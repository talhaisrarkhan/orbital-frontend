import type { ITask } from 'src/types/project';
import type { UniqueIdentifier } from '@dnd-kit/core';
import type { Theme, SxProps } from '@mui/material/styles';
import type { Transform } from '@dnd-kit/utilities';
import type { DraggableSyntheticListeners } from '@dnd-kit/core';

import { useSortable } from '@dnd-kit/sortable';
import { useState, useEffect, forwardRef, memo } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import ListItem from '@mui/material/ListItem';
import { alpha, styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';

import { varAlpha, stylesMode } from 'src/theme/styles';
import { Iconify } from 'src/components/iconify';

import { kanbanClasses } from './classes';
import { TaskDetailsDrawer } from '../task-details-drawer';

// ----------------------------------------------------------------------

export const StyledItemWrap = styled(ListItem)(() => ({
  '@keyframes fadeIn': { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
  transform:
    'translate3d(var(--translate-x, 0), var(--translate-y, 0), 0) scaleX(var(--scale-x, 1)) scaleY(var(--scale-y, 1))',
  transformOrigin: '0 0',
  touchAction: 'manipulation',
  [`&.${kanbanClasses.state.fadeIn}`]: { animation: 'fadeIn 500ms ease' },
  [`&.${kanbanClasses.state.dragOverlay}`]: { zIndex: 999 },
}));

export const StyledItem = styled(Stack)(({ theme }) => ({
  width: '100%',
  cursor: 'grab',
  outline: 'none',
  overflow: 'hidden',
  position: 'relative',
  transformOrigin: '50% 50%',
  touchAction: 'manipulation',
  boxShadow: theme.customShadows.z1,
  borderRadius: '16px',
  WebkitTapHighlightColor: 'transparent',
  backgroundColor: theme.palette.background.paper,
  transition: theme.transitions.create(['box-shadow', 'transform', 'background-color']),
  border: `1px solid ${alpha(theme.palette.grey[500], 0.08)}`,
  [stylesMode.dark]: { 
    backgroundColor: theme.palette.grey[900],
    border: `1px solid ${alpha(theme.palette.grey[700], 0.4)}`,
  },
  '&:hover': {
    boxShadow: theme.customShadows.z8,
    transform: 'translateY(-2px)',
    borderColor: alpha(theme.palette.primary.main, 0.24),
  },
  [`&.${kanbanClasses.state.disabled}`]: {},
  [`&.${kanbanClasses.state.sorting}`]: {},
  [`&.${kanbanClasses.state.dragOverlay}`]: {
    backdropFilter: `blur(12px)`,
    boxShadow: theme.customShadows.z20,
    backgroundColor: alpha(theme.palette.background.paper, 0.9),
    transform: 'scale(1.02)',
    [stylesMode.dark]: { backgroundColor: alpha(theme.palette.grey[900], 0.9) },
  },
  [`&.${kanbanClasses.state.dragging}`]: { opacity: 0.2, filter: 'grayscale(1)' },
}));

// ----------------------------------------------------------------------

type TaskItemProps = {
  task: ITask;
  disabled?: boolean;
  sx?: SxProps<Theme>;
  onUpdate?: () => void;
};

export function KanbanTaskItem({ task, disabled, sx, onUpdate }: TaskItemProps) {
  const [openDetails, setOpenDetails] = useState(false);

  const { setNodeRef, listeners, isDragging, isSorting, transform, transition } = useSortable({
    id: task.id,
    disabled,
  });

  const mounted = useMountStatus();
  const mountedWhileDragging = isDragging && !mounted;

  return (
    <>
      <ItemBase
        ref={setNodeRef}
        task={task}
        onClick={() => setOpenDetails(true)}
        stateProps={{
          transform,
          listeners,
          transition,
          sorting: isSorting,
          dragging: isDragging,
          fadeIn: mountedWhileDragging,
          disabled,
        }}
        sx={sx}
      />

      <TaskDetailsDrawer
        taskId={task.id}
        open={openDetails}
        onClose={() => setOpenDetails(false)}
        onUpdate={onUpdate}
      />
    </>
  );
}

// ----------------------------------------------------------------------

type ItemBaseProps = {
  task: ITask;
  onClick?: () => void;
  sx?: SxProps<Theme>;
  stateProps?: {
    fadeIn?: boolean;
    sorting?: boolean;
    disabled?: boolean;
    dragging?: boolean;
    dragOverlay?: boolean;
    transition?: string | null;
    transform?: Transform | null;
    listeners?: DraggableSyntheticListeners;
  };
};

const ItemBase = forwardRef<HTMLLIElement, ItemBaseProps>(
  ({ task, stateProps, sx, onClick, ...other }, ref) => {
    useEffect(() => {
      if (!stateProps?.dragOverlay) {
        return;
      }

      document.body.style.cursor = 'grabbing';

      return () => {
        document.body.style.cursor = '';
      };
    }, [stateProps?.dragOverlay]);

    const itemWrapClassName = kanbanClasses.itemWrap.concat(
      (stateProps?.fadeIn && ` ${kanbanClasses.state.fadeIn}`) ||
        (stateProps?.dragOverlay && ` ${kanbanClasses.state.dragOverlay}`) ||
        ''
    );

    const itemClassName = kanbanClasses.item.concat(
      (stateProps?.dragging && ` ${kanbanClasses.state.dragging}`) ||
        (stateProps?.disabled && ` ${kanbanClasses.state.disabled}`) ||
        (stateProps?.sorting && ` ${kanbanClasses.state.sorting}`) ||
        (stateProps?.dragOverlay && ` ${kanbanClasses.state.dragOverlay}`) ||
        ''
    );

    const renderPriority = (
      <Iconify
        icon={
          (task.priority === 'low' && 'solar:double-alt-arrow-down-bold-duotone') ||
          (task.priority === 'medium' && 'solar:double-alt-arrow-right-bold-duotone') ||
          'solar:double-alt-arrow-up-bold-duotone'
        }
        sx={{
          top: 12,
          right: 12,
          position: 'absolute',
          ...(task.priority === 'low' && { color: 'info.main' }),
          ...(task.priority === 'medium' && { color: 'warning.main' }),
          ...(task.priority === 'high' && { color: 'error.main' }),
          ...(task.priority === 'critical' && { color: 'error.dark' }),
        }}
      />
    );

    const renderInfo = (
      <Stack direction="row" alignItems="center" spacing={1}>
        {task.storyPoints && (
          <Stack
            direction="row"
            alignItems="center"
            sx={{ typography: 'caption', color: 'text.disabled' }}
          >
            <Iconify width={16} icon="solar:star-bold-duotone" sx={{ mr: 0.25 }} />
            <Box component="span">{task.storyPoints}</Box>
          </Stack>
        )}

        {task.tags && task.tags.length > 0 && (
          <Stack direction="row" spacing={0.5}>
            {task.tags.slice(0, 2).map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                variant="outlined"
                sx={{
                  height: 20,
                  fontSize: '0.75rem',
                  '& .MuiChip-label': { px: 0.5 },
                }}
              />
            ))}
          </Stack>
        )}

        <Box sx={{ flexGrow: 1 }} />

        {task.assignee && (
          <Avatar
            alt={task.assignee.name}
            src={task.assignee.profilePicture}
            sx={{ width: 24, height: 24 }}
          />
        )}
      </Stack>
    );

    return (
      <StyledItemWrap
        ref={ref}
        disablePadding
        className={itemWrapClassName}
        sx={{
          ...(!!stateProps?.transition && { transition: stateProps.transition }),
          ...(!!stateProps?.transform && {
            '--translate-x': `${Math.round(stateProps.transform.x)}px`,
            '--translate-y': `${Math.round(stateProps.transform.y)}px`,
            '--scale-x': `${stateProps.transform.scaleX}`,
            '--scale-y': `${stateProps.transform.scaleY}`,
          }),
        }}
      >
        <StyledItem
          className={itemClassName}
          data-cypress="draggable-item"
          sx={sx}
          tabIndex={0}
          onClick={onClick}
          {...stateProps?.listeners}
          {...other}
        >
          <Box sx={{ px: 2, py: 2.5, position: 'relative' }}>
            {renderPriority}

            <Typography variant="subtitle2" sx={{ mb: 2, pr: 3 }}>
              {task.title}
            </Typography>

            {renderInfo}
          </Box>
        </StyledItem>
      </StyledItemWrap>
    );
  }
);

export default memo(ItemBase);

function useMountStatus() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setIsMounted(true), 500);
    return () => clearTimeout(timeout);
  }, []);

  return isMounted;
}
