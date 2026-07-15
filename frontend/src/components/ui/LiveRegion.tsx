"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./LiveRegion.module.css";

interface LiveRegionProps {
  message: string;
}

export function LiveRegion({ message }: LiveRegionProps) {
  const [announced, setAnnounced] = useState(message);
  const lastMessage = useRef(message);

  useEffect(() => {
    if (message !== lastMessage.current) {
      lastMessage.current = message;
      setAnnounced(message);
    }
  }, [message]);

  return (
    <div className={styles.liveRegion} role="status" aria-live="polite" aria-atomic="true">
      {announced}
    </div>
  );
}
