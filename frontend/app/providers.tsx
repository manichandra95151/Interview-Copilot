"use client";

import { AuthProvider } from "@/lib/hooks/useAuth";
import { ToastProvider } from "@/lib/hooks/useToast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>{children}</ToastProvider>
    </AuthProvider>
  );
}
