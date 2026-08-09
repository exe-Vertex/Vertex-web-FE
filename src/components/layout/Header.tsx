import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Button } from '../ui/Button';
import { VertexLogo } from '../ui/VertexLogo';
import { useLang } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar } from '../ui/Avatar';
import { ChevronDown, LayoutDashboard, LogOut, Menu, X } from 'lucide-react';

interface HeaderProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, currentPage }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const { t } = useLang();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const dashboardDestination = user?.role.toLowerCase() === 'admin'
    ? 'admin'
    : user?.role.toLowerCase() === 'lecturer'
      ? 'lecturer'
      : 'dashboard';

  const navigateToDashboard = () => {
    setIsAccountMenuOpen(false);
    setIsMobileMenuOpen(false);
    onNavigate(dashboardDestination);
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await logout();
      setIsAccountMenuOpen(false);
      setIsMobileMenuOpen(false);
      onNavigate('landing');
    } finally {
      setIsSigningOut(false);
    }
  };

  const navItems = [
    { label: t.nav.features,  id: 'features'   },
    { label: t.nav.pricing,   id: 'pricing'    },
    { label: t.nav.resources, id: 'resources'  },
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-[#0A0F1A]/80 backdrop-blur-xl shadow-lg shadow-green-500/5 py-3 border-b border-[#22C55E]/10' : 'bg-transparent py-5'
      }`}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between md:grid md:grid-cols-[1fr_auto_1fr] md:items-center">
        {/* Logo */}
        <div 
          className="vertex-brand inline-flex w-max items-center gap-2 cursor-pointer md:justify-self-start" 
          onClick={() => onNavigate('landing')}
        >
          <div className="vertex-mark w-8 h-8 rounded-lg flex items-center justify-center text-white">
            <VertexLogo size={20} />
          </div>
          <span className="font-display text-xl tracking-tight vertex-wordmark">
            Vertex
          </span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center justify-center gap-8">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`menu-link text-sm font-medium ${currentPage === item.id ? 'is-current' : ''}`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Actions */}
        <div className="hidden md:flex items-center justify-end gap-3">
          {isLoading ? (
            <div className="flex items-center gap-3" aria-label="Checking session">
              <span className="h-8 w-28 animate-pulse rounded-xl bg-[#162032]" />
              <span className="h-8 w-8 animate-pulse rounded-full bg-[#162032]" />
            </div>
          ) : isAuthenticated && user ? (
            <>
              <Button
                variant="primary"
                size="sm"
                icon={<LayoutDashboard size={15} />}
                onClick={navigateToDashboard}
              >
                {t.nav.dashboard}
              </Button>
              <div ref={accountMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsAccountMenuOpen((open) => !open)}
                  className="flex items-center gap-1 rounded-full p-0.5 text-slate-400 transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-[#34D399]/60"
                  aria-label="Open account menu"
                  aria-expanded={isAccountMenuOpen}
                >
                  <Avatar
                    src={user.avatarUrl}
                    alt={user.name}
                    fallback={user.name.charAt(0).toUpperCase() || 'U'}
                    size="sm"
                  />
                  <ChevronDown
                    size={15}
                    className={`transition-transform ${isAccountMenuOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                <AnimatePresence>
                  {isAccountMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.98 }}
                      transition={{ duration: 0.16 }}
                      className="absolute right-0 top-[calc(100%+0.75rem)] w-64 overflow-hidden rounded-lg border border-[#22C55E]/15 bg-[#0F1A2A]/98 p-2 shadow-2xl shadow-black/40 backdrop-blur-xl"
                    >
                      <div className="px-3 py-2">
                        <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                        <p className="truncate text-xs text-slate-500">{user.email}</p>
                      </div>
                      <div className="my-1 h-px bg-[#22C55E]/10" />
                      <button
                        type="button"
                        onClick={navigateToDashboard}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-300 transition-colors hover:bg-[#162032] hover:text-white"
                      >
                        <LayoutDashboard size={16} />
                        <span>{t.nav.dashboard}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        disabled={isSigningOut}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-red-300 transition-colors hover:bg-red-500/10 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <LogOut size={16} />
                        <span>{t.nav.signOut}</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('login')}>
                {t.nav.signIn}
              </Button>
              <Button variant="primary" size="sm" onClick={() => onNavigate('dashboard')}>
                {t.nav.free}
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden p-2 text-slate-400"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden absolute top-full left-0 right-0 bg-[#0F1A2A]/95 backdrop-blur-xl border-b border-[#22C55E]/10 p-4 flex flex-col gap-1 shadow-lg shadow-green-500/5"
        >
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                setIsMobileMenuOpen(false);
              }}
              className={`text-left px-3 py-2.5 rounded-lg font-medium transition-colors ${
                currentPage === item.id
                  ? 'bg-[#22C55E]/10 text-[#22C55E]'
                  : 'text-slate-400 hover:text-white hover:bg-[#162032]'
              }`}
            >
              {item.label}
            </button>
          ))}
          <div className="my-2 h-px bg-[#22C55E]/10"></div>
          {isLoading ? (
            <div className="space-y-2 px-1 py-1" aria-label="Checking session">
              <div className="h-12 animate-pulse rounded-lg bg-[#162032]" />
              <div className="h-9 animate-pulse rounded-xl bg-[#162032]" />
            </div>
          ) : isAuthenticated && user ? (
            <>
              <div className="flex items-center gap-3 rounded-lg bg-[#162032]/60 px-3 py-2.5">
                <Avatar
                  src={user.avatarUrl}
                  alt={user.name}
                  fallback={user.name.charAt(0).toUpperCase() || 'U'}
                  size="sm"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                  <p className="truncate text-xs text-slate-500">{user.email}</p>
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                className="w-full justify-center"
                icon={<LayoutDashboard size={15} />}
                onClick={navigateToDashboard}
              >
                {t.nav.dashboard}
              </Button>
              <Button
                variant="danger"
                size="sm"
                className="w-full justify-center"
                icon={<LogOut size={15} />}
                isLoading={isSigningOut}
                onClick={handleSignOut}
              >
                {t.nav.signOut}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start"
                onClick={() => {
                  onNavigate('login');
                  setIsMobileMenuOpen(false);
                }}
              >
                {t.nav.signIn}
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="w-full justify-center"
                onClick={() => {
                  onNavigate('dashboard');
                  setIsMobileMenuOpen(false);
                }}
              >
                {t.nav.free}
              </Button>
            </>
          )}
        </motion.div>
      )}
    </header>
  );
};
