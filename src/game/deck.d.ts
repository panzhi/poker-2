import type { Card } from './types';
/**
 * 创建规则定义的完整牌库。
 *
 * 4 人局：基础 26 张 + 红桃 9 + 黑桃 9，共 28 张。
 * 5 人局：4 人牌库 + 梅花 9 + 方片 9，共 30 张。
 */
export declare function createDeck(mode: 4 | 5): Card[];
/**
 * Fisher-Yates 洗牌算法。
 *
 * 多人生产环境应在服务端执行本函数，并注入基于 crypto 的随机数。
 * 前端 MVP 使用 Math.random 仅用于本地演示。
 */
export declare function shuffleDeck<T>(items: readonly T[], random?: () => number): T[];
/**
 * 从起始玩家开始按座位顺序逐张发牌。
 */
export declare function dealCards(deck: readonly Card[], playersCount: number, dealerIndex: number): Card[][];
/**
 * 按牌力降序整理手牌；牌力相同时按 id 保持稳定顺序。
 */
export declare function sortCards(cards: readonly Card[]): Card[];
