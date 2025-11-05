import type { tasks } from '@prisma/client';

type RawTask = Partial<tasks> & {
  task_labels?: Array<{ labels: any } & Record<string, any>>;
  other_tasks?: RawTask[];
  tasks?: RawTask | null;
  projects?: {
    id: string;
    nombre: string;
    color?: string | null;
  } | null;
  sections?: {
    id: string;
    nombre: string;
  } | null;
  _count?: {
    other_tasks?: number;
    comments?: number;
    reminders?: number;
    [key: string]: number | undefined;
  } | null;
  labels?: any[];
  subTasks?: RawTask[];
  parentTask?: RawTask | null;
};

const mapTaskLabels = (taskLabels?: RawTask['task_labels'], fallbackLabels?: any[]) => {
  if (taskLabels && taskLabels.length > 0) {
    return taskLabels.map((tl) => {
      const { labels: label, ...rest } = tl;
      return {
        ...rest,
        label,
      };
    });
  }

  return fallbackLabels || [];
};

const mapSubTasks = (subTasks?: RawTask['other_tasks'], fallbackSubTasks?: RawTask[]) => {
  if (subTasks && subTasks.length > 0) {
    return subTasks.map((st) => toClientTask(st));
  }

  return fallbackSubTasks ? fallbackSubTasks.map((st) => toClientTask(st)) : [];
};

const mapCounts = (count?: RawTask['_count']) => {
  if (!count) return count;

  const normalized = { ...count } as Record<string, any>;
  if (normalized.other_tasks !== undefined) {
    normalized.subTasks = normalized.other_tasks;
    delete normalized.other_tasks;
  }

  return normalized;
};

export function toClientTask(task: RawTask | null | undefined): any {
  if (!task) return task;

  const {
    task_labels,
    other_tasks,
    tasks: parentTask,
    projects,
    sections,
    _count,
    labels,
    subTasks,
    parentTask: fallbackParent,
    ...rest
  } = task;

  return {
    ...rest,
    project: projects
      ? {
          id: projects.id,
          nombre: projects.nombre,
          color: projects.color ?? undefined,
        }
      : undefined,
    section: sections
      ? {
          id: sections.id,
          nombre: sections.nombre,
        }
      : undefined,
    labels: mapTaskLabels(task_labels, Array.isArray(labels) ? labels : []),
    subTasks: mapSubTasks(other_tasks, Array.isArray(subTasks) ? subTasks : []),
    parentTask: parentTask
      ? toClientTask(parentTask)
      : fallbackParent
      ? toClientTask(fallbackParent)
      : undefined,
    _count: mapCounts(_count),
  };
}

export const taskFactory = {
  toClientTask,
};


