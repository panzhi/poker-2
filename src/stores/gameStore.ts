import { defineStore } from 'pinia'
import type { BidState, BidType, Card, GamePhase, Player, ScoreResult, Team, Trick } from '../game/types'
import { canBeat } from '../game/hand'
import { socketClient, type SnapshotPayload } from '../network/socketClient'

interface GameStoreState {
  connected: boolean
  messageSubscribed: boolean
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

/**
 * 多人牌局客户端状态树。
 *
 * 客户端只保存服务端快照和本地选牌 UI 状态；洗牌、发牌、出牌校验、
 * Pass 流转和结算全部由 Node WebSocket 服务端执行。
 */
export const useGameStore = defineStore('game', {
  state: (): GameStoreState => ({
    connected: false,
    messageSubscribed: false,
    roomCode: '',
    selfPlayerId: null,
    ownerPlayerId: null,
    phase: 'lobby',
    mode: 4,
    players: [],
    deck: [],
    currentTrick: null,
    discardPile: [],
    currentPlayerId: null,
    dealerPlayerId: null,
    starterPlayerId: null,
    bid: null,
    finishOrder: [],
    selectedCardIds: [],
    passPlayerIds: [],
    roundNo: 0,
    lastScoreResult: null,
    message: '连接服务后创建或加入房间',
    availableBidsFromServer: [],
  }),

  getters: {
    me: (state): Player | null => {
      return state.players.find((player) => player.id === state.selfPlayerId) ?? null
    },

    currentPlayer: (state): Player | null => {
      return state.players.find((player) => player.id === state.currentPlayerId) ?? null
    },

    selectedCards(state): Card[] {
      const me = state.players.find((player) => player.id === state.selfPlayerId)
      return me?.hand.filter((card) => state.selectedCardIds.includes(card.id)) ?? []
    },

    canSubmit(): boolean {
      return this.phase === 'playing' && this.currentPlayerId === this.me?.id && canBeat(this.selectedCards, this.currentTrick).valid
    },

    availableBids(): BidType[] {
      return this.availableBidsFromServer
    },

    winnerLabel(): string {
      if (!this.lastScoreResult) return ''
      if (this.lastScoreResult.label) return this.lastScoreResult.label
      if (this.lastScoreResult.winnerTeam === 'draw') return '平局'
      return this.lastScoreResult.winnerTeam === 'red' ? '红队胜利' : '黑队胜利'
    },

    isOwner: (state): boolean => {
      return Boolean(state.selfPlayerId && state.ownerPlayerId && state.selfPlayerId === state.ownerPlayerId)
    },

    roomIsFull: (state): boolean => {
      return state.players.length === state.mode
    },
  },

  actions: {
    /**
     * 连接多人服务端。
     */
    async connect(): Promise<void> {
      try {
        await socketClient.connect()
        this.connected = true
        this.message = '已连接服务端'
      } catch (error) {
        this.connected = false
        this.message = error instanceof Error ? error.message : '连接服务端失败'
        return
      }

      if (this.messageSubscribed) return
      this.messageSubscribed = true
      socketClient.onMessage((message) => {
        if (message.type === 'snapshot') {
          this.applySnapshot(message.payload as SnapshotPayload)
          return
        }

        if (message.type === 'error') {
          const payload = message.payload as { message?: string }
          this.message = payload.message ?? '服务端错误'
        }
      })
    },

    /**
     * 创建真实多人房间。
     */
    async createRoom(name: string, mode: 4 | 5): Promise<void> {
      await this.ensureConnected()
      if (!this.connected) return
      socketClient.send('createRoom', { name, mode })
    },

    /**
     * 加入真实多人房间。
     */
    async joinRoom(name: string, roomCode: string): Promise<void> {
      await this.ensureConnected()
      if (!this.connected) return
      socketClient.send('joinRoom', { name, roomCode })
    },

    /**
     * 房主请求服务端开局。
     */
    startRound(): void {
      socketClient.send('startRound')
    },

    /**
     * 当前玩家叫分。
     */
    placeBid(type: BidType): void {
      socketClient.send('bid', { bidType: type })
    },

    /**
     * 便捷入口：本玩家不叫。
     */
    skipBidding(): void {
      this.placeBid('pass')
    },

    /**
     * 切换本方手牌选择状态。本地只做 UI 选择，不改变牌局。
     */
    toggleCard(cardId: string): void {
      if (this.phase !== 'playing' || this.currentPlayerId !== this.me?.id) return

      this.selectedCardIds = this.selectedCardIds.includes(cardId)
        ? this.selectedCardIds.filter((id) => id !== cardId)
        : [...this.selectedCardIds, cardId]
    },

    /**
     * 当前玩家向服务端提交出牌意图。
     */
    playSelectedCards(): void {
      socketClient.send('playCards', { cardIds: this.selectedCardIds })
    },

    /**
     * 当前玩家向服务端提交 Pass 意图。
     */
    pass(): void {
      socketClient.send('pass')
    },

    /**
     * 应用服务端快照。
     */
    applySnapshot(snapshot: SnapshotPayload): void {
      const state = snapshot.state as Partial<GameStoreState>

      this.roomCode = snapshot.roomCode
      this.selfPlayerId = snapshot.selfPlayerId
      this.ownerPlayerId = snapshot.ownerPlayerId
      this.availableBidsFromServer = snapshot.availableBids
      this.phase = state.phase ?? this.phase
      this.mode = state.mode ?? this.mode
      this.players = (state.players as Player[] | undefined) ?? []
      this.currentTrick = (state.currentTrick as Trick | null | undefined) ?? null
      this.discardPile = (state.discardPile as Trick[] | undefined) ?? []
      this.currentPlayerId = state.currentPlayerId ?? null
      this.dealerPlayerId = state.dealerPlayerId ?? null
      this.starterPlayerId = state.starterPlayerId ?? null
      this.bid = (state.bid as BidState | null | undefined) ?? null
      this.finishOrder = (state.finishOrder as string[] | undefined) ?? []
      this.passPlayerIds = (state.passPlayerIds as string[] | undefined) ?? []
      this.roundNo = state.roundNo ?? 0
      this.lastScoreResult = (state.lastScoreResult as ScoreResult | null | undefined) ?? null
      this.message = state.message ?? ''
      this.selectedCardIds = this.selectedCardIds.filter((cardId) => this.me?.hand.some((card) => card.id === cardId))
    },

    async ensureConnected(): Promise<void> {
      if (!this.connected) {
        await this.connect()
      }
    },
  },
})
