"use client";
import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import TableContainer from '@mui/material/TableContainer';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { toast } from 'src/components/snackbar';
import { fDate } from 'src/utils/format-time';

import { IProjectMember, ProjectMemberRole } from 'src/types/project';
import { updateProjectMemberRole, removeProjectMember } from 'src/api/project';
import { ProjectMemberDialog } from '../project-member-dialog';

// ----------------------------------------------------------------------

type Props = {
  projectId: string;
  members: IProjectMember[];
  onUpdate: () => void;
};

const ROLES: ProjectMemberRole[] = [
  'project_manager',
  'team_lead',
  'developer',
  'designer',
  'qa',
  'member',
];

export function ProjectTeamView({ projectId, members, onUpdate }: Props) {
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleRemoveMember = async () => {
    if (!confirmDelete) return;
    try {
      await removeProjectMember(confirmDelete);
      toast.success('Member removed successfully');
      onUpdate();
    } catch (error) {
      console.error(error);
      toast.error('Failed to remove member');
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      await updateProjectMemberRole(memberId, newRole);
      toast.success('Role updated successfully');
      onUpdate();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update role');
    }
  };

  return (
    <>
      <Card>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 3 }}>
          <Typography variant="h6">Team Members ({members.length})</Typography>
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={() => setOpenAddDialog(true)}
          >
            Add Member
          </Button>
        </Stack>

        <TableContainer sx={{ overflow: 'unset' }}>
          <Scrollbar>
            <Table sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Joined At</TableCell>
                  <TableCell>Added By</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id} hover>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar alt={member.user?.name} src={member.user?.avatarUrl} />
                        <Box>
                          <Typography variant="subtitle2" noWrap>
                            {member.user?.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {member.user?.email}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Select
                        value={member.role}
                        size="small"
                        onChange={(e) => handleRoleChange(member.id, e.target.value)}
                        sx={{
                          minWidth: 140,
                          '& .MuiSelect-select': {
                            py: 1,
                            pr: '24px !important',
                            typography: 'subtitle2',
                            textTransform: 'capitalize',
                          },
                        }}
                      >
                        {ROLES.map((role) => (
                          <MenuItem key={role} value={role} sx={{ textTransform: 'capitalize' }}>
                            {role.replace('_', ' ')}
                          </MenuItem>
                        ))}
                      </Select>
                    </TableCell>

                    <TableCell>{fDate(member.joinedAt)}</TableCell>

                    <TableCell>
                      {member.addedByUser ? (
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography variant="body2">{member.addedByUser.name}</Typography>
                        </Stack>
                      ) : (
                        'System'
                      )}
                    </TableCell>

                    <TableCell align="right">
                      <Tooltip title="Remove Member">
                        <IconButton color="error" onClick={() => setConfirmDelete(member.id)}>
                          <Iconify icon="solar:trash-bin-trash-bold" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Scrollbar>
        </TableContainer>
      </Card>

      <ProjectMemberDialog
        open={openAddDialog}
        onClose={() => setOpenAddDialog(false)}
        projectId={projectId}
        currentMembers={members}
        onUpdate={onUpdate}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Remove Member"
        content="Are you sure you want to remove this member from the project?"
        action={
          <Button variant="contained" color="error" onClick={handleRemoveMember}>
            Remove
          </Button>
        }
      />
    </>
  );
}
