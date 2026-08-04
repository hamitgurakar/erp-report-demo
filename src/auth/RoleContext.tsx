import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

/**
 * Rol katmanı — Supabase oturumu + admin rolü.
 *
 * Login BU repoda YOK; portal (muhiku-portal) tarafında yapılır. Burada yalnızca
 * mevcut oturum okunur ve public.is_current_user_admin() RPC'si ile admin rolü
 * belirlenir.
 *
 * FAIL CLOSED: oturum yoksa, RPC hata verirse ya da rol henüz yüklenmediyse
 * isAdmin=false. Yönetim menüsü YALNIZCA roleLoaded && isAdmin iken gösterilir,
 * böylece rol çözülene kadar menü flash etmez.
 */
interface RoleContextValue {
  user: User | null;
  email: string | null;
  isAdmin: boolean;
  /** Oturum + rol en az bir kez çözüldüyse true. */
  roleLoaded: boolean;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
}

const RoleContext = createContext<RoleContextValue | undefined>(undefined);

async function fetchIsAdmin(session: Session | null): Promise<boolean> {
  if (!session?.user) return false; // oturum yok → admin değil
  try {
    const { data, error } = await supabase.rpc('is_current_user_admin');
    if (error) return false; // RPC hatası → admin değil
    return data === true;
  } catch {
    return false; // beklenmedik hata → admin değil
  }
}

export function AuthRoleProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [roleLoaded, setRoleLoaded] = useState(false);

  const resolve = useCallback(async (session: Session | null) => {
    setUser(session?.user ?? null);
    const admin = await fetchIsAdmin(session);
    setIsAdmin(admin);
    setRoleLoaded(true);
  }, []);

  useEffect(() => {
    let active = true;

    // İlk boyama için mevcut oturumu geri yükle.
    supabase.auth.getSession().then(({ data }) => {
      if (active) void resolve(data.session);
    });

    // Oturum değişikliklerini dinle (giriş / çıkış / token yenileme).
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) void resolve(session);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [resolve]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const refreshRole = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    await resolve(data.session);
  }, [resolve]);

  const value: RoleContextValue = {
    user,
    email: user?.email ?? null,
    isAdmin,
    roleLoaded,
    signOut,
    refreshRole,
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRole(): RoleContextValue {
  const ctx = useContext(RoleContext);
  if (ctx === undefined) {
    // Provider yoksa da FAIL CLOSED: yetkisiz varsay.
    return {
      user: null,
      email: null,
      isAdmin: false,
      roleLoaded: true,
      signOut: async () => {},
      refreshRole: async () => {},
    };
  }
  return ctx;
}
