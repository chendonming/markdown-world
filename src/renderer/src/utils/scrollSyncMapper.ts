/**
 * 滚动同步映射器
 * 用于构建和维护编辑器行号与预览区域DOM元素位置的映射关系
 */

export interface LineMapping {
  /** 源代码行号 */
  line: number
  /** 对应的 DOM 元素 */
  element: HTMLElement
  /** 元素距离容器顶部的偏移量（像素） */
  offsetTop: number
}

export class ScrollSyncMapper {
  private mappings: LineMapping[] = []
  private previewContainer: HTMLElement | null = null

  /**
   * 设置预览容器
   * @param container - 预览区域的容器元素
   */
  setPreviewContainer(container: HTMLElement): void {
    this.previewContainer = container
  }

  /**
   * 从预览容器中构建映射表
   * 扫描所有带有 data-line 属性的元素，建立行号到元素位置的映射
   */
  buildMappingTable(): void {
    if (!this.previewContainer) {
      console.warn('预览容器未设置，无法构建映射表')
      return
    }

    // 清空旧的映射
    this.mappings = []

    // 查找所有带有 data-line 属性的元素
    const elements = this.previewContainer.querySelectorAll<HTMLElement>('[data-line]')

    elements.forEach((element) => {
      const lineAttr = element.getAttribute('data-line')
      if (lineAttr) {
        const line = parseInt(lineAttr, 10)
        if (!isNaN(line)) {
          // 计算元素相对于容器顶部的偏移量
          // 性能考量：在构建映射表时一次性调用 getBoundingClientRect，避免在滚动热路径中多次调用
          const containerRect = this.previewContainer!.getBoundingClientRect()
          const elemRect = element.getBoundingClientRect()
          const offsetTop = Math.max(
            0,
            Math.round(elemRect.top - containerRect.top + this.previewContainer!.scrollTop)
          )

          this.mappings.push({ line, element, offsetTop })
        }
      }
    })

    // 按行号排序，确保映射表有序
    this.mappings.sort((a, b) => a.line - b.line)

    console.log(`构建映射表完成，共 ${this.mappings.length} 个映射项`)
  }

  // 注意：已在 buildMappingTable 中一次性计算所有元素的 offsetTop，避免在滚动热路径中重复布局查询。
  // 如需单独计算某个元素的位置，可在外部直接使用 getBoundingClientRect，并结合容器的 getBoundingClientRect() 与 scrollTop。

  /**
   * 根据编辑器行号查找对应的映射项
   * 使用二分查找找到最接近的映射项
   * @param line - 编辑器行号
   * @returns 对应的映射项，如果没有找到则返回 null
   */
  findMappingByLine(line: number): LineMapping | null {
    if (this.mappings.length === 0) {
      return null
    }

    // 如果行号小于第一个映射项，返回第一个
    if (line <= this.mappings[0].line) {
      return this.mappings[0]
    }

    // 如果行号大于最后一个映射项，返回最后一个
    if (line >= this.mappings[this.mappings.length - 1].line) {
      return this.mappings[this.mappings.length - 1]
    }

    // 二分查找最接近的映射项
    let left = 0
    let right = this.mappings.length - 1

    while (left <= right) {
      const mid = Math.floor((left + right) / 2)
      const mapping = this.mappings[mid]

      if (mapping.line === line) {
        return mapping
      } else if (mapping.line < line) {
        left = mid + 1
      } else {
        right = mid - 1
      }
    }

    // 返回最接近的较小行号的映射项
    return this.mappings[right]
  }

  /**
   * 根据预览区域的滚动位置查找对应的编辑器行号
   * @param scrollTop - 预览区域的滚动位置
   * @returns 对应的编辑器行号，如果没有找到则返回 1
   */
  findLineByScrollTop(scrollTop: number): number {
    if (this.mappings.length === 0) {
      return 1
    }

    // 如果滚动位置小于第一个映射项，返回第一行
    if (scrollTop <= this.mappings[0].offsetTop) {
      return this.mappings[0].line
    }

    // 如果滚动位置大于最后一个映射项，返回最后一行
    const lastMapping = this.mappings[this.mappings.length - 1]
    if (scrollTop >= lastMapping.offsetTop) {
      return lastMapping.line
    }

    // 查找最接近的映射项
    for (let i = 0; i < this.mappings.length - 1; i++) {
      const current = this.mappings[i]
      const next = this.mappings[i + 1]

      if (scrollTop >= current.offsetTop && scrollTop < next.offsetTop) {
        // 线性插值，获得更精确的行号
        const ratio = (scrollTop - current.offsetTop) / (next.offsetTop - current.offsetTop)
        const interpolatedLine = current.line + ratio * (next.line - current.line)
        return Math.round(interpolatedLine)
      }
    }

    return this.mappings[0].line
  }

  /**
   * 获取所有映射项（用于调试）
   */
  getMappings(): LineMapping[] {
    return [...this.mappings]
  }

  /**
   * 清空映射表
   */
  clear(): void {
    this.mappings = []
  }
}
