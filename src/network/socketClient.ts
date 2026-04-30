import type { BidType } from '../game/types'

export interface ServerEnvelope<T = unknown> {
  type: string
  payload: T
}

export interface SnapshotPayload {
  roomCode: string
  ownerPlayerId: string
  selfPlayerId: string
  availableBids: BidType[]
  state: Record<string, unknown>
}

type MessageHandler = (message: ServerEnvelope) => void

/**
 * 浏览器 WebSocket 客户端封装。
 *
 * 只负责连接、JSON 编解码和发送操作意图；不在客户端执行权威规则。
 */
export class SocketClient {
  private socket: WebSocket | null = null
  private connectPromise: Promise<void> | null = null
  private handlers = new Set<MessageHandler>()

  get connected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN
  }

  /**
   * 建立 WebSocket 连接。
   */
  connect(url = import.meta.env.VITE_WS_URL || getDefaultWebSocketUrl()): Promise<void> {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return Promise.resolve()
    }

    if (this.socket?.readyState === WebSocket.CONNECTING && this.connectPromise) {
      return this.connectPromise
    }

    this.socket = new WebSocket(url)

    this.socket.addEventListener('message', (event) => {
      const message = JSON.parse(String(event.data)) as ServerEnvelope
      this.handlers.forEach((handler) => handler(message))
    })

    this.connectPromise = new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('WebSocket 初始化失败'))
        return
      }

      this.socket.addEventListener(
        'open',
        () => {
          this.connectPromise = null
          resolve()
        },
        { once: true },
      )
      this.socket.addEventListener(
        'error',
        () => {
          this.connectPromise = null
          reject(new Error(`WebSocket 连接失败：${url}`))
        },
        { once: true },
      )
      this.socket.addEventListener(
        'close',
        () => {
          this.connectPromise = null
        },
        { once: true },
      )
    })

    return this.connectPromise
  }

  /**
   * 订阅服务端消息。
   */
  onMessage(handler: MessageHandler): () => void {
    this.handlers.add(handler)
    return () => this.handlers.delete(handler)
  }

  /**
   * 发送 JSON 操作意图。
   */
  send(type: string, payload: Record<string, unknown> = {}): void {
    if (!this.connected || !this.socket) {
      throw new Error('WebSocket 未连接')
    }

    this.socket.send(JSON.stringify({ type, payload }))
  }
}

function getDefaultWebSocketUrl(): string {
  if (['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    return 'ws://localhost:8787'
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}/ws`
}

export const socketClient = new SocketClient()
