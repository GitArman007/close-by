import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { setApiToken, setUnauthorizedHandler } from '@/api/client';
import { authApi } from '@/api/endpoints';
import type { AuthResponse, UserRole, UserSummaryDto } from '@/types/api';
import { DEMO_ACCOUNTS, type DemoAccountKey } from './demoAccounts';
import { authStorage } from './storage';

interface AuthContextValue {
  user: UserSummaryDto | null;
  token: string | null;
  isHydrating: boolean;
  demoSwitcherVisible: boolean;
  setDemoSwitcherVisible: (visible: boolean) => void;
  login: (email: string, password: string) => Promise<UserSummaryDto>;
  registerFamily: (payload: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
  }) => Promise<UserSummaryDto>;
  registerClinic: (payload: {
    adminFullName: string;
    email: string;
    adminPhone: string;
    password: string;
    clinicName: string;
    registrationNumber: string;
    locality: string;
    address: string;
    clinicPhone: string;
  }) => Promise<UserSummaryDto>;
  switchDemoAccount: (key: DemoAccountKey) => Promise<UserSummaryDto>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function roleHomeRoute(role: UserRole): string {
  switch (role) {
    case 'PLATFORM_ADMIN':
      return '/(admin)';
    case 'CLINIC_ADMIN':
      return '/(clinic)';
    case 'CLINIC_STAFF':
      return '/(staff)';
    case 'FAMILY':
      return '/(family)';
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserSummaryDto | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);
  const [demoSwitcherVisible, setDemoSwitcherVisible] = useState(false);

  const applySession = useCallback((res: AuthResponse): UserSummaryDto => {
    setApiToken(res.accessToken);
    authStorage.setToken(res.accessToken);
    authStorage.setUserJson(JSON.stringify(res.user));
    setToken(res.accessToken);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(() => {
    setApiToken(null);
    authStorage.clear();
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
    });
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  useEffect(() => {
    let mounted = true;
    async function hydrate() {
      const storedToken = authStorage.getToken();
      const storedUserRaw = authStorage.getUserJson();
      if (!storedToken) {
        if (mounted) setIsHydrating(false);
        return;
      }

      setApiToken(storedToken);
      if (storedUserRaw) {
        try {
          const parsed = JSON.parse(storedUserRaw) as UserSummaryDto;
          if (mounted) {
            setToken(storedToken);
            setUser(parsed);
          }
        } catch {
          // Will refresh from /auth/me below
        }
      }

      try {
        const freshUser = await authApi.me();
        if (mounted) {
          authStorage.setUserJson(JSON.stringify(freshUser));
          setToken(storedToken);
          setUser(freshUser);
        }
      } catch {
        if (mounted) {
          logout();
        }
      } finally {
        if (mounted) setIsHydrating(false);
      }
    }

    void hydrate();
    return () => {
      mounted = false;
    };
  }, [logout]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await authApi.login(email, password);
      return applySession(res);
    },
    [applySession]
  );

  const registerFamily = useCallback(
    async (payload: {
      fullName: string;
      email: string;
      phone: string;
      password: string;
    }) => {
      const res = await authApi.registerFamily(payload);
      return applySession(res);
    },
    [applySession]
  );

  const registerClinic = useCallback(
    async (payload: {
      adminFullName: string;
      email: string;
      adminPhone: string;
      password: string;
      clinicName: string;
      registrationNumber: string;
      locality: string;
      address: string;
      clinicPhone: string;
    }) => {
      const res = await authApi.registerClinic(payload);
      return applySession(res);
    },
    [applySession]
  );

  const switchDemoAccount = useCallback(
    async (key: DemoAccountKey) => {
      const target = DEMO_ACCOUNTS.find((a) => a.key === key);
      if (!target) {
        throw new Error('Unknown demo account.');
      }
      const res = await authApi.login(target.email, target.password);
      return applySession(res);
    },
    [applySession]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isHydrating,
        demoSwitcherVisible,
        setDemoSwitcherVisible,
        login,
        registerFamily,
        registerClinic,
        switchDemoAccount,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
