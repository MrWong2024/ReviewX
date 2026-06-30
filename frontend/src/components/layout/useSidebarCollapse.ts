'use client';

import { useCallback, useEffect, useState } from 'react';

const SIDEBAR_COLLAPSED_STORAGE_KEY = 'reviewx_sidebar_collapsed';

function persistSidebarCollapsed(collapsed: boolean) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(
      SIDEBAR_COLLAPSED_STORAGE_KEY,
      String(collapsed),
    );
  } catch {
    // localStorage is a non-critical UI preference.
  }
}

export function useSidebarCollapse() {
  const [collapsed, setCollapsedState] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      setCollapsedState(
        window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === 'true',
      );
    } catch {
      setCollapsedState(false);
    }
  }, []);

  const setCollapsed = useCallback((next: boolean) => {
    setCollapsedState(next);
    persistSidebarCollapsed(next);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsedState((current) => {
      const next = !current;
      persistSidebarCollapsed(next);
      return next;
    });
  }, []);

  return { collapsed, setCollapsed, toggleCollapsed };
}
