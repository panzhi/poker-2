# 全栈技术架构与代码说明

## 1. 技术栈

- Vue 3：界面渲染。
- Pinia：客户端状态管理。
- Vite：开发和构建。
- TypeScript：规则引擎类型约束。
- Node.js + ws：真实多人房间 WebSocket 服务。
- CSS/SVG 思路：扑克牌面由 CSS 绘制，无外部图片资源。

当前仓库已经升级为真实多人房间 MVP。Node 服务端持有权威牌局状态，负责洗牌、发牌、出牌校验和结算；前端只提交操作意图并渲染服务端快照。

## 2. 状态树

核心状态位于 `src/stores/gameStore.ts`。

```ts
interface GameStoreState {
  connected: boolean
  roomCode: string
  selfPlayerId: string | null
  ownerPlayerId: string | null
  phase: GamePhase
  mode: 4 | 5
  players: Player[]
  deck: Card[]
  currentTrick: Trick | null
  discardPile: Trick[]
  currentPlayerId: string | null
  dealerPlayerId: string | null
  starterPlayerId: string | null
  bid: BidState | null
  finishOrder: string[]
  selectedCardIds: string[]
  passPlayerIds: string[]
  roundNo: number
  lastScoreResult: ScoreResult | null
  message: string
  availableBidsFromServer: BidType[]
}
```

状态流转：

```txt
lobby -> dealing -> bidding -> playing -> settlement
```

## 3. 模块划分

### `src/game/types.ts`

集中定义牌、玩家、叫分、牌型、结算结果等类型。

### `src/game/deck.ts`

负责：

- 创建 4 人 / 5 人牌库。
- Fisher-Yates 洗牌。
- 发牌。
- 手牌排序。

### `src/game/hand.ts`

负责：

- 单张、对子、三张、四张判定。
- 判断所选牌能否压过桌面牌。

### `src/game/score.ts`

负责：

- 4 人局结算。
- 5 人局结算。
- 平局序列处理。

### `src/game/engine.ts`

负责：

- 阵营推导。
- 可用叫分项。
- 托管最小可出牌。
- 宣/提 A 的明示玩家列表。

### `server/index.js`

负责：

- 房间创建。
- 玩家加入。
- 服务端权威新局开始。
- 叫分。
- 出牌校验。
- Pass。
- 出完名次与积分结算。
- 向不同玩家发送脱敏快照。

### `server/game-engine.js`

负责服务端权威规则：

- 创建牌库。
- Fisher-Yates 洗牌。
- 发牌。
- 牌型判定。
- 阵营推导。
- 计分。

### `src/network/socketClient.ts`

负责：

- 连接 WebSocket 服务。
- JSON 消息编解码。
- 发送创建房间、加入房间、叫分、出牌、Pass 等操作意图。

### `src/stores/gameStore.ts`

负责：

- 保存服务端快照。
- 保存本地选牌状态。
- 将 UI 操作转成 WebSocket 消息。
- 积分结算。

### `src/components/*`

负责 UI 展示：

- `GameTable.vue`：主牌桌。
- `PlayingCard.vue`：CSS 卡牌。
- `PlayerSeat.vue`：玩家座位。
- `ActionBar.vue`：出牌操作。
- `BiddingPanel.vue`：叫分面板。

## 4. 核心算法

### Fisher-Yates 洗牌

实现位置：`server/game-engine.js` 和 `src/game/deck.ts`。

生产要求：

- 多人版实际使用服务端实现。
- 服务端使用 `crypto.randomInt` 注入随机数。
- 洗牌结果只在服务端保存。

### 牌型判定

实现位置：`src/game/hand.ts`。

规则：

- 只允许 1-4 张。
- 必须同点数。
- 跟牌必须同牌型。
- 候选牌点数必须大于桌面牌。
- 四张不具备炸弹特权。

## 5. 当前 MVP 能力

已落地：

- Vite + Vue 3 + Pinia 工程。
- Node WebSocket 服务端。
- 4 人 / 5 人真实多人房间。
- 房间号创建 / 加入。
- 服务端自动洗牌、发牌。
- `♥9` 持有者先出牌。
- 一口价叫分模型。
- 阵营推导。
- 出牌和 Pass。
- 非本人手牌隐藏，只展示手牌数量。
- 4 人 / 5 人结算骨架。
- CSS 扑克牌。
- 响应式桌面。

暂未最终接入：

- 独的成功/失败结算。
- 宣爆的额外结算。
- 完整 5 人局序列枚举。
- 断线托管。

原因：这些点依赖规则最终确认。

## 6. 快速运行

```bash
nvm use 18
npm install
```

终端 1 启动服务端：

```bash
npm run server
```

终端 2 启动前端：

```bash
npm run dev
```

生产构建：

```bash
nvm use 18
npm run build
npm run preview
```

## 7. 多人联机使用方式

1. 玩家 A 打开页面，输入昵称，选择 4 人局或 5 人局，点击创建房间。
2. 页面显示 6 位房间号。
3. 玩家 B/C/D/E 在自己的浏览器打开页面，输入昵称和房间号，点击加入。
4. 房间满员后，房主点击开始。
5. 每个玩家只看到自己的手牌，其他玩家只显示手牌数量。

## 8. 服务端后续扩展建议

后续可继续拆分：

```txt
server/
  index.js
  game-engine.js
  room-store.js
  transport.js
```

服务端职责：

- 创建房间。
- 管理座位。
- 洗牌发牌。
- 校验出牌。
- 广播公开状态。
- 隐藏非本人手牌。
- 处理断线重连。
- 执行权威结算。

客户端职责：

- 展示公开状态。
- 展示自己的手牌。
- 提交意图：叫分、选牌、出牌、Pass。
- 播放动画。

## 9. 关键技术风险

- 阵营人数不合法：需要重洗或明确归属规则。
- 叫分规则未闭合：影响结算。
- 独/宣爆未闭合：影响数值平衡。
- 客户端洗牌不可用于正式多人。
- 5 人局“等”规则必须变成完整枚举或算法。
