"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * Protects a page by redirecting to "/" if there is no authenticated session.
 * Waits for Zustand to rehydrate from localStorage before deciding to redirect,
 * which prevents the false-redirect that happens on a hard page refresh.
 *
 * @param allowGuest - If true, guest users are also allowed. Default: true.
 */
export function useRequireAuth(allowGuest = true) {
  const router = useRouter();
  const { user, isGuest, isLoading, _hasHydrated, checkSession } =
    useAuthStore();

  // Kick off session verification on mount
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Only redirect AFTER hydration is complete AND session check is done
  useEffect(() => {
    if (!_hasHydrated || isLoading) return;

    const isAuthenticated = !!user || (allowGuest && isGuest);
    if (!isAuthenticated) {
      router.push("/");
    }
  }, [_hasHydrated, isLoading, user, isGuest, allowGuest, router]);

  return { user, isGuest, isLoading: !_hasHydrated || isLoading };
}
