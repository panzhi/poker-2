import { describe, expect, it } from 'vitest'
import { createDeck, dealCards, shuffleDeck } from '../../src/game/deck'

describe('deck rules', () => {
  it('creates 28 cards for 4 players and 30 cards for 5 players', () => {
    expect(createDeck(4)).toHaveLength(28)
    expect(createDeck(5)).toHaveLength(30)
  })

  it('contains the mandatory 9 cards by mode', () => {
    expect(createDeck(4).map((card) => card.id)).toEqual(expect.arrayContaining(['H-9', 'S-9']))
    expect(createDeck(4).map((card) => card.id)).not.toEqual(expect.arrayContaining(['C-9', 'D-9']))
    expect(createDeck(5).map((card) => card.id)).toEqual(expect.arrayContaining(['H-9', 'S-9', 'C-9', 'D-9']))
  })

  it('deals all cards with no leftovers in 4-player and 5-player modes', () => {
    const fourHands = dealCards(createDeck(4), 4, 0)
    const fiveHands = dealCards(createDeck(5), 5, 0)

    expect(fourHands.map((hand) => hand.length)).toEqual([7, 7, 7, 7])
    expect(fourHands.flat()).toHaveLength(28)
    expect(new Set(fourHands.flat().map((card) => card.id))).toHaveLength(28)

    expect(fiveHands.map((hand) => hand.length)).toEqual([6, 6, 6, 6, 6])
    expect(fiveHands.flat()).toHaveLength(30)
    expect(new Set(fiveHands.flat().map((card) => card.id))).toHaveLength(30)
  })

  it('keeps the same card set after Fisher-Yates shuffle', () => {
    const deck = createDeck(5)
    const shuffled = shuffleDeck(deck, () => 0.42)

    expect(shuffled).toHaveLength(deck.length)
    expect(new Set(shuffled.map((card) => card.id))).toEqual(new Set(deck.map((card) => card.id)))
    expect(shuffled).not.toBe(deck)
  })
})
