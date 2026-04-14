import AddIcon from "@mui/icons-material/Add";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { EmptyState } from "../../shared/ui/EmptyState";
import {
  CreateProjectModal,
  type CreateProjectValues,
} from "../../modules/projects/components/CreateProjectModal";
import type { Project } from "../../types/projects";

function createMockProjects(): Project[] {
  return [
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
}

export function ProjectsListPage() {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>(() => createMockProjects());

  const hasProjects = projects.length > 0;

  const sorted = useMemo(() => {
    return [...projects].sort((a, b) => a.name.localeCompare(b.name));
  }, [projects]);

  async function onCreate(values: CreateProjectValues) {
    const next: Project = {
      id: crypto.randomUUID(),
      name: values.name,
      description: values.description ? values.description : null,
    };
    setProjects((prev) => [next, ...prev]);
  }

  return (
    <Box sx={{ display: "grid", gap: 2.5 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        gap={1.5}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Projects
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create a project, then add tasks to keep work moving.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setModalOpen(true)}
        >
          Create project
        </Button>
      </Stack>

      {!hasProjects ? (
        <EmptyState
          title="No projects yet"
          description="Create your first project to start tracking tasks."
          actionLabel="Create project"
          onAction={() => setModalOpen(true)}
        />
      ) : (
        <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 } }}>
          <Grid container spacing={2}>
            {sorted.map((p) => (
              <Grid key={p.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card
                  variant="outlined"
                  sx={{
                    height: "100%",
                    transition: "transform 120ms ease, box-shadow 120ms ease",
                    "&:hover": { transform: "translateY(-1px)" },
                  }}
                >
                  <CardActionArea
                    onClick={() => navigate(`/projects/${p.id}`)}
                    sx={{ height: "100%" }}
                  >
                    <CardContent>
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        {p.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.75 }}
                      >
                        {p.description ?? "No description"}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      <CreateProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={onCreate}
      />
    </Box>
  );
}

