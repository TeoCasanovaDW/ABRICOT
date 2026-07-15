"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";

interface AuthIllustrationProps {
  className?: string;
}

// Decorative only (empty alt) — picks the register illustration on
// /register, the login one everywhere else in the (auth) group.
export function AuthIllustration({ className }: AuthIllustrationProps) {
  const pathname = usePathname();
  const src = pathname === "/register" ? "/images/sign_in.webp" : "/images/log_in.webp";

  return (
    <div className={className}>
      <Image src={src} alt="" fill sizes="50vw" priority style={{ objectFit: "cover" }} />
    </div>
  );
}
