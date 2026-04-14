import { apiClient } from "../shared/http/client";
import { unwrapSuccess } from "../shared/utils/apiResponse";
import type { Task, TaskPriority, TaskStatus } from "../types";

export type ListTasksFilters = {
  status?: TaskStatus;
  assignee?: string;
};

export async function listTasks(
  projectId: string,
  filters: ListTasksFilters = {},
): Promise<Task[]> {
  const res = await apiClient.get(`/projects/${projectId}/tasks`, {
    params: {
      status: filters.status,
      assignee: filters.assignee,
    },
  });
  return unwrapSuccess<Task[]>(res.data);
}

export type CreateTaskPayload = {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string | null;
  dueDate?: string | null; // YYYY-MM-DD
};

export async function createTask(
  projectId: string,
  payload: CreateTaskPayload,
): Promise<Task> {
  const res = await apiClient.post(`/projects/${projectId}/tasks`, payload);
  return unwrapSuccess<Task>(res.data);
}

export type UpdateTaskPayload = Partial<CreateTaskPayload>;

export async function updateTask(
  taskId: string,
  payload: UpdateTaskPayload,
): Promise<Task> {
  const res = await apiClient.patch(`/tasks/${taskId}`, payload);
  return unwrapSuccess<Task>(res.data);
}

export async function deleteTask(taskId: string): Promise<void> {
  await apiClient.delete(`/tasks/${taskId}`);
}

