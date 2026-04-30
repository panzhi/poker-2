import type { BidType, Card, Player, Team, Trick } from './types'
import { sortCards } from './deck'
import { canBeat } from './hand'

/**
 * 根据玩家手牌推导阵营。
 *
 * 规则原文没有处理同一玩家同时持有红 A 与黑 A 的冲突。
 * MVP 先采用红 A 优先；正式服务端建议在发牌后校验并重洗，保证阵营人数合法。
 */
export function inferTeam(player: Pick<Player, 'hand'>, mode: 4 | 5): Team {
  const hasRedA = player.hand.some((card) => card.rank === 'A' && card.color === 'red')
  const hasBlackA = player.hand.some((card) => card.rank === 'A' && card.color === 'black')

  if (hasRedA) return 'red'
  if (hasBlackA) return 'black'
  return mode === 5 ? 'black' : 'black'
}

/**
 * 获取玩家当前可用叫分按钮。
 */
export function getAvailableBids(hand: readonly Card[]): BidType[] {
  const redA = hand.filter((card) => card.rank === 'A' && card.color === 'red')
  const blackA = hand.filter((card) => card.rank === 'A' && card.color === 'black')
  const bids: BidType[] = ['solo']

  if (redA.length >= 2 || blackA.length >= 2) bids.unshift('xuan-bao')
  if (redA.length >= 1) bids.push('declare-red-a')
  if (blackA.length >= 1) bids.push('declare-black-a')
  if (redA.length === 0) bids.push('ask-red-a')
  if (blackA.length === 0) bids.push('ask-black-a')

  bids.push('pass')

  return bids
}

/**
 * 查找托管玩家的最小可出牌。
 *
 * 该策略偏保守：优先出最小张数，再出最小牌力。
 */
export function findSmallestPlayable(hand: readonly Card[], currentTrick: Trick | null): Card[] {
  const sorted = sortCards(hand).reverse()

  for (const size of [1, 2, 3, 4]) {
    const groups = new Map<number, Card[]>()

    for (const card of sorted) {
      groups.set(card.power, [...(groups.get(card.power) ?? []), card])
    }

    for (const cards of groups.values()) {
      const candidate = cards.slice(0, size)

      if (candidate.length === size && canBeat(candidate, currentTrick).valid) {
        return candidate
      }
    }
  }

  return []
}

/**
 * 计算被宣/提 A 后需要公开身份的玩家。
 */
export function getRevealedPlayerIds(players: readonly Player[], bidType: BidType): string[] {
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
