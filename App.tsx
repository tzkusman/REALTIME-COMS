
import React, { useState, useEffect } from 'react';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import Storefront from './components/Storefront';
import { getStoreSetupSQL } from './services/geminiService';
import { Auth } from './components/Auth';
import { RealtimeCursors } from './components/RealtimeCursors';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

// Log configuration
console.log('Supabase URL:', SUPABASE_URL);
console.log('Supabase Key loaded:', !!SUPABASE_KEY);

const App: React.FC = () => {
  const [supabase] = useState(() => {
    console.log('Creating Supabase client with URL:', SUPABASE_URL);
    return createClient(SUPABASE_URL, SUPABASE_KEY, {
      global: {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      }
    });
  });
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupSql, setSetupSql] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        if (session) {
          await checkConnection();
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Auth init error:', err);
        setError(`Authentication failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session) {
        checkConnection();
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const checkConnection = async () => {
    setIsLoading(true);
    try {
      const { data, error: tableError } = await supabase.from('products').select('id').limit(1);
      
      if (tableError) {
        console.error('Table error:', tableError);
        if (tableError.code === '42P01') {
          setNeedsSetup(true);
          setError(null);
        } else {
          setError(`Connection Error: ${tableError.message}`);
        }
      } else {
        setIsReady(true);
        setNeedsSetup(false);
        setError(null);
      }
    } catch (err) {
      const errorMsg = `Unable to connect to Supabase at ${SUPABASE_URL}. This is a local development URL which cannot be accessed from the cloud.`;
      console.error('Connection error:', err);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetup = async () => {
    setIsSettingUp(true);
    try {
      const sql = await getStoreSetupSQL();
      setSetupSql(sql);
    } catch (e) {
      setError("Failed to fetch setup script.");
    } finally {
      setIsSettingUp(false);
    }
  };

  const copyToClipboard = () => {
    if (setupSql) {
      navigator.clipboard.writeText(setupSql);
      alert("SQL copied to clipboard!");
    }
  };

  if (!user) {
    return <Auth supabase={supabase} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#3ecf8e]/20 border-t-[#3ecf8e] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth supabase={supabase} />;
  }

  if (error && !needsSetup) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-full max-w-2xl">
          <div className="w-20 h-20 bg-red-900/20 text-red-500 rounded-3xl flex items-center justify-center mb-6 border border-red-500/20 mx-auto">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <h2 className="text-2xl font-bold mb-4 text-white">Configuration Issue</h2>
          <p className="text-zinc-400 mb-6 whitespace-pre-wrap text-left bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
            {error}
          </p>
          <div className="space-y-3">
            <p className="text-sm text-zinc-500">
              ⚠️ <strong>The current Supabase URL is for local development only.</strong>
            </p>
            <p className="text-sm text-zinc-400">
              To deploy to production, you need a real Supabase Cloud project.
            </p>
            <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg text-left">
              <p className="text-sm font-bold text-blue-300 mb-2">Quick Fix:</p>
              <ol className="text-xs text-blue-200 space-y-1 list-decimal list-inside">
                <li>Create a free Supabase project at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline">supabase.com</a></li>
                <li>Copy your project URL and anon key</li>
                <li>Update the Vercel environment variables</li>
                <li>Redeploy the project</li>
              </ol>
            </div>
          </div>
          <button 
            onClick={checkConnection} 
            className="mt-6 bg-[#3ecf8e] text-[#09090b] px-8 py-3 rounded-xl font-bold hover:bg-[#34b27b] transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (needsSetup) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6">
        <div className="max-w-4xl w-full flex flex-col items-center">
          <div className="w-20 h-20 bg-[#3ecf8e]/10 text-[#3ecf8e] rounded-3xl flex items-center justify-center mb-6 border border-[#3ecf8e]/20">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <h2 className="text-3xl font-bold mb-2 text-white text-center">Initialize Store Database</h2>
          <p className="text-zinc-400 max-w-lg mb-8 text-center">
            Your local Supabase is connected but the tables are missing. Paste the SQL below into your SQL Editor to bootstrap the store.
          </p>

          {!setupSql ? (
            <button 
              onClick={handleSetup} 
              disabled={isSettingUp}
              className="bg-[#3ecf8e] text-[#09090b] px-10 py-4 rounded-2xl font-bold hover:bg-[#34b27b] transition-all disabled:opacity-50 shadow-xl shadow-[#3ecf8e]/20"
            >
              {isSettingUp ? 'Fetching Script...' : 'Get Store Setup SQL'}
            </button>
          ) : (
            <div className="w-full space-y-4">
              <div className="flex justify-between items-center px-2">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">PostgreSQL Bootstrap Script</span>
                <button 
                  onClick={copyToClipboard}
                  className="text-xs text-[#3ecf8e] hover:text-[#34b27b] font-bold flex items-center gap-1.5 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                  Copy to Clipboard
                </button>
              </div>
              <div className="bg-[#111114] border border-zinc-800 rounded-2xl p-6 font-mono text-sm overflow-auto max-h-[400px] text-zinc-300 shadow-inner custom-scrollbar">
                <pre>{setupSql}</pre>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
                <a 
                  href="http://localhost:54323/project/default/sql/new" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-white text-[#09090b] px-8 py-4 rounded-2xl font-bold hover:bg-zinc-200 transition-all text-center"
                >
                  Open Supabase SQL Editor
                </a>
                <button 
                  onClick={checkConnection}
                  className="border border-zinc-700 text-zinc-300 px-8 py-4 rounded-2xl font-bold hover:bg-zinc-800 transition-all"
                >
                  I've run the SQL, Check Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <RealtimeCursors supabase={supabase} user={user} />
      <Storefront supabase={supabase} user={user} />
    </>
  );
};

export default App;
