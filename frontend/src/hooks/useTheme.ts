"use client";

import { useCallback, useEffect, useState } from "react";

const KEY = "youthlink.theme";

export function useTheme() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    setMounted(true);
  }, []);

  const toggle = useCallback(() => {
    setDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      document.documentElement.dataset.theme = next ? "dark" : "light";
      try {
        localStorage.setItem(KEY, next ? "dark" : "light");
      } catch {
        /* 저장이 막혀도 이번 세션에는 적용된다. */
      }
      return next;
    });
  }, []);

  return { dark, toggle, mounted };
}
