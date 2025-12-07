"use client";
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import MenuItem from '@mui/material/MenuItem';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { getUsers } from 'src/api/user-management';
import { addProjectMembersBulk } from 'src/api/project';
import { IUserItem } from 'src/types/user';
import { ProjectMemberRole, IProjectMember } from 'src/types/project';
import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  projectId: string;
  currentMembers: IProjectMember[];
  onUpdate: () => void;
};

const ROLES: ProjectMemberRole[] = [
  
  'developer',
  'designer',
  'qa',
 
];

export function ProjectMemberDialog({ open, onClose, projectId, currentMembers, onUpdate }: Props) {
  const [users, setUsers] = useState<IUserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<IUserItem[]>([]);
  const [selectedRole, setSelectedRole] = useState<ProjectMemberRole>('developer');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchUsers();
      setSelectedUsers([]);
      setSelectedRole('developer');
    }
  }, [open]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      // Filter out existing members
      const memberUserIds = currentMembers.map((m) => m.userId);
      const availableUsers = data.filter((u: IUserItem) => !memberUserIds.includes(Number(u.id)));
      setUsers(availableUsers);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (selectedUsers.length === 0) return;

    try {
      setSubmitting(true);
      const payload = {
        members: selectedUsers.map((user) => ({
          userId: Number(user.id),
          role: selectedRole,
        })),
      };

      await addProjectMembersBulk(projectId, payload);
      toast.success('Members added successfully');
      onUpdate();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Failed to add members');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Add Team Members</DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <Autocomplete
            multiple
            loading={loading}
            options={users}
            getOptionLabel={(option) => option.name}
            value={selectedUsers}
            onChange={(event, newValue) => setSelectedUsers(newValue)}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                <Avatar
                  src={option.avatarUrl}
                  alt={option.name}
                  sx={{ width: 24, height: 24, mr: 1 }}
                />
                <Box>
                  <Typography variant="body2">{option.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.email}
                  </Typography>
                </Box>
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Users"
                placeholder="Search users..."
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loading ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />

          <TextField
            select
            label="Role"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as ProjectMemberRole)}
          >
            {ROLES.map((role) => (
              <MenuItem key={role} value={role} sx={{ textTransform: 'capitalize' }}>
                {role.replace('_', ' ')}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={selectedUsers.length === 0 || submitting}
        >
          Add Members
        </Button>
      </DialogActions>
    </Dialog>
  );
}
