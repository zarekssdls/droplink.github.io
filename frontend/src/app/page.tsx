'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Server, Globe, Zap, ArrowRight, Menu, X } from 'lucide-react'

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-900/20 to-slate-950">
      {/* Navigation */}
      <nav className="fixed w-full top-0 z-50 glass-effect border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Server className="w-8 h-8 text-purple-400" />
              <span className="text-2xl font-bold text-white">Dropls</span>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex gap-8">
              <a href="#features" className="hover:text-purple-400 transition">Features</a>
              <a href="#pricing" className="hover:text-purple-400 transition">Pricing</a>
              <a href="#docs" className="hover:text-purple-400 transition">Docs</a>
            </div>

            <div className="hidden md:flex gap-4">
              <Link href="/auth/login" className="button-secondary">
                Sign In
              </Link>
              <Link href="/auth/register" className="button-primary">
                Get Started
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 space-y-4">
              <a href="#features" className="block hover:text-purple-400">Features</a>
              <a href="#pricing" className="block hover:text-purple-400">Pricing</a>
              <div className="space-y-2 pt-4 border-t border-slate-700">
                <Link href="/auth/login" className="block button-secondary">Sign In</Link>
                <Link href="/auth/register" className="block button-primary">Get Started</Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white">
            Your Game Server,
            <span className="block bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
              Your Domain
            </span>
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Create and manage game servers with custom subdomains. Deploy instantly with automatic DNS management powered by Cloudflare.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/auth/register" className="button-primary flex items-center gap-2">
              Start Free <ArrowRight className="w-4 h-4" />
            </Link>
            <button className="button-secondary">
              Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Powerful Features</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="glass-effect p-8 rounded-xl hover:border-purple-500/50 transition">
              <Globe className="w-12 h-12 text-purple-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Custom Subdomains</h3>
              <p className="text-slate-400">Automatic DNS management with Cloudflare. Create unlimited subdomains for your game servers.</p>
            </div>

            {/* Feature 2 */}
            <div className="glass-effect p-8 rounded-xl hover:border-purple-500/50 transition">
              <Server className="w-12 h-12 text-purple-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Server Management</h3>
              <p className="text-slate-400">Monitor server status, manage player slots, and configure game settings from one dashboard.</p>
            </div>

            {/* Feature 3 */}
            <div className="glass-effect p-8 rounded-xl hover:border-purple-500/50 transition">
              <Zap className="w-12 h-12 text-purple-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Instant Deployment</h3>
              <p className="text-slate-400">Deploy servers in seconds. Multi-game support: Minecraft, CS:GO, Rust, Valheim, and more.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto glass-effect p-12 rounded-xl text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to launch?</h2>
          <p className="text-slate-300 mb-8">Sign up with Discord and start managing your game servers in minutes.</p>
          <Link href="/auth/register" className="button-primary inline-flex items-center gap-2">
            Sign Up with Discord <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 py-8 px-4 mt-20">
        <div className="max-w-6xl mx-auto text-center text-slate-400">
          <p>&copy; 2026 Dropls. All rights reserved. | dropls.xyz</p>
        </div>
      </footer>
    </div>
  )
}
