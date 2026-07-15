"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { LiveRegion } from "@/components/ui/LiveRegion";
import styles from "./page.module.css";

const MESSAGES = {
  success: "Task created successfully.",
  error: "Something went wrong. Please try again.",
  loading: "Saving changes…",
  info: "No tasks match the current filters.",
};

export function LiveRegionPlayground() {
  const [message, setMessage] = useState("");
  const [rerenderCount, setRerenderCount] = useState(0);

  return (
    <div className={styles.column}>
      <div className={styles.row}>
        <Button variant="secondary" onClick={() => setMessage(MESSAGES.success)}>
          Trigger success
        </Button>
        <Button variant="secondary" onClick={() => setMessage(MESSAGES.error)}>
          Trigger error
        </Button>
        <Button variant="secondary" onClick={() => setMessage(MESSAGES.loading)}>
          Trigger loading
        </Button>
        <Button variant="secondary" onClick={() => setMessage(MESSAGES.info)}>
          Trigger info
        </Button>
        <Button variant="ghost" onClick={() => setRerenderCount((count) => count + 1)}>
          Re-render with same message ({rerenderCount})
        </Button>
      </div>
      <p>Current message: {message || "(none)"}</p>
      <LiveRegion message={message} />
    </div>
  );
}
