import { redirect } from "next/navigation";
import { getSessionToken } from "@/lib/session";
import { apiServer } from "@/lib/api/server";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { Header } from "@/components/layout/Header";
import { Logo } from "@/components/ui/Logo";
import type { User } from "@/types";
import styles from "./layout.module.css";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const token = await getSessionToken();

  if (!token) {
    redirect("/login");
  }

  let user: User;
  try {
    ({ user } = await apiServer<{ user: User }>("/auth/profile"));
  } catch {
    // Expired/invalid token past proxy.ts's presence-only check: treat as
    // unauthenticated. Cookie clearing happens via the logout Route Handler
    // (specs/05), not here — a Server Component can't mutate cookies.
    redirect("/login");
  }

  return (
    <AuthProvider user={user}>
      <a href="#main-content" className={styles.skipLink}>
        Aller au contenu principal
      </a>
      <header className={styles.header}>
        <Header />
      </header>
      <main id="main-content" className={`container ${styles.main}`}>
        {children}
      </main>
      <footer className={styles.footer}>
        <div className={`container ${styles.footerInner}`}>
          <Logo variant="black" height={20} />
          <span>© {new Date().getFullYear()} Abricot</span>
        </div>
      </footer>
    </AuthProvider>
  );
}
