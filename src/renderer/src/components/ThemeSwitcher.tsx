import { useState, useEffect } from 'react'
import { themeManager, type Theme } from '../utils/themeManager'

interface ThemeSwitcherProps {
  className?: string
  style?: React.CSSProperties
}

export function ThemeSwitcher({
  className = '',
  style = {}
}: ThemeSwitcherProps): React.JSX.Element {
  const [theme, setTheme] = useState<Theme>(themeManager.getTheme())

  useEffect(() => {
    const unsubscribe = themeManager.onThemeChange((newTheme) => {
      setTheme(newTheme)
    })
    return unsubscribe
  }, [])

  const handleToggle = (): void => {
    themeManager.toggleTheme()
  }

  return (
    <button
      onClick={handleToggle}
      className={className}
      style={{
        padding: '8px 12px',
        fontSize: '14px',
        backgroundColor: theme === 'dark' ? '#f0f0f0' : '#1e1e1e',
        color: theme === 'dark' ? '#1e1e1e' : '#f0f0f0',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.3s ease',
        ...style
      }}
      title={`切换为${theme === 'dark' ? '亮色' : '暗色'}主题`}
    >
      {theme === 'dark' ? <span>☀️</span> : <span>🌙</span>}
      {theme === 'dark' ? '亮色' : '暗色'}
    </button>
  )
}

export default ThemeSwitcher
