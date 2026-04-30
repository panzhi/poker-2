export type Suit = 'S' | 'H' | 'C' | 'D';
export type Rank = '9' | '10' | 'J' | 'Q' | 'K' | 'A' | '2' | 'SJ' | 'BJ';
export type Team = 'red' | 'black';
export type GamePhase = 'lobby' | 'dealing' | 'bidding' | 'playing' | 'settlement';
export type HandType = 'single' | 'pair' | 'triple' | 'quad';
export type BidType = 'xuan-bao' | 'solo' | 'declare-red-a' | 'declare-black-a' | 'ask-red-a' | 'ask-black-a' | 'pass';
export interface Card {
    id: string;
    suit: Suit | 'JOKER';
    rank: Rank;
    color: Team;
    power: number;
}
export interface Player {
    id: string;
    name: string;
    hand: Card[];
    score: number;
    team: Team | null;
    connected: boolean;
    autoPlay: boolean;
    finishedRank: number | null;
}
export interface Trick {
    playerId: string;
    cards: Card[];
    type: HandType;
    power: number;
}
export interface BidState {
    type: BidType;
    playerId: string;
    multiplier: number;
    revealedPlayerIds: string[];
}
export interface ScoreResult {
    winnerTeam: Team | 'draw';
    deltaByPlayerId: Record<string, number>;
    sequence: string;
}
