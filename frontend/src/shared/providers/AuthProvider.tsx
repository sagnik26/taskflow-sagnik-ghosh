import type { ReactNode } from "react";

import { AuthContextProvider } from "../../modules/auth/context/AuthContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  return <AuthContextProvider>{children}</AuthContextProvider>;
}

