import type { Card, HandType, Trick } from './types';
export interface HandResult {
    valid: boolean;
    type: HandType | null;
    power: number;
    reason?: string;
}
/**
 * 判定所选牌是否符合规则牌型。
 *
 * 当前规则只允许单张、对子、三张、四张；四张不具备炸弹特权。
 */
export declare function evaluateHand(cards: readonly Card[]): HandResult;
/**
 * 判定候选牌是否可以压过桌面牌。
 *
 * 新一轮出牌时 currentTrick 为 null，只需要候选牌本身合法。
 */
export declare function canBeat(candidate: readonly Card[], currentTrick: Trick | null): HandResult;
