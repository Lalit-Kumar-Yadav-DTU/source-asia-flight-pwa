'use client'

import { WifiOff, RotateCw } from 'lucide-react'

export default function OfflineFallbackPage() {
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 text-center">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4 animate-pulse">
        <WifiOff className="w-8 h-8" />
      </div>
      <h1 className="text-xl font-bold text-slate-800 tracking-tight">You're Offline</h1>
      <p className="text-xs text-slate-400 max-w-xs mt-1 font-medium">
        Your device isn't connected to the internet. Please check your network adapters or cellular connection.
      </p>

      <button
        onClick={() => window.location.reload()}
        className="mt-6 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-all shadow-sm active:scale-95"
      >
        <RotateCw className="w-3.5 h-3.5" /> Retry Connection
      </button>
    </main>
  )
}