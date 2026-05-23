'use client'

import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowBanner(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setDeferredPrompt(null)
      setShowBanner(false)
    }
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm bg-slate-900 text-white rounded-2xl p-4 shadow-2xl z-50 flex items-center justify-between border border-slate-800 animate-bounce">
      <div className="flex items-center gap-3">
        <div className="bg-blue-600 p-2 rounded-xl text-white">
          <Download className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-bold">Install App Blueprint</h4>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">Add to home screen for live offline access.</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={handleInstallClick}
          className="bg-blue-600 hover:bg-blue-700 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all"
        >
          Install
        </button>
        <button onClick={() => setShowBanner(false)} className="text-slate-500 hover:text-slate-300">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}