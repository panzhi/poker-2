import type { Card, HandType, Trick } from './types'

export interface HandResult {
  valid: boolean
  type: HandType | null
  power: number
  reason?: string
}

const TYPE_BY_COUNT: Record<number, HandType> = {
  1: 'single',
  2: 'pair',
  3: 'triple',
  4: 'quad',
}

/**
 * 判定所选牌是否符合规则牌型。
 *
 * 当前规则只允许单张、对子、三张、四张；四张不具备炸弹特权。
 */
export function evaluateHand(cards: readonly Card[]): HandResult {
  if (cards.length < 1 || cards.length > 4) {
    return { valid: false, type: null, power: 0, reason: '只能出 1-4 张牌' }
  }

  const firstPower = cards[0]?.power
  const sameRank = cards.every((card) => card.power === firstPower)

  if (!sameRank) {
    return { valid: false, type: null, power: 0, reason: '必须选择相同点数' }
  }

  return {
    valid: true,
    type: TYPE_BY_COUNT[cards.length],
    power: firstPower,
  }
}

/**
 * 判定候选牌是否可以压过桌面牌。
 *
 * 新一轮出牌时 currentTrick 为 null，只需要候选牌本身合法。
 */
export function canBeat(candidate: readonly Card[], currentTrick: Trick | null): HandResult {
  const hand = evaluateHand(candidate)

  if (!hand.valid || !hand.type) return hand
  if (!currentTrick) return hand

  if (hand.type !== currentTrick.type) {
    return {
      valid: false,
      type: hand.type,
      power: hand.power,
      reason: '必须跟相同牌型',
    }
  }

  if (hand.power <= currentTrick.power) {
    return {
      valid: false,
      type: hand.type,
      power: hand.power,
      reason: '点数不够大',
    }
  }

  return hand
}
