'use client';

import type { IProject, IProjectCreatePayload } from 'src/types/project';
import type { IUserItem } from 'src/types/user';

import { z as zod } from 'zod';
import { useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import useSWR from 'swr';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import LoadingButton from '@mui/lab/LoadingButton';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';

import { endpoints, fetcher } from 'src/utils/axios';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

import { createProject, updateProject } from 'src/api/project';

// ----------------------------------------------------------------------

export type ProjectSchemaType = zod.infer<typeof ProjectSchema>;

export const ProjectSchema = zod.object({
  name: zod.string().min(1, { message: 'Name is required!' }),
  code: zod.string().min(1, { message: 'Code is required!' }),
  description: zod.string().optional(),
  projectType: zod.enum(['internal', 'client', 'hr', 'research', 'other']),
  status: zod.enum(['planned', 'active', 'halted', 'completed']),
  projectManagerId: zod.string().min(1, { message: 'Project Manager is required!' }),
  budget: zod.number().optional(),
  repoUrl: zod.string().url().optional().or(zod.literal('')),
  gitIntegrationEnabled: zod.boolean(),
  startDate: zod.string().optional(),
  endDate: zod.string().optional(),
});

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  project?: IProject | null;
  companyId?: number;
};

export function ProjectDialog({ open, onClose, project, companyId }: Props) {
  const { data: users } = useSWR<IUserItem[]>(endpoints.userManagement.list, fetcher);

  const defaultValues = useMemo(
    () => ({
      name: project?.name || '',
      code: project?.code || '',
      description: project?.description || '',
      projectType: project?.projectType || 'internal',
      status: project?.status || 'planned',
      projectManagerId: project?.projectManagerId?.toString() || '',
      budget: project?.budget || 0,
      repoUrl: project?.repoUrl || '',
      gitIntegrationEnabled: project?.gitIntegrationEnabled || false,
      startDate: project?.startDate
        ? new Date(project.startDate).toISOString().split('T')[0]
        : '',
      endDate: project?.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
    }),
    [project]
  );

  const methods = useForm<ProjectSchemaType>({
    mode: 'onSubmit',
    resolver: zodResolver(ProjectSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = methods;

  const gitEnabled = watch('gitIntegrationEnabled');

  const onSubmit = handleSubmit(async (data) => {
    try {
      const payload: IProjectCreatePayload = {
      
        name: data.name,
        code: data.code,
        description: data.description,
        projectType: data.projectType as any,
        status: data.status as any,
        projectManagerId: parseInt(data.projectManagerId, 10),
        budget: data.budget,
        repoUrl: data.repoUrl || undefined,
        gitIntegrationEnabled: data.gitIntegrationEnabled,
        startDate: data.startDate || undefined,
        endDate: data.endDate || undefined,
      };

      if (project) {
        await updateProject(project.id, payload);
        toast.success('Project updated successfully!');
      } else {
        await createProject(payload);
        toast.success('Project created successfully!');
      }

      reset();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(project ? 'Update failed!' : 'Create failed!');
    }
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>{project ? 'Edit Project' : 'Create New Project'}</DialogTitle>

      <Form methods={methods} onSubmit={onSubmit}>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <Field.Text name="name" label="Project Name" placeholder="Enter project name" />
              </Grid>
              <Grid item xs={12} md={4}>
                <Field.Text
                  name="code"
                  label="Project Code"
                  placeholder="e.g., PRJ-001"
                  disabled={!!project}
                  helperText={project ? 'Code cannot be changed' : ''}
                />
              </Grid>
            </Grid>

            <Field.Text
              name="description"
              label="Description"
              placeholder="Brief description of the project"
              multiline
              rows={3}
            />

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Field.Select name="projectType" label="Project Type">
                  <MenuItem value="internal">Internal</MenuItem>
                  <MenuItem value="client">Client</MenuItem>
                  <MenuItem value="hr">HR</MenuItem>
                  <MenuItem value="research">Research</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Field.Select>
              </Grid>
              <Grid item xs={12} md={6}>
                <Field.Select name="status" label="Status">
                  <MenuItem value="planned">Planned</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="halted">Halted</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                </Field.Select>
              </Grid>
            </Grid>

            <Field.Select name="projectManagerId" label="Project Manager">
              {users?.map((user) => (
                <MenuItem key={user.id} value={user.id.toString()}>
                  {user.name} ({user.email})
                </MenuItem>
              ))}
            </Field.Select>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Field.Text
                  name="startDate"
                  label="Start Date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Field.Text
                  name="endDate"
                  label="End Date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            <Field.Text
              name="budget"
              label="Budget"
              type="number"
              placeholder="0.00"
              InputProps={{
                startAdornment: <Box sx={{ mr: 1, color: 'text.secondary' }}>$</Box>,
              }}
            />

            <Box>
              <Field.Switch name="gitIntegrationEnabled" label="Enable Git Integration" />
            </Box>

            {gitEnabled && (
              <Field.Text
                name="repoUrl"
                label="Repository URL"
                placeholder="https://github.com/username/repo"
              />
            )}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} color="inherit">
            Cancel
          </Button>
          <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
            {project ? 'Save Changes' : 'Create Project'}
          </LoadingButton>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
