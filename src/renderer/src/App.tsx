import Editor from './components/Editor'

function App(): React.JSX.Element {
  return (
    <div style={{ width: '100vw', height: '100vh', padding: '20px', boxSizing: 'border-box' }}>
      <h1 style={{ marginBottom: '10px' }}>Markdown Editor</h1>
      <Editor />
    </div>
  )
}

export default App
