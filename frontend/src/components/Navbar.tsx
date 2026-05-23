'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Search, ChevronLeft, ChevronRight, Menu, X, User as UserIcon, Heart, Library, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import useAuthStore from '../store/useAuthStore';

interface NavbarProps {
  onSearch?: (query: string) => void;
  initialSearchQuery?: string;
}

export default function Navbar({ onSearch, initialSearchQuery = '' }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, logout } = useAuthStore();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [searchVal, setSearchVal] = useState(initialSearchQuery);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync state if query URL parameter changes
  useEffect(() => {
    if (pathname === '/search') {
      const q = searchParams.get('q') || '';
      setSearchVal(q);
    }
  }, [searchParams, pathname]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchVal);
    } else {
      router.push(`/search?q=${encodeURIComponent(searchVal)}`);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchVal(val);
    if (onSearch) {
      onSearch(val);
    }
  };

  return (
    <>
      <header className="h-16 fixed top-0 right-0 left-0 md:left-64 bg-black/90 backdrop-blur-md border-b border-zinc-900 flex items-center justify-between px-6 z-10 select-none">
        {/* Navigation Arrows & Search Input */}
        <div className="flex items-center gap-4 flex-1 max-w-lg">
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              onClick={() => router.back()}
              className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white cursor-pointer transition active:scale-95"
              title="Go Back"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => router.forward()}
              className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white cursor-pointer transition active:scale-95"
              title="Go Forward"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Glass Search Input */}
          {(pathname === '/search' || pathname === '/') && (
            <form onSubmit={handleSearchSubmit} className="relative w-full flex-1">
              <input
                type="text"
                placeholder="Search tracks, artists, genres..."
                value={searchVal}
                onChange={handleInputChange}
                className="w-full bg-[#0a0a0a] border border-zinc-800 focus:border-zinc-500 rounded-lg py-1.5 pl-10 pr-4 text-xs text-white placeholder-zinc-500 outline-none transition-all shadow-sm"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-550 pointer-events-none" />
            </form>
          )}
        </div>

        {/* Action Controls & User Account */}
        <div className="flex items-center gap-4">
          {/* Mobile Navigation Menu Trigger */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white cursor-pointer transition active:scale-95"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Desktop User Widget */}
          <div className="hidden md:flex items-center gap-3 min-h-[32px]">
            {!mounted ? (
              <div className="w-20 h-6 bg-zinc-900 rounded-lg animate-pulse" />
            ) : isAuthenticated ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 shadow-sm">
                <UserIcon className="w-3.5 h-3.5 text-zinc-350" />
                <span className="text-xs font-semibold text-zinc-200">{user?.username}</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/register"
                  className="text-xs font-bold text-zinc-450 hover:text-white transition"
                >
                  Register
                </Link>
                <Link
                  href="/login"
                  className="px-4 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black text-xs font-bold transition active:scale-95 shadow-sm"
                >
                  Login
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex justify-end select-none">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
            onClick={() => setMobileMenuOpen(false)}
          ></div>
          <div className="relative w-64 h-full bg-black border-l border-zinc-900 p-6 flex flex-col z-10">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-2 text-zinc-450 hover:text-white rounded-lg bg-zinc-900 border border-zinc-800"
            >
              <X className="w-4 h-4" />
            </button>

            <span className="font-bold text-lg tracking-tight text-white mb-8 flex items-center gap-2 mt-4">
              Wave<span className="text-zinc-400">Flow</span>
            </span>

            {/* Navigation links */}
            <nav className="space-y-4 flex-1">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 text-sm font-semibold transition ${pathname === '/' ? 'text-white' : 'text-zinc-400'}`}
              >
                <ChevronRightIcon className="w-4 h-4" /> Home
              </Link>
              <Link
                href="/search"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 text-sm font-semibold transition ${pathname === '/search' ? 'text-white' : 'text-zinc-400'}`}
              >
                <ChevronRightIcon className="w-4 h-4" /> Search
              </Link>
              <Link
                href="/library"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 text-sm font-semibold transition ${pathname.startsWith('/library') ? 'text-white' : 'text-zinc-400'}`}
              >
                <ChevronRightIcon className="w-4 h-4" /> Library
              </Link>
              <Link
                href="/library?tab=likes"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 text-xs text-zinc-500 pl-4 border-l border-zinc-900 ml-2"
              >
                <Heart className="w-3.5 h-3.5" /> Liked Songs
              </Link>
              <Link
                href="/library?tab=history"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 text-xs text-zinc-500 pl-4 border-l border-zinc-900 ml-2"
              >
                <Library className="w-3.5 h-3.5" /> Recently Played
              </Link>
            </nav>

            {/* Session logic */}
            <div className="pt-6 border-t border-zinc-900 min-h-[80px]">
              {!mounted ? (
                <div className="w-full h-12 bg-zinc-900 rounded-lg animate-pulse" />
              ) : isAuthenticated ? (
                <div className="flex flex-col gap-2">
                  <div className="text-center py-2 px-3 rounded-lg bg-zinc-900 border border-zinc-800 truncate mb-2">
                    <span className="text-xs font-bold text-white block">{user?.username}</span>
                    <span className="text-[10px] font-mono text-zinc-500 block truncate">{user?.email}</span>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white text-xs font-bold text-center active:scale-95 transition"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2 rounded-lg bg-zinc-900 text-white text-xs font-bold text-center border border-zinc-800 active:scale-95 transition"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2 rounded-lg bg-white text-black text-xs font-bold text-center active:scale-95 transition"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
