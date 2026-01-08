import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Keys for localStorage
const OFFLINE_SESSION_KEY = 'agrodata_offline_session';
const OFFLINE_USER_KEY = 'agrodata_offline_user';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasOfflineSession: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper to safely parse JSON from localStorage
const safeParseJSON = <T,>(key: string): T | null => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
};

// Save session to localStorage for offline access
const saveOfflineSession = (session: Session | null, user: User | null) => {
  try {
    if (session && user) {
      localStorage.setItem(OFFLINE_SESSION_KEY, JSON.stringify({
        ...session,
        savedAt: new Date().toISOString(),
      }));
      localStorage.setItem(OFFLINE_USER_KEY, JSON.stringify(user));
    }
  } catch (error) {
    console.error('Error saving offline session:', error);
  }
};

// Get offline session from localStorage
const getOfflineSession = (): { session: Session | null; user: User | null } => {
  const session = safeParseJSON<Session & { savedAt: string }>(OFFLINE_SESSION_KEY);
  const user = safeParseJSON<User>(OFFLINE_USER_KEY);
  
  // Check if session is not too old (7 days)
  if (session?.savedAt) {
    const savedAt = new Date(session.savedAt);
    const now = new Date();
    const daysDiff = (now.getTime() - savedAt.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysDiff > 7) {
      localStorage.removeItem(OFFLINE_SESSION_KEY);
      localStorage.removeItem(OFFLINE_USER_KEY);
      return { session: null, user: null };
    }
  }
  
  return { session, user };
};

// Clear offline session
const clearOfflineSession = () => {
  localStorage.removeItem(OFFLINE_SESSION_KEY);
  localStorage.removeItem(OFFLINE_USER_KEY);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasOfflineSession, setHasOfflineSession] = useState(false);

  useEffect(() => {
    // Check for offline session first
    const { session: offlineSession, user: offlineUser } = getOfflineSession();
    setHasOfflineSession(!!(offlineSession && offlineUser));

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Save session for offline use
        if (session?.user) {
          saveOfflineSession(session, session.user);
          setHasOfflineSession(true);
        }
        
        if (event === 'SIGNED_OUT') {
          clearOfflineSession();
          setHasOfflineSession(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error || !session) {
        // If we're offline and have an offline session, use it
        if (!navigator.onLine && offlineSession && offlineUser) {
          setSession(offlineSession);
          setUser(offlineUser);
          setLoading(false);
          return;
        }
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Save session for offline use
      if (session?.user) {
        saveOfflineSession(session, session.user);
        setHasOfflineSession(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName
        }
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    // Save session for offline use if successful
    if (!error && data.session && data.user) {
      saveOfflineSession(data.session, data.user);
      setHasOfflineSession(true);
    }
    
    return { error };
  };

  const signOut = async () => {
    clearOfflineSession();
    setHasOfflineSession(false);
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    hasOfflineSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
