import React from 'react'
import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear()

  const footerLinks = [
    {
      title: 'Platform',
      links: [
        { name: 'About', href: '/about' },
        { name: 'How it Works', href: '/how-it-works' },
        { name: 'Pricing', href: '/pricing' },
        { name: 'FAQ', href: '/faq' },
      ]
    },
    {
      title: 'Legal',
      links: [
        { name: 'Terms of Service', href: '/terms' },
        { name: 'Privacy Policy', href: '/privacy' },
        { name: 'Cookie Policy', href: '/cookies' },
        { name: 'Risk Disclosure', href: '/risk' },
      ]
    },
    {
      title: 'Support',
      links: [
        { name: 'Contact Us', href: '/contact' },
        { name: 'Help Center', href: '/help' },
        { name: 'API Documentation', href: '/api-docs' },
        { name: 'Status', href: '/status' },
      ]
    },
  ]

  return (
    <footer className="bg-base-200 border-t border-base-300 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-3">
            <div className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              TradeSim
            </div>
            <p className="text-sm text-base-content/70">
              Experience realistic trading with simulated assets. Practice risk-free and improve your trading skills.
            </p>
            <div className="flex gap-4 pt-2">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm btn-circle">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.937 4.937 0 004.604 3.417 9.868 9.868 0 01-6.102 2.104c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 0021.337-11.7c0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm btn-circle">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.03-2.682-.103-.253-.447-1.27.098-2.646 0 0 .84-.269 2.75 1.025.8-.223 1.65-.334 2.5-.334.85 0 1.7.111 2.5.334 1.91-1.294 2.75-1.025 2.75-1.025.545 1.376.201 2.393.099 2.646.64.698 1.03 1.591 1.03 2.682 0 3.841-2.337 4.687-4.565 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                </svg>
              </a>
              <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm btn-circle">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515a.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0a12.64 12.64 0 00-.617-1.25a.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057a19.9 19.9 0 005.993 3.03a.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106a13.107 13.107 0 01-1.872-.892a.077.077 0 01-.008-.128c.126-.094.251-.19.371-.285a.078.078 0 01.08-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.08.01c.12.094.245.19.371.284a.077.077 0 01-.008.128a12.86 12.86 0 01-1.872.892a.077.077 0 00-.041.106c.352.699.764 1.364 1.226 1.994a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03a.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.331c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Links Sections */}
          {footerLinks.map((section) => (
            <div key={section.title} className="space-y-3">
              <h3 className="font-bold text-base-content">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-sm text-base-content/70 hover:text-primary transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Newsletter Section */}
          <div className="space-y-3">
            <h3 className="font-bold text-base-content">Newsletter</h3>
            <p className="text-sm text-base-content/70">
              Get the latest updates and trading tips
            </p>
            <form className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="input input-bordered input-sm flex-1"
              />
              <button className="btn btn-primary btn-sm">
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-base-300 mt-8 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-base-content/60">
              © {currentYear} TradeSim. All rights reserved.
            </div>
            <div className="flex gap-6">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="text-xs text-base-content/50"
              >
                <span>🚀 Simulated Trading Platform</span>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="text-xs text-base-content/50"
              >
                <span>⚡ Real-time Market Simulation</span>
              </motion.div>
            </div>
            <div className="flex gap-4 text-xs text-base-content/50">
              <span>🇺🇸 English</span>
              <span>💵 USD</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}