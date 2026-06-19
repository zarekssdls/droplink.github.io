'use client'

import { Globe, Trash2, Settings, Copy, Check } from 'lucide-react'
import { useState } from 'react'

interface GameServer {
  id: string
  name: string
  status: 'online' | 'offline'
  players: number
  maxPlayers: number
  gameType: string
  subdomain: string
  ip: string
}

export default function ServerCard({ server }: { server: GameServer }) {
  const [copied, setCopied] = useState(false)

  const handleCopyIP = async () => {
    await navigator.clipboard.writeText(`${server.subdomain}.dropls.xyz:25565`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="glass-effect p-6 rounded-xl hover:border-purple-500/50 transition">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-3 h-3 rounded-full ${server.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
            <h3 className="text-xl font-semibold text-white">{server.name}</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
              {server.gameType.toUpperCase()}
            </span>
            <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">
              {server.players}/{server.maxPlayers} Players
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <button className="p-2 hover:bg-slate-700 rounded-lg transition" title="Settings">
            <Settings className="w-5 h-5 text-slate-400" />
          </button>
          <button className="p-2 hover:bg-red-900/20 rounded-lg transition" title="Delete">
            <Trash2 className="w-5 h-5 text-red-400" />
          </button>
        </div>
      </div>

      {/* Subdomain Info */}
      <div className="bg-slate-900 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-4 h-4 text-purple-400" />
            <div>
              <p className="text-xs text-slate-400">Connect with</p>
              <p className="text-white font-mono">{server.subdomain}.dropls.xyz</p>
            </div>
          </div>
          <button
            onClick={handleCopyIP}
            className="p-2 hover:bg-slate-700 rounded-lg transition"
            title="Copy"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-slate-400" />
            )}
          </button>
        </div>
      </div>

      {/* Server Details */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-slate-400">IP Address</p>
          <p className="text-white font-mono">{server.ip}</p>
        </div>
        <div>
          <p className="text-slate-400">Status</p>
          <p className="text-white capitalize">{server.status}</p>
        </div>
      </div>
    </div>
  )
}
