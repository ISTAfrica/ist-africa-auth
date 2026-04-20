import { toast } from "@/hooks/use-toast";
import { storage } from "@/lib/storage";

export const handleGlobalLogout = (message?: string) => {
  if (typeof window !== "undefined") {
    storage.clear();

    const searchParams = message
      ? `?message=${encodeURIComponent(message)}`
      : "";
    window.location.href = `/auth/login${searchParams}`;
  }
};

async function tryRefreshToken(): Promise<string | null> {
  const { refreshAccessToken } = await import("@/services/authService");
  return refreshAccessToken();
}

async function makeRequest(
  endpoint: string,
  options: RequestInit,
  token: string | null
) {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  return fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
  });
}

export async function apiClient<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = storage.get("accessToken");

  try {
    let response = await makeRequest(endpoint, options, token);

    // On 401, try refreshing the token and retry once
    if (response.status === 401) {
      const newToken = await tryRefreshToken();
      if (newToken) {
        response = await makeRequest(endpoint, options, newToken);
      } else {
        handleGlobalLogout("Session expired");
        return new Promise(() => {});
      }
    }

    const responseText = await response.text();
    let data: unknown = {};

    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      data = { message: responseText || "Unknown error" };
    }

    if (!response.ok) {
      const errorMsg =
        typeof data === "object" && data !== null && "message" in data
          ? String((data as { message?: unknown }).message)
          : "Something went wrong";

      if (response.status === 401) {
        handleGlobalLogout(errorMsg);
        return new Promise(() => {});
      }

      throw new Error(errorMsg);
    }

    return data as T;
  } catch (error: unknown) {
    console.error("API request failed:", error);

    if (
      typeof window !== "undefined" &&
      !endpoint.includes("/auth/") &&
      error instanceof Error
    ) {
      toast({
        title: "Error",
        description: error.message || "Connection failed",
        variant: "destructive",
      });
    }

    throw error;
  }
}
