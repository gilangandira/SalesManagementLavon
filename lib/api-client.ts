const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

type FetchOptions = RequestInit & {
  params?: Record<string, string>;
};

import { getToken } from "@/lib/auth";

// Helper removed as we now use server action for token retrieval

export async function apiClient<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { params, ...init } = options;

  let url = `${BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  // Get token via server action (works for both httpOnly and regular cookies)
  const token = await getToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    ...init.headers,
  };

  if (token) {
    (headers as any)["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    headers,
    ...init,
  });

  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") {
        // Token expired or invalid, redirect to login
        // Optional: Clear cookies if possible or let login page handle it
        window.location.href = "/login";
        throw new Error("Unauthenticated. Redirecting to login...");
    }
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `API request failed with status ${res.status}`);
  }

  return res.json();
}
