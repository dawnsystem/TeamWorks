import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { tasksAPI } from '@/lib/api';
import type { Task } from '@/types';

type UseTasksTreeOptions = {
  projectId?: string | null;
  labelId?: string | null;
  enabled?: boolean;
};

type TasksMap = Map<string, Task>;

const traverseTasks = (tasks: Task[], map: TasksMap) => {
  const stack = [...tasks];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;

    map.set(current.id, current);

    if (current.subTasks && current.subTasks.length > 0) {
      stack.push(...current.subTasks);
    }
  }
};

export function useTasksTree({ projectId, labelId = null, enabled = true }: UseTasksTreeOptions) {
  const query = useQuery({
    queryKey: ['tasks', projectId, labelId],
    queryFn: () => {
      if (!projectId) return Promise.resolve([] as Task[]);
      return tasksAPI
        .getAll({ projectId, labelId: labelId || undefined })
        .then((res) => res.data);
    },
    enabled: enabled && !!projectId,
    staleTime: 1_000 * 15,
    refetchOnWindowFocus: false,
  });

  const rootTasks = query.data ?? [];

  const { tasksMap, sectionMap, tasksWithoutSection } = useMemo(() => {
    const map: TasksMap = new Map();
    const sections = new Map<string, Task[]>();
    const withoutSection: Task[] = [];

    traverseTasks(rootTasks, map);

    for (const task of rootTasks) {
      if (task.sectionId) {
        if (!sections.has(task.sectionId)) {
          sections.set(task.sectionId, []);
        }
        sections.get(task.sectionId)!.push(task);
      } else {
        withoutSection.push(task);
      }
    }

    return {
      tasksMap: map,
      sectionMap: sections,
      tasksWithoutSection: withoutSection,
    };
  }, [rootTasks]);

  return {
    ...query,
    tasks: rootTasks,
    tree: rootTasks,
    tasksMap,
    sectionMap,
    tasksWithoutSection,
  };
}


