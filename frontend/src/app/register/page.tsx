'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn, User, Mail, Lock, Loader2, Sparkles, AlertCircle, ArrowLeft } from 'lucide-react';
import useAuthStore from '@/store/useAuthStore';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isAuthenticated, isLoading, error, clearError } = useAuthStore();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Clear errors on mount
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!username.trim() || !email.trim() || !password.trim()) {
      setValidationError('All fields are required');
      return;
    }

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters long');
      return;
    }

    const success = await register(username, email, password);
    if (success) {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] text-foreground flex flex-col justify-center items-center px-4 relative">
      {/* Background radial elements for cyberpunk theme */}
      <div className="fixed inset-0 pointer-events-none bg-cyber-mesh -z-10" />

      {/* Back to Home CTA */}
      <Link
        href="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white uppercase tracking-wider transition-colors cursor-pointer group"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        Back to Dashboard
      </Link>

      <div className="w-full max-w-md">
        {/* Logo and title header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-violet-500 to-pink-500 shadow-md shadow-cyan-500/25 mb-4">
            <User className="w-6 h-6 text-white" />
            <div className="absolute inset-0 rounded-2xl bg-cyan-500 filter blur-md opacity-20 -z-10"></div>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Register Node ID
          </h2>
          <p className="text-[10px] uppercase font-extrabold tracking-widest text-zinc-500 mt-1">Acquire WaveFlow Port Credentials</p>
        </div>

        {/* Card containing the form */}
        <div className="glassmorphism p-8 rounded-3xl border border-zinc-800/60 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full filter blur-3xl -z-10"></div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Display error messages */}
            {(error || validationError) && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-950/20 border border-rose-900/30 text-rose-450 text-xs font-medium animate-[fadeIn_0.3s_ease-out]">
                <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{validationError || error}</span>
              </div>
            )}

            {/* Username Input Field */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block pl-1">
                Operator Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="cyber_hacker"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  className="w-full bg-zinc-900/40 border border-zinc-800 focus:border-cyan-500/50 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-zinc-600 outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all shadow-inner"
                />
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-650" />
              </div>
            </div>

            {/* Email Input Field */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block pl-1">
                Node Endpoint Address (Email)
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="name@net.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="w-full bg-zinc-900/40 border border-zinc-800 focus:border-cyan-500/50 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-zinc-600 outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all shadow-inner"
                />
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-650" />
              </div>
            </div>

            {/* Password Input Field */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block pl-1">
                Node Access Credentials (Password)
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="•••••••• (Min 6 chars)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full bg-zinc-900/40 border border-zinc-800 focus:border-cyan-500/50 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-zinc-600 outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all shadow-inner"
                />
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-650" />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 mt-2 rounded-xl bg-gradient-to-r from-cyan-500 via-violet-500 to-pink-500 hover:from-cyan-400 hover:to-pink-400 text-white font-extrabold text-xs tracking-wider uppercase transition-all shadow-md shadow-cyan-500/10 hover:shadow-cyan-500/25 hover:scale-[1.01] cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  Generating credentials...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-white" />
                  Register & Connect
                </>
              )}
            </button>
          </form>

          {/* Prompt to login */}
          <div className="mt-6 pt-6 border-t border-zinc-800/40 text-center">
            <span className="text-[11px] text-zinc-550 font-medium">Already have a Port ID? </span>
            <Link
              href="/login"
              className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors uppercase tracking-wider pl-1 cursor-pointer"
            >
              Connect Node ID
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
