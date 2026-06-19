'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/AuthContext'
import { LogOut, Settings, Server, Globe, Menu, X } from 'lucide-react'
import { useState } from 'react'

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 flex">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-slate-900/50 border-r border-slate-700 transition-all duration-300 p-4 flex flex-col`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 px-2">
          <Server className="w-8 h-8 text-purple-400 flex-shrink-0" />
          {sidebarOpen && <span className="text-lg font-bold text-white">Dropls</span>}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2">
          <NavLink
            href="/dashboard"
            icon={<Server className="w-5 h-5" />}
            label="Servers"
            collapsed={!sidebarOpen}
          />
          <NavLink
            href="/dashboard/dns"
            icon={<Globe className="w-5 h-5" />}
            label="DNS Management"
            collapsed={!sidebarOpen}
          />
          <NavLink
            href="/dashboard/settings"
            icon={<Settings className="w-5 h-5" />}
            label="Settings"
            collapsed={!sidebarOpen}
          />
        </nav>

        {/* User & Toggle */}
        <div className="space-y-4 border-t border-slate-700 pt-4">
          {sidebarOpen && user && (
            <div className="px-2">
              <p className="text-xs text-slate-400">Logged in as</p>
              <p className="text-sm font-medium text-white truncate">{user.username}</p>
            </div>
          )}

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full p-2 rounded-lg hover:bg-slate-700 transition text-slate-400 mb-2"
            title={sidebarOpen ? 'Collapse' : 'Expand'}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <button
            onClick={logout}
            className="w-full px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            {sidebarOpen && 'Logout'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">{children}</div>
    </div>
  )
}

interface NavLinkProps {
  href: string
  icon: React.ReactNode
  label: string
  collapsed: boolean
}

function NavLink({ href, icon, label, collapsed }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-purple-600/20 hover:text-purple-400 transition ${
        collapsed ? 'justify-center' : ''
      }`}
      title={collapsed ? label : undefined}
    >
      <div className="flex-shrink-0">{icon}</div>
      {!collapsed && <span className="text-sm font-medium">{label}</span>}
    </Link>
  )
}
