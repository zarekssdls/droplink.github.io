'use client'

import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface Domain {
  id: string
  name: string
  status: 'active' | 'inactive'
}

export default function DomainSelector({
  selectedDomain,
  onDomainChange,
}: {
  selectedDomain: string
  onDomainChange: (domain: string) => void
}) {
  const [domains, setDomains] = useState<Domain[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDomains()
  }, [])

  const fetchDomains = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/domains`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (!response.ok) throw new Error('Failed to fetch domains')

      const data = await response.json()
      setDomains(data)

      // Set first domain as default if none selected
      if (!selectedDomain && data.length > 0) {
        onDomainChange(data[0].id)
      }
    } catch (error) {
      console.error('Error fetching domains:', error)
    } finally {
      setLoading(false)
    }
  }

  const selected = domains.find((d) => d.id === selectedDomain)

  return (
    <div className="relative inline-block w-64">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white hover:border-purple-500 transition"
      >
        <span>{loading ? 'Loading...' : selected?.name || 'Select Domain'}</span>
        <ChevronDown className={`w-4 h-4 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-50">
          {domains.map((domain) => (
            <button
              key={domain.id}
              onClick={() => {
                onDomainChange(domain.id)
                setOpen(false)
              }}
              className="w-full text-left px-4 py-2 hover:bg-purple-600/20 transition text-white flex items-center justify-between"
            >
              <span>{domain.name}</span>
              <span className={`w-2 h-2 rounded-full ${domain.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
