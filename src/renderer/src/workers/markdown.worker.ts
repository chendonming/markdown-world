import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
import { visit } from 'unist-util-visit'
import type { Element } from 'hast'

/**
 * 自定义 rehype 插件：将源码行号注入到 HTML 元素的 data-line 属性中
 * 这是实现编辑器与预览区域同步滚动的基础
 */
function rehypeAddLineNumbers() {
  return (tree) => {
    visit(tree, 'element', (node: Element) => {
      // 检查节点是否有位置信息
      if (node.position && node.position.start) {
        // 初始化 properties 对象（如果不存在）
        if (!node.properties) {
          node.properties = {}
        }
        // 将源码起始行号添加到 data-line 属性
        node.properties.dataLine = node.position.start.line
      }
    })
  }
}

/**
 * 创建自定义 sanitize schema，允许 data-line 属性通过
 */
const customSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    // 允许所有元素使用 dataLine 属性（对应 HTML 中的 data-line）
    '*': [...(defaultSchema.attributes?.['*'] || []), 'dataLine']
  }
}

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
      .use(rehypeAddLineNumbers) // 添加行号注入插件
      .use(rehypeSanitize, customSchema) // 使用自定义 schema 允许 data-line 属性
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
