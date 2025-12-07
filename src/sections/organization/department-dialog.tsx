"use client";
import type { IDepartment } from 'src/types/department';
import type { IUserItem } from 'src/types/user';

import { z as zod } from 'zod';
import { useEffect,  useMemo } from 'react';
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

import { endpoints, fetcher } from 'src/utils/axios';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

import { createDepartment, changeDepartmentHead } from 'src/api/department';

// ----------------------------------------------------------------------

export type DepartmentSchemaType = zod.infer<typeof DepartmentSchema>;

export const DepartmentSchema = zod.object({
  name: zod.string().min(1, { message: 'Name is required!' }),
  headId: zod.string().min(1, { message: 'Head is required!' }),
});

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  department?: IDepartment | null;
};

export function DepartmentDialog({ open, onClose, department }: Props) {
  const { data: users } = useSWR<IUserItem[]>(endpoints.userManagement.list, fetcher);

  const defaultValues = useMemo(
    () => ({
      name: department?.name || '',
      headId: department?.headId || '',
    }),
    [department]
  );

  const methods = useForm<DepartmentSchemaType>({
    mode: 'onSubmit',
    resolver: zodResolver(DepartmentSchema),
    defaultValues,
  });




  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;
    useEffect(() => {
      if (open) {
        reset({
          name: department?.name || '',
          headId: department?.headId || '',
        });
      }
    }, [open, department, reset]);
  

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (department) {
        if (data.headId !== department.headId) {
          await changeDepartmentHead(department.id, data.headId);
        }
        toast.success('Department updated successfully!');
      } else {
        await createDepartment(data);
        toast.success('Department created successfully!');
      }

      reset();
      onClose();
      window.location.reload();
    } catch (error) {
      console.error(error);
      toast.error(department ? 'Update failed!' : 'Create failed!');
    }
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{department ? 'Edit Department' : 'Create Department'}</DialogTitle>

      <Form methods={methods} onSubmit={onSubmit}>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 1 }}>
            <Field.Text
              name="name"
              label="Department Name"
              disabled={!!department}
              helperText={department ? 'Name cannot be changed' : ''}
            />

            <Field.Select name="headId" label="Department Head">
              {users?.map((user) => (
                <MenuItem key={user.id} value={user.id.toString()}>
                  {user.name}
                </MenuItem>
              ))}
            </Field.Select>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} color="inherit">
            Cancel
          </Button>
          <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
            {department ? 'Save Changes' : 'Create'}
          </LoadingButton>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
