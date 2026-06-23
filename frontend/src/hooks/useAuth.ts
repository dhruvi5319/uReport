'use client';

/**
 * useAuth — client-side hook that reads session state from a cookie-based
 * auth context. In this implementation we call GET /api/auth/me on mount
 * and cache the result in module-level state to avoid repeated fetches.
 *
 * Returns { user, role, isLoading } where user is null if not authenticated.
 */

import { useEffect, useState } from 'react';
import type { CurrentUser } from '@/types/api';

interface AuthState {
  user: CurrentUser | null;
  isLoading: boolean;
}

let cachedUser: CurrentUser | null | undefined = undefined; // undefined = not fetched yet

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: cachedUser !== undefined ? cachedUser : null,
    isLoading: cachedUser === undefined,
  });

  useEffect(() => {
    if (cachedUser !== undefined) {
      setState({ user: cachedUser, isLoading: false });
      return;
    }

    const controller = new AbortController();
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '';

    fetch(`${apiBase}/api/auth/me`, {
      credentials: 'include',
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) return null;
        return res.json() as Promise<{ data: CurrentUser }>;
      })
      .then((json) => {
        cachedUser = json?.data ?? null;
        setState({ user: cachedUser, isLoading: false });
      })
      .catch((err: Error) => {
        if (err.name === 'AbortError') return;
        cachedUser = null;
        setState({ user: null, isLoading: false });
      });

    return () => controller.abort();
  }, []);

  return state;
}
