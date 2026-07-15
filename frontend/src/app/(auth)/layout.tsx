import { redirect } from "next/navigation";
import { getSessionToken } from "@/lib/session";
import { AuthIllustration } from "./AuthIllustration";
import styles from "./layout.module.css";

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const token = await getSessionToken();

  if (token) {
    redirect("/dashboard");
  }

  return (
    <div className={styles.shell}>
      <div className={styles.formColumn}>{children}</div>
      <AuthIllustration className={styles.illustrationColumn} />
    </div>
  );
}
