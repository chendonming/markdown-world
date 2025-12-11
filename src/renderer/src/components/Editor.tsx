import MonacoEditor, { loader } from '@monaco-editor/react'
import { useState } from 'react'
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
}

function Editor({ onContentChange }: EditorProps): React.JSX.Element {
  const [value, setValue] = useState('# Hello Monaco Editor\n\n开始输入您的内容...')

  const handleEditorChange = (newValue: string | undefined): void => {
    const content = newValue || ''
    setValue(content)
    onContentChange?.(content)
  }

  return (
    <div style={{ width: '100%', height: '600px' }}>
      <MonacoEditor
        height="100%"
        defaultLanguage="markdown"
        theme="vs-dark"
        value={value}
        onChange={handleEditorChange}
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

export default Editor
