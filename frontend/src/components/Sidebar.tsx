'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Library, Heart, History, LogIn, LogOut, Sparkles, Music } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import usePlayerStore from '../store/usePlayerStore';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { clearQueue } = usePlayerStore();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const mainNav = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Search', href: '/search', icon: Search },
    { name: 'Library', href: '/library', icon: Library },
  ];

  const subNav = [
    { name: 'Liked Songs', href: '/library?tab=likes', icon: Heart, color: 'text-zinc-400' },
    { name: 'Recently Played', href: '/library?tab=history', icon: History, color: 'text-zinc-400' },
  ];

  const handleLogout = () => {
    logout();
    clearQueue();
  };

  return (
    <aside className="w-64 h-screen hidden md:flex flex-col fixed left-0 top-0 bg-[#0a0a0a] border-r border-zinc-900 p-6 z-20 select-none">
      {/* Brand Logo */}
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 shadow-sm">
          <Music className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1">
            Wave<span className="text-zinc-400">Flow</span>
          </span>
          <span className="text-[8px] font-mono uppercase tracking-widest text-zinc-500 block -mt-1">Monochrome</span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="space-y-1 mb-8">
        <span className="px-3 text-[9px] font-mono uppercase tracking-wider text-zinc-500 block mb-3">Discover</span>
        {mainNav.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-zinc-900 border-l-2 border-white text-white font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Icon className={`w-4 h-4 transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-white' : 'text-zinc-400 group-hover:text-white'}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* My Space */}
      <div className="space-y-1 mb-8">
        <span className="px-3 text-[9px] font-mono uppercase tracking-wider text-zinc-500 block mb-3">Your Space</span>
        {subNav.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all duration-200 group"
            >
              <Icon className="w-4 h-4 text-zinc-400 group-hover:text-white group-hover:scale-105 transition-all" />
              {item.name}
            </Link>
          );
        })}
      </div>

      {/* User Session Slot */}
      <div className="mt-auto pt-6 border-t border-zinc-900">
        <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-950 border border-zinc-900 shadow-sm min-h-[44px]">
          {!mounted ? (
            <div className="w-full h-8 bg-zinc-900 rounded-lg animate-pulse" />
          ) : isAuthenticated ? (
            <div className="flex items-center justify-between w-full gap-2">
              <div className="flex flex-col truncate">
                <span className="text-xs font-bold text-white truncate">{user?.username}</span>
                <span className="text-[9px] font-mono text-zinc-500 truncate">{user?.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition cursor-pointer active:scale-95"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-white hover:bg-zinc-200 text-black text-xs font-bold shadow transition cursor-pointer active:scale-95"
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign In
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}
