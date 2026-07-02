import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  type AuthUser,
  loginRequest,
  registerRequest,
  type RegisterPayload,
  type UserRole,
} from "@/services/auth-service";

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  role: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
};

const AUTH_TOKEN_KEY = "auth_token";
const AUTH_USER_KEY = "auth_user";

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const restoreSession = useCallback(async () => {
    try {
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem(AUTH_TOKEN_KEY),
        AsyncStorage.getItem(AUTH_USER_KEY),
      ]);

      if (!storedToken || !storedUser) {
        setToken(null);
        setUser(null);
        return;
      }

      setToken(storedToken);
      setUser(JSON.parse(storedUser) as AuthUser);
    } catch {
      await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, AUTH_USER_KEY]);
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void restoreSession();
    }, 0);

    return () => {
      clearTimeout(timeout);
    };
  }, [restoreSession]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await loginRequest(email, password);

    await AsyncStorage.multiSet([
      [AUTH_TOKEN_KEY, data.token],
      [AUTH_USER_KEY, JSON.stringify(data.user)],
    ]);

    setToken(data.token);
    setUser(data.user);
  }, []);

  const register = useCallback(
    async (payload: RegisterPayload) => {
      await registerRequest(payload);
      await login(payload.email, payload.password);
    },
    [login],
  );

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, AUTH_USER_KEY]);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      role: user?.role ?? null,
      isLoading,
      isAuthenticated: Boolean(token && user),
      login,
      register,
      logout,
      restoreSession,
    }),
    [isLoading, login, logout, register, restoreSession, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
