import type { BidState, BidType, Card, GamePhase, Player, ScoreResult, Team, Trick } from '../game/types';
interface GameStoreState {
    phase: GamePhase;
    mode: 4 | 5;
    players: Player[];
    deck: Card[];
    currentTrick: Trick | null;
    discardPile: Trick[];
    currentPlayerId: string | null;
    dealerPlayerId: string | null;
    starterPlayerId: string | null;
    bid: BidState | null;
    finishOrder: string[];
    selectedCardIds: string[];
    passPlayerIds: string[];
    roundNo: number;
    lastScoreResult: ScoreResult | null;
    message: string;
}
/**
 * 单机 MVP 牌局状态树。
 *
 * 视图层只负责展示和触发 action，所有规则判断都集中在该 store 与 game/*
 * 纯函数中，方便后续迁移到 Node 服务端。
 */
export declare const useGameStore: import("pinia").StoreDefinition<"game", GameStoreState, {
    me: (state: {
        phase: GamePhase;
        mode: 4 | 5;
        players: {
            id: string;
            name: string;
            hand: {
                id: string;
                suit: import("../game/types").Suit | "JOKER";
                rank: import("../game/types").Rank;
                color: Team;
                power: number;
            }[];
            score: number;
            team: Team | null;
            connected: boolean;
            autoPlay: boolean;
            finishedRank: number | null;
        }[];
        deck: {
            id: string;
            suit: import("../game/types").Suit | "JOKER";
            rank: import("../game/types").Rank;
            color: Team;
            power: number;
        }[];
        currentTrick: {
            playerId: string;
            cards: {
                id: string;
                suit: import("../game/types").Suit | "JOKER";
                rank: import("../game/types").Rank;
                color: Team;
                power: number;
            }[];
            type: import("../game/types").HandType;
            power: number;
        } | null;
        discardPile: {
            playerId: string;
            cards: {
                id: string;
                suit: import("../game/types").Suit | "JOKER";
                rank: import("../game/types").Rank;
                color: Team;
                power: number;
            }[];
            type: import("../game/types").HandType;
            power: number;
        }[];
        currentPlayerId: string | null;
        dealerPlayerId: string | null;
        starterPlayerId: string | null;
        bid: {
            type: BidType;
            playerId: string;
            multiplier: number;
            revealedPlayerIds: string[];
        } | null;
        finishOrder: string[];
        selectedCardIds: string[];
        passPlayerIds: string[];
        roundNo: number;
        lastScoreResult: {
            winnerTeam: Team | "draw";
            deltaByPlayerId: Record<string, number>;
            sequence: string;
        } | null;
        message: string;
    } & import("pinia").PiniaCustomStateProperties<GameStoreState>) => Player | null;
    currentPlayer: (state: {
        phase: GamePhase;
        mode: 4 | 5;
        players: {
            id: string;
            name: string;
            hand: {
                id: string;
                suit: import("../game/types").Suit | "JOKER";
                rank: import("../game/types").Rank;
                color: Team;
                power: number;
            }[];
            score: number;
            team: Team | null;
            connected: boolean;
            autoPlay: boolean;
            finishedRank: number | null;
        }[];
        deck: {
            id: string;
            suit: import("../game/types").Suit | "JOKER";
            rank: import("../game/types").Rank;
            color: Team;
            power: number;
        }[];
        currentTrick: {
            playerId: string;
            cards: {
                id: string;
                suit: import("../game/types").Suit | "JOKER";
                rank: import("../game/types").Rank;
                color: Team;
                power: number;
            }[];
            type: import("../game/types").HandType;
            power: number;
        } | null;
        discardPile: {
            playerId: string;
            cards: {
                id: string;
                suit: import("../game/types").Suit | "JOKER";
                rank: import("../game/types").Rank;
                color: Team;
                power: number;
            }[];
            type: import("../game/types").HandType;
            power: number;
        }[];
        currentPlayerId: string | null;
        dealerPlayerId: string | null;
        starterPlayerId: string | null;
        bid: {
            type: BidType;
            playerId: string;
            multiplier: number;
            revealedPlayerIds: string[];
        } | null;
        finishOrder: string[];
        selectedCardIds: string[];
        passPlayerIds: string[];
        roundNo: number;
        lastScoreResult: {
            winnerTeam: Team | "draw";
            deltaByPlayerId: Record<string, number>;
            sequence: string;
        } | null;
        message: string;
    } & import("pinia").PiniaCustomStateProperties<GameStoreState>) => Player | null;
    selectedCards(state: {
        phase: GamePhase;
        mode: 4 | 5;
        players: {
            id: string;
            name: string;
            hand: {
                id: string;
                suit: import("../game/types").Suit | "JOKER";
                rank: import("../game/types").Rank;
                color: Team;
                power: number;
            }[];
            score: number;
            team: Team | null;
            connected: boolean;
            autoPlay: boolean;
            finishedRank: number | null;
        }[];
        deck: {
            id: string;
            suit: import("../game/types").Suit | "JOKER";
            rank: import("../game/types").Rank;
            color: Team;
            power: number;
        }[];
        currentTrick: {
            playerId: string;
            cards: {
                id: string;
                suit: import("../game/types").Suit | "JOKER";
                rank: import("../game/types").Rank;
                color: Team;
                power: number;
            }[];
            type: import("../game/types").HandType;
            power: number;
        } | null;
        discardPile: {
            playerId: string;
            cards: {
                id: string;
                suit: import("../game/types").Suit | "JOKER";
                rank: import("../game/types").Rank;
                color: Team;
                power: number;
            }[];
            type: import("../game/types").HandType;
            power: number;
        }[];
        currentPlayerId: string | null;
        dealerPlayerId: string | null;
        starterPlayerId: string | null;
        bid: {
            type: BidType;
            playerId: string;
            multiplier: number;
            revealedPlayerIds: string[];
        } | null;
        finishOrder: string[];
        selectedCardIds: string[];
        passPlayerIds: string[];
        roundNo: number;
        lastScoreResult: {
            winnerTeam: Team | "draw";
            deltaByPlayerId: Record<string, number>;
            sequence: string;
        } | null;
        message: string;
    } & import("pinia").PiniaCustomStateProperties<GameStoreState>): Card[];
    canSubmit(): boolean;
    availableBids(): BidType[];
    winnerLabel(): string;
}, {
    /**
     * 创建本地测试房间。
     */
    createLocalGame(mode: 4 | 5): void;
    /**
     * 开始新一局，完成洗牌、发牌、分队，并进入叫分阶段。
     */
    startRound(): void;
    /**
     * 当前玩家叫分。MVP 使用一口价模型：第一个非“不叫”锁定本局。
     */
    placeBid(type: BidType): void;
    /**
     * 本地快速跳过叫分，便于测试出牌流程。
     */
    skipBidding(): void;
    /**
     * 切换本方手牌选择状态。
     */
    toggleCard(cardId: string): void;
    /**
     * 当前玩家打出所选牌。
     */
    playSelectedCards(): void;
    /**
     * 指定玩家出牌，托管和真人共用同一入口。
     */
    playCards(playerId: string, cards: readonly Card[]): void;
    /**
     * 当前玩家 Pass。
     */
    pass(): void;
    /**
     * 托管行动：能出最小可压牌则出，否则 Pass。
     */
    autoAct(): void;
    /**
     * 标记玩家出完，并在只剩最后一名时自动结算。
     */
    markFinished(playerId: string): void;
    /**
     * 根据完成顺序结算积分。
     */
    settleRound(): void;
    /**
     * 推进出牌回合到下一名未完成玩家。
     */
    advanceTurn(): void;
    /**
     * 查找下一名仍在牌局中的玩家。
     */
    nextActivePlayerId(fromId: string | null): string;
    enterPlaying(): void;
    advanceBiddingTurn(): void;
    resolveDealerIndex(): number;
}>;
export {};
