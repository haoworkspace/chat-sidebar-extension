import { useState, useEffect } from "react"
import "./style.css"

function IndexPopup() {
  const [isEnabled, setIsEnabled] = useState(true)

  useEffect(() => {
    chrome.storage.local.get(["sidebarEnabled"], (result) => {
      setIsEnabled(result.sidebarEnabled ?? true)
    })
  }, [])

  const toggleSidebar = async () => {
    const newState = !isEnabled
    setIsEnabled(newState)
    await chrome.storage.local.set({ sidebarEnabled: newState })
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { 
        action: "toggleSidebar", 
        enabled: newState 
      })
    }
  }

  return (
    <div className="w-64 p-4 bg-gray-50 flex flex-col gap-4">
      <h2 className="text-lg font-bold text-gray-800">Chat Sidebar</h2>
      <div className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm border">
        <span className="text-sm font-medium text-gray-600">侧边栏开关</span>
        <button
          onClick={toggleSidebar}
          className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${
            isEnabled 
              ? "bg-blue-600 text-white" 
              : "bg-gray-200 text-gray-500"
          }`}
        >
          {isEnabled ? "ON" : "OFF"}
        </button>
      </div>
    </div>
  )
}

export default IndexPopup