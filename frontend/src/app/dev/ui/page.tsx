import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "UI Components",
};

export default function DevUiPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return (
    <main className={`container ${styles.page}`}>
      <h1>UI component showcase</h1>

      <section className={styles.section}>
        <h2>Button</h2>
        <div className={styles.row}>
          <Button variant="primary">Primary</Button>
          <Button variant="brand">Brand</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
          <Button variant="primary" loading>
            Loading
          </Button>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Input</h2>
        <div className={styles.column}>
          <label className={styles.field}>
            Default
            <Input placeholder="Default input" />
          </label>
          <label className={styles.field}>
            Focused (autofocus)
            <Input placeholder="Focused input" autoFocus />
          </label>
          <label className={styles.field}>
            Disabled
            <Input placeholder="Disabled input" disabled />
          </label>
          <label className={styles.field}>
            Error
            <Input placeholder="Invalid input" error="This field is required" />
          </label>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Textarea</h2>
        <div className={styles.column}>
          <label className={styles.field}>
            Default
            <Textarea placeholder="Default textarea" rows={3} />
          </label>
          <label className={styles.field}>
            Disabled
            <Textarea placeholder="Disabled textarea" rows={3} disabled />
          </label>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Select</h2>
        <div className={styles.column}>
          <label className={styles.field}>
            Default
            <Select defaultValue="">
              <option value="" disabled>
                Choose an option
              </option>
              <option value="one">Option one</option>
              <option value="two">Option two</option>
              <option value="three">Option three</option>
            </Select>
          </label>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Card</h2>
        <Card>
          <p>Simple card content for visual verification.</p>
        </Card>
      </section>

      <section className={styles.section}>
        <h2>Progress bar</h2>
        <div className={styles.column}>
          <ProgressBar completed={0} total={4} label="Empty" />
          <ProgressBar completed={1} total={4} label="Quarter" />
          <ProgressBar completed={2} total={4} label="Half" />
          <ProgressBar completed={3} total={4} label="Three quarters" />
          <ProgressBar completed={4} total={4} label="Complete" />
        </div>
      </section>

      <section className={styles.section}>
        <h2>Badge</h2>
        <div className={styles.row}>
          <Badge status="TODO" />
          <Badge status="IN_PROGRESS" />
          <Badge status="DONE" />
          <Badge status="CANCELLED" />
        </div>
      </section>

      <section className={styles.section}>
        <h2>Avatar</h2>
        <div className={styles.row}>
          <Avatar name="Jane Doe" />
          <Avatar name="Jane Doe" size={64} />
          <Avatar name="A" />
        </div>
      </section>
    </main>
  );
}
