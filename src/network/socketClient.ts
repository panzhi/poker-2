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
  private handlers = new Set<MessageHandler>()

  get connected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN
  }

  /**
   * 建立 WebSocket 连接。
   */
  connect(url = import.meta.env.VITE_WS_URL || getDefaultWebSocketUrl()): Promise<void> {
    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)
    ) {
      return Promise.resolve()
    }

    this.socket = new WebSocket(url)

    this.socket.addEventListener('message', (event) => {
      const message = JSON.parse(String(event.data)) as ServerEnvelope
      this.handlers.forEach((handler) => handler(message))
    })

    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('WebSocket 初始化失败'))
        return
      }

      this.socket.addEventListener('open', () => resolve(), { once: true })
      this.socket.addEventListener('error', () => reject(new Error('WebSocket 连接失败')), { once: true })
    })
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
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}/ws`
}

export const socketClient = new SocketClient()
