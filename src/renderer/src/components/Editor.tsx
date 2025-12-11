import MonacoEditor, { loader } from '@monaco-editor/react'
import { useState } from 'react'
import * as monaco from 'monaco-editor'

// 配置 Monaco Editor 使用本地版本而非 CDN
loader.config({ monaco })

function Editor(): React.JSX.Element {
  const [value, setValue] = useState('# Hello Monaco Editor\n\n开始输入您的内容...')

  const handleEditorChange = (newValue: string | undefined): void => {
    setValue(newValue || '')
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
