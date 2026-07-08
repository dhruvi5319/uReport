import { createContext, useContext } from "react";
import { MotionConfig } from "framer-motion";
import { useReducedMotion } from "../lib/hooks/useReducedMotion";

interface AnimationConfig {
  reducedMotion: boolean;
  /**
   * Returns 0 when reduced motion is active, otherwise returns the base duration.
   * Usage: transition={{ duration: animConfig.duration(0.2) }}
   */
  duration: (base: number) => number;
}

const AnimationContext = createContext<AnimationConfig>({
  reducedMotion: false,
  duration: (base) => base,
});

export function AnimationProvider({ children }: { children: React.ReactNode }) {
  const reducedMotion = useReducedMotion();

  const config: AnimationConfig = {
    reducedMotion,
    duration: (base: number) => (reducedMotion ? 0 : base),
  };

  return (
    <AnimationContext.Provider value={config}>
      {/*
        MotionConfig from Framer Motion:
        - reducedMotion="user" honors prefers-reduced-motion at the Framer Motion level
        - This is the primary mechanism; AnimationContext provides React-accessible config
      */}
      <MotionConfig reducedMotion="user">
        {children}
      </MotionConfig>
    </AnimationContext.Provider>
  );
}

export function useAnimationConfig(): AnimationConfig {
  return useContext(AnimationContext);
}
