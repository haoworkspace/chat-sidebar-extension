import cssText from "data-text:~/style.css"
import type { PlasmoCSConfig } from "plasmo"
import { useEffect, useState, useRef } from "react"
// 👇 注意：这里引用名变了，请确保你已经完成了第一步的文件重命名
import { useChatParser } from "./useChatParser" 

export const config: PlasmoCSConfig = {
  // 这是功能性配置。
  matches: ["https://gemini.google.com/*"]
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

// 组件改名为更通用的 ChatSidebar
const ChatSidebar = () => {
  const [isVisible, setIsVisible] = useState(true)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const listRef = useRef<HTMLDivElement>(null)
  
  // Hook 调用也改名
  const { userQueries, refresh } = useChatParser({ 
    debug: false,
    rootSelector: 'body' 
  })

  // 1. 自动主题
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setTheme(mediaQuery.matches ? 'dark' : 'light')
    const handler = (e: MediaQueryListEvent) => setTheme(e.matches ? 'dark' : 'light')
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  // 2. 自动滚动
  useEffect(() => {
    if (listRef.current && userQueries.length > 0) {
      setTimeout(() => {
        listRef.current?.scrollTo({
          top: listRef.current.scrollHeight,
          behavior: 'smooth'
        })
      }, 100)
    }
  }, [userQueries.length])

  // 3. 消息监听
  useEffect(() => {
    chrome.storage.local.get(["sidebarEnabled"], (result) => {
      setIsVisible(result.sidebarEnabled ?? true)
    })
    const messageListener = (msg: any) => {
      if (msg.action === "toggleSidebar") {
        setIsVisible(msg.enabled)
      }
    }
    chrome.runtime.onMessage.addListener(messageListener)
    return () => chrome.runtime.onMessage.removeListener(messageListener)
  }, [])

  const handleScrollTo = (element: HTMLElement) => {
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" })
      element.style.transition = "background 0.5s"
      element.style.backgroundColor = theme === 'dark' ? "rgba(255, 255, 0, 0.2)" : "rgba(255, 215, 0, 0.4)"
      setTimeout(() => {
        element.style.backgroundColor = ""
      }, 1000)
    }
  }

  const handleExport = () => {
    if (userQueries.length === 0) {
      alert("没有可以导出的内容！")
      return
    }
 
    const title = document.title || "Chat-Export"
    const date = new Date().toLocaleDateString()
    let content = `# ${title}\n\n**导出日期**: ${date}\n**总条数**: ${userQueries.length}\n\n---\n\n`
    userQueries.forEach((q, index) => {
      content += `### ${index + 1}. ${q.text}\n\n`
    })
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
 
    link.download = `Chat_Export_${new Date().getTime()}.md`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (!isVisible) return null

  // 🎨 样式配置
  const styles = {
    dark: {
      containerBg: '#1e1f20',
      borderColor: '#444746',
      textColor: '#e3e3e3',
      headerBg: '#131314',
      subText: '#8e918f',
      hoverBg: '#28292a',
      scrollTrack: 'transparent',
      scrollThumb: '#444746',
      btnBorder: '#444746',
      btnHover: '#333'
    },
    light: {
      containerBg: '#ffffff',
      borderColor: '#e0e0e0',
      textColor: '#1f1f1f',
      headerBg: '#f8f9fa',
      subText: '#5e5e5e',
      hoverBg: '#f5f5f5',
      scrollTrack: 'transparent',
      scrollThumb: '#c1c1c1',
      btnBorder: '#dadce0',
      btnHover: '#f1f3f4'
    }
  }

  const currentTheme = styles[theme]

  // --- 收起模式 ---
  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        style={{
          backgroundColor: currentTheme.containerBg,
          color: currentTheme.textColor,
          borderColor: currentTheme.borderColor
        }}
        className="fixed top-20 right-4 z-[9999] w-10 h-10 border rounded-full shadow-xl hover:scale-110 transition-all duration-200 flex items-center justify-center group"
        title="展开对话目录"
      >
        <span className="text-lg">📑</span>
        <div className="absolute top-0 right-0 -mt-1 -mr-1 w-4 h-4 bg-red-500 rounded-full text-[9px] flex items-center justify-center text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity">
          {userQueries.length > 99 ? '99+' : userQueries.length}
        </div>
      </button>
    )
  }

  // --- 展开模式 ---
  return (
    <>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: ${currentTheme.scrollTrack};
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: ${currentTheme.scrollThumb};
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: ${theme === 'dark' ? '#666' : '#999'};
        }
      `}</style>

      <div className="fixed top-20 right-4 w-64 max-h-[80vh] flex flex-col z-[9999] font-sans antialiased pointer-events-none transition-all duration-300 ease-in-out transform translate-x-0 opacity-100">
        <div 
          style={{
            backgroundColor: currentTheme.containerBg,
            borderColor: currentTheme.borderColor,
            color: currentTheme.textColor
          }}
          className="shadow-2xl rounded-xl border overflow-hidden flex flex-col h-full pointer-events-auto"
        >
          {/* Header */}
          <div 
            style={{ backgroundColor: currentTheme.headerBg, borderColor: currentTheme.borderColor }}
            className="p-3 border-b flex justify-between items-center shrink-0"
          >
            <div className="flex flex-col">
              <h3 className="font-medium text-sm">对话目录</h3>
              <span style={{ color: currentTheme.subText }} className="text-[10px] opacity-80">
                 Outline & Index
              </span>
            </div>
            
            <div className="flex gap-2 items-center">
              <div className="flex gap-1">
                <button 
                  onClick={() => setIsCollapsed(true)}
                  style={{ borderColor: currentTheme.btnBorder, color: currentTheme.subText }}
                  className="w-7 h-7 flex items-center justify-center rounded-md border transition-all hover:opacity-80 active:scale-95"
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = currentTheme.btnHover}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  title="收起"
                >
                  ➖
                </button>

                <button 
                  onClick={handleExport}
                  style={{ borderColor: currentTheme.btnBorder, color: currentTheme.subText }}
                  className="w-7 h-7 flex items-center justify-center rounded-md border transition-all hover:opacity-80 active:scale-95"
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = currentTheme.btnHover}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  title="导出 .md"
                >
                  ⬇
                </button>
              </div>

              <span 
                style={{ color: currentTheme.subText, backgroundColor: currentTheme.containerBg, borderColor: currentTheme.borderColor }}
                className="text-[10px] px-2 py-0.5 rounded-full border text-center font-mono"
              >
                {userQueries.length}
              </span>
            </div>
          </div>

          {/* List */}
          <div ref={listRef} className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {userQueries.length === 0 ? (
              <div style={{ color: currentTheme.subText }} className="p-8 text-center text-xs flex flex-col items-center gap-2">
                <span>📭</span>
                <span>暂无对话记录...</span>
              </div>
            ) : (
              userQueries.map((q, index) => (
                <button
                  key={q.id}
                  onClick={() => handleScrollTo(q.element)}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = currentTheme.hoverBg}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  className="w-full text-left p-2 rounded-lg cursor-pointer transition-all duration-200 border border-transparent flex gap-2 items-start"
                >
                  <span 
                    style={{ color: currentTheme.subText }}
                    className="text-xs font-mono mt-[1px] shrink-0 min-w-[1.5em] text-right"
                  >
                    {index + 1}.
                  </span>
                  <p className="text-xs leading-relaxed line-clamp-2 break-all">
                    {q.text}
                  </p>
                </button>
              ))
            )}
          </div>

          {/* Footer: 完全去 Gemini 化 */}
          <div 
            style={{ 
              backgroundColor: currentTheme.headerBg, 
              borderColor: currentTheme.borderColor,
              color: currentTheme.subText
            }}
            className="p-2 border-t text-[10px] flex justify-between items-center px-3"
          >
            <span>Chat Sidebar</span>
            <span className="opacity-70 font-mono">v1.1.0 • by Leo</span>
          </div>
        </div>
      </div>
    </>
  )
}

export default ChatSidebar