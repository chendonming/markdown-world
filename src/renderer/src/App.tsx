import { useState, useEffect, useRef, useCallback } from 'react'
import Editor, { EditorRef } from './components/Editor'
import ThemeSwitcher from './components/ThemeSwitcher'
import { MarkdownWorkerManager } from './utils/markdownWorkerManager'
import { ScrollSyncMapper } from './utils/scrollSyncMapper'
import { ScrollSyncLock } from './utils/scrollSyncLock'

function App(): React.JSX.Element {
  const [markdownContent, setMarkdownContent] = useState('')
  const [htmlPreview, setHtmlPreview] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const workerManagerRef = useRef<MarkdownWorkerManager | null>(null)
  const scrollMapperRef = useRef<ScrollSyncMapper | null>(null)
  const previewContainerRef = useRef<HTMLDivElement | null>(null)
  const editorRef = useRef<EditorRef | null>(null)
  const scrollSyncLockRef = useRef<ScrollSyncLock | null>(null)

  // 初始化 Worker Manager、ScrollSyncMapper 和 ScrollSyncLock
  useEffect(() => {
    workerManagerRef.current = new MarkdownWorkerManager()
    scrollMapperRef.current = new ScrollSyncMapper()
    scrollSyncLockRef.current = new ScrollSyncLock()

    // 组件卸载时清理资源
    return () => {
      if (workerManagerRef.current) {
        workerManagerRef.current.terminate()
      }
      if (scrollMapperRef.current) {
        scrollMapperRef.current.clear()
      }
      if (scrollSyncLockRef.current) {
        scrollSyncLockRef.current.forceRelease()
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

  // 编辑器滚动时同步预览区域（使用互斥锁机制）
  const handleEditorScroll = useCallback((visibleLine: number) => {
    if (!scrollSyncLockRef.current || !scrollMapperRef.current || !previewContainerRef.current) {
      return
    }

    // 如果正在从预览同步到编辑器，则忽略编辑器的滚动事件，防止循环滚动
    if (scrollSyncLockRef.current.isSyncingTo('editor')) {
      return
    }

    // 使用防抖 + 互斥锁机制
    scrollSyncLockRef.current.debounce('editor', () => {
      if (scrollSyncLockRef.current) {
        // 标记正在同步到预览，防止预览的滚动事件触发反向同步
        scrollSyncLockRef.current.markSyncingTo('preview')
      }
      const mapping = scrollMapperRef.current!.findMappingByLine(visibleLine)
      if (mapping && previewContainerRef.current) {
        // 滚动预览区域到对应位置
        previewContainerRef.current.scrollTo({
          top: mapping.offsetTop,
          behavior: 'smooth'
        })
      }
    })
  }, [])

  // 预览区域滚动时同步编辑器（使用互斥锁机制）
  const handlePreviewScroll = useCallback(() => {
    if (
      !scrollSyncLockRef.current ||
      !scrollMapperRef.current ||
      !previewContainerRef.current ||
      !editorRef.current
    ) {
      return
    }

    // 如果正在从编辑器同步到预览，则忽略预览的滚动事件，防止循环滚动
    if (scrollSyncLockRef.current.isSyncingTo('preview')) {
      return
    }

    // 使用防抖 + 互斥锁机制
    scrollSyncLockRef.current.debounce('preview', () => {
      if (scrollSyncLockRef.current) {
        // 标记正在同步到编辑器，防止编辑器的滚动事件触发反向同步
        scrollSyncLockRef.current.markSyncingTo('editor')
      }
      if (scrollMapperRef.current && previewContainerRef.current && editorRef.current) {
        const scrollTop = previewContainerRef.current.scrollTop
        const line = scrollMapperRef.current.findLineByScrollTop(scrollTop)
        editorRef.current.scrollToLine(line)
      }
    })
  }, [])

  // 监听预览区域滚动事件
  useEffect(() => {
    const previewContainer = previewContainerRef.current
    if (previewContainer) {
      previewContainer.addEventListener('scroll', handlePreviewScroll)
      return () => {
        previewContainer.removeEventListener('scroll', handlePreviewScroll)
      }
    }
    return undefined
  }, [handlePreviewScroll, htmlPreview])

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
        <ThemeSwitcher />
      </div>

      <div style={{ flex: 1, display: 'flex', gap: '20px', minHeight: 0 }}>
        {/* 编辑器区域 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ marginTop: 0, marginBottom: '10px' }}>编辑器</h3>
          <Editor
            ref={editorRef}
            onContentChange={handleContentChange}
            onScroll={handleEditorScroll}
          />
        </div>

        {/* 预览区域 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ marginTop: 0, marginBottom: '10px' }}>预览</h3>
          <div
            ref={previewContainerRef}
            className="preview-container"
            style={{
              width: '100%',
              height: '600px',
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
