# Team Poker

一个基于 Vue 3 + Vite + Pinia 的多人团队跑牌游戏 MVP。项目包含浏览器客户端和 Node.js WebSocket 服务端，服务端负责权威洗牌、发牌、出牌校验、回合流转和计分结算。

## 功能概览

- 支持 4 人局和 5 人局。
- 支持创建房间、加入房间、房主开局 / 下一局。
- 服务端使用 Fisher-Yates 洗牌，并通过 WebSocket 下发每位玩家自己的牌局快照。
- 支持叫分：宣爆、独、宣红 A、宣黑 A、提红 A、提黑 A、不叫。
- 支持单张、对子、三张、四张出牌；跟牌必须同牌型且点数更大。
- 支持按完成顺序结算 4 人 / 5 人团队胜负，以及宣爆 / 独的即时结算。
- 前端只处理 UI 状态和操作意图，核心规则由服务端执行。

## 技术栈

- Vue 3
- Vite
- TypeScript
- Pinia
- Node.js 18
- ws
- Vitest
- Docker / Docker Compose
- Nginx

## 环境要求

项目要求 Node.js `18.x`。本地开发前先切换 Node 版本：

```bash
nvm use
```

如果本机没有对应版本：

```bash
nvm install 18
nvm use
```

## 本地启动

安装依赖：

```bash
nvm use
yarn install
```

启动 WebSocket 服务端：

```bash
nvm use
yarn server
```

另开一个终端启动前端开发服务：

```bash
nvm use
yarn dev
```

默认地址：

- 前端：`http://localhost:5173`
- WebSocket 服务端：`ws://localhost:8787`

本地访问 `localhost` 或 `127.0.0.1` 时，客户端默认连接 `ws://localhost:8787`。如需覆盖服务端地址，可以设置：

```bash
VITE_WS_URL=ws://your-host:8787 yarn dev
```

## 使用方式

1. 打开前端页面。
2. 输入昵称，选择 4 人局或 5 人局。
3. 第一位玩家点击「创建房间」，页面会显示房间号。
4. 其他玩家输入房间号并点击「加入」。
5. 房间满员后，房主点击「开始 / 下一局」。
6. 按顺序叫分、出牌或 Pass，结算后可继续下一局。

## 游戏规则摘要

### 牌库

- 4 人局：`10 / J / Q / K / A / 2` 四种花色，加 `♥9 / ♠9` 和大小王，共 28 张，每人 7 张。
- 5 人局：在 4 人局基础上增加 `♣9 / ♦9`，共 30 张，每人 6 张。
- 点数大小：`9 < 10 < J < Q < K < A < 2 < 小王 < 大王`。

### 阵营

- 红 A 玩家属于红队。
- 黑 A 玩家属于黑队。
- 同时持有红 A 和黑 A 时，红 A 优先。
- 5 人局无 A 玩家归黑队。

### 出牌

- 允许牌型：单张、对子、三张、四张。
- 大小王可以组成对子。
- 四张不具备炸弹特权，不能跨牌型压制。
- 跟牌必须与桌面牌同牌型，并且点数严格更大。
- `♥9` 持有者先出牌。

### 叫分

当前 MVP 采用“一口价”模型：第一个非不叫的叫分直接进入出牌阶段。

- `declare-red-a` / `declare-black-a` / `ask-red-a` / `ask-black-a`：倍率为 2。
- `xuan-bao`：宣爆，成功向其他每位玩家收 5 分，失败赔其他每位玩家 5 分。
- `solo`：独，成功向其他每位玩家收 3 分，失败赔其他每位玩家 3 分。
- `pass`：不叫。

### 结算

- 4 人局：前两名同队则该队双倍胜；前两名不同队时，第 3 名所在队单倍胜。
- 5 人局：
  - `RRBBB`：红队双倍胜。
  - `BBBRR`：黑队双倍胜。
  - `RBBBR / BRRBB / BRBRB / BBRRB`：平局。
  - 其他序列：第 1 名所在队单倍胜。
- 普通叫分倍率会参与团队胜负结算。
- 宣爆 / 独按特殊规则即时结算。

## 常用命令

```bash
nvm use
yarn dev
```

启动前端开发服务。

```bash
nvm use
yarn server
```

启动 Node WebSocket 服务端。

```bash
nvm use
yarn build
```

执行 TypeScript 类型检查并构建前端产物。

```bash
nvm use
yarn test
```

运行 Vitest 单元测试。

```bash
nvm use
yarn preview
```

本地预览生产构建。

## Docker 部署

项目提供前端 Nginx 镜像和 Node WebSocket 服务端镜像。

```bash
docker compose up -d --build
```

或使用脚本：

```bash
sh scripts/deploy-docker.sh
```

部署后默认暴露：

- Web：`http://localhost:5173`
- WebSocket 代理：`/ws`

Nginx 会把 `/ws` 转发到 compose 内部的 `server:8787`。

## 项目结构

```text
.
├── server/
│   ├── index.js          # WebSocket 房间、回合和广播逻辑
│   └── game-engine.js    # 服务端权威规则实现
├── src/
│   ├── components/       # Vue 牌桌、座位、手牌、叫分和操作组件
│   ├── game/             # 前端规则类型、牌库、牌型和计分逻辑
│   ├── network/          # WebSocket 客户端封装
│   ├── stores/           # Pinia 游戏状态
│   ├── App.vue
│   └── main.ts
├── tests/
│   └── unit/             # 牌库、牌型、计分等单元测试
├── Dockerfile.server
├── Dockerfile.web
├── docker-compose.yml
└── nginx.conf
```

## 设计备注

- 服务端是牌局权威来源，客户端提交的是操作意图。
- 服务端只把当前玩家自己的手牌下发给该玩家；其他玩家只暴露手牌数量。
- 阵营默认只对本人可见，结算阶段或宣 / 提 A 后按规则部分公开。
- 当前房间状态保存在服务端内存中，重启服务后房间会丢失。
- 断线玩家会被标记为离线；自动托管和重连恢复仍属于后续增强项。

## 部署时可能遇到的问题

### 你服务器上的 Git 被配置成走本地代理 127.0.0.1:1080，但服务器上这个代理没开，所以连 GitHub 失败了。

先执行这几条清掉 Git 代理：

git config --global --unset http.proxy
git config --global --unset https.proxy
git config --global --unset http.https://github.com.proxy
git config --global --unset https.https://github.com.proxy
如果某条提示不存在，没事。

再确认没有代理：

git config --global --get http.proxy
git config --global --get https.proxy
没有输出就对了。

### 还有代理配置在别的地方，不在 ~/.gitconfig。直接按这个排查。

先看 Git 到底从哪里读到了 proxy：

git config --show-origin --get-regexp 'proxy'
再看环境变量：

env | grep -i proxy
大概率会看到类似：

http_proxy=http://127.0.0.1:1080
https_proxy=http://127.0.0.1:1080
ALL_PROXY=socks5://127.0.0.1:1080
清掉当前 shell 的代理：

unset http_proxy
unset https_proxy
unset all_proxy
unset HTTP_PROXY
unset HTTPS_PROXY
unset ALL_PROXY
再试：

cd /opt
git clone https://github.com/panzhi/poker-2.git
如果还不行，说明是 system git config：

git config --system --get-regexp 'proxy'
清掉：

git config --system --unset http.proxy
git config --system --unset https.proxy
git config --system --unset http.https://github.com.proxy
git config --system --unset https.https://github.com.proxy
然后再 clone。

临时强制不走代理也可以这样：


cd /opt
git -c http.proxy= -c https.proxy= clone https://github.com/panzhi/poker-2.git
如果 env | grep -i proxy 里有代理，之后还会反复出现，就检查这些文件里有没有写死：

grep -R "127.0.0.1:1080" ~/.bashrc ~/.profile /etc/environment /etc/profile /etc/profile.d 2>/dev/null
删掉对应那行后重新登录 SSH。



sh scripts/deploy-docker.sh