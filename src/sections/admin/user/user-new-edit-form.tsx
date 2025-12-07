import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import MenuItem from '@mui/material/MenuItem';
import LoadingButton from '@mui/lab/LoadingButton';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

import type { IUserManagementItem } from 'src/types/user-management';
import { createUser } from 'src/api/user-management';
import { UserRole } from 'src/auth/types/user-role';

// ----------------------------------------------------------------------

export type NewUserSchemaType = zod.infer<typeof NewUserSchema>;

export const NewUserSchema = zod.object({
  name: zod.string().min(1, { message: 'Name is required!' }),
  email: zod.string().min(1, { message: 'Email is required!' }).email(),
  password: zod.string().min(6, { message: 'Password must be at least 6 characters!' }),
  role: zod.nativeEnum(UserRole),
});

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: VoidFunction;
  onSuccess: VoidFunction;
  currentUser?: IUserManagementItem;
};

export function UserNewEditForm({ open, onClose, onSuccess, currentUser }: Props) {
  const defaultValues = useMemo(
    () => ({
      name: currentUser?.name || '',
      email: currentUser?.email || '',
      password: '', // Always empty for new/edit (unless we want to allow password update)
      role: (currentUser?.role as UserRole) || UserRole.EMPLOYEE,
    }),
    [currentUser]
  );

  const methods = useForm<NewUserSchemaType>({
    resolver: zodResolver(NewUserSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    if (open) {
      reset(defaultValues);
    }
  }, [open, defaultValues, reset]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (currentUser) {
        // Update logic if needed (API not defined yet for update)
        // await updateUser(currentUser.id, data);
        toast.info('Update not implemented yet');
      } else {
        await createUser(data);
        toast.success('Create success!');
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(currentUser ? 'Update failed!' : 'Create failed!');
    }
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{currentUser ? 'Edit User' : 'New User'}</DialogTitle>

      <DialogContent>
        <Form methods={methods} onSubmit={onSubmit}>
          <Box
            rowGap={3}
            columnGap={2}
            display="grid"
            gridTemplateColumns={{
              xs: 'repeat(1, 1fr)',
            }}
            sx={{ mt: 1 }}
          >
            <Field.Text name="name" label="Name" />
            <Field.Text name="email" label="Email" />
            <Field.Text name="password" label="Password" type="password" />
            
            <Field.Select name="role" label="Role">
              <MenuItem value={UserRole.DEPARTMENT_HEAD}>Department Head</MenuItem>
              <MenuItem value={UserRole.TEAM_LEAD}>Team Lead</MenuItem>
              <MenuItem value={UserRole.EMPLOYEE}>Employee</MenuItem>
            </Field.Select>
          </Box>
        </Form>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined" color="inherit">
          Cancel
        </Button>
        <LoadingButton 
          onClick={onSubmit} 
          variant="contained" 
          loading={isSubmitting}
        >
          {currentUser ? 'Save Changes' : 'Create User'}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
