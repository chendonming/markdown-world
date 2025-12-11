import { useState, useEffect, useRef } from 'react'
import Editor from './components/Editor'
import { MarkdownWorkerManager } from './utils/markdownWorkerManager'
import { ScrollSyncMapper } from './utils/scrollSyncMapper'

function App(): React.JSX.Element {
  const [markdownContent, setMarkdownContent] = useState('')
  const [htmlPreview, setHtmlPreview] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const workerManagerRef = useRef<MarkdownWorkerManager | null>(null)
  const scrollMapperRef = useRef<ScrollSyncMapper | null>(null)
  const previewContainerRef = useRef<HTMLDivElement | null>(null)

  // 初始化 Worker Manager 和 ScrollSyncMapper
  useEffect(() => {
    workerManagerRef.current = new MarkdownWorkerManager()
    scrollMapperRef.current = new ScrollSyncMapper()

    // 组件卸载时清理资源
    return () => {
      if (workerManagerRef.current) {
        workerManagerRef.current.terminate()
      }
      if (scrollMapperRef.current) {
        scrollMapperRef.current.clear()
      }
    }
  }, [])

  const handleContentChange = (content: string): void => {
    setMarkdownContent(content)
  }

  const handlePreview = async (): Promise<void> => {
    if (!markdownContent || !workerManagerRef.current) {
      return
    }

    setIsLoading(true)
    try {
      // 使用 Worker 解析 Markdown（在后台线程执行）
      const html = await workerManagerRef.current.parseMarkdown(markdownContent)
      setHtmlPreview(html)
    } catch (error) {
      console.error('解析 Markdown 失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 当 HTML 内容更新后，构建映射表
  useEffect(() => {
    if (htmlPreview && previewContainerRef.current && scrollMapperRef.current) {
      // 使用 setTimeout 确保 DOM 已经更新完成
      setTimeout(() => {
        if (scrollMapperRef.current && previewContainerRef.current) {
          scrollMapperRef.current.setPreviewContainer(previewContainerRef.current)
          scrollMapperRef.current.buildMappingTable()

          // 调试：打印映射表信息
          const mappings = scrollMapperRef.current.getMappings()
          console.log('映射表已构建:', mappings)
        }
      }, 0)
    }
  }, [htmlPreview])

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        padding: '20px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <h1 style={{ margin: 0 }}>Markdown Editor</h1>
        <button
          onClick={handlePreview}
          disabled={isLoading}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            backgroundColor: '#007acc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1
          }}
        >
          {isLoading ? '解析中...' : '预览'}
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', gap: '20px', minHeight: 0 }}>
        {/* 编辑器区域 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ marginTop: 0, marginBottom: '10px' }}>编辑器</h3>
          <Editor onContentChange={handleContentChange} />
        </div>

        {/* 预览区域 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ marginTop: 0, marginBottom: '10px' }}>预览</h3>
          <div
            ref={previewContainerRef}
            style={{
              width: '100%',
              height: '600px',
              padding: '20px',
              backgroundColor: '#1e1e1e',
              color: '#d4d4d4',
              borderRadius: '4px',
              overflowY: 'auto',
              boxSizing: 'border-box'
            }}
            dangerouslySetInnerHTML={{ __html: htmlPreview }}
          />
        </div>
      </div>
    </div>
  )
}

export default App
