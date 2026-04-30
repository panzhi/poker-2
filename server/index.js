import { randomInt } from 'node:crypto'
import { WebSocketServer, WebSocket } from 'ws'
import {
  canBeat,
  createDeck,
  dealCards,
  getAvailableBids,
  getBidMultiplier,
  getRevealedPlayerIds,
  inferTeam,
  scoreRound,
  shuffleDeck,
} from './game-engine.js'

const PORT = Number(process.env.PORT ?? 8787)
const rooms = new Map()
const sockets = new Map()
const wss = new WebSocketServer({ port: PORT })

console.log(`Poker WebSocket server listening on ws://localhost:${PORT}`)

wss.on('connection', (socket) => {
  const clientId = createId('c')
  sockets.set(clientId, socket)
  send(socket, 'connected', { clientId })

  socket.on('message', (raw) => {
    try {
      const message = JSON.parse(String(raw))
      handleClientMessage(clientId, socket, message)
    } catch (error) {
      sendError(socket, error instanceof Error ? error.message : '消息格式错误')
    }
  })

  socket.on('close', () => {
    sockets.delete(clientId)
    markDisconnected(clientId)
  })

  socket.on('error', (error) => {
    console.error(error)
  })
})

/**
 * 处理客户端操作意图。
 *
 * @param {string} clientId 连接 id。
 * @param {WebSocket} socket WebSocket。
 * @param {{ type: string; payload?: Record<string, unknown> }} message 消息。
 */
function handleClientMessage(clientId, socket, message) {
  const payload = message.payload ?? {}

  if (message.type === 'createRoom') {
    createRoom(clientId, socket, payload)
    return
  }

  if (message.type === 'joinRoom') {
    joinRoom(clientId, socket, payload)
    return
  }

  const context = getPlayerContext(clientId)

  if (!context) {
    sendError(socket, '请先创建或加入房间')
    return
  }

  const { room, player } = context

  switch (message.type) {
    case 'startRound':
      startRound(room, player.id)
      break
    case 'bid':
      placeBid(room, player.id, String(payload.bidType))
      break
    case 'playCards':
      playCards(room, player.id, Array.isArray(payload.cardIds) ? payload.cardIds.map(String) : [])
      break
    case 'pass':
      pass(room, player.id)
      break
    default:
      sendError(socket, `未知操作：${message.type}`)
  }
}

/**
 * 创建真实多人房间。
 */
function createRoom(clientId, socket, payload) {
  const mode = payload.mode === 5 ? 5 : 4
  const roomCode = createRoomCode()
  const player = createPlayer(clientId, String(payload.name || '玩家1'))
  const room = {
    code: roomCode,
    ownerPlayerId: player.id,
    mode,
    phase: 'lobby',
    players: [player],
    deck: [],
    currentTrick: null,
    discardPile: [],
    currentPlayerId: null,
    dealerPlayerId: player.id,
    starterPlayerId: null,
    bid: null,
    finishOrder: [],
    passPlayerIds: [],
    roundNo: 0,
    lastScoreResult: null,
    message: `${mode} 人房已创建，等待玩家加入`,
  }

  rooms.set(roomCode, room)
  socket.roomCode = roomCode
  socket.playerId = player.id
  broadcastRoom(room)
}

/**
 * 加入已有房间。
 */
function joinRoom(clientId, socket, payload) {
  const roomCode = String(payload.roomCode || '').trim().toUpperCase()
  const room = rooms.get(roomCode)

  if (!room) {
    sendError(socket, '房间不存在')
    return
  }

  if (room.phase !== 'lobby') {
    sendError(socket, '牌局已开始，暂不支持中途加入')
    return
  }

  if (room.players.length >= room.mode) {
    sendError(socket, '房间已满')
    return
  }

  const existing = room.players.find((item) => item.clientId === clientId)

  if (existing) {
    existing.connected = true
    socket.roomCode = room.code
    socket.playerId = existing.id
    broadcastRoom(room)
    return
  }

  const player = createPlayer(clientId, String(payload.name || `玩家${room.players.length + 1}`))
  room.players.push(player)
  room.message = `玩家 ${player.name} 加入房间`
  socket.roomCode = room.code
  socket.playerId = player.id
  broadcastRoom(room)
}

/**
 * 服务端权威开局：洗牌、发牌、分队。
 */
function startRound(room, playerId) {
  if (playerId !== room.ownerPlayerId) throw new Error('只有房主可以开始')
  if (room.players.length !== room.mode) throw new Error(`需要 ${room.mode} 名玩家满员后开始`)

  room.phase = 'dealing'
  room.roundNo += 1
  room.finishOrder = []
  room.discardPile = []
  room.currentTrick = null
  room.passPlayerIds = []
  room.bid = null
  room.lastScoreResult = null

  const dealerIndex = Math.max(
    0,
    room.players.findIndex((player) => player.id === room.dealerPlayerId),
  )
  const deck = shuffleDeck(createDeck(room.mode), () => randomInt(0, 1_000_000) / 1_000_000)
  const hands = dealCards(deck, room.players.length, dealerIndex)

  room.deck = deck
  room.players.forEach((player, index) => {
    player.hand = hands[index]
    player.finishedRank = null
    player.team = inferTeam(player, room.mode)
  })

  const starter = room.players.find((player) => player.hand.some((card) => card.id === 'H-9')) ?? room.players[dealerIndex]
  room.starterPlayerId = starter.id
  room.currentPlayerId = room.dealerPlayerId
  room.phase = 'bidding'
  room.message = '叫分阶段'
  broadcastRoom(room)
}

/**
 * 服务端处理叫分。
 */
function placeBid(room, playerId, bidType) {
  assertTurn(room, playerId)
  if (room.phase !== 'bidding') throw new Error('当前不是叫分阶段')

  const player = findPlayer(room, playerId)
  const availableBids = getAvailableBids(player.hand)

  if (!availableBids.includes(bidType)) throw new Error('当前手牌不能这样叫分')

  if (bidType === 'pass') {
    advanceBiddingTurn(room)
    broadcastRoom(room)
    return
  }

  room.bid = {
    type: bidType,
    playerId,
    multiplier: getBidMultiplier(bidType),
    revealedPlayerIds: getRevealedPlayerIds(room.players, bidType),
  }
  enterPlaying(room)
  broadcastRoom(room)
}

/**
 * 服务端处理出牌。
 */
function playCards(room, playerId, cardIds) {
  assertTurn(room, playerId)
  if (room.phase !== 'playing') throw new Error('当前不是出牌阶段')

  const player = findPlayer(room, playerId)
  const selectedCards = cardIds.map((cardId) => player.hand.find((card) => card.id === cardId))

  if (selectedCards.some((card) => !card)) throw new Error('选择了不存在的手牌')

  const result = canBeat(selectedCards, room.currentTrick)

  if (!result.valid || !result.type) throw new Error(result.reason ?? '无法出牌')

  const selectedIdSet = new Set(cardIds)
  const trick = {
    playerId,
    cards: selectedCards,
    type: result.type,
    power: result.power,
  }

  player.hand = player.hand.filter((card) => !selectedIdSet.has(card.id))
  room.currentTrick = trick
  room.discardPile.push(trick)
  room.passPlayerIds = []
  room.message = `${player.name} 出牌`

  if (player.hand.length === 0) {
    markFinished(room, player.id)
  }

  advanceTurn(room)
  broadcastRoom(room)
}

/**
 * 服务端处理 Pass。
 */
function pass(room, playerId) {
  assertTurn(room, playerId)
  if (room.phase !== 'playing') throw new Error('当前不是出牌阶段')
  if (!room.currentTrick) throw new Error('新一轮出牌不能跳过')

  if (!room.passPlayerIds.includes(playerId)) {
    room.passPlayerIds.push(playerId)
  }

  const activePlayers = room.players.filter((player) => player.finishedRank === null)
  const trickOwnerId = room.currentTrick.playerId
  const allOthersPassed = activePlayers
    .filter((player) => player.id !== trickOwnerId)
    .every((player) => room.passPlayerIds.includes(player.id))

  if (allOthersPassed) {
    const trickOwnerActive = activePlayers.some((player) => player.id === trickOwnerId)
    room.currentPlayerId = trickOwnerActive ? trickOwnerId : nextActivePlayerId(room, playerId)
    room.currentTrick = null
    room.passPlayerIds = []
    room.message = '新一轮出牌'
    broadcastRoom(room)
    return
  }

  advanceTurn(room)
  broadcastRoom(room)
}

function advanceBiddingTurn(room) {
  const dealerIndex = room.players.findIndex((player) => player.id === room.dealerPlayerId)
  const currentIndex = room.players.findIndex((player) => player.id === room.currentPlayerId)
  const isLastBidder = (currentIndex + 1) % room.players.length === dealerIndex

  if (isLastBidder) {
    enterPlaying(room)
    return
  }

  room.currentPlayerId = room.players[(currentIndex + 1) % room.players.length].id
}

function enterPlaying(room) {
  room.phase = 'playing'
  room.currentPlayerId = room.starterPlayerId
  room.message = '♥9 持有者先出牌'
}

function markFinished(room, playerId) {
  const player = findPlayer(room, playerId)

  if (player.finishedRank !== null) return

  player.finishedRank = room.finishOrder.length + 1
  room.finishOrder.push(player.id)

  if (shouldSettleAfterFinish(room)) {
    settleRound(room)
    return
  }

  if (room.finishOrder.length === room.players.length - 1) {
    const lastPlayer = room.players.find((item) => item.finishedRank === null)

    if (lastPlayer) {
      lastPlayer.finishedRank = room.players.length
      room.finishOrder.push(lastPlayer.id)
    }

    settleRound(room)
  }
}

function shouldSettleAfterFinish(room) {
  if (room.mode === 4) return shouldSettleFourPlayerRoom(room)
  if (room.mode === 5) return shouldSettleFivePlayerRoom(room)

  return false
}

function shouldSettleFourPlayerRoom(room) {
  if (room.finishOrder.length < 2) return false

  const first = findPlayer(room, room.finishOrder[0])
  const second = findPlayer(room, room.finishOrder[1])

  if (first.team === second.team) return true

  return room.finishOrder.length >= 3
}

function shouldSettleFivePlayerRoom(room) {
  const sequence = createFinishedTeamSequence(room)

  if (sequence.length < 2) return false

  if (sequence === 'RR') return true

  if (sequence.length >= 3) {
    if (sequence === 'BBB') return true
    if (countTeam(sequence, 'R') === 2) return true
  }

  return sequence.length >= 4
}

function settleRound(room) {
  completeRemainingPlayers(room)

  const multiplier = room.bid?.multiplier ?? 1
  const result = scoreRound(room.players, room.finishOrder, room.mode, multiplier)

  for (const player of room.players) {
    player.score += result.deltaByPlayerId[player.id] ?? 0
  }

  room.lastScoreResult = result
  room.phase = 'settlement'
  room.currentPlayerId = null
  room.dealerPlayerId = room.finishOrder[0] ?? room.dealerPlayerId
  room.message = result.winnerTeam === 'draw' ? `平局：${result.sequence}` : `${result.winnerTeam} 胜：${result.sequence}`
}

function completeRemainingPlayers(room) {
  for (const player of room.players) {
    if (player.finishedRank === null) {
      player.finishedRank = room.finishOrder.length + 1
      room.finishOrder.push(player.id)
    }
  }
}

function createFinishedTeamSequence(room) {
  return room.finishOrder.map((playerId) => (findPlayer(room, playerId).team === 'red' ? 'R' : 'B')).join('')
}

function countTeam(sequence, teamCode) {
  return sequence.split('').filter((item) => item === teamCode).length
}

function advanceTurn(room) {
  if (room.phase === 'settlement') return
  room.currentPlayerId = nextActivePlayerId(room, room.currentPlayerId)
}

function nextActivePlayerId(room, fromId) {
  const startIndex = Math.max(
    0,
    room.players.findIndex((player) => player.id === fromId),
  )

  for (let offset = 1; offset <= room.players.length; offset += 1) {
    const player = room.players[(startIndex + offset) % room.players.length]
    if (player.finishedRank === null) return player.id
  }

  return room.players[0].id
}

function broadcastRoom(room) {
  for (const player of room.players) {
    const socket = getSocketByPlayer(player.id)
    if (socket?.readyState === WebSocket.OPEN) {
      send(socket, 'snapshot', createSnapshot(room, player.id))
    }
  }
}

function createSnapshot(room, selfPlayerId) {
  const self = findPlayer(room, selfPlayerId)

  return {
    roomCode: room.code,
    ownerPlayerId: room.ownerPlayerId,
    selfPlayerId,
    availableBids: room.phase === 'bidding' && room.currentPlayerId === selfPlayerId ? getAvailableBids(self.hand) : [],
    state: {
      phase: room.phase,
      mode: room.mode,
      players: room.players.map((player) => ({
        id: player.id,
        name: player.name,
        hand: player.id === selfPlayerId ? player.hand : [],
        handCount: player.hand.length,
        score: player.score,
        team: shouldRevealTeam(room, player.id, selfPlayerId) ? player.team : null,
        connected: player.connected,
        autoPlay: false,
        finishedRank: player.finishedRank,
      })),
      currentTrick: room.currentTrick,
      discardPile: room.discardPile,
      currentPlayerId: room.currentPlayerId,
      dealerPlayerId: room.dealerPlayerId,
      starterPlayerId: room.starterPlayerId,
      bid: room.bid,
      finishOrder: room.finishOrder,
      passPlayerIds: room.passPlayerIds,
      roundNo: room.roundNo,
      lastScoreResult: room.lastScoreResult,
      message: room.message,
    },
  }
}

function shouldRevealTeam(room, playerId, selfPlayerId) {
  return room.phase === 'settlement' || playerId === selfPlayerId || room.bid?.revealedPlayerIds.includes(playerId)
}

function markDisconnected(clientId) {
  for (const room of rooms.values()) {
    const player = room.players.find((item) => item.clientId === clientId)

    if (player) {
      player.connected = false
      room.message = `${player.name} 已断线`
      broadcastRoom(room)
      return
    }
  }
}

function getPlayerContext(clientId) {
  for (const room of rooms.values()) {
    const player = room.players.find((item) => item.clientId === clientId)
    if (player) return { room, player }
  }

  return null
}

function getSocketByPlayer(playerId) {
  for (const socket of sockets.values()) {
    if (socket.playerId === playerId) return socket
  }

  return null
}

function assertTurn(room, playerId) {
  if (room.currentPlayerId !== playerId) throw new Error('还没轮到你')
}

function findPlayer(room, playerId) {
  const player = room.players.find((item) => item.id === playerId)
  if (!player) throw new Error('玩家不存在')
  return player
}

function createPlayer(clientId, name) {
  return {
    id: createId('p'),
    clientId,
    name,
    hand: [],
    score: 0,
    team: null,
    connected: true,
    autoPlay: false,
    finishedRank: null,
  }
}

function createRoomCode() {
  let code = ''

  do {
    code = String(randomInt(100000, 999999))
  } while (rooms.has(code))

  return code
}

function createId(prefix) {
  return `${prefix}_${randomInt(100000, 999999)}_${Date.now().toString(36)}`
}

function send(socket, type, payload) {
  socket.send(JSON.stringify({ type, payload }))
}

function sendError(socket, message) {
  send(socket, 'error', { message })
}
