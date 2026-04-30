import type { Player, ScoreResult } from './types';
/**
 * 计算 4 人局结算。
 *
 * 第 1、2 名同队时该队双倍胜；不同队时第 3 名所在队单倍胜。
 */
export declare function scoreFourPlayers(players: readonly Player[], finishOrder: readonly string[], multiplier: number): ScoreResult;
/**
 * 计算 5 人局结算。
 *
 * RULE.md 对部分单倍胜写了“等”，这里用可维护策略落地：
 * - RRBBB：红队双倍胜。
 * - BBBRR：黑队双倍胜。
 * - RBBBR / BRRBB / BRBRB / BBRRB：平局。
 * - 其他序列：第 1 名所在队单倍胜。
 */
export declare function scoreFivePlayers(players: readonly Player[], finishOrder: readonly string[], multiplier: number): ScoreResult;
