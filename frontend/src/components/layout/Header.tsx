"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LayoutDashboard, FolderKanban, LogOut, User as UserIcon } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthContext";
import { Avatar } from "@/components/ui/Avatar";
import { Logo } from "@/components/ui/Logo";
import { moveFocusTo, returnFocusTo } from "@/lib/focusManagement";
import styles from "./Header.module.css";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/projects", label: "Projets", icon: FolderKanban },
] as const;

function isActive(pathname: string, href: string): boolean {
  return href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    moveFocusTo(menuRef.current);
    const trigger = menuButtonRef.current;

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      returnFocusTo(trigger);
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await apiClient("/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
    }
  };

  const accountLabel = user.name ?? user.email;

  return (
    <div className={`container ${styles.headerInner}`}>
      <Link href="/dashboard" className={styles.logoLink} aria-label="Abricot, aller au tableau de bord">
        <Logo />
      </Link>

      <nav aria-label="Primary" className={styles.nav}>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={[styles.navLink, active && styles.navLinkActive].filter(Boolean).join(" ")}
            >
              <Icon size={20} aria-hidden="true" />
              <span className={styles.navLabel}>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.account}>
        <button
          ref={menuButtonRef}
          type="button"
          className={styles.accountButton}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label={`Menu du compte de ${accountLabel}`}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <Avatar name={accountLabel} size={36} />
        </button>

        {menuOpen && (
          <div ref={menuRef} role="menu" aria-label="Compte" tabIndex={-1} className={styles.menu}>
            <Link href="/profile" role="menuitem" className={styles.menuItem} onClick={() => setMenuOpen(false)}>
              <UserIcon size={16} aria-hidden="true" />
              Profil
            </Link>
            <button
              type="button"
              role="menuitem"
              className={styles.menuItem}
              disabled={loggingOut}
              aria-busy={loggingOut || undefined}
              onClick={handleLogout}
            >
              <LogOut size={16} aria-hidden="true" />
              {loggingOut ? "Déconnexion..." : "Déconnexion"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
