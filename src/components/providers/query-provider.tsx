"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import { toast } from "sonner";

import { useErrorMessage } from "@/lib/errors/use-error-message";
import { createQueryClient } from "@/lib/query/client";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const getErrorMessage = useErrorMessage();
  const [queryClient] = useState(() =>
    createQueryClient({
      notifyError: (error) => toast.error(getErrorMessage(error)),
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
