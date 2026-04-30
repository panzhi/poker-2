import type { Player, ScoreResult, Team } from './types'

const FIVE_PLAYER_DRAW_SEQUENCES = new Set(['RBBBR', 'BRRBB', 'BRBRB', 'BBRRB'])

/**
 * 计算 4 人局结算。
 *
 * 第 1、2 名同队时该队双倍胜；不同队时第 3 名所在队单倍胜。
 */
export function scoreFourPlayers(
  players: readonly Player[],
  finishOrder: readonly string[],
  multiplier: number,
): ScoreResult {
  const byId = createPlayerMap(players)
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
  const winnerTeam: Team = sameTeamTopTwo ? first.team : third!.team!
  const baseScore = sameTeamTopTwo ? 2 : 1
  const deltaByPlayerId = createEmptyDelta(players)

  for (const player of players) {
    deltaByPlayerId[player.id] = player.team === winnerTeam ? baseScore * multiplier : -baseScore * multiplier
  }

  return {
    winnerTeam,
    deltaByPlayerId,
    sequence: createTeamSequence(byId, finishOrder),
  }
}

/**
 * 计算 5 人局结算。
 *
 * RULE.md 对部分单倍胜写了“等”，这里用可维护策略落地：
 * - RRBBB：红队双倍胜。
 * - BBBRR：黑队双倍胜。
 * - RBBBR / BRRBB / BRBRB / BBRRB：平局。
 * - 其他序列：第 1 名所在队单倍胜。
 */
export function scoreFivePlayers(
  players: readonly Player[],
  finishOrder: readonly string[],
  multiplier: number,
): ScoreResult {
  const byId = createPlayerMap(players)
  const sequence = createTeamSequence(byId, finishOrder)
  const deltaByPlayerId = createEmptyDelta(players)

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

  const first = byId.get(finishOrder[0])

  if (!first?.team) {
    throw new Error('5 人局结算失败：首名玩家队伍未完成分配')
  }

  applyTeamDelta(players, deltaByPlayerId, first.team, 1 * multiplier, -1 * multiplier)

  return { winnerTeam: first.team, deltaByPlayerId, sequence }
}

function createPlayerMap(players: readonly Player[]): Map<string, Player> {
  return new Map(players.map((player) => [player.id, player]))
}

function createEmptyDelta(players: readonly Player[]): Record<string, number> {
  return Object.fromEntries(players.map((player) => [player.id, 0]))
}

function createTeamSequence(byId: Map<string, Player>, finishOrder: readonly string[]): string {
  return finishOrder.map((playerId) => (byId.get(playerId)?.team === 'red' ? 'R' : 'B')).join('')
}

function applyTeamDelta(
  players: readonly Player[],
  deltaByPlayerId: Record<string, number>,
  winnerTeam: Team,
  winnerDelta: number,
  loserDelta: number,
): void {
  for (const player of players) {
    deltaByPlayerId[player.id] = player.team === winnerTeam ? winnerDelta : loserDelta
  }
}

function applyFivePlayerRedDoubleWin(
  players: readonly Player[],
  deltaByPlayerId: Record<string, number>,
  multiplier: number,
): void {
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

function applyFivePlayerBlackDoubleWin(
  players: readonly Player[],
  deltaByPlayerId: Record<string, number>,
  multiplier: number,
): void {
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

function hasCard(player: Player, cardId: string): boolean {
  return player.hand.some((card) => card.id === cardId)
}
