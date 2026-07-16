"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/Input";
import { apiClient } from "@/lib/api/client";
import type { UserSummary } from "@/types";
import styles from "./ContributorPicker.module.css";

const SEARCH_MIN_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 300;

function contributorLabel(user: UserSummary): string {
  return user.name ?? user.email;
}

interface ContributorPickerProps {
  id: string;
  label: string;
  selected: UserSummary[];
  onAdd: (user: UserSummary) => void;
  onRemove: (user: UserSummary) => void;
  disabled?: boolean;
  excludeIds?: string[];
}

// Search-driven multi-select against GET /users/search, shared by any form
// that picks project contributors — never accepts a typed email as a value.
export function ContributorPicker({
  id,
  label,
  selected,
  onAdd,
  onRemove,
  disabled,
  excludeIds,
}: ContributorPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSummary[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listboxId = useId();

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  const hiddenIds = new Set([...selected.map((user) => user.id), ...(excludeIds ?? [])]);
  const visibleResults = results.filter((user) => !hiddenIds.has(user.id));

  const handleSearchChange = (value: string) => {
    setQuery(value);
    setActiveIndex(-1);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    const trimmed = value.trim();
    if (trimmed.length < SEARCH_MIN_LENGTH) {
      setResults([]);
      setSearchOpen(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const { users } = await apiClient<{ users: UserSummary[] }>(
          `/users/search?query=${encodeURIComponent(trimmed)}`
        );
        setResults(users);
        setSearchOpen(true);
      } catch {
        setResults([]);
        setSearchOpen(false);
      }
    }, SEARCH_DEBOUNCE_MS);
  };

  const selectContributor = (user: UserSummary) => {
    onAdd(user);
    setQuery("");
    setResults([]);
    setSearchOpen(false);
    setActiveIndex(-1);
    searchInputRef.current?.focus();
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!searchOpen || visibleResults.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % visibleResults.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? visibleResults.length - 1 : index - 1));
    } else if (event.key === "Enter") {
      if (activeIndex >= 0) {
        event.preventDefault();
        selectContributor(visibleResults[activeIndex]!);
      }
    } else if (event.key === "Escape") {
      setSearchOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div className={styles.field}>
      {label}
      <div className={styles.comboboxWrapper}>
        <Input
          ref={searchInputRef}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={searchOpen}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
          autoComplete="off"
          placeholder="Rechercher par nom ou e-mail (2 caractères min.)…"
          disabled={disabled}
          value={query}
          onChange={(event) => handleSearchChange(event.target.value)}
          onKeyDown={handleSearchKeyDown}
        />
        {searchOpen && visibleResults.length > 0 && (
          <ul id={listboxId} role="listbox" aria-label="Résultats de recherche" className={styles.listbox}>
            {visibleResults.map((user, index) => (
              <li
                key={user.id}
                id={`${listboxId}-option-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                className={[styles.option, index === activeIndex && styles.optionActive]
                  .filter(Boolean)
                  .join(" ")}
                onMouseDown={(event) => {
                  event.preventDefault();
                  selectContributor(user);
                }}
              >
                <Avatar name={contributorLabel(user)} size={24} />
                <span>{contributorLabel(user)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selected.length > 0 && (
        <ul className={styles.chipList}>
          {selected.map((user) => (
            <li key={user.id} className={styles.chip}>
              <Avatar name={contributorLabel(user)} size={20} />
              <span>{contributorLabel(user)}</span>
              <button
                type="button"
                className={styles.chipRemove}
                aria-label={`Retirer ${contributorLabel(user)}`}
                disabled={disabled}
                onClick={() => onRemove(user)}
              >
                &times;
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
