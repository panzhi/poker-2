import type { BidType, Card, Player, Team, Trick } from './types';
/**
 * 根据玩家手牌推导阵营。
 *
 * 规则原文没有处理同一玩家同时持有红 A 与黑 A 的冲突。
 * MVP 先采用红 A 优先；正式服务端建议在发牌后校验并重洗，保证阵营人数合法。
 */
export declare function inferTeam(player: Pick<Player, 'hand'>, mode: 4 | 5): Team;
/**
 * 获取玩家当前可用叫分按钮。
 */
export declare function getAvailableBids(hand: readonly Card[]): BidType[];
/**
 * 查找托管玩家的最小可出牌。
 *
 * 该策略偏保守：优先出最小张数，再出最小牌力。
 */
export declare function findSmallestPlayable(hand: readonly Card[], currentTrick: Trick | null): Card[];
/**
 * 计算被宣/提 A 后需要公开身份的玩家。
 */
export declare function getRevealedPlayerIds(players: readonly Player[], bidType: BidType): string[];
