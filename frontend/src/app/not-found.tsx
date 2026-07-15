import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page introuvable",
};

export default function NotFound() {
  return (
    <main className="container">
      <h1>Page introuvable</h1>
    </main>
  );
}
