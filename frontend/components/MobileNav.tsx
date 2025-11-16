'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Home, LayoutDashboard, Trophy, Copy, BarChart3, TrendingUp, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConnectWallet } from '@/components/ConnectWallet';

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/markets', label: 'Markets', icon: TrendingUp },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { href: '/traders', label: 'Search Traders', icon: Search },
    { href: '/copy-trading', label: 'Copy Trading', icon: Copy },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleMenu}
        className="md:hidden"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </Button>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
              onClick={closeMenu}
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-16 right-0 bottom-0 w-64 bg-background border-l z-50 md:hidden"
            >
              <nav className="flex flex-col p-4 space-y-2">
                {links.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={closeMenu}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors min-h-[44px] transform -skew-y-1 ${
                        isActive
                          ? 'bg-amber-500/20 text-amber-400 border-2 border-amber-400/50'
                          : 'hover:bg-muted border-2 border-transparent'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-black uppercase italic tracking-wider">{link.label}</span>
                    </Link>
                  );
                })}

                {/* Connect Wallet in Menu */}
                <div className="pt-4 border-t">
                  <ConnectWallet />
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// Desktop Navigation (for larger screens)
export function DesktopNav() {
  const pathname = usePathname();

  const links = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/markets', label: 'Markets' },
    { href: '/leaderboard', label: 'Leaderboard' },
    { href: '/traders', label: 'Traders' },
    { href: '/copy-trading', label: 'Copy Trading' },
    { href: '/analytics', label: 'Analytics' },
  ];

  return (
    <nav className="hidden md:flex gap-4">
      {links.map((link) => {
        const isActive = pathname === link.href;

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`text-sm font-black uppercase italic tracking-wider transition-colors transform -skew-y-1 px-3 py-2 rounded border-2 ${
              isActive
                ? 'text-amber-400 border-amber-400/50 bg-amber-500/10'
                : 'text-slate-300 border-transparent hover:text-amber-400 hover:border-amber-400/30'
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
