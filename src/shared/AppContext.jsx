// =====================================================================
//  AppContext — global state for authentication, staff profile and the
//  branding/theme settings. Wrap the app once in <AppProvider>.
// =====================================================================
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';
import { supabase } from './supabase';
import { themeApi } from './api';
import { applyTheme, DEFAULT_THEME } from './theme';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [session, setSession] = useState(null);
  const [staff, setStaff] = useState(null); // staff profile row
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [loading, setLoading] = useState(true);

  // ---- Load the staff profile linked 1:1 to the auth user -------------
  const loadStaffProfile = useCallback(async (userId) => {
    if (!userId) {
      setStaff(null);
      return;
    }
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) {
      // eslint-disable-next-line no-console
      console.warn('[AppContext] staff profile not found:', error.message);
      setStaff(null);
    } else {
      setStaff(data);
    }
  }, []);

  // ---- Load + apply the branding theme on first paint -----------------
  const loadTheme = useCallback(async () => {
    try {
      const t = await themeApi.get();
      setTheme(t);
      applyTheme(t);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[AppContext] falling back to default theme:', err.message);
      applyTheme(DEFAULT_THEME);
    }
  }, []);

  // ---- Bootstrap: theme + existing session ----------------------------
  useEffect(() => {
    let active = true;

    (async () => {
      await loadTheme();
      const {
        data: { session: current },
      } = await supabase.auth.getSession();
      if (!active) return;
      setSession(current);
      await loadStaffProfile(current?.user?.id);
      setLoading(false);
    })();

    // React to auth changes (login / logout / token refresh).
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      loadStaffProfile(next?.user?.id);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [loadTheme, loadStaffProfile]);

  // ---- Auth helpers ---------------------------------------------------
  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setStaff(null);
  }, []);

  // ---- Theme refresh (after an admin saves changes) -------------------
  const refreshTheme = useCallback(async () => {
    await loadTheme();
  }, [loadTheme]);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      staff,
      isAuthenticated: !!session,
      isAdmin: staff?.role === 'admin',
      isMatchmaker: staff?.role === 'matchmaker',
      theme,
      loading,
      signIn,
      signOut,
      refreshTheme,
    }),
    [session, staff, theme, loading, signIn, signOut, refreshTheme]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// Hook for consumers.
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within <AppProvider>');
  return ctx;
}

export default AppContext;
