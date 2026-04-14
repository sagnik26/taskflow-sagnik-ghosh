import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  Box,
  Button,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";

import { useAuth } from "../../modules/auth/context/useAuth.ts";
import { EmptyState } from "../../shared/ui/EmptyState";
import {
  TaskFilters,
  type TaskAssigneeFilter,
} from "../../modules/tasks/components/TaskFilters.tsx";
import { TaskList } from "../../modules/tasks/components/TaskList.tsx";
import { TaskModal } from "../../modules/tasks/components/TaskModal.tsx";
import type { Project } from "../../types/projects";
import type { Task, TaskStatus } from "../../types/tasks";

function mockProjectById(id: string): Project | null {
  const projects: Project[] = [
    {
      id: "p1",
      name: "Website Redesign",
      description: "Q2 website redesign project",
    },
    {
      id: "p2",
      name: "Hiring Pipeline",
      description: "Streamline screening + take-home evaluation process",
    },
  ];
  return projects.find((p) => p.id === id) ?? null;
}

function mockTasks(projectId: string, currentUserId: string): Task[] {
  if (projectId === "p1") {
    return [
      {
        id: "t1",
        title: "Design homepage",
        description: "Create initial Figma frames for hero + navigation.",
        status: "todo",
        priority: "high",
        assigneeId: currentUserId,
        dueDate: "2026-04-25",
      },
      {
        id: "t1b",
        title: "Audit existing UI components",
        description:
          "List reusable components and missing states (loading/empty/error).",
        status: "todo",
        priority: "medium",
        assigneeId: null,
        dueDate: "2026-04-22",
      },
      {
        id: "t1c",
        title: "Create design tokens",
        description:
          "Define spacing, typography, and color usage for consistency.",
        status: "todo",
        priority: "low",
        assigneeId: currentUserId,
        dueDate: null,
      },
      {
        id: "t1d",
        title: "Write content outline",
        description: null,
        status: "todo",
        priority: "medium",
        assigneeId: null,
        dueDate: null,
      },
      {
        id: "t2",
        title: "Implement auth flow",
        description: "Login + register pages with validations.",
        status: "in_progress",
        priority: "medium",
        assigneeId: currentUserId,
        dueDate: null,
      },
      {
        id: "t2b",
        title: "Hook up task modal",
        description: "Support create/edit with client-side zod validation.",
        status: "in_progress",
        priority: "high",
        assigneeId: currentUserId,
        dueDate: "2026-04-20",
      },
      {
        id: "t2c",
        title: "Add optimistic status updates",
        description: "Update UI immediately, revert on API error.",
        status: "in_progress",
        priority: "medium",
        assigneeId: null,
        dueDate: null,
      },
      {
        id: "t3",
        title: "Write API docs",
        description: null,
        status: "done",
        priority: "low",
        assigneeId: null,
        dueDate: null,
      },
      {
        id: "t3b",
        title: "Set up project skeleton",
        description: "Vite + MUI + router wired with basic layout.",
        status: "done",
        priority: "medium",
        assigneeId: currentUserId,
        dueDate: null,
      },
      {
        id: "t3c",
        title: "Create project detail page",
        description: "Project header + tasks section + filters.",
        status: "done",
        priority: "high",
        assigneeId: currentUserId,
        dueDate: null,
      },
    ];
  }

  return [
    {
      id: "t4",
      title: "Define rubric checklist",
      description: "Make sure UI has loading/error/empty states everywhere.",
      status: "todo",
      priority: "medium",
      assigneeId: null,
      dueDate: null,
    },
    {
      id: "t5",
      title: "Polish navbar layout",
      description: "Ensure responsive spacing and clear logout affordance.",
      status: "todo",
      priority: "low",
      assigneeId: currentUserId,
      dueDate: null,
    },
    {
      id: "t6",
      title: "Refactor task card UI",
      description: "Improve spacing and alignment for status/priority chips.",
      status: "in_progress",
      priority: "medium",
      assigneeId: currentUserId,
      dueDate: null,
    },
    {
      id: "t7",
      title: "Add empty state components",
      description: null,
      status: "done",
      priority: "low",
      assigneeId: null,
      dueDate: null,
    },
  ];
}

export function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id ?? "";
  const project = mockProjectById(projectId);

  const { user } = useAuth();
  const currentUserId = user?.id ?? "me";

  const [filters, setFilters] = useState<{
    status: TaskStatus | "all";
    assignee: TaskAssigneeFilter;
  }>({ status: "all", assignee: "all" });

  const [tasks, setTasks] = useState<Task[]>(() =>
    mockTasks(projectId, currentUserId),
  );

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskModalMode, setTaskModalMode] = useState<"create" | "edit">("create");
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (filters.status !== "all" && t.status !== filters.status) return false;
      if (filters.assignee === "me" && t.assigneeId !== currentUserId)
        return false;
      if (filters.assignee === "unassigned" && t.assigneeId !== null)
        return false;
      return true;
    });
  }, [currentUserId, filters.assignee, filters.status, tasks]);

  if (!project) {
    return (
      <EmptyState
        title="Project not found"
        description="This project doesn’t exist in the Phase A mock data."
        actionLabel="Back to projects"
        actionHref="/projects"
      />
    );
  }

  async function handleSaveTask(next: Omit<Task, "id">, existingId?: string) {
    if (existingId) {
      setTasks((prev) =>
        prev.map((t) => (t.id === existingId ? { ...t, ...next } : t)),
      );
      return;
    }
    const created: Task = { id: crypto.randomUUID(), ...next };
    setTasks((prev) => [created, ...prev]);
  }

  return (
    <Box sx={{ display: "grid", gap: 2.5 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Button
          component={RouterLink}
          to="/projects"
          startIcon={<ArrowBackIcon />}
          variant="text"
        >
          Projects
        </Button>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setTaskModalMode("create");
            setEditingTask(null);
            setTaskModalOpen(true);
          }}
        >
          Create task
        </Button>
      </Stack>

      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h5" sx={{ fontWeight: 850 }}>
          {project.name}
        </Typography>
        {project.description ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
            {project.description}
          </Typography>
        ) : null}
      </Paper>

      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack spacing={2}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Tasks
          </Typography>
          <TaskFilters
            status={filters.status}
            assignee={filters.assignee}
            onChange={(next) => setFilters(next)}
          />

          <Divider />

          {filtered.length === 0 ? (
            <EmptyState
              title="No tasks match your filters"
              description="Try changing status or assignee filters, or create a new task."
              actionLabel="Create task"
              onAction={() => {
                setTaskModalMode("create");
                setEditingTask(null);
                setTaskModalOpen(true);
              }}
            />
          ) : (
            <TaskList
              tasks={filtered}
              currentUserId={currentUserId}
              onEdit={(task) => {
                setTaskModalMode("edit");
                setEditingTask(task);
                setTaskModalOpen(true);
              }}
              onChangeStatus={(taskId, status) => {
                // Phase A local optimistic change
                setTasks((prev) =>
                  prev.map((t) => (t.id === taskId ? { ...t, status } : t)),
                );
              }}
            />
          )}
        </Stack>
      </Paper>

      <TaskModal
        open={taskModalOpen}
        mode={taskModalMode}
        task={editingTask}
        currentUserId={currentUserId}
        onClose={() => setTaskModalOpen(false)}
        onSave={handleSaveTask}
      />
    </Box>
  );
}

