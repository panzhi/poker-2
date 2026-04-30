import { describe, expect, it } from 'vitest'
import { scoreFivePlayers, scoreFourPlayers } from '../../src/game/score'
import type { Card, Player, Team } from '../../src/game/types'

describe('4-player scoring rules', () => {
  it('awards double score when top two players are from the same team', () => {
    const players = [player('r1', 'red'), player('r2', 'red'), player('b1', 'black'), player('b2', 'black')]
    const result = scoreFourPlayers(players, ['r1', 'r2', 'b1', 'b2'], 1)

    expect(result.winnerTeam).toBe('red')
    expect(result.deltaByPlayerId).toEqual({ r1: 2, r2: 2, b1: -2, b2: -2 })
  })

  it('uses the third finisher team when top two players are from different teams', () => {
    const players = [player('r1', 'red'), player('r2', 'red'), player('b1', 'black'), player('b2', 'black')]
    const result = scoreFourPlayers(players, ['r1', 'b1', 'b2', 'r2'], 1)

    expect(result.winnerTeam).toBe('black')
    expect(result.deltaByPlayerId).toEqual({ r1: -1, r2: -1, b1: 1, b2: 1 })
  })

  it('applies multiplier without producing Infinity for large but realistic values', () => {
    const players = [player('r1', 'red'), player('r2', 'red'), player('b1', 'black'), player('b2', 'black')]
    const result = scoreFourPlayers(players, ['r1', 'r2', 'b1', 'b2'], 1_000_000)

    expect(Object.values(result.deltaByPlayerId).every(Number.isFinite)).toBe(true)
    expect(result.deltaByPlayerId.r1).toBe(2_000_000)
  })

  it('throws when teams are not assigned before settlement', () => {
    const players = [player('p1', null), player('p2', 'red'), player('p3', 'black'), player('p4', 'black')]

    expect(() => scoreFourPlayers(players, ['p1', 'p2', 'p3', 'p4'], 1)).toThrow('队伍未完成分配')
  })
})

describe('5-player scoring rules', () => {
  it('awards RRBBB red double win with heart A +4 and diamond A +2', () => {
    const players = [
      player('heartA', 'red', [card('H-A')]),
      player('diamondA', 'red', [card('D-A')]),
      player('b1', 'black'),
      player('b2', 'black'),
      player('b3', 'black'),
    ]
    const result = scoreFivePlayers(players, ['heartA', 'diamondA', 'b1', 'b2', 'b3'], 1)

    expect(result.winnerTeam).toBe('red')
    expect(result.deltaByPlayerId).toEqual({ heartA: 4, diamondA: 2, b1: -2, b2: -2, b3: -2 })
  })

  it('awards BBBRR black double win with heart A -4 and diamond A -2', () => {
    const players = [
      player('heartA', 'red', [card('H-A')]),
      player('diamondA', 'red', [card('D-A')]),
      player('b1', 'black'),
      player('b2', 'black'),
      player('b3', 'black'),
    ]
    const result = scoreFivePlayers(players, ['b1', 'b2', 'b3', 'heartA', 'diamondA'], 1)

    expect(result.winnerTeam).toBe('black')
    expect(result.deltaByPlayerId).toEqual({ heartA: -4, diamondA: -2, b1: 2, b2: 2, b3: 2 })
  })

  it.each(['RBBBR', 'BRRBB', 'BRBRB', 'BBRRB'])('treats %s as draw', (sequence) => {
    const players = playersForSequence(sequence)
    const result = scoreFivePlayers(players, players.map((item) => item.id), 1)

    expect(result.winnerTeam).toBe('draw')
    expect(Object.values(result.deltaByPlayerId)).toEqual([0, 0, 0, 0, 0])
  })

  it('applies declare/ask A multiplier to settlement', () => {
    const players = [player('r1', 'red'), player('r2', 'red'), player('b1', 'black'), player('b2', 'black'), player('b3', 'black')]
    const result = scoreFivePlayers(players, ['r1', 'b1', 'b2', 'r2', 'b3'], 2)

    expect(result.winnerTeam).toBe('red')
    expect(result.deltaByPlayerId).toEqual({ r1: 2, r2: 2, b1: -2, b2: -2, b3: -2 })
  })
})

function playersForSequence(sequence: string): Player[] {
  let redIndex = 0
  let blackIndex = 0

  return sequence.split('').map((team, index) => {
    if (team === 'R') {
      redIndex += 1
      return player(`r${index}`, 'red', [card(redIndex === 1 ? 'H-A' : 'D-A')])
    }

    blackIndex += 1
    return player(`b${index}`, 'black')
  })
}

function player(id: string, team: Team | null, hand: Card[] = []): Player {
  return {
    id,
    name: id,
    hand,
    score: 0,
    team,
    connected: true,
    autoPlay: false,
    finishedRank: null,
  }
}

function card(id: string): Card {
  return {
    id,
    suit: id.startsWith('H') ? 'H' : 'D',
    rank: 'A',
    color: id.startsWith('H') || id.startsWith('D') ? 'red' : 'black',
    power: 6,
  }
}
