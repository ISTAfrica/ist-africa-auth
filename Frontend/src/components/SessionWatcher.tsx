"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { validateSession } from "@/services/authService";
import { handleGlobalLogout } from "@/lib/api-client";

export default function SessionWatcher() {
  const pathname = usePathname();

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "accessToken" && !event.newValue) {
        handleGlobalLogout();
      }
    };

    const handleCheck = () => {
      const publicPaths = ["/auth/login", "/register", "/forgot-password"];
      if (!publicPaths.includes(pathname)) {
        validateSession().catch(() => {});
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") handleCheck();
    });
    window.addEventListener("focus", handleCheck);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("visibilitychange", handleCheck);
      window.removeEventListener("focus", handleCheck);
    };
  }, [pathname]);

  return null;
}