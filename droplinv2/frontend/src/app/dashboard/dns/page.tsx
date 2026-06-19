'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, ExternalLink, Globe } from 'lucide-react'
import DomainSelector from '@/components/DomainSelector'

interface DNSRecord {
  id: string
  subdomain: string
  type: 'A' | 'CNAME' | 'MX' | 'TXT'
  value: string
  ttl: number
  status: 'active' | 'pending'
  createdAt: string
}

export default function DNSDashboardPage() {
  const [records, setRecords] = useState<DNSRecord[]>([])
  const [selectedDomain, setSelectedDomain] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [showNewRecordModal, setShowNewRecordModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (selectedDomain) {
      fetchRecords()
    }
  }, [selectedDomain])

  const fetchRecords = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('authToken')

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/dns/records?domain=${selectedDomain}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (!response.ok) throw new Error('Failed to fetch DNS records')

      const data = await response.json()
      setRecords(data)
    } catch (error) {
      console.error('Error fetching DNS records:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredRecords = records.filter((record) =>
    record.subdomain.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900/50 px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-4">DNS Management</h1>
          <p className="text-slate-400 mb-4">
            Manage DNS records and subdomains for your domains
          </p>

          <div className="flex gap-4 items-center flex-wrap">
            <DomainSelector
              selectedDomain={selectedDomain}
              onDomainChange={setSelectedDomain}
            />

            <input
              type="text"
              placeholder="Search subdomains..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 min-w-64 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
            />

            <button
              onClick={() => setShowNewRecordModal(true)}
              className="button-primary flex items-center gap-2 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Add Record
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            <p className="text-slate-400 mt-4">Loading DNS records...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-12 glass-effect p-8 rounded-xl">
            <Globe className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-white mb-2">No DNS Records</h2>
            <p className="text-slate-400 mb-6">
              Add your first DNS record to get started
            </p>
            <button
              onClick={() => setShowNewRecordModal(true)}
              className="button-primary inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Record
            </button>
          </div>
        ) : (
          <div className="glass-effect rounded-xl overflow-hidden">
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-700 bg-slate-900/50">
                  <tr className="text-left text-sm font-semibold text-slate-300">
                    <th className="px-6 py-4">Subdomain</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Value</th>
                    <th className="px-6 py-4">TTL</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record, idx) => (
                    <tr
                      key={record.id}
                      className={`border-b border-slate-700 hover:bg-slate-800/50 transition ${
                        idx === filteredRecords.length - 1 ? 'border-b-0' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <code className="bg-slate-800 px-3 py-1 rounded text-sm text-purple-300">
                          {record.subdomain}.
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs font-mono">
                          {record.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-slate-300 font-mono text-sm">
                          {record.value}
                        </code>
                      </td>
                      <td className="px-6 py-4 text-slate-400">{record.ttl}s</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-2 text-xs font-medium ${
                            record.status === 'active'
                              ? 'text-green-400'
                              : 'text-yellow-400'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              record.status === 'active'
                                ? 'bg-green-500'
                                : 'bg-yellow-500'
                            }`}
                          />
                          {record.status === 'active' ? 'Active' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            className="p-1 hover:bg-slate-700 rounded transition"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4 text-slate-400" />
                          </button>
                          <button
                            className="p-1 hover:bg-red-900/20 rounded transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="border-t border-slate-700 px-6 py-4 bg-slate-900/50 text-sm text-slate-400">
              Showing {filteredRecords.length} of {records.length} records
            </div>
          </div>
        )}
      </div>

      {/* New Record Modal */}
      {showNewRecordModal && (
        <NewRecordModal
          domain={selectedDomain}
          onClose={() => setShowNewRecordModal(false)}
          onRecordCreated={fetchRecords}
        />
      )}
    </div>
  )
}

function NewRecordModal({
  domain,
  onClose,
  onRecordCreated,
}: {
  domain: string
  onClose: () => void
  onRecordCreated: () => void
}) {
  const [recordType, setRecordType] = useState<'A' | 'CNAME' | 'MX' | 'TXT'>('A')
  const [loading, setLoading] = useState(false)

  const recordTypes = ['A', 'CNAME', 'MX', 'TXT'] as const

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('authToken')
      const formData = new FormData(e.currentTarget)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/dns/records`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domain,
            subdomain: formData.get('subdomain'),
            type: recordType,
            value: formData.get('value'),
            ttl: Number(formData.get('ttl')),
          }),
        }
      )

      if (!response.ok) throw new Error('Failed to create record')

      onRecordCreated()
      onClose()
    } catch (error) {
      console.error('Error creating record:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass-effect p-8 rounded-xl max-w-md w-full">
        <h2 className="text-2xl font-bold text-white mb-6">Add DNS Record</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Subdomain */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Subdomain
            </label>
            <div className="flex">
              <input
                type="text"
                name="subdomain"
                required
                className="flex-1 bg-slate-900 border border-slate-700 border-r-0 rounded-l-lg px-4 py-2 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                placeholder="server"
              />
              <div className="bg-slate-800 border border-slate-700 border-l-0 rounded-r-lg px-4 py-2 text-slate-400 text-sm flex items-center">
                .dropls.xyz
              </div>
            </div>
          </div>

          {/* Record Type */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Record Type
            </label>
            <div className="grid grid-cols-4 gap-2">
              {recordTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setRecordType(type)}
                  className={`py-2 rounded-lg border transition font-mono text-sm ${
                    recordType === type
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Value */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Value
            </label>
            <input
              type="text"
              name="value"
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
              placeholder={
                recordType === 'A'
                  ? '192.168.1.1'
                  : recordType === 'CNAME'
                    ? 'example.com'
                    : 'example.com'
              }
            />
          </div>

          {/* TTL */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              TTL (seconds)
            </label>
            <input
              type="number"
              name="ttl"
              required
              min="60"
              defaultValue="3600"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-6">
            <button type="button" onClick={onClose} className="flex-1 button-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 button-primary disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
