'use client';

import { useEffect, Suspense } from 'react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import MusicPlayer from '@/components/MusicPlayer';
import BottomNav from '@/components/BottomNav';
import useAuthStore from '@/store/useAuthStore';
import usePlayerStore from '@/store/usePlayerStore';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { fetchMe, isAuthenticated } = useAuthStore();
  const { fetchLikes, fetchHistory } = usePlayerStore();

  // Try to load user data from JWT stored in localStorage
  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  // Load user specific features on successful authentication
  useEffect(() => {
    if (isAuthenticated) {
      fetchLikes();
      fetchHistory();
    }
  }, [isAuthenticated, fetchLikes, fetchHistory]);

  return (
    <div className="min-h-screen bg-black text-foreground">
      {/* Background radial elements for monochrome theme */}
      <div className="fixed inset-0 pointer-events-none bg-cyber-mesh -z-10" />

      {/* Sidebar for desktop navigation */}
      <Sidebar />

      {/* Main dashboard content view wrapper */}
      <div className="flex flex-col min-h-screen md:pl-64 pb-36 md:pb-24">
        {/* Navigation Bar wrapped in Suspense to prevent build-time de-optimization */}
        <Suspense fallback={<div className="h-16 fixed top-0 right-0 left-0 md:left-64 bg-zinc-950/20 border-b border-zinc-800/30 z-10" />}>
          <Navbar />
        </Suspense>

        {/* Dynamic page content slot */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 pt-20 pb-8 animate-[fadeIn_0.5s_ease-out]">
          {children}
        </main>
      </div>

      {/* Persistent global audio control player */}
      <MusicPlayer />

      {/* Bottom Nav Bar for Mobile devices */}
      <BottomNav />
    </div>
  );
}
