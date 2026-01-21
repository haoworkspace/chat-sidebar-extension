import { useEffect, useState, useCallback, useRef } from "react"

// 定义数据结构
export interface UserQuery {
  id: string
  text: string
  element: HTMLElement
}

interface UseChatParserProps {
  debug?: boolean
  rootSelector?: string
}

// ✨ 关键修改：函数名改为 useChatParser
export const useChatParser = ({ debug = false, rootSelector = "body" }: UseChatParserProps = {}) => {
  const [userQueries, setUserQueries] = useState<UserQuery[]>([])
  const observerRef = useRef<MutationObserver | null>(null)
  
  const log = useCallback((...args: any[]) => {
    if (debug) console.log("[ChatParser]", ...args)
  }, [debug])

  // 核心解析逻辑 (保持不变，或根据最新的 DOM 结构微调)
  const extractUserQueries = useCallback(() => {
    const queries: UserQuery[] = []
    
    // 针对 Gemini 的选择器逻辑
    // 注意：如果有特定的 Class 名变动，这里可能需要调整，但目前通用的逻辑如下：
    const elements = document.querySelectorAll('user-query, .user-query') 
    
    // 备用方案：如果找不到 user-query 标签，尝试查找带特定属性的 div
    // Gemini 的 DOM 结构经常变，这里保留最通用的查找方式
    if (elements.length === 0) {
       // 尝试通过 ARIA 属性或常见的对话容器查找
       const chatBubbles = document.querySelectorAll('[data-message-id]')
       chatBubbles.forEach((el) => {
         if (el.getAttribute('data-is-user-message') === 'true') {
            const text = el.textContent?.trim() || ""
            if (text) {
              queries.push({
                id: `query-${queries.length}`,
                text: text.slice(0, 50) + (text.length > 50 ? "..." : ""),
                element: el as HTMLElement
              })
            }
         }
       })
    } else {
      elements.forEach((el, index) => {
        const text = el.textContent?.trim() || ""
        if (text) {
          queries.push({
            id: `query-${index}`,
            text: text.slice(0, 50) + (text.length > 50 ? "..." : ""),
            element: el as HTMLElement
          })
        }
      })
    }

    return queries
  }, [])

  // 监听 DOM 变化
  useEffect(() => {
    const root = document.querySelector(rootSelector)
    if (!root) return

    log("Starting observer...")
    
    // 初始化一次
    const initialQueries = extractUserQueries()
    if (initialQueries.length > 0) {
      setUserQueries(initialQueries)
    }

    observerRef.current = new MutationObserver((mutations) => {
      // 简单的防抖或直接执行
      const newQueries = extractUserQueries()
      setUserQueries(prev => {
        if (prev.length !== newQueries.length) {
          log("Queries updated:", newQueries.length)
          return newQueries
        }
        // 如果长度一样，但最后一条内容变了（比如流式输出完成），也更新
        if (prev.length > 0 && newQueries.length > 0) {
             const lastPrev = prev[prev.length - 1]
             const lastNew = newQueries[newQueries.length - 1]
             if (lastPrev.text !== lastNew.text) {
                 return newQueries
             }
        }
        return prev
      })
    })

    observerRef.current.observe(root, {
      childList: true,
      subtree: true,
      characterData: true // 监听文字变化
    })

    return () => {
      observerRef.current?.disconnect()
    }
  }, [extractUserQueries, rootSelector, log])

  // 手动刷新方法
  const refresh = useCallback(() => {
    const qs = extractUserQueries()
    setUserQueries(qs)
    log("Manual refresh triggered", qs.length)
  }, [extractUserQueries, log])

  return { userQueries, refresh }
}