'use client';

import type { IDepartment } from 'src/types/department';
import type { ITeam } from 'src/types/team';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import AvatarGroup from '@mui/material/AvatarGroup';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Grid from '@mui/material/Unstable_Grid2';
import { alpha } from '@mui/material/styles';

import { useBoolean } from 'src/hooks/use-boolean';

import { DashboardContent } from 'src/layouts/dashboard';
import { useGetDepartments, deleteDepartment } from 'src/api/department';
import { deleteTeam } from 'src/api/team';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { paths } from 'src/routes/paths';

import { DepartmentDialog } from './department-dialog';
import { TeamDialog } from './team-dialog';

// ----------------------------------------------------------------------

type DepartmentCardProps = {
  department: IDepartment;
  onEditDepartment: (dept: IDepartment) => void;
  onDeleteDepartment: (id: string) => void;
  onCreateTeam: (departmentId: string) => void;
  onEditTeam: (team: ITeam) => void;
  onDeleteTeam: (id: string) => void;
};

function DepartmentCard({
  department,
  onEditDepartment,
  onDeleteDepartment,
  onCreateTeam,
  onEditTeam,
  onDeleteTeam,
}: DepartmentCardProps) {
  // Use teams from the department object (already fetched with departments)
  const departmentTeams = department.teams || [];

  return (
    <Card
      sx={{
        p: 3,
        position: 'relative',
        overflow: 'visible',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: (theme) => theme.customShadows.z20,
          transform: 'translateY(-4px)',
        },
      }}
    >
      {/* Department Header */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 3 }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
            }}
          >
            <Iconify
              icon="solar:buildings-2-bold-duotone"
              width={32}
              sx={{ color: 'primary.main' }}
            />
          </Box>
          <Box>
            <Typography variant="h5" gutterBottom>
              {department.name}
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Avatar
                src={department.head?.profilePicture}
                alt={department.head?.name}
                sx={{ width: 24, height: 24 }}
              />
              <Typography variant="body2" color="text.secondary">
                Head: {department.head?.name || 'Not assigned'}
              </Typography>
            </Stack>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1}>
          <IconButton
            size="small"
            onClick={() => onEditDepartment(department)}
            sx={{
              bgcolor: (theme) => alpha(theme.palette.grey[500], 0.08),
              '&:hover': {
                bgcolor: (theme) => alpha(theme.palette.grey[500], 0.16),
              },
            }}
          >
            <Iconify icon="solar:pen-bold" width={18} />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => onDeleteDepartment(department.id)}
            sx={{
              bgcolor: (theme) => alpha(theme.palette.error.main, 0.08),
              color: 'error.main',
              '&:hover': {
                bgcolor: (theme) => alpha(theme.palette.error.main, 0.16),
              },
            }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" width={18} />
          </IconButton>
        </Stack>
      </Stack>

      {/* Teams Section */}
      <Box>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 2 }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Iconify icon="solar:users-group-rounded-bold-duotone" width={20} />
            <Typography variant="subtitle2">
              Teams ({departmentTeams.length})
            </Typography>
          </Stack>
          <Button
            size="small"
            variant="soft"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={() => onCreateTeam(department.id)}
          >
            Add Team
          </Button>
        </Stack>

        {departmentTeams.length === 0 ? (
          <Box
            sx={{
              p: 3,
              textAlign: 'center',
              borderRadius: 2,
              bgcolor: (theme) => alpha(theme.palette.grey[500], 0.04),
              border: (theme) => `1px dashed ${alpha(theme.palette.grey[500], 0.2)}`,
            }}
          >
            <Typography variant="body2" color="text.disabled">
              No teams yet. Create one to get started.
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {departmentTeams.map((team) => (
              <Grid key={team.id} xs={12} sm={6} md={4}>
                <Card
                  sx={{
                    p: 2.5,
                    height: '100%',
                    position: 'relative',
                    bgcolor: (theme) => alpha(theme.palette.grey[500], 0.04),
                    border: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.08)}`,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
                      borderColor: 'primary.main',
                      boxShadow: (theme) => theme.customShadows.z8,
                    },
                  }}
                >
                  <Stack spacing={2}>
                    {/* Team Header */}
                    <Stack
                      direction="row"
                      alignItems="flex-start"
                      justifyContent="space-between"
                    >
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="subtitle2"
                          noWrap
                          sx={{ mb: 0.5 }}
                        >
                          {team.name}
                        </Typography>
                        <Chip
                          size="small"
                          label={`${team.members?.length || 0} members`}
                          sx={{
                            height: 20,
                            fontSize: '0.75rem',
                          }}
                        />
                      </Box>
                      <Stack direction="row" spacing={0.5}>
                        <IconButton
                          size="small"
                          onClick={() => onEditTeam(team)}
                          sx={{ width: 28, height: 28 }}
                        >
                          <Iconify icon="solar:pen-bold" width={16} />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => onDeleteTeam(team.id)}
                          sx={{
                            width: 28,
                            height: 28,
                            color: 'error.main',
                          }}
                        >
                          <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                        </IconButton>
                      </Stack>
                    </Stack>

                    {/* Team Lead */}
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Avatar
                        src={team.lead?.profilePicture}
                        alt={team.lead?.name}
                        sx={{ width: 32, height: 32 }}
                      />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="caption" color="text.disabled" display="block">
                          Team Lead
                        </Typography>
                        <Typography variant="body2" noWrap>
                          {team.lead?.name || 'Not assigned'}
                        </Typography>
                      </Box>
                    </Stack>

                    {/* Team Members */}
                    {team.members && team.members.length > 0 && (
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <AvatarGroup
                          max={4}
                          sx={{
                            '& .MuiAvatar-root': {
                              width: 28,
                              height: 28,
                              fontSize: '0.75rem',
                            },
                          }}
                        >
                          {team.members.map((member) => (
                            <Avatar
                              key={member.id}
                              src={member.profilePicture}
                              alt={member.name}
                            />
                          ))}
                        </AvatarGroup>
                      </Stack>
                    )}
                  </Stack>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Card>
  );
}

// ----------------------------------------------------------------------

export function OrganizationView() {
  const { departments, departmentsLoading } = useGetDepartments();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

  const departmentDialog = useBoolean();
  const teamDialog = useBoolean();
  const deleteDialog = useBoolean();

  const [editingDepartment, setEditingDepartment] = useState<IDepartment | null>(null);
  const [editingTeam, setEditingTeam] = useState<ITeam | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'department' | 'team'; id: string } | null>(null);

  const handleCreateDepartment = () => {
    setEditingDepartment(null);
    departmentDialog.onTrue();
  };

  const handleEditDepartment = (dept: IDepartment) => {
    setEditingDepartment(dept);
    departmentDialog.onTrue();
  };

  const handleCreateTeam = (departmentId?: string) => {
    setEditingTeam(null);
    if (departmentId) {
      setSelectedDepartment(departmentId);
    }
    teamDialog.onTrue();
  };

  const handleEditTeam = (team: ITeam) => {
    setEditingTeam(team);
    teamDialog.onTrue();
  };

  const handleDeleteClick = (type: 'department' | 'team', id: string) => {
    setDeleteTarget({ type, id });
    deleteDialog.onTrue();
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      if (deleteTarget.type === 'department') {
        await deleteDepartment(deleteTarget.id);
        toast.success('Department deleted successfully!');
      } else {
        await deleteTeam(deleteTarget.id);
        toast.success('Team deleted successfully!');
      }
      window.location.reload();
    } catch (error) {
      console.error(error);
      toast.error('Delete failed!');
    } finally {
      deleteDialog.onFalse();
      setDeleteTarget(null);
    }
  };

  const filteredDepartments = departments.filter((dept) =>
    dept.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <DashboardContent maxWidth="xl">
        <CustomBreadcrumbs
          heading="Organization Structure"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Organization' },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        {/* Header Actions */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent="space-between"
          sx={{ mb: 4 }}
        >
          <TextField
            placeholder="Search departments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
            sx={{ maxWidth: { sm: 320 } }}
          />

          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={() => handleCreateTeam()}
            >
              New Team
            </Button>
            <Button
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={handleCreateDepartment}
            >
              New Department
            </Button>
          </Stack>
        </Stack>

        {/* Departments Grid */}
        {departmentsLoading ? (
          <Typography>Loading...</Typography>
        ) : filteredDepartments.length === 0 ? (
          <Card
            sx={{
              p: 8,
              textAlign: 'center',
              bgcolor: (theme) => alpha(theme.palette.grey[500], 0.04),
            }}
          >
            <Iconify
              icon="solar:folder-open-bold-duotone"
              width={80}
              sx={{ mb: 2, color: 'text.disabled', opacity: 0.5 }}
            />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No departments found
            </Typography>
            <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>
              Create your first department to get started
            </Typography>
            <Button variant="contained" onClick={handleCreateDepartment}>
              Create Department
            </Button>
          </Card>
        ) : (
          <Stack spacing={4}>
            {filteredDepartments.map((department) => (
              <DepartmentCard
                key={department.id}
                department={department}
                onEditDepartment={handleEditDepartment}
                onDeleteDepartment={(id) => handleDeleteClick('department', id)}
                onCreateTeam={handleCreateTeam}
                onEditTeam={handleEditTeam}
                onDeleteTeam={(id) => handleDeleteClick('team', id)}
              />
            ))}
          </Stack>
        )}
      </DashboardContent>

      {/* Dialogs */}
      <DepartmentDialog
        open={departmentDialog.value}
        onClose={departmentDialog.onFalse}
        department={editingDepartment}
      />

      <TeamDialog
        open={teamDialog.value}
        onClose={teamDialog.onFalse}
        team={editingTeam}
        preselectedDepartmentId={selectedDepartment}
      />

      <ConfirmDialog
        open={deleteDialog.value}
        onClose={deleteDialog.onFalse}
        title="Delete"
        content={`Are you sure you want to delete this ${deleteTarget?.type}?`}
        action={
          <Button variant="contained" color="error" onClick={handleConfirmDelete}>
            Delete
          </Button>
        }
      />
    </>
  );
}
