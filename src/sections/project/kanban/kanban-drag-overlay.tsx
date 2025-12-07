import type { IBoardColumn, ITask } from 'src/types/project';
import type { UniqueIdentifier } from '@dnd-kit/core';
import type { Theme, SxProps } from '@mui/material/styles';

import { DragOverlay, defaultDropAnimationSideEffects } from '@dnd-kit/core';

import { KanbanColumn } from './kanban-column';
import { KanbanTaskItem } from './kanban-task-item';

// ----------------------------------------------------------------------

const dropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } }),
};

type Props = {
  sx?: SxProps<Theme>;
  columns?: IBoardColumn[];
  tasks?: Record<string, ITask[]>;
  activeId: UniqueIdentifier | null;
  projectId: string;
    sprintId: string;
};

export function KanbanDragOverlay({ columns, tasks, activeId, sx, projectId, sprintId }: Props) {
  const activeColumn = columns?.find((column) => column.id === activeId);

  const activeTask =
    activeId && tasks
      ? Object.values(tasks)
          .flat()
          .find((task) => task.id === activeId)
      : null;

  return (
    <DragOverlay dropAnimation={dropAnimation}>
      {activeColumn && (
        <KanbanColumn
            column={activeColumn}
          tasks={tasks?.[activeColumn.id] || []}
          disabled
          sx={sx}
          projectId={projectId}
          sprintId={sprintId}
        >
          {tasks?.[activeColumn.id]?.map((task) => (
            <KanbanTaskItem key={task.id} task={task} disabled />
          ))}
        </KanbanColumn>
      )}

      {activeTask && <KanbanTaskItem task={activeTask} disabled sx={sx} />}
    </DragOverlay>
  );
}
