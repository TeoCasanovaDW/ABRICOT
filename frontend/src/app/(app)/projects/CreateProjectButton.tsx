"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LiveRegion } from "@/components/ui/LiveRegion";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { apiClient } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";
import {
  applyFieldErrors,
  createProjectSchema,
  zodResolver,
  type CreateProjectFormValues,
} from "@/lib/validation";
import type { Project, UserSummary } from "@/types";
import styles from "./CreateProjectButton.module.css";

interface CreateProjectButtonProps {
  label: string;
}

const SEARCH_MIN_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 300;

function contributorLabel(user: UserSummary): string {
  return user.name ?? user.email;
}

export function CreateProjectButton({ label }: CreateProjectButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSummary[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [selected, setSelected] = useState<UserSummary[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listboxId = useId();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateProjectFormValues>({ resolver: zodResolver(createProjectSchema) });

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  const selectedIds = new Set(selected.map((user) => user.id));
  const visibleResults = results.filter((user) => !selectedIds.has(user.id));

  const openModal = () => setOpen(true);

  const closeModal = () => {
    setOpen(false);
    setGeneralError("");
    setAnnouncement("");
    setQuery("");
    setResults([]);
    setSearchOpen(false);
    setActiveIndex(-1);
    setSelected([]);
    reset();
  };

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
    setSelected((current) => [...current, user]);
    setQuery("");
    setResults([]);
    setSearchOpen(false);
    setActiveIndex(-1);
    setAnnouncement(`${contributorLabel(user)} ajouté aux contributeurs.`);
    searchInputRef.current?.focus();
  };

  const removeContributor = (user: UserSummary) => {
    setSelected((current) => current.filter((existing) => existing.id !== user.id));
    setAnnouncement(`${contributorLabel(user)} retiré des contributeurs.`);
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

  const onSubmit = handleSubmit(async (values) => {
    setGeneralError("");

    const payload: { name: string; description?: string; contributors?: string[] } = {
      name: values.name,
    };
    if (values.description) payload.description = values.description;
    if (selected.length > 0) payload.contributors = selected.map((user) => user.email);

    try {
      const { project } = await apiClient<{ project: Project }>("/projects", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      router.push(`/projects/${project.id}`);
    } catch (error) {
      if (!isApiError(error)) throw error;

      if (error.status === 400 && error.fieldErrors) {
        applyFieldErrors(error.fieldErrors, setError);
        return;
      }

      setGeneralError(error.message);
      setAnnouncement(error.message);
    }
  });

  return (
    <>
      <Button type="button" onClick={openModal}>
        {label}
      </Button>

      <Modal open={open} onClose={closeModal} title="Créer un projet">
        {generalError && <p className={styles.generalError}>{generalError}</p>}

        <form className={styles.form} onSubmit={onSubmit} noValidate>
          <label className={styles.field}>
            Titre *
            <Input
              id="project-name"
              disabled={isSubmitting}
              error={errors.name?.message}
              {...register("name")}
            />
          </label>

          <label className={styles.field}>
            Description *
            <Textarea
              id="project-description"
              disabled={isSubmitting}
              error={errors.description?.message}
              {...register("description")}
            />
          </label>

          <div className={styles.field}>
            Contributeurs
            <div className={styles.comboboxWrapper}>
              <Input
                ref={searchInputRef}
                id="project-contributors"
                type="text"
                role="combobox"
                aria-expanded={searchOpen}
                aria-controls={listboxId}
                aria-autocomplete="list"
                aria-activedescendant={
                  activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
                }
                autoComplete="off"
                placeholder="Rechercher par nom ou e-mail (2 caractères min.)…"
                disabled={isSubmitting}
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
                      onClick={() => removeContributor(user)}
                    >
                      &times;
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={styles.actions}>
            <Button type="submit" variant="primary" loading={isSubmitting} disabled={isSubmitting}>
              Ajouter un projet
            </Button>
            <Button type="button" variant="secondary" disabled={isSubmitting} onClick={closeModal}>
              Annuler
            </Button>
          </div>
        </form>
      </Modal>

      <LiveRegion message={announcement} />
    </>
  );
}
