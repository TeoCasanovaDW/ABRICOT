import Image from "next/image";
import styles from "./Logo.module.css";

const SOURCES = {
  orange: "/logos/logo_orange.svg",
  black: "/logos/logo_black.svg",
  white: "/logos/logo_white.svg",
} as const;

// Matches the source SVGs' intrinsic viewBox (253x33) so height-based sizing never distorts the wordmark.
const ASPECT_RATIO = 253 / 33;

interface LogoProps {
  variant?: keyof typeof SOURCES;
  height?: number;
  className?: string;
}

export function Logo({ variant = "orange", height = 32, className }: LogoProps) {
  return (
    <Image
      src={SOURCES[variant]}
      alt="Abricot"
      height={height}
      width={Math.round(height * ASPECT_RATIO)}
      className={[styles.logo, className].filter(Boolean).join(" ")}
      priority
    />
  );
}
