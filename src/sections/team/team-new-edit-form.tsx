import type { ITeam } from 'src/types/team';
import type { IUserItem } from 'src/types/user';
import type { IDepartment } from 'src/types/department';

import { z as zod } from 'zod';
import { useMemo, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import useSWR from 'swr';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Unstable_Grid2';
import LoadingButton from '@mui/lab/LoadingButton';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { endpoints, fetcher } from 'src/utils/axios';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

import { createTeam, changeTeamLead, updateTeamMembers } from 'src/api/team';
import { useGetDepartments } from 'src/api/department';

// ----------------------------------------------------------------------

export type NewTeamSchemaType = zod.infer<typeof NewTeamSchema>;

export const NewTeamSchema = zod.object({
  name: zod.string().min(1, { message: 'Name is required!' }),
  departmentId: zod.string().min(1, { message: 'Department is required!' }),
  leadId: zod.string().min(1, { message: 'Lead is required!' }),
  memberIds: zod.array(zod.string()).optional(),
});

// ----------------------------------------------------------------------

type Props = {
  currentTeam?: ITeam;
};

export function TeamNewEditForm({ currentTeam }: Props) {
  const router = useRouter();

  const { data: users } = useSWR<IUserItem[]>(endpoints.userManagement.list, fetcher);
  const { departments } = useGetDepartments();

  const defaultValues = useMemo(
    () => ({
      name: currentTeam?.name || '',
      departmentId: currentTeam?.departmentId || '',
      leadId: currentTeam?.leadId || '',
      memberIds: currentTeam?.members?.map((m) => m.id) || [],
    }),
    [currentTeam]
  );

  const methods = useForm<NewTeamSchemaType>({
    mode: 'onSubmit',
    resolver: zodResolver(NewTeamSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (currentTeam) {
        // Update logic
        if (data.leadId !== currentTeam.leadId) {
            await changeTeamLead(currentTeam.id, data.leadId);
        }
        
        // Check if members changed
        const currentMemberIds = currentTeam.members?.map(m => m.id).sort() || [];
        const newMemberIds = (data.memberIds || []).sort();
        
        if (JSON.stringify(currentMemberIds) !== JSON.stringify(newMemberIds)) {
            await updateTeamMembers(currentTeam.id, newMemberIds);
        }

        toast.success('Update success!');
      } else {
        const newTeam = await createTeam({
            name: data.name,
            departmentId: data.departmentId,
            leadId: data.leadId,
        });
        
        // If members are selected, add them
        if (data.memberIds && data.memberIds.length > 0) {
            await updateTeamMembers(newTeam.id, data.memberIds);
        }
        
        toast.success('Create success!');
      }
      
      reset();
      //router.push(paths.dashboard.team.root);
    } catch (error) {
      console.error(error);
      toast.error(currentTeam ? 'Update failed!' : 'Create failed!');
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid xs={12} md={8}>
          <Card sx={{ p: 3 }}>
            <Box
              rowGap={3}
              columnGap={2}
              display="grid"
              gridTemplateColumns={{ xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' }}
            >
              <Field.Text name="name" label="Team Name" disabled={!!currentTeam} helperText={currentTeam ? "Name cannot be changed" : ""} />

              <Field.Select name="departmentId" label="Department" disabled={!!currentTeam}>
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </MenuItem>
                ))}
              </Field.Select>

              <Field.Select name="leadId" label="Lead">
                {users?.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.name}
                  </MenuItem>
                ))}
              </Field.Select>

              <Field.MultiSelect
                checkbox
                name="memberIds"
                label="Members"
                options={users?.map((user) => ({ value: user.id, label: user.name })) || []}
              />
            </Box>

            <Stack alignItems="flex-end" sx={{ mt: 3 }}>
              <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
                {!currentTeam ? 'Create Team' : 'Save Changes'}
              </LoadingButton>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Form>
  );
}
