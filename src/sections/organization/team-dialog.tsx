"use client";
import type { ITeam } from 'src/types/team';
import type { IUserItem } from 'src/types/user';

import { z as zod } from 'zod';
import { useMemo, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import useSWR from 'swr';

import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import LoadingButton from '@mui/lab/LoadingButton';
import Button from '@mui/material/Button';

import { endpoints, fetcher } from 'src/utils/axios';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

import { createTeam, changeTeamLead, updateTeamMembers } from 'src/api/team';
import { useGetDepartments } from 'src/api/department';

// ----------------------------------------------------------------------

export type TeamSchemaType = zod.infer<typeof TeamSchema>;

export const TeamSchema = zod.object({
  name: zod.string().min(1, { message: 'Name is required!' }),
  departmentId: zod.string().min(1, { message: 'Department is required!' }),
  leadId: zod.string().min(1, { message: 'Lead is required!' }),
  memberIds: zod.array(zod.string()).optional(),
});

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  team?: ITeam | null;
  preselectedDepartmentId?: string | null;
};

export function TeamDialog({ open, onClose, team, preselectedDepartmentId }: Props) {
  const { data: users } = useSWR<IUserItem[]>(endpoints.userManagement.list, fetcher);
  const { departments } = useGetDepartments();

const defaultValues = useMemo(
  () => ({
    name: team?.name || '',
    departmentId: team?.departmentId?.toString() || preselectedDepartmentId?.toString() || '',
    leadId: team?.leadId?.toString() || '',
    memberIds: team?.members?.map((m) => m.id.toString()) || [],
  }),
  [team, preselectedDepartmentId]
);

  const methods = useForm<TeamSchemaType>({
    mode: 'onSubmit',
    resolver: zodResolver(TeamSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    if (open) {
      reset({
        name: team?.name || '',
        departmentId: team?.departmentId?.toString() || preselectedDepartmentId?.toString() || '',
        leadId: team?.leadId?.toString() || '',
        memberIds: team?.members?.map((m) => m.id.toString()) || [],
      });
    }
  }, [open, team, preselectedDepartmentId, reset]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (team) {
        if (data.leadId != team.leadId) {
          await changeTeamLead(team.id, data.leadId);
        }

        const currentMemberIds = team.members?.map((m) => m.id).sort() || [];
        const newMemberIds = (data.memberIds || []).sort();

        if (JSON.stringify(currentMemberIds) !=JSON.stringify(newMemberIds)) {
          await updateTeamMembers(team.id, newMemberIds);
        }

        toast.success('Team updated successfully!');
      } else {
        const newTeam = await createTeam({
          name: data.name,
          departmentId: data.departmentId.toString(),
          leadId: data.leadId,
        });

        if (data.memberIds && data.memberIds.length > 0) {
          await updateTeamMembers(newTeam.id, data.memberIds);
        }

        toast.success('Team created successfully!');
      }

      reset();
      onClose();
     
    } catch (error) {
      console.error(error);
      toast.error(team ? 'Update failed!' : 'Create failed!');
    }
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{team ? 'Edit Team' : 'Create Team'}</DialogTitle>

      <Form methods={methods} onSubmit={onSubmit}>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 1 }}>
            <Field.Text
              name="name"
              label="Team Name"
              disabled={!!team}
              helperText={team ? 'Name cannot be changed' : ''}
            />

            <Field.Select
              name="departmentId"
              label="Department"
              disabled={!!team || !!preselectedDepartmentId}
            >
              {departments.map((dept) => (
                <MenuItem key={dept.id} value={dept.id.toString()}>
                  {dept.name}
                </MenuItem>
              ))}
            </Field.Select>

            <Field.Select name="leadId" label="Team Lead">
              {users?.map((user) => (
                <MenuItem key={user.id} value={user.id.toString()}>
                  {user.name}
                </MenuItem>
              ))}
            </Field.Select>

            <Field.MultiSelect
              checkbox
              name="memberIds"
              label="Team Members"
              options={users?.map((user) => ({ value: user.id.toString(), label: user.name })) || []}
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} color="inherit">
            Cancel
          </Button>
          <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
            {team ? 'Save Changes' : 'Create'}
          </LoadingButton>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
