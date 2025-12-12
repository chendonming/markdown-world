import MonacoEditor, { loader, OnMount } from '@monaco-editor/react'
import { useState, useRef, useImperativeHandle, forwardRef } from 'react'
import * as monaco from 'monaco-editor'

// 配置 Monaco Editor 使用本地版本而非 CDN
// 配置 Monaco 的 worker 以避免与我们的 markdown worker 冲突
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(self as any).MonacoEnvironment = {
  getWorker() {
    // 为 Monaco Editor 返回专用的 worker
    return new Worker(new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url), {
      type: 'module'
    })
  }
}

loader.config({ monaco })

interface EditorProps {
  onContentChange?: (content: string) => void
  onCursorPositionChange?: (line: number) => void
  onScroll?: (visibleLine: number) => void
}

export interface EditorRef {
  scrollToLine: (line: number) => void
  getVisibleRange: () => { startLine: number; endLine: number } | null
}

const Editor = forwardRef<EditorRef, EditorProps>(
  ({ onContentChange, onCursorPositionChange, onScroll }, ref): React.JSX.Element => {
    const [value, setValue] = useState('')
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)

    // 暴露方法给父组件
    useImperativeHandle(ref, () => ({
      scrollToLine: (line: number) => {
        if (editorRef.current) {
          editorRef.current.revealLineInCenter(line)
        }
      },
      getVisibleRange: () => {
        if (!editorRef.current) return null
        const visibleRanges = editorRef.current.getVisibleRanges()
        if (visibleRanges.length > 0) {
          return {
            startLine: visibleRanges[0].startLineNumber,
            endLine: visibleRanges[0].endLineNumber
          }
        }
        return null
      }
    }))

    const handleEditorChange = (newValue: string | undefined): void => {
      const content = newValue || ''
      setValue(content)
      onContentChange?.(content)
    }

    const handleEditorDidMount: OnMount = (editor) => {
      editorRef.current = editor

      // 监听光标位置变化
      editor.onDidChangeCursorPosition((e) => {
        const line = e.position.lineNumber
        onCursorPositionChange?.(line)
      })

      // 监听滚动事件
      editor.onDidScrollChange(() => {
        const visibleRanges = editor.getVisibleRanges()
        if (visibleRanges.length > 0) {
          // 获取可见区域的中间行号
          const startLine = visibleRanges[0].startLineNumber
          const endLine = visibleRanges[0].endLineNumber
          const middleLine = Math.floor((startLine + endLine) / 2)
          onScroll?.(middleLine)
        }
      })
    }

    return (
      <div style={{ width: '100%', height: '600px' }}>
        <MonacoEditor
          height="100%"
          defaultLanguage="markdown"
          theme="vs-dark"
          value={value}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            wordWrap: 'on',
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true
          }}
        />
      </div>
    )
  }
)

Editor.displayName = 'Editor'

export default Editor
