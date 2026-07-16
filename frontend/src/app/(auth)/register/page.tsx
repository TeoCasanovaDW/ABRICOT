import type { Metadata } from "next";
import { RegisterForm } from "./RegisterForm";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Inscription",
};

export default function RegisterPage() {
  return (
    <main className={styles.main}>
      <RegisterForm />
    </main>
  );
}
