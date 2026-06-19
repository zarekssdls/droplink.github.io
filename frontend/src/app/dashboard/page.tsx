'use client'

import { useState, useEffect } from 'react'
import { Plus, Cpu, Globe } from 'lucide-react'
import ServerCard from '@/components/ServerCard'
import DomainSelector from '@/components/DomainSelector'

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

export default function DashboardPage() {
  const [servers, setServers] = useState<GameServer[]>([])
  const [selectedDomain, setSelectedDomain] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [showNewServerModal, setShowNewServerModal] = useState(false)

  useEffect(() => {
    fetchServers()
  }, [selectedDomain])

  const fetchServers = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('authToken')
      
      const query = selectedDomain ? `?domain=${selectedDomain}` : ''
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/servers${query}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (!response.ok) throw new Error('Failed to fetch servers')

      const data = await response.json()
      setServers(data)
    } catch (error) {
      console.error('Error fetching servers:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900/50 px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-4">Game Servers</h1>
          
          {/* Filter and Actions */}
          <div className="flex gap-4 items-center flex-wrap">
            <DomainSelector 
              selectedDomain={selectedDomain}
              onDomainChange={setSelectedDomain}
            />
            
            <button
              onClick={() => setShowNewServerModal(true)}
              className="button-primary flex items-center gap-2 ml-auto"
            >
              <Plus className="w-4 h-4" />
              New Server
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            <p className="text-slate-400 mt-4">Loading servers...</p>
          </div>
        ) : servers.length === 0 ? (
          <div className="text-center py-12">
            <Cpu className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-white mb-2">No Servers Yet</h2>
            <p className="text-slate-400 mb-6">Create your first game server to get started</p>
            <button
              onClick={() => setShowNewServerModal(true)}
              className="button-primary inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Server
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {servers.map((server) => (
              <ServerCard key={server.id} server={server} />
            ))}
          </div>
        )}
      </div>

      {/* New Server Modal */}
      {showNewServerModal && (
        <NewServerModal 
          onClose={() => setShowNewServerModal(false)}
          onServerCreated={fetchServers}
        />
      )}
    </div>
  )
}

function NewServerModal({ 
  onClose, 
  onServerCreated 
}: { 
  onClose: () => void
  onServerCreated: () => void
}) {
  const [gameType, setGameType] = useState('minecraft')
  const [loading, setLoading] = useState(false)

  const gameTypes = [
    { id: 'minecraft', name: 'Minecraft', icon: '⚔️' },
    { id: 'csgo', name: 'CS:GO/CS2', icon: '🎮' },
    { id: 'rust', name: 'Rust', icon: '🔧' },
    { id: 'valheim', name: 'Valheim', icon: '⛏️' },
  ]

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('authToken')
      const formData = new FormData(e.currentTarget)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/servers`,
        {
          method: 'POST',
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.get('name'),
            gameType,
            maxPlayers: Number(formData.get('maxPlayers')),
            domain: formData.get('domain'),
          }),
        }
      )

      if (!response.ok) throw new Error('Failed to create server')

      onServerCreated()
      onClose()
    } catch (error) {
      console.error('Error creating server:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass-effect p-8 rounded-xl max-w-md w-full">
        <h2 className="text-2xl font-bold text-white mb-6">Create New Server</h2>

        <form onSubmit={handleCreate} className="space-y-4">
          {/* Server Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Server Name
            </label>
            <input
              type="text"
              name="name"
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
              placeholder="My Game Server"
            />
          </div>

          {/* Game Type */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Game Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {gameTypes.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGameType(g.id)}
                  className={`p-2 rounded-lg border transition ${
                    gameType === g.id
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <span className="text-lg">{g.icon}</span>
                  <p className="text-xs text-slate-300">{g.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Max Players */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Max Players
            </label>
            <input
              type="number"
              name="maxPlayers"
              required
              min="1"
              defaultValue="32"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
            />
          </div>

          {/* Domain Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Domain
            </label>
            <select
              name="domain"
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
            >
              <option value="">Select a domain...</option>
              <option value="dropls.xyz">dropls.xyz</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 button-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 button-primary disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Server'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
