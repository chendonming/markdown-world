/**
 * 主题管理工具
 * 支持主题的切换、保存和加载
 */

export type Theme = 'light' | 'dark'

class ThemeManager {
  private currentTheme: Theme = 'dark'
  private listeners: Array<(theme: Theme) => void> = []
  private readonly STORAGE_KEY = 'markdown-editor-theme'

  constructor() {
    this.currentTheme = this.loadTheme()
    this.applyTheme(this.currentTheme)
  }

  /**
   * 从 localStorage 加载主题配置
   */
  private loadTheme(): Theme {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored === 'light' || stored === 'dark') {
        return stored
      }

      // 默认根据系统偏好选择主题
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      return prefersDark ? 'dark' : 'light'
    } catch {
      return 'dark'
    }
  }

  /**
   * 将主题保存到 localStorage
   */
  private saveTheme(theme: Theme): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, theme)
    } catch {
      console.warn('Failed to save theme to localStorage')
    }
  }

  /**
   * 获取当前主题
   */
  getTheme(): Theme {
    return this.currentTheme
  }

  /**
   * 设置主题
   */
  setTheme(theme: Theme): void {
    if (this.currentTheme === theme) {
      return
    }

    this.currentTheme = theme
    this.saveTheme(theme)
    this.applyTheme(theme)
    this.notifyListeners()
  }

  /**
   * 切换主题
   */
  toggleTheme(): Theme {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark'
    this.setTheme(newTheme)
    return newTheme
  }

  /**
   * 为预览容器应用主题
   */
  applyTheme(theme: Theme, containerSelector: string = '.preview-container'): void {
    const container = document.querySelector(containerSelector)
    if (!container) {
      return
    }

    // 移除旧主题类
    container.classList.remove('theme-light', 'theme-dark')

    // 添加新主题类
    container.classList.add(`theme-${theme}`)

    // 同时更新 document 元素的 data 属性（用于其他样式同步）
    document.documentElement.setAttribute('data-theme', theme)
  }

  /**
   * 注册主题变化监听器
   */
  onThemeChange(listener: (theme: Theme) => void): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.currentTheme))
  }
}

// 创建全局单例
export const themeManager = new ThemeManager()

export default ThemeManager
