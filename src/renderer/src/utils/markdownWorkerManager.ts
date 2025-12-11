/**
 * Markdown Worker 管理器
 * 使用双缓冲模式，将 Markdown 解析任务发送给 Web Worker 处理
 */

interface WorkerMessage {
  id: number
  markdown: string
}

interface WorkerResponse {
  id: number
  html: string
  error?: string
}

export class MarkdownWorkerManager {
  private worker: Worker | null = null
  private messageId = 0
  private pendingRequests = new Map<
    number,
    {
      resolve: (html: string) => void
      reject: (error: Error) => void
    }
  >()

  constructor() {
    this.initWorker()
  }

  private initWorker(): void {
    // 创建 Worker 实例
    this.worker = new Worker(new URL('../workers/markdown.worker.ts', import.meta.url), {
      type: 'module'
    })

    // 监听 Worker 返回的消息
    this.worker.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
      const { id, html, error } = event.data
      const pending = this.pendingRequests.get(id)

      if (pending) {
        if (error) {
          pending.reject(new Error(error))
        } else {
          pending.resolve(html)
        }
        this.pendingRequests.delete(id)
      }
    })

    // 监听 Worker 错误
    this.worker.addEventListener('error', (event) => {
      console.error('Worker 错误:', event)
      // 拒绝所有待处理的请求
      this.pendingRequests.forEach((pending) => {
        pending.reject(new Error('Worker 发生错误'))
      })
      this.pendingRequests.clear()
    })
  }

  /**
   * 解析 Markdown 为 HTML
   * @param markdown - Markdown 文本
   * @returns Promise<string> - 解析后的 HTML
   */
  async parseMarkdown(markdown: string): Promise<string> {
    if (!this.worker) {
      throw new Error('Worker 未初始化')
    }

    return new Promise((resolve, reject) => {
      const id = ++this.messageId

      // 存储 Promise 的 resolve 和 reject
      this.pendingRequests.set(id, { resolve, reject })

      // 发送消息到 Worker
      const message: WorkerMessage = { id, markdown }
      this.worker!.postMessage(message)
    })
  }

  /**
   * 终止 Worker
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
    this.pendingRequests.clear()
  }
}
