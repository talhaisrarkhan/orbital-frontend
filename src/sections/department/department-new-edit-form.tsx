import type { IDepartment } from 'src/types/department';
import type { IUserItem } from 'src/types/user';

import { z as zod } from 'zod';
import { useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import useSWR from 'swr';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Unstable_Grid2';
import LoadingButton from '@mui/lab/LoadingButton';
import MenuItem from '@mui/material/MenuItem';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { endpoints, fetcher } from 'src/utils/axios';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

import { createDepartment, changeDepartmentHead } from 'src/api/department';

// ----------------------------------------------------------------------

export type NewDepartmentSchemaType = zod.infer<typeof NewDepartmentSchema>;

export const NewDepartmentSchema = zod.object({
  name: zod.string().min(1, { message: 'Name is required!' }),
  headId: zod.string().min(1, { message: 'Head is required!' }),
});

// ----------------------------------------------------------------------

type Props = {
  currentDepartment?: IDepartment;
};

export function DepartmentNewEditForm({ currentDepartment }: Props) {
  const router = useRouter();

  const { data: users } = useSWR<IUserItem[]>(endpoints.userManagement.list, fetcher);

  const defaultValues = useMemo(
    () => ({
      name: currentDepartment?.name || '',
      headId: currentDepartment?.headId || '',
    }),
    [currentDepartment]
  );

  const methods = useForm<NewDepartmentSchemaType>({
    mode: 'onSubmit',
    resolver: zodResolver(NewDepartmentSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (currentDepartment) {
        // Update logic
        // The API spec only has PATCH /departments/{id}/head for changing head.
        // And maybe PUT/PATCH for name? The spec didn't explicitly say update name, but usually it's there.
        // The spec said:
        // PATCH /departments/{id}/head Change department head
        // It didn't mention updating name. I'll assume for now I can only update head if it's edit mode, 
        // or maybe I should check if name changed and if there is an endpoint.
        // Given the spec, I'll only call changeDepartmentHead if headId changed.
        // If name changed, I might need another endpoint or the spec is incomplete.
        // I'll assume for now that I can only change head as per spec.
        
        if (data.headId !== currentDepartment.headId) {
            await changeDepartmentHead(currentDepartment.id, data.headId);
        }
        
        toast.success('Update success!');
      } else {
        await createDepartment(data);
        toast.success('Create success!');
      }
      
      reset();
    //  router.push(paths.dashboard.department.root);
    } catch (error) {
      console.error(error);
      toast.error(currentDepartment ? 'Update failed!' : 'Create failed!');
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
              <Field.Text name="name" label="Department Name" disabled={!!currentDepartment} helperText={currentDepartment ? "Name cannot be changed" : ""} />

              <Field.Select name="headId" label="Head">
                {users?.map((user) => (
                  <MenuItem key={user.id} value={user.id.toString()}>
                    {user.name}
                  </MenuItem>
                ))}
              </Field.Select>
            </Box>

            <Stack alignItems="flex-end" sx={{ mt: 3 }}>
              <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
                {!currentDepartment ? 'Create Department' : 'Save Changes'}
              </LoadingButton>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Form>
  );
}
