import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import {
  usersService,
  type LoginChallengeResult,
  type SignupInput,
  type SignupResult
} from "../services/users";
import type { UserProfile } from "../types";

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<LoginChallengeResult>;
  verifyLoginCode: (challengeToken: string, code: string) => Promise<void>;
  signup: (input: SignupInput) => Promise<SignupResult>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      setUser(await usersService.session());
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshSession().finally(() => setLoading(false));
  }, [refreshSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login: async (identifier, password) => {
        return usersService.login(identifier, password);
      },
      verifyLoginCode: async (challengeToken, code) => {
        await usersService.verifyLoginCode(challengeToken, code);
        await refreshSession();
      },
      signup: async (input) => {
        return usersService.signup(input);
      },
      logout: async () => {
        await usersService.logout();
        setUser(null);
      },
      refreshSession
    }),
    [loading, refreshSession, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
