import type { Card, Rank, Suit } from './types'

const RANK_POWER: Record<Rank, number> = {
  '9': 1,
  '10': 2,
  J: 3,
  Q: 4,
  K: 5,
  A: 6,
  '2': 7,
  SJ: 8,
  BJ: 9,
}

/**
 * 创建规则定义的完整牌库。
 *
 * 4 人局：基础 26 张 + 红桃 9 + 黑桃 9，共 28 张。
 * 5 人局：4 人牌库 + 梅花 9 + 方片 9，共 30 张。
 */
export function createDeck(mode: 4 | 5): Card[] {
  const suits: Suit[] = ['S', 'H', 'C', 'D']
  const baseRanks: Rank[] = ['10', 'J', 'Q', 'K', 'A', '2']
  const cards: Card[] = []

  for (const suit of suits) {
    for (const rank of baseRanks) {
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
 * Fisher-Yates 洗牌算法。
 *
 * 多人生产环境应在服务端执行本函数，并注入基于 crypto 的随机数。
 * 前端 MVP 使用 Math.random 仅用于本地演示。
 */
export function shuffleDeck<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const next = [...items]

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[next[index], next[swapIndex]] = [next[swapIndex], next[index]]
  }

  return next
}

/**
 * 从起始玩家开始按座位顺序逐张发牌。
 */
export function dealCards(deck: readonly Card[], playersCount: number, dealerIndex: number): Card[][] {
  const hands = Array.from({ length: playersCount }, () => [] as Card[])

  deck.forEach((card, offset) => {
    const playerIndex = (dealerIndex + offset) % playersCount
    hands[playerIndex].push(card)
  })

  return hands.map(sortCards)
}

/**
 * 按牌力降序整理手牌；牌力相同时按 id 保持稳定顺序。
 */
export function sortCards(cards: readonly Card[]): Card[] {
  return [...cards].sort((a, b) => b.power - a.power || a.id.localeCompare(b.id))
}

function createSuitCard(suit: Suit, rank: Rank): Card {
  const isRed = suit === 'H' || suit === 'D'

  return {
    id: `${suit}-${rank}`,
    suit,
    rank,
    color: isRed ? 'red' : 'black',
    power: RANK_POWER[rank],
  }
}

function createJoker(rank: 'SJ' | 'BJ'): Card {
  return {
    id: `JOKER-${rank}`,
    suit: 'JOKER',
    rank,
    color: rank === 'BJ' ? 'red' : 'black',
    power: RANK_POWER[rank],
  }
}
