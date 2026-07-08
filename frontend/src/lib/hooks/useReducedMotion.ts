import { useState, useEffect } from "react";

/**
 * Returns true when the user has opted into reduced motion via
 * prefers-reduced-motion: reduce media query.
 * Updates reactively when the media query changes (e.g., OS setting toggle).
 */
export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");

    function handleChange(e: MediaQueryListEvent) {
      setReducedMotion(e.matches);
    }

    // Use addEventListener for modern browsers
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  return reducedMotion;
}
