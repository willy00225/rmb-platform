"use client";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { useState } from "react";

export function DashboardProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 60 * 1000 } },
  }));

  return (
    <SessionProvider
      baseUrl={process.env.NEXT_PUBLIC_NEXTAUTH_URL}
    >
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster position="top-right" toastOptions={{ style: { background: "#1F2A22", color: "#FFFFFF", border: "1px solid #E5E7EB" } }} />
      </QueryClientProvider>
    </SessionProvider>
  );
}