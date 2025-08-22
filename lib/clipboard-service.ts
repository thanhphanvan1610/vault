/**
 * FortressPass Clipboard Security Service
 * 
 * Provides secure clipboard operations with automatic clearing
 * after a specified timeout to prevent password leakage.
 */

export class ClipboardService {
  private clearTimeouts = new Map<string, NodeJS.Timeout>()

  /**
   * Copy text to clipboard with automatic clearing after 30 seconds
   */
  async copyToClipboard(text: string, clearAfterMs: number = 30000): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text)
      
      // Clear any existing timeout for this text
      const existingTimeout = this.clearTimeouts.get(text)
      if (existingTimeout) {
        clearTimeout(existingTimeout)
      }

      // Set new timeout to clear clipboard
      const timeout = setTimeout(async () => {
        try {
          const currentClipboard = await navigator.clipboard.readText()
          if (currentClipboard === text) {
            await navigator.clipboard.writeText('')
          }
        } catch (error) {
          // Silent fail - clipboard might not be accessible
        }
        this.clearTimeouts.delete(text)
      }, clearAfterMs)

      this.clearTimeouts.set(text, timeout)
      return true
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      return false
    }
  }

  /**
   * Immediately clear clipboard if it contains the specified text
   */
  async clearClipboard(text?: string): Promise<void> {
    try {
      if (text) {
        const currentClipboard = await navigator.clipboard.readText()
        if (currentClipboard === text) {
          await navigator.clipboard.writeText('')
        }
      } else {
        await navigator.clipboard.writeText('')
      }
    } catch (error) {
      // Silent fail - clipboard might not be accessible
    }
  }

  /**
   * Clear all pending timeouts
   */
  clearAllTimeouts(): void {
    for (const timeout of this.clearTimeouts.values()) {
      clearTimeout(timeout)
    }
    this.clearTimeouts.clear()
  }
}

export const clipboardService = new ClipboardService()