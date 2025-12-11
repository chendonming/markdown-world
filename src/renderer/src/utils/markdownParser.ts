import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeSanitize from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'

/**
 * 将 Markdown 文本转换为 HTML
 * @param markdown - Markdown 格式的字符串
 * @returns Promise<string> - 解析后的 HTML 字符串
 */
export async function parseMarkdown(markdown: string): Promise<string> {
  const result = await unified()
    .use(remarkParse) // 解析 Markdown
    .use(remarkRehype) // 转换为 Rehype (HTML) AST
    .use(rehypeSanitize) // 清理不安全的 HTML
    .use(rehypeStringify) // 序列化为 HTML 字符串
    .process(markdown)

  return String(result)
}
