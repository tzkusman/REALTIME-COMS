
import React, { useState } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';

interface AuthProps {
  supabase: SupabaseClient;
}

export const Auth: React.FC<AuthProps> = ({ supabase }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRegistering) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username,
              avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
            },
          },
        });
        if (error) throw error;
        alert('Check your email for the confirmation link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-[#111114] border border-white/10 rounded-3xl p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-[#3ecf8e] rounded-2xl flex items-center justify-center text-[#09090b] mx-auto mb-4">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M21.362 9.354H12V.396L2.638 14.646H12v8.958l9.362-14.25z" /></svg>
          </div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">
            {isRegistering ? 'Join LocalStore' : 'Welcome Back'}
          </h2>
          <p className="text-zinc-500 mt-2 text-sm font-medium">
            Experience realtime shopping on your local machine.
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {isRegistering && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Username</label>
              <input
                required
                type="text"
                placeholder="developer_zero"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3ecf8e]/50 transition-all text-white"
              />
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Email</label>
            <input
              required
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3ecf8e]/50 transition-all text-white"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Password</label>
            <input
              required
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3ecf8e]/50 transition-all text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#3ecf8e] text-[#09090b] py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-[#34b27b] transition-all shadow-lg shadow-[#3ecf8e]/20 disabled:opacity-50 mt-4"
          >
            {loading ? 'Processing...' : (isRegistering ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-sm font-bold text-zinc-400 hover:text-white transition-colors"
          >
            {isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Register"}
          </button>
        </div>
      </div>
    </div>
  );
};
