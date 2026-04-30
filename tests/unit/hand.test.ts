import { describe, expect, it } from 'vitest'
import { canBeat, evaluateHand } from '../../src/game/hand'
import type { Card, Trick } from '../../src/game/types'

describe('hand evaluation rules', () => {
  it.each([
    { cards: [card('S-10', 2)], type: 'single' },
    { cards: [card('S-J', 3), card('H-J', 3)], type: 'pair' },
    { cards: [card('S-Q', 4), card('H-Q', 4), card('C-Q', 4)], type: 'triple' },
    { cards: [card('S-K', 5), card('H-K', 5), card('C-K', 5), card('D-K', 5)], type: 'quad' },
  ])('accepts legal $type hands', ({ cards, type }) => {
    expect(evaluateHand(cards)).toMatchObject({ valid: true, type })
  })

  it('rejects empty hands and hands above four cards', () => {
    expect(evaluateHand([])).toMatchObject({ valid: false })
    expect(evaluateHand([card('1', 1), card('2', 1), card('3', 1), card('4', 1), card('5', 1)])).toMatchObject({
      valid: false,
    })
  })

  it('rejects mixed ranks, including visually same-size but different power cards', () => {
    expect(evaluateHand([card('S-A', 6), card('H-K', 5)])).toMatchObject({ valid: false })
  })

  it('allows any legal hand when starting a new trick', () => {
    expect(canBeat([card('S-9', 1)], null)).toMatchObject({ valid: true, type: 'single', power: 1 })
  })

  it('requires the same type and a strictly greater power when following', () => {
    const current: Trick = {
      playerId: 'p1',
      cards: [card('S-Q', 4), card('H-Q', 4)],
      type: 'pair',
      power: 4,
    }

    expect(canBeat([card('S-K', 5), card('H-K', 5)], current)).toMatchObject({ valid: true })
    expect(canBeat([card('S-Q2', 4), card('H-Q2', 4)], current)).toMatchObject({ valid: false })
    expect(canBeat([card('S-A', 6)], current)).toMatchObject({ valid: false, reason: '必须跟相同牌型' })
  })

  it('does not treat four of a kind as a bomb across hand types', () => {
    const current: Trick = {
      playerId: 'p1',
      cards: [card('S-2', 7)],
      type: 'single',
      power: 7,
    }

    expect(canBeat([card('S-A', 6), card('H-A', 6), card('C-A', 6), card('D-A', 6)], current)).toMatchObject({
      valid: false,
      reason: '必须跟相同牌型',
    })
  })
})

function card(id: string, power: number): Card {
  return {
    id,
    suit: id.startsWith('JOKER') ? 'JOKER' : 'S',
    rank: 'A',
    color: 'black',
    power,
  }
}
