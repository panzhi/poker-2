const RANK_POWER = {
  9: 1,
  10: 2,
  J: 3,
  Q: 4,
  K: 5,
  A: 6,
  2: 7,
  SJ: 8,
  BJ: 9,
}

const BID_MULTIPLIER_TYPES = new Set(['declare-red-a', 'declare-black-a', 'ask-red-a', 'ask-black-a'])
const FIVE_PLAYER_DRAW_SEQUENCES = new Set(['RBBBR', 'BRRBB', 'BRBRB', 'BBRRB'])

/**
 * 创建符合 RULE.md 的牌库。
 *
 * @param {4 | 5} mode 玩家人数模式。
 * @returns {import('./types').Card[]} 牌库。
 */
export function createDeck(mode) {
  const suits = ['S', 'H', 'C', 'D']
  const ranks = ['10', 'J', 'Q', 'K', 'A', '2']
  const cards = []

  for (const suit of suits) {
    for (const rank of ranks) {
      cards.push(createSuitCard(suit, rank))
    }
  }

  cards.push(createJoker('SJ'), createJoker('BJ'), createSuitCard('H', '9'), createSuitCard('S', '9'))

  if (mode === 5) {
    cards.push(createSuitCard('C', '9'), createSuitCard('D', '9'))
  }

  return cards
}

/**
 * Fisher-Yates 洗牌。
 *
 * @template T
 * @param {readonly T[]} items 原始数组。
 * @param {() => number} random 随机数函数。
 * @returns {T[]} 新数组。
 */
export function shuffleDeck(items, random = Math.random) {
  const next = [...items]

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[next[index], next[swapIndex]] = [next[swapIndex], next[index]]
  }

  return next
}

/**
 * 发牌。
 *
 * @param {readonly import('./types').Card[]} deck 牌库。
 * @param {number} playersCount 玩家数量。
 * @param {number} dealerIndex 起始发牌座位。
 * @returns {import('./types').Card[][]} 每位玩家手牌。
 */
export function dealCards(deck, playersCount, dealerIndex) {
  const hands = Array.from({ length: playersCount }, () => [])

  deck.forEach((card, offset) => {
    hands[(dealerIndex + offset) % playersCount].push(card)
  })

  return hands.map(sortCards)
}

/**
 * 服务端权威牌型判定。
 *
 * @param {readonly import('./types').Card[]} cards 候选牌。
 * @returns {{ valid: boolean; type: string | null; power: number; reason?: string }}
 */
export function evaluateHand(cards) {
  if (cards.length < 1 || cards.length > 4) {
    return { valid: false, type: null, power: 0, reason: '只能出 1-4 张牌' }
  }

  const firstPower = cards[0].power
  const sameRank = cards.every((card) => card.power === firstPower)

  if (!sameRank) {
    return { valid: false, type: null, power: 0, reason: '必须选择相同点数' }
  }

  return {
    valid: true,
    type: { 1: 'single', 2: 'pair', 3: 'triple', 4: 'quad' }[cards.length],
    power: firstPower,
  }
}

/**
 * 判断候选牌能否压过桌面牌。
 *
 * @param {readonly import('./types').Card[]} candidate 候选牌。
 * @param {import('./types').Trick | null} currentTrick 当前桌面牌。
 * @returns {{ valid: boolean; type: string | null; power: number; reason?: string }}
 */
export function canBeat(candidate, currentTrick) {
  const hand = evaluateHand(candidate)

  if (!hand.valid || !hand.type) return hand
  if (!currentTrick) return hand

  if (hand.type !== currentTrick.type) {
    return { valid: false, type: hand.type, power: hand.power, reason: '必须跟相同牌型' }
  }

  if (hand.power <= currentTrick.power) {
    return { valid: false, type: hand.type, power: hand.power, reason: '点数不够大' }
  }

  return hand
}

/**
 * 生成玩家可用叫分项。
 *
 * @param {readonly import('./types').Card[]} hand 手牌。
 * @returns {string[]} 叫分项。
 */
export function getAvailableBids(hand) {
  const redA = hand.filter((card) => card.rank === 'A' && card.color === 'red')
  const blackA = hand.filter((card) => card.rank === 'A' && card.color === 'black')
  const bids = ['solo']

  if (redA.length >= 2 || blackA.length >= 2) bids.unshift('xuan-bao')
  if (redA.length >= 1) bids.push('declare-red-a')
  if (blackA.length >= 1) bids.push('declare-black-a')
  if (redA.length === 0) bids.push('ask-red-a')
  if (blackA.length === 0) bids.push('ask-black-a')

  bids.push('pass')

  return bids
}

/**
 * 推导玩家阵营。
 *
 * @param {{ hand: readonly import('./types').Card[] }} player 玩家。
 * @param {4 | 5} mode 玩家人数模式。
 * @returns {'red' | 'black'} 阵营。
 */
export function inferTeam(player, mode) {
  const hasRedA = player.hand.some((card) => card.rank === 'A' && card.color === 'red')
  const hasBlackA = player.hand.some((card) => card.rank === 'A' && card.color === 'black')

  if (hasRedA) return 'red'
  if (hasBlackA) return 'black'
  return mode === 5 ? 'black' : 'black'
}

/**
 * 结算积分。
 *
 * @param {readonly import('./types').Player[]} players 玩家。
 * @param {readonly string[]} finishOrder 完成顺序。
 * @param {4 | 5} mode 玩家模式。
 * @param {number} multiplier 倍率。
 * @returns {{ winnerTeam: 'red' | 'black' | 'draw'; deltaByPlayerId: Record<string, number>; sequence: string }}
 */
export function scoreRound(players, finishOrder, mode, multiplier) {
  return mode === 4
    ? scoreFourPlayers(players, finishOrder, multiplier)
    : scoreFivePlayers(players, finishOrder, multiplier)
}

/**
 * 根据叫分类型生成倍率。
 *
 * @param {string} bidType 叫分类型。
 * @returns {number} 倍率。
 */
export function getBidMultiplier(bidType) {
  return BID_MULTIPLIER_TYPES.has(bidType) ? 2 : 1
}

/**
 * 获取宣/提 A 后需要明示身份的玩家。
 *
 * @param {readonly import('./types').Player[]} players 玩家。
 * @param {string} bidType 叫分类型。
 * @returns {string[]} 玩家 id。
 */
export function getRevealedPlayerIds(players, bidType) {
  const targetColor =
    bidType === 'declare-red-a' || bidType === 'ask-red-a'
      ? 'red'
      : bidType === 'declare-black-a' || bidType === 'ask-black-a'
        ? 'black'
        : null

  if (!targetColor) return []

  return players
    .filter((player) => player.hand.some((card) => card.rank === 'A' && card.color === targetColor))
    .map((player) => player.id)
}

/**
 * 排序手牌。
 *
 * @param {readonly import('./types').Card[]} cards 手牌。
 * @returns {import('./types').Card[]} 排序后的手牌。
 */
export function sortCards(cards) {
  return [...cards].sort((a, b) => b.power - a.power || a.id.localeCompare(b.id))
}

function scoreFourPlayers(players, finishOrder, multiplier) {
  const byId = new Map(players.map((player) => [player.id, player]))
  const first = byId.get(finishOrder[0])
  const second = byId.get(finishOrder[1])

  if (!first?.team || !second?.team) {
    throw new Error('4 人局结算失败：玩家队伍未完成分配')
  }

  const sameTeamTopTwo = first.team === second.team

  if (!sameTeamTopTwo && !byId.get(finishOrder[2])?.team) {
    throw new Error('4 人局结算失败：第 3 名未产生')
  }

  const third = byId.get(finishOrder[2])
  const winnerTeam = sameTeamTopTwo ? first.team : third.team
  const baseScore = sameTeamTopTwo ? 2 : 1
  const deltaByPlayerId = Object.fromEntries(players.map((player) => [player.id, 0]))

  for (const player of players) {
    deltaByPlayerId[player.id] = player.team === winnerTeam ? baseScore * multiplier : -baseScore * multiplier
  }

  return { winnerTeam, deltaByPlayerId, sequence: createTeamSequence(byId, finishOrder) }
}

function scoreFivePlayers(players, finishOrder, multiplier) {
  const byId = new Map(players.map((player) => [player.id, player]))
  const sequence = createTeamSequence(byId, finishOrder)
  const deltaByPlayerId = Object.fromEntries(players.map((player) => [player.id, 0]))

  if (FIVE_PLAYER_DRAW_SEQUENCES.has(sequence)) {
    return { winnerTeam: 'draw', deltaByPlayerId, sequence }
  }

  if (sequence === 'RRBBB') {
    applyFivePlayerRedDoubleWin(players, deltaByPlayerId, multiplier)
    return { winnerTeam: 'red', deltaByPlayerId, sequence }
  }

  if (sequence === 'BBBRR') {
    applyFivePlayerBlackDoubleWin(players, deltaByPlayerId, multiplier)
    return { winnerTeam: 'black', deltaByPlayerId, sequence }
  }

  const winnerTeam = byId.get(finishOrder[0]).team
  applyTeamDelta(players, deltaByPlayerId, winnerTeam, 1 * multiplier, -1 * multiplier)

  return { winnerTeam, deltaByPlayerId, sequence }
}

function applyTeamDelta(players, deltaByPlayerId, winnerTeam, winnerDelta, loserDelta) {
  for (const player of players) {
    deltaByPlayerId[player.id] = player.team === winnerTeam ? winnerDelta : loserDelta
  }
}

function applyFivePlayerRedDoubleWin(players, deltaByPlayerId, multiplier) {
  for (const player of players) {
    if (hasCard(player, 'H-A')) {
      deltaByPlayerId[player.id] = 4 * multiplier
    } else if (hasCard(player, 'D-A')) {
      deltaByPlayerId[player.id] = 2 * multiplier
    } else {
      deltaByPlayerId[player.id] = -2 * multiplier
    }
  }
}

function applyFivePlayerBlackDoubleWin(players, deltaByPlayerId, multiplier) {
  for (const player of players) {
    if (hasCard(player, 'H-A')) {
      deltaByPlayerId[player.id] = -4 * multiplier
    } else if (hasCard(player, 'D-A')) {
      deltaByPlayerId[player.id] = -2 * multiplier
    } else {
      deltaByPlayerId[player.id] = 2 * multiplier
    }
  }
}

function hasCard(player, cardId) {
  return player.hand.some((card) => card.id === cardId)
}

function createTeamSequence(byId, finishOrder) {
  return finishOrder.map((playerId) => (byId.get(playerId).team === 'red' ? 'R' : 'B')).join('')
}

function createSuitCard(suit, rank) {
  const isRed = suit === 'H' || suit === 'D'

  return {
    id: `${suit}-${rank}`,
    suit,
    rank,
    color: isRed ? 'red' : 'black',
    power: RANK_POWER[rank],
  }
}

function createJoker(rank) {
  return {
    id: `JOKER-${rank}`,
    suit: 'JOKER',
    rank,
    color: rank === 'BJ' ? 'red' : 'black',
    power: RANK_POWER[rank],
  }
}
