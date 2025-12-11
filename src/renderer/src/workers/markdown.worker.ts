// 为 Worker 环境提供基本的 DOM polyfill
// rehype-sanitize 可能会尝试访问 document
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any).document = {
  createElement: () => ({}) as any,
  createElementNS: () => ({}) as any,
  createTextNode: () => ({}) as any,
  createComment: () => ({}) as any
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any).window = globalThis

import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeSanitize from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'

// Worker 消息类型
interface MarkdownMessage {
  id: number
  markdown: string
}

interface HtmlMessage {
  id: number
  html: string
  error?: string
}

// 监听主线程的消息
self.addEventListener('message', async (event: MessageEvent<MarkdownMessage>) => {
  const { id, markdown } = event.data

  try {
    // 在 Worker 线程中执行 Markdown 解析
    const result = await unified()
      .use(remarkParse)
      .use(remarkRehype)
      .use(rehypeSanitize)
      .use(rehypeStringify)
      .process(markdown)

    const html = String(result)

    // 发送解析结果回主线程
    const response: HtmlMessage = { id, html }
    self.postMessage(response)
  } catch (error) {
    // 发送错误信息回主线程
    const response: HtmlMessage = {
      id,
      html: '',
      error: error instanceof Error ? error.message : '未知错误'
    }
    self.postMessage(response)
  }
})
