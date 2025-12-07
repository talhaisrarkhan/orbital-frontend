'use client';

import type {
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  UniqueIdentifier,
  CollisionDetection,
} from '@dnd-kit/core';
import type { IBoard, ITask, TaskStatus, ISprint } from 'src/types/project';

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSensor,
  DndContext,
  useSensors,
  MouseSensor,
  TouchSensor,
  closestCenter,
  pointerWithin,
  KeyboardSensor,
  rectIntersection,
  getFirstCollision,
  MeasuringStrategy,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { alpha } from '@mui/material/styles';

import { endpoints, fetcher } from 'src/utils/axios';
import { moveTask, updateBoardColumn } from 'src/api/project';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { kanbanClasses } from './classes';
import { KanbanColumn } from './kanban-column';
import { KanbanTaskItem } from './kanban-task-item';
import { KanbanDragOverlay } from './kanban-drag-overlay';
import { ColumnDialog } from '../column-dialog';

import { useSocketRoom } from 'src/hooks/use-socket';
import { useProjectPermissions } from 'src/hooks/use-project-permissions';

// ----------------------------------------------------------------------

type Props = {
  boardId: string;  
  projectId: string;  
  sprintId: string;
  projectManagerId?: number;
};

export function KanbanBoard({ boardId, projectId, sprintId, projectManagerId }: Props) {
  const { mutate } = useSWRConfig();
  const { canManageTasks, canManageSprint } = useProjectPermissions(projectManagerId);
  const { data: board, isLoading, mutate: mutateBoard } = useSWR<IBoard>(
    endpoints.board.details(boardId),
    fetcher
  );

  // Memoize event handlers to prevent unnecessary re-subscriptions
  const handleTaskCreated = useCallback((newTask: ITask) => {
    mutateBoard((currentBoard) => {
      if (!currentBoard) return currentBoard;
      return {
        ...currentBoard,
        tasks: [...(currentBoard.tasks || []), newTask],
      };
    }, false);
  }, [mutateBoard]);

  const handleTaskUpdated = useCallback((updatedTask: ITask) => {
    mutateBoard((currentBoard) => {
      if (!currentBoard) return currentBoard;
      return {
        ...currentBoard,
        tasks: (currentBoard.tasks || []).map((t) =>
          t.id === updatedTask.id ? updatedTask : t
        ),
      };
    }, false);
  }, [mutateBoard]);

  const handleTaskDeleted = useCallback(({ taskId }: { taskId: string }) => {
    mutateBoard((currentBoard) => {
      if (!currentBoard) return currentBoard;
      return {
        ...currentBoard,
        tasks: (currentBoard.tasks || []).filter((t) => t.id !== taskId),
      };
    }, false);
  }, [mutateBoard]);

  const handleTaskMoved = useCallback((movedTask: ITask) => {
    mutateBoard((currentBoard) => {
      if (!currentBoard) return currentBoard;
      return {
        ...currentBoard,
        tasks: (currentBoard.tasks || []).map((t) =>
          t.id === movedTask.id ? movedTask : t
        ),
      };
    }, false);
  }, [mutateBoard]);

  const handleBoardUpdated = useCallback((updatedBoard: IBoard) => {
    mutateBoard(updatedBoard, false);
  }, [mutateBoard]);

  // Use optimized socket room hook
  // Use optimized socket room hook
  useSocketRoom({
    room: boardId,
    joinEvent: 'join:board',
    events: {
      'task.created': handleTaskCreated,
      'task.updated': handleTaskUpdated,
      'task.deleted': handleTaskDeleted,
      'task.moved': handleTaskMoved,
      'board.updated': handleBoardUpdated,
    },
  });

  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [openAddColumn, setOpenAddColumn] = useState(false);
  const lastOverId = useRef<UniqueIdentifier | null>(null);
  const recentlyMovedToNewContainer = useRef(false);

  // Transform tasks into a dictionary keyed by columnId
  const tasks = useMemo(() => {
    if (!board?.columns || !board?.tasks) return {};
    const taskMap: Record<string, ITask[]> = {};
    
    board.columns.forEach((col) => {
      taskMap[col.id] = board.tasks!
        .filter((t) => t.boardColumnId == col.id)
        .sort((a, b) => a.orderIndex - b.orderIndex);
    });
    return taskMap;
  }, [board]);

  const columnIds = useMemo(() => board?.columns?.map((c) => c.id) || [], [board]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const findColumn = (id: UniqueIdentifier) => {
    if (columnIds.includes(id as string)) {
      return id;
    }
    return Object.keys(tasks).find((key) => tasks[key].map((t) => t.id).includes(id as string));
  };

  const collisionDetectionStrategy: CollisionDetection = useCallback(
    (args) => {
      if (activeId && activeId in tasks) {
        return closestCenter({
          ...args,
          droppableContainers: args.droppableContainers.filter((column) => column.id in tasks),
        });
      }

      const pointerIntersections = pointerWithin(args);
      const intersections =
        pointerIntersections.length > 0 ? pointerIntersections : rectIntersection(args);
      let overId = getFirstCollision(intersections, 'id');

      if (overId != null) {
        if (overId in tasks) {
          const columnItems = tasks[overId].map((task) => task.id);
          if (columnItems.length > 0) {
            overId = closestCenter({
              ...args,
              droppableContainers: args.droppableContainers.filter(
                (column) => column.id !== overId && columnItems.includes(column.id as string)
              ),
            })[0]?.id;
          }
        }

        lastOverId.current = overId;
        return [{ id: overId }];
      }

      if (recentlyMovedToNewContainer.current) {
        lastOverId.current = activeId;
      }

      return lastOverId.current ? [{ id: lastOverId.current }] : [];
    },
    [activeId, tasks]
  );

  const onDragStart = ({ active }: DragStartEvent) => {
    setActiveId(active.id);
  };

  const onDragOver = ({ active, over }: DragOverEvent) => {
    const overId = over?.id;
    if (overId == null || active.id in tasks) return;

    const overColumn = findColumn(overId);
    const activeColumn = findColumn(active.id);

    if (!overColumn || !activeColumn) return;

    if (activeColumn !== overColumn) {
      // Logic for visual updates during drag over across columns
      recentlyMovedToNewContainer.current = true;
    }
  };

  const onDragEnd = async ({ active, over }: DragEndEvent) => {
    const activeColumnId = findColumn(active.id);
    const overColumnId = findColumn(over?.id as UniqueIdentifier);

    if (!activeColumnId || !overColumnId || !over) {
      setActiveId(null);
      return;
    }

    // Moving Column
    if (active.id in tasks && over.id in tasks && active.id !== over.id) {
      const activeIndex = columnIds.indexOf(active.id as string);
      const overIndex = columnIds.indexOf(over.id as string);
      
      // Optimistic update
      const newColumns = arrayMove(board!.columns!, activeIndex, overIndex);
      mutateBoard({ ...board!, columns: newColumns }, false);

      try {
        toast.info('Column reordering saved');
      } catch (error) {
        mutateBoard(); // Revert
        toast.error('Failed to move column');
      }
    }

    // Moving Task
    if (activeColumnId && overColumnId) {
      const activeTasks = tasks[activeColumnId];
      const overTasks = tasks[overColumnId];
      
      const activeIndex = activeTasks.findIndex((t) => t.id === active.id);
      const overIndex = overTasks.findIndex((t) => t.id === over.id);

      let newIndex;
      if (activeColumnId === overColumnId) {
        newIndex = overIndex;
      } else {
        const isBelowOverItem =
          over &&
          active.rect.current.translated &&
          active.rect.current.translated.top > over.rect.top + over.rect.height;

        const modifier = isBelowOverItem ? 1 : 0;
        newIndex = overIndex >= 0 ? overIndex + modifier : overTasks.length + 1;
      }

      if (activeColumnId !== overColumnId || activeIndex !== newIndex) {
        // Optimistic UI update for BOARD
        const newBoard = { ...board! };
        newBoard.tasks = [...(board!.tasks || [])];
        
        const taskIndex = newBoard.tasks.findIndex((t) => t.id === active.id);
        
        if (taskIndex !== -1) {
          const movedTask = { ...newBoard.tasks[taskIndex] };
          movedTask.boardColumnId = overColumnId as string;
          movedTask.orderIndex = newIndex;
          
          newBoard.tasks[taskIndex] = movedTask;
          
          mutateBoard(newBoard, false);

          // Optimistic UI update for SPRINT STATS
          if (sprintId) {
            mutate(endpoints.sprint.details(sprintId), (currentSprint: ISprint | undefined) => {
                if (!currentSprint) return currentSprint;
                
                const sprintTasks = currentSprint.tasks ? [...currentSprint.tasks] : [];
                const sprintTaskIndex = sprintTasks.findIndex(t => t.id === active.id);
                
                if (sprintTaskIndex !== -1) {
                    const targetColumn = board!.columns!.find(c => c.id === overColumnId);
                    if (targetColumn) {
                         const statusMap: Record<string, TaskStatus> = {
                            'to do': 'todo',
                            'todo': 'todo',
                            'in progress': 'in_progress',
                            'inprogress': 'in_progress',
                            'review': 'review',
                            'done': 'done',
                        };
                        const newStatus = statusMap[targetColumn.title.toLowerCase()] || sprintTasks[sprintTaskIndex].status;
                        
                        sprintTasks[sprintTaskIndex] = {
                            ...sprintTasks[sprintTaskIndex],
                            status: newStatus,
                            boardColumnId: overColumnId as string,
                        };
                        
                        return { ...currentSprint, tasks: sprintTasks };
                    }
                }
                return currentSprint;
            }, false);
          }
        }

        try {
          await moveTask(active.id as string, {
            boardColumnId: overColumnId as string,
            orderIndex: newIndex,
          });
        } catch (error) {
          console.error(error);
          toast.error('Failed to move task');
          mutateBoard(); // Revert board
          mutate(endpoints.sprint.details(sprintId)); // Revert sprint
        }
      }
    }

    setActiveId(null);
  };

  if (isLoading || !board) {
    return (
      <Box sx={{ py: 5 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <DndContext
      id="dnd-kanban"
      sensors={sensors}
      collisionDetection={collisionDetectionStrategy}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <Stack
        sx={{
          flex: '1 1 auto',
          overflowX: 'auto',
          height: '100%',
        }}
      >
        <Stack
          direction="row"
          sx={{
            gap: '24px', // var(--column-gap)
            pb: 3,
            height: '100%',
            minHeight: '600px',
          }}
        >
          <SortableContext
            items={[...columnIds]}
            strategy={horizontalListSortingStrategy}
          >
            {board.columns?.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                projectId={projectId}
                sprintId={sprintId}
                tasks={tasks[column.id] || []}
                onUpdate={mutateBoard}
                canCreateTask={canManageTasks}
              >
                <SortableContext
                  items={tasks[column.id] || []}
                  strategy={verticalListSortingStrategy}
                >
                  {tasks[column.id]?.map((task) => (
                    <KanbanTaskItem
                      key={task.id}
                      task={task}
                      onUpdate={mutateBoard}
                    />
                  ))}
                </SortableContext>
              </KanbanColumn>
            ))}
          </SortableContext>

          {/* Add Column Button */}
          {canManageSprint && (
            <Box
              sx={{
                flexShrink: 0,
                width: '336px',
                height: 'fit-content',
                p: 2,
                borderRadius: 2,
                border: (theme) => `2px dashed ${alpha(theme.palette.grey[500], 0.24)}`,
                bgcolor: (theme) => alpha(theme.palette.grey[500], 0.04),
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: (theme) => alpha(theme.palette.primary.main, 0.48),
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                },
              }}
              onClick={() => setOpenAddColumn(true)}
            >
              <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                <Iconify icon="mingcute:add-line" width={20} />
                <Typography variant="subtitle2" color="text.secondary">
                  Add Column
                </Typography>
              </Stack>
            </Box>
          )}
        </Stack>
      </Stack>

      <KanbanDragOverlay
        projectId={projectId}
        sprintId={sprintId}
        columns={board.columns}
        tasks={tasks}
        activeId={activeId}
      />

      <ColumnDialog
        open={openAddColumn}
        onClose={() => {
          setOpenAddColumn(false);
          mutateBoard();
        }}
        boardId={boardId}
        columnCount={board.columns?.length || 0}
      />
    </DndContext>
  );
}
