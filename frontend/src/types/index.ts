// Hand-written client types mirroring specs/01 API contract response shapes,
// verified against backend/prisma/schema.prisma and the controllers that build
// each response (Prisma `include` always returns base scalars, so relation
// selection alone does not make a scalar field optional — only entirely
// omitted relations, or per-endpoint `select`/manual-mapping differences, do).
// Not generated from backend Swagger output, which drifts from actual behavior.

export type Role = "ADMIN" | "CONTRIBUTOR";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED";
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

// Reduced user shape embedded everywhere a user is a *reference*, not the
// authenticated subject: Project.owner, ProjectMember.user, Task.creator,
// TaskAssignee.user, Comment.author, GET /users/search results. Every one of
// these call sites uses `select: { id, email, name }` — always exactly these
// three fields, never createdAt/updatedAt.
export interface UserSummary {
  id: string;
  email: string;
  name: string | null;
}

// The authenticated user's own record, returned only by /auth/* endpoints.
// id/email/name are always present (name nullable); createdAt/updatedAt vary
// per endpoint (specs/01 "Authentication and profile").
export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt?: string; // absent only on GET /auth/profile
  updatedAt?: string; // present only on PUT /auth/profile
}

export interface ProjectMember {
  id: string;
  role: Role;
  joinedAt: string;
  user: UserSummary;
}

export interface TaskAssignee {
  id: string; // join-row id, not the user id — use user.id for identity
  assignedAt: string;
  user: UserSummary;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  // Present when fetched via the comment endpoints or dashboard task lists
  // (plain Prisma `include`); stripped by the backend's getTaskComments()
  // helper used to build a task's embedded `comments` array.
  taskId?: string;
  authorId?: string;
  author: UserSummary;
}

// Task shape embedded only in ProjectDetail.tasks (GET /projects/:id).
// That endpoint includes `creator` but never `assignees`/`comments`
// (specs/01: "GET /projects/:id's embedded tasks lack assignees/comments").
export interface TaskSummary {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  projectId: string;
  creatorId: string;
  creator: UserSummary;
}

// Full task shape returned by the task CRUD endpoints and both dashboard
// task-bearing endpoints. assignees/comments are always populated (possibly
// empty arrays) in every one of those; creator is only omitted by the
// dashboard endpoints, which don't select it.
export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  projectId: string;
  creatorId: string;
  creator?: UserSummary; // absent on GET /dashboard/assigned-tasks and GET /dashboard/projects-with-tasks
  assignees: TaskAssignee[];
  comments: Comment[];
}

// Base project shape: exactly what POST /projects and PUT /projects/:id
// return. owner/members are always included by every project-returning
// endpoint (Prisma `include`, never a bare `select`), so neither is optional.
export interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  owner: UserSummary;
  members: ProjectMember[];
}

// GET /projects list items: adds userRole + taskStats, never tasks.
export interface ProjectListItem extends Project {
  userRole: Role;
  taskStats: {
    total: number;
    completed: number;
  };
}

// GET /projects/:id: adds userRole + tasks, never taskStats.
export interface ProjectDetail extends Project {
  userRole: Role;
  tasks: TaskSummary[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface ApiError {
  status: number;
  code?: string;
  message: string;
  fieldErrors?: { field: string; message: string }[];
}
