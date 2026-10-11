"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";

import styles from "./switcher.module.css";

export function ThemeToggle({ label }: { label: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const transitionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  useEffect(() => {
    return () => {
      if (transitionTimeout.current !== null) {
        clearTimeout(transitionTimeout.current);
        document.documentElement.removeAttribute("data-theme-transition");
      }
    };
  }, []);

  function toggleTheme() {
    if (transitionTimeout.current !== null) {
      clearTimeout(transitionTimeout.current);
    }

    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.documentElement.setAttribute("data-theme-transition", "");
      transitionTimeout.current = setTimeout(() => {
        document.documentElement.removeAttribute("data-theme-transition");
        transitionTimeout.current = null;
      }, 300);
    } else {
      document.documentElement.removeAttribute("data-theme-transition");
      transitionTimeout.current = null;
    }

    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      disabled={!mounted}
      onClick={toggleTheme}
    >
      <span
        aria-hidden="true"
        className={styles.themeIcon}
        data-dark={mounted && resolvedTheme === "dark"}
      >
        <Sun className={`${styles.sun} size-4`} />
        <Moon className={`${styles.moon} size-4`} />
      </span>
    </Button>
  );
}
