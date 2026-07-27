import { z } from "zod";

// Pure, framework-free task field schemas shared by the manual task form
// (lib/validation.ts's taskSchema) and AI draft validation
// (lib/ai/validateDrafts.ts), so both enforce identical rules without the
// server-only AI path importing anything react-hook-form-adjacent.

export const taskTitleSchema = z
  .string()
  .trim()
  .min(2, "Le titre doit contenir au moins 2 caractères.")
  .max(200, "Le titre ne peut pas dépasser 200 caractères.");

export const taskDescriptionSchema = z
  .string()
  .trim()
  .min(1, "La description est requise.")
  .max(1000, "La description ne peut pas dépasser 1000 caractères.");

export const taskDueDateSchema = z
  .string()
  .trim()
  .min(1, "La date d'échéance est requise.")
  .refine((value) => !Number.isNaN(Date.parse(value)), "Date d'échéance invalide.");

export const taskStatusSchema = z.enum(["TODO", "IN_PROGRESS", "DONE"]);

export const taskPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);
