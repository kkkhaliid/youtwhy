'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Library, Heart, History, LogIn, LogOut, Sparkles, Music, Star } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import usePlayerStore from '../store/usePlayerStore';
import Sticker from './Sticker';

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
    <aside className="w-64 h-screen hidden md:flex flex-col fixed left-0 top-0 bg-[#000000] border-r border-zinc-900 p-6 z-20 select-none">
      {/* Brand Logo with curved details */}
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 shadow-sm transition-transform duration-350 hover:scale-105">
          <Music className="w-5 h-5 text-neon-green" />
        </div>
        <div>
          <span className="font-black text-lg tracking-tight text-white flex items-center gap-1">
            Wave<span className="text-zinc-400 font-medium">Flow</span>
          </span>
          <span className="text-[7.5px] font-mono font-extrabold uppercase tracking-widest text-neon-green block -mt-1 drop-shadow-[0_0_8px_rgba(61,253,62,0.4)]">Monochrome</span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="space-y-1.5 mb-8">
        <span className="px-3 text-[9px] font-mono font-extrabold uppercase tracking-wider text-zinc-550 block mb-3">Discover</span>
        {mainNav.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 group border ${
                isActive
                  ? 'bg-zinc-900 border-zinc-800 border-l-4 border-l-neon-green text-neon-green font-bold shadow-md shadow-neon-green/5'
                  : 'text-zinc-400 border-transparent hover:text-white hover:bg-zinc-900 hover:border-zinc-900'
              }`}
            >
              <Icon className={`w-4 h-4 transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-neon-green' : 'text-zinc-400 group-hover:text-white'}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* My Space */}
      <div className="space-y-1.5 mb-8">
        <span className="px-3 text-[9px] font-mono font-extrabold uppercase tracking-wider text-zinc-550 block mb-3">Your Space</span>
        {subNav.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all duration-200 group border border-transparent hover:border-zinc-900"
            >
              <Icon className="w-4 h-4 text-zinc-400 group-hover:text-white group-hover:scale-105 transition-all" />
              {item.name}
            </Link>
          );
        })}
      </div>

      {/* Decorative Rotating Art Sticker Badge in Left Drawer */}
      <div className="flex justify-center my-4 py-2 border-y border-zinc-900/60">
        <Sticker 
          text="• WAVEFLOW • DISCOVER • PREMIUM • MONOCHROME " 
          id="sidebar-sticker"
          color="text-neon-green"
          size="w-24 h-24"
          icon={Star}
        />
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
