"use client";

import axios, { type AxiosInstance } from "axios";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { getAccessToken } from "./auth-session";

const ApiContext = createContext<AxiosInstance | null>(null);

export function ApiProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );
  const [api] = useState(() => {
    const client = axios.create({
      baseURL:
        process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
        "http://localhost:5000",
      headers: { "Content-Type": "application/json" },
    });

    client.interceptors.request.use((config) => {
      const token = getAccessToken();
      if (token) config.headers.set("Authorization", `Bearer ${token}`);
      return config;
    });
    client.interceptors.response.use(
      (response) => response,
      (error: unknown) => {
        if (axios.isAxiosError(error) && !error.response) {
          console.error("Could not reach the ShopWorld API.", error);
        }
        return Promise.reject(error);
      },
    );
    return client;
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ApiContext.Provider value={api}>{children}</ApiContext.Provider>
    </QueryClientProvider>
  );
}

export function useApi() {
  const api = useContext(ApiContext);
  if (!api) throw new Error("useApi must be used inside ApiProvider.");
  return api;
}

export function getApiErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (axios.isAxiosError<{ message?: string | string[] }>(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join(", ");
    if (message) return message;
    if (!error.response) {
      return "Could not reach the API. Check that the backend is running.";
    }
  }
  return error instanceof Error ? error.message : fallback;
}
