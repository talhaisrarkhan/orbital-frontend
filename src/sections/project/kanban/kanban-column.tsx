import type { Theme, SxProps } from '@mui/material/styles';
import type { IBoardColumn, ITask } from 'src/types/project';

import { memo, forwardRef, useState } from 'react';
import { useSortable, defaultAnimateLayoutChanges } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Badge from '@mui/material/Badge';
import { alpha } from '@mui/material/styles';

import { varAlpha, stylesMode } from 'src/theme/styles';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { kanbanClasses } from './classes';
import { TaskDialog } from '../task-dialog';
import { ColumnDialog } from '../column-dialog';
import { deleteBoardColumn } from 'src/api/project';
import { toast } from 'src/components/snackbar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

// ----------------------------------------------------------------------

const StyledRoot = styled(Stack)(({ theme }) => ({
  flexShrink: 0,
  height: '100%',
  borderWidth: 1,
  position: 'relative',
  borderStyle: 'solid',
  borderColor: 'transparent',
  padding: '24px 20px 20px 20px',
  borderRadius: '24px',
  backgroundColor: alpha(theme.palette.background.neutral, 0.8),
  backdropFilter: 'blur(8px)',
  transition: theme.transitions.create(['background-color', 'box-shadow', 'border-color']),
  [stylesMode.dark]: { 
    backgroundColor: alpha(theme.palette.grey[800], 0.8),
    border: `1px solid ${alpha(theme.palette.grey[700], 0.4)}`,
  },
  '&::before': {
    top: 0,
    left: 0,
    content: '""',
    width: '100%',
    height: '100%',
    position: 'absolute',
    borderRadius: 'inherit',
    backgroundColor: 'transparent',
    transition: theme.transitions.create(['background-color']),
  },
  [`&.${kanbanClasses.state.hover}`]: {
    backgroundColor: alpha(theme.palette.background.neutral, 1),
    [stylesMode.dark]: { backgroundColor: theme.palette.grey[800] },
  },
  [`&.${kanbanClasses.state.dragOverlay}`]: {
    backdropFilter: `blur(12px)`,
    borderColor: alpha(theme.palette.primary.main, 0.24),
    backgroundColor: alpha(theme.palette.background.paper, 0.9),
    boxShadow: theme.customShadows.z20,
    [stylesMode.dark]: { backgroundColor: alpha(theme.palette.grey[800], 0.9) },
  },
  [`&.${kanbanClasses.state.dragging}`]: { opacity: 0 },
}));

// ----------------------------------------------------------------------

type ColumnProps = {
  column: IBoardColumn;
  tasks: ITask[];
  disabled?: boolean;
  sx?: SxProps<Theme>;
  children: React.ReactNode;
  projectId: string;
    sprintId: string;
  onUpdate?: () => void;
  canCreateTask?: boolean;
};

export function KanbanColumn({ column, tasks, disabled, sx, children, projectId, sprintId, onUpdate, canCreateTask }: ColumnProps) {
  const [openAddTask, setOpenAddTask] = useState(false);
  const [openEditColumn, setOpenEditColumn] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
  };

  const handleEditColumn = () => {
    setOpenEditColumn(true);
    handleCloseMenu();
  };

  const handleDeleteColumn = async () => {
    if (tasks.length > 0) {
      toast.error('Cannot delete column with tasks. Please move or delete all tasks first.');
      setConfirmDelete(false);
      return;
    }

    try {
      await deleteBoardColumn(column.id);
      toast.success('Column deleted successfully');
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete column');
    } finally {
      setConfirmDelete(false);
    }
  };

  const { attributes, isDragging, listeners, setNodeRef, transition, active, over, transform } =
    useSortable({
      id: column.id,
      data: { type: 'container', children: tasks },
      animateLayoutChanges: (args) => defaultAnimateLayoutChanges({ ...args, wasDragging: true }),
      disabled,
    });

  const tasksIds = tasks.map((task) => task.id);

  const isOverContainer = over
    ? (column.id === over.id && active?.data.current?.type !== 'container') ||
      tasksIds.includes(over.id as string)
    : false;

  const getColumnColor = () => {
    switch (column.title.toLowerCase()) {
      case 'to do':
        return 'info.main';
      case 'in progress':
        return 'warning.main';
      case 'review':
        return 'secondary.main';
      case 'done':
        return 'success.main';
      default:
        return 'primary.main';
    }
  };

  return (
    <>
      <ColumnBase
        ref={setNodeRef}
        sx={{ transition, transform: CSS.Translate.toString(transform), ...sx }}
        stateProps={{
          dragging: isDragging,
          hover: isOverContainer,
          handleProps: { ...attributes, ...listeners },
        }}
        slots={{
          header: (
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: getColumnColor(),
                  }}
                />
                <Typography variant="subtitle1">{column.title}</Typography>
                <Badge
                  badgeContent={tasks.length}
                  color="default"
                  sx={{
                    '& .MuiBadge-badge': {
                      bgcolor: (theme) => alpha(theme.palette.text.primary, 0.08),
                      color: 'text.primary',
                    },
                  }}
                />
              </Stack>
              <Stack direction="row" spacing={0.5}>
                {canCreateTask && (
                  <IconButton size="small" onClick={() => setOpenAddTask(true)}>
                    <Iconify icon="mingcute:add-line" width={18} />
                  </IconButton>
                )}
                <IconButton size="small" onClick={handleOpenMenu}>
                  <Iconify icon="eva:more-vertical-fill" width={18} />
                </IconButton>
              </Stack>
            </Stack>
          ),
          main: <>{children}</>,
          action: canCreateTask ? (
            <Button
              fullWidth
              variant="soft"
              color="inherit"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={() => setOpenAddTask(true)}
              sx={{
                fontSize: 13,
                bgcolor: (theme) => alpha(theme.palette.grey[500], 0.08),
                '&:hover': {
                  bgcolor: (theme) => alpha(theme.palette.grey[500], 0.16),
                },
              }}
            >
              Add Task
            </Button>
          ) : null,
        }}
      />

      <TaskDialog
        open={openAddTask}
        onClose={() => {
          setOpenAddTask(false);
          if (onUpdate) onUpdate();
        }}
        boardId={column.boardId}
        projectId={projectId || ''}
        sprintId={sprintId || ''} 
        columnId={column.id}
      />

      {/* Column Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={handleEditColumn}>
          <ListItemIcon>
            <Iconify icon="solar:pen-bold" width={20} />
          </ListItemIcon>
          <ListItemText>Edit Column</ListItemText>
        </MenuItem>
        <MenuItem 
          onClick={() => {
            setConfirmDelete(true);
            handleCloseMenu();
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <Iconify icon="solar:trash-bin-trash-bold" width={20} sx={{ color: 'error.main' }} />
          </ListItemIcon>
          <ListItemText>Delete Column</ListItemText>
        </MenuItem>
      </Menu>

      {/* Edit Column Dialog */}
      <ColumnDialog
        open={openEditColumn}
        onClose={() => {
          setOpenEditColumn(false);
          if (onUpdate) onUpdate();
        }}
        boardId={column.boardId}
        column={column}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete Column"
        content={
          tasks.length > 0
            ? `This column has ${tasks.length} task(s). Please move or delete all tasks before deleting the column.`
            : 'Are you sure you want to delete this column? This action cannot be undone.'
        }
        action={
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleDeleteColumn}
            disabled={tasks.length > 0}
          >
            Delete
          </Button>
        }
      />
    </>
  );
}

// ----------------------------------------------------------------------

type ColumnBaseProps = {
  slots?: {
    header?: React.ReactNode;
    main?: React.ReactNode;
    action?: React.ReactNode;
  };
  stateProps?: {
    hover?: boolean;
    dragOverlay?: boolean;
    dragging?: boolean;
    handleProps?: any;
  };
  sx?: SxProps<Theme>;
};

const ColumnBase = forwardRef<HTMLDivElement, ColumnBaseProps>(
  ({ slots, stateProps, sx, ...other }, ref) => {
    const className = kanbanClasses.column.concat(
      (stateProps?.hover && ` ${kanbanClasses.state.hover}`) ||
        (stateProps?.dragOverlay && ` ${kanbanClasses.state.dragOverlay}`) ||
        (stateProps?.dragging && ` ${kanbanClasses.state.dragging}`) ||
        ''
    );

    return (
      <StyledRoot
        ref={ref}
        className={className}
        sx={{ gap: 2.5, width: '336px', ...sx }} // var(--column-width)
        {...other}
      >
        {slots?.header && (
          <Box {...stateProps?.handleProps} sx={{ cursor: 'grab' }}>
            {slots.header}
          </Box>
        )}

        {slots?.main && (
          <Box
            component="ul"
            className={kanbanClasses.columnList}
            sx={{
              minHeight: 80,
              display: 'flex',
              gap: '16px', // var(--item-gap)
              flexDirection: 'column',
              padding: 0,
              margin: 0,
            }}
          >
            {slots.main}
          </Box>
        )}

        {slots?.action && slots?.action}
      </StyledRoot>
    );
  }
);

export default memo(ColumnBase);
