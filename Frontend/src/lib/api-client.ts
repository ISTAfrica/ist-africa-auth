import { toast } from "@/hooks/use-toast";

export const handleGlobalLogout = (message?: string) => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");

    const searchParams = message
      ? `?message=${encodeURIComponent(message)}`
      : "";
    window.location.href = `/auth/login${searchParams}`;
  }
};

export async function apiClient<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("accessToken")
      : null;

  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}${endpoint}`,
      {
        ...options,
        headers,
        credentials: "include",
      }
    );

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

      if (
        response.status === 401 ||
        errorMsg.toLowerCase().includes("token version mismatch") ||
        errorMsg.toLowerCase().includes("unauthorized")
      ) {
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
