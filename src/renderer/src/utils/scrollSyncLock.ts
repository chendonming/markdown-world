/**
 * 滚动同步锁管理器
 * 使用互斥锁（Mutex）+ 来源锁定（Source Locking）机制
 * 从根本上解决双向滚动同步的竞态条件问题
 */

export type ScrollSource = 'editor' | 'preview' | null

export class ScrollSyncLock {
  /** 当前持有锁的滚动源 */
  private currentSource: ScrollSource = null

  /** 锁的超时时间（毫秒），防止死锁 */
  private lockTimeout = 300

  /** 锁的定时器 */
  private lockTimer: number | null = null

  /** 防抖定时器 */
  private debounceTimer: number | null = null

  /** 防抖延迟（毫秒） */
  private debounceDelay = 50

  /** 当前正在同步到的目标（防止目标事件触发反向同步） */
  private syncingTo: ScrollSource = null

  /** 同步过程定时器 */
  private syncTimer: number | null = null

  /**
   * 尝试获取滚动锁
   * @param source - 滚动源（'editor' 或 'preview'）
   * @returns 是否成功获取锁
   */
  tryAcquire(source: ScrollSource): boolean {
    // 如果没有锁或者是同一个源，允许获取
    if (this.currentSource === null || this.currentSource === source) {
      this.acquireLock(source)
      return true
    }

    // 如果有其他源的锁，拒绝
    return false
  }

  /**
   * 获取锁（内部方法）
   * @param source - 滚动源
   */
  private acquireLock(source: ScrollSource): void {
    this.currentSource = source

    // 清除旧的定时器
    if (this.lockTimer !== null) {
      clearTimeout(this.lockTimer)
    }

    // 设置自动释放定时器，防止死锁
    this.lockTimer = window.setTimeout(() => {
      this.release(source)
    }, this.lockTimeout)
  }

  /**
   * 释放滚动锁
   * @param source - 滚动源（只有持有锁的源才能释放）
   */
  release(source: ScrollSource): void {
    // 只有持有锁的源才能释放锁
    if (this.currentSource === source) {
      this.currentSource = null

      if (this.lockTimer !== null) {
        clearTimeout(this.lockTimer)
        this.lockTimer = null
      }
    }
  }

  /**
   * 强制释放所有锁（用于清理）
   */
  forceRelease(): void {
    this.currentSource = null
    this.syncingTo = null

    if (this.lockTimer !== null) {
      clearTimeout(this.lockTimer)
      this.lockTimer = null
    }

    if (this.syncTimer !== null) {
      clearTimeout(this.syncTimer)
      this.syncTimer = null
    }

    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = null
    }
  }

  /**
   * 标记开始同步到目标（在开始程序化滚动前调用）
   * 这会在短时间内阻止目标的滚动事件触发反向同步
   * @param target - 目标滚动源
   */
  markSyncingTo(target: ScrollSource): void {
    // 清除旧的同步定时器
    if (this.syncTimer !== null) {
      clearTimeout(this.syncTimer)
    }

    this.syncingTo = target

    // 在一段持续时间后自动清除同步状态
    this.syncTimer = window.setTimeout(() => {
      this.syncingTo = null
      this.syncTimer = null
    }, 200)
  }

  /**
   * 检查是否正在同步到指定目标
   * @param target - 要检查的目标
   * @returns 是否正在同步到该目标
   */
  isSyncingTo(target: ScrollSource): boolean {
    return this.syncingTo === target
  }

  /**
   * 检查当前锁的状态
   * @returns 当前持有锁的源
   */
  getCurrentSource(): ScrollSource {
    return this.currentSource
  }

  /**
   * 检查指定源是否持有锁
   * @param source - 要检查的滚动源
   * @returns 是否持有锁
   */
  isLocked(source: ScrollSource): boolean {
    return this.currentSource === source
  }

  /**
   * 带防抖的执行函数
   * @param source - 滚动源
   * @param callback - 要执行的回调函数
   */
  debounce(source: ScrollSource, callback: () => void): void {
    // 清除之前的防抖定时器
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer)
    }

    // 设置新的防抖定时器
    this.debounceTimer = window.setTimeout(() => {
      if (this.tryAcquire(source)) {
        callback()
        // 延迟释放锁，确保同步完成
        setTimeout(() => {
          this.release(source)
        }, 100)
      }
      this.debounceTimer = null
    }, this.debounceDelay)
  }

  /**
   * 设置锁超时时间
   * @param timeout - 超时时间（毫秒）
   */
  setLockTimeout(timeout: number): void {
    this.lockTimeout = timeout
  }

  /**
   * 设置防抖延迟
   * @param delay - 防抖延迟（毫秒）
   */
  setDebounceDelay(delay: number): void {
    this.debounceDelay = delay
  }
}
