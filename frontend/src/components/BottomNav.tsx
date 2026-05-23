'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Library } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Search', href: '/search', icon: Search },
    { name: 'Library', href: '/library', icon: Library },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#0a0a0a]/95 backdrop-blur-md border-t border-zinc-800/40 flex items-center justify-around px-6 z-40 md:hidden select-none">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-1 py-1 w-16 transition-all duration-200 cursor-pointer ${
              isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Icon className={`w-5 h-5 transition-transform duration-250 ${isActive ? 'scale-105 stroke-[2.2px]' : 'stroke-[1.8px]'}`} />
            <span className="text-[9px] font-bold tracking-wider uppercase select-none">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
