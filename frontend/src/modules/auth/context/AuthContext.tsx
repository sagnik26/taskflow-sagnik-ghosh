import { useCallback, useMemo, type ReactNode } from "react";

import { useAuthStore } from "../../../store";
import type { LoginInput, RegisterInput } from "../schemas/auth.schemas";
import type { User } from "../../../types/auth";
import { AuthContext, type AuthContextValue } from "./auth.context";

function createMockUser(input: { name?: string; email: string }): User {
  return {
    id: crypto.randomUUID(),
    name: input.name ?? "Test User",
    email: input.email,
  };
}

export function AuthContextProvider({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const clear = useAuthStore((s) => s.clear);

  const login = useCallback(
    async (input: LoginInput) => {
      // Phase A mock: accept any credentials
      setUser(createMockUser({ email: input.email }));
    },
    [setUser],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      // Phase A mock: accept any registration
      setUser(createMockUser({ name: input.name, email: input.email }));
    },
    [setUser],
  );

  const logout = useCallback(() => {
    clear();
  }, [clear]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
    }),
    [login, logout, register, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

