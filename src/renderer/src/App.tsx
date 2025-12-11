import { useState } from 'react'
import Editor from './components/Editor'
import { parseMarkdown } from './utils/markdownParser'

function App(): React.JSX.Element {
  const [markdownContent, setMarkdownContent] = useState('')
  const [htmlPreview, setHtmlPreview] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleContentChange = (content: string): void => {
    setMarkdownContent(content)
  }

  const handlePreview = async (): Promise<void> => {
    if (!markdownContent) {
      return
    }

    setIsLoading(true)
    try {
      const html = await parseMarkdown(markdownContent)
      setHtmlPreview(html)
    } catch (error) {
      console.error('解析 Markdown 失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

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
