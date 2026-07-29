"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { moveFocusTo } from "@/lib/focusManagement";

// Max time to wait for the destination route's h1 to land before giving up.
const HEADING_WAIT_MS = 4000;

// Skips the initial mount so the browser's own load-time focus isn't
// hijacked — only subsequent client-side navigations move focus.
export function RouteChangeFocus() {
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const main = document.getElementById("main-content");
    if (!main) return;

    const existingHeading = main.querySelector<HTMLElement>("h1");
    if (existingHeading) {
      moveFocusTo(existingHeading);
      return;
    }

    // `usePathname` updates as soon as navigation starts, which is while
    // the route's `loading.tsx` fallback (no h1) is still in `main` — the
    // real heading lands later, once the server data resolves. Wait for it
    // instead of focusing the loading skeleton's container: that container
    // is the whole landmark, so focusing it draws a giant outline around
    // the entire page instead of a normal heading-sized one.
    const observer = new MutationObserver(() => {
      const heading = main.querySelector<HTMLElement>("h1");
      if (heading) {
        observer.disconnect();
        clearTimeout(timeoutId);
        moveFocusTo(heading);
      }
    });
    observer.observe(main, { childList: true, subtree: true });

    const timeoutId = setTimeout(() => observer.disconnect(), HEADING_WAIT_MS);

    return () => {
      observer.disconnect();
      clearTimeout(timeoutId);
    };
  }, [pathname]);

  return null;
}
