"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { CalendarDays, CheckSquare } from "lucide-react";
import { LiveRegion } from "@/components/ui/LiveRegion";
import styles from "./DashboardTabs.module.css";

export type DashboardTabId = "assigned" | "kanban";

const TABS: { id: DashboardTabId; label: string; icon: typeof CheckSquare }[] = [
  { id: "assigned", label: "Liste", icon: CheckSquare },
  { id: "kanban", label: "Kanban", icon: CalendarDays },
];

interface DashboardTabsProps {
  assignedView: ReactNode;
  kanbanView: ReactNode;
}

export function DashboardTabs({ assignedView, kanbanView }: DashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<DashboardTabId>("assigned");
  const baseId = useId();
  const tabRefs = useRef<Partial<Record<DashboardTabId, HTMLButtonElement | null>>>({});

  const panels: { id: DashboardTabId; content: ReactNode }[] = [
    { id: "assigned", content: assignedView },
    { id: "kanban", content: kanbanView },
  ];

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % TABS.length;
    else if (event.key === "ArrowLeft") nextIndex = (index - 1 + TABS.length) % TABS.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = TABS.length - 1;

    if (nextIndex === null) return;
    event.preventDefault();
    const nextTab = TABS[nextIndex];
    setActiveTab(nextTab.id);
    tabRefs.current[nextTab.id]?.focus();
  };

  const activeLabel = TABS.find((tab) => tab.id === activeTab)?.label ?? "";

  return (
    <div className={styles.wrapper}>
      <div role="tablist" aria-label="Vues du tableau de bord" className={styles.tabList}>
        {TABS.map((tab, index) => {
          const isActive = tab.id === activeTab;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              ref={(node) => {
                tabRefs.current[tab.id] = node;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`${baseId}-panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              className={`${styles.tab} ${isActive ? styles.tabActive : ""}`}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
            >
              <Icon size={16} aria-hidden="true" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <LiveRegion message={`Vue affichée : ${activeLabel}`} />

      {panels.map((panel) => (
        <div
          key={panel.id}
          role="tabpanel"
          id={`${baseId}-panel-${panel.id}`}
          aria-labelledby={`${baseId}-tab-${panel.id}`}
          hidden={panel.id !== activeTab}
          className={styles.panel}
        >
          {panel.content}
        </div>
      ))}
    </div>
  );
}
