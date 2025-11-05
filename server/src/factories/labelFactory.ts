type LabelSummary = {
  id: string;
  nombre: string;
  color: string;
  userId?: string;
};

type RawTaskLabel = {
  taskId: string;
  labels: LabelSummary;
};

type RawLabel = {
  id: string;
  nombre: string;
  color: string;
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
  task_labels?: RawTaskLabel[];
  _count?: {
    task_labels?: number;
    [key: string]: number | undefined;
  } | null;
};

const mapCounts = (count?: RawLabel['_count']) => {
  if (!count) return undefined;
  return {
    tasks: count.task_labels ?? 0,
  };
};

const mapTaskLabels = (taskLabels?: RawTaskLabel[]) => {
  if (!taskLabels) return [];
  return taskLabels.map((tl) => ({
    taskId: tl.taskId,
    labelId: tl.labels.id,
  }));
};

export function toClientLabel(label: RawLabel | null | undefined) {
  if (!label) return label;

  return {
    id: label.id,
    nombre: label.nombre,
    color: label.color,
    userId: label.userId,
    createdAt: label.createdAt?.toISOString?.() ?? label.createdAt,
    updatedAt: label.updatedAt?.toISOString?.() ?? label.updatedAt,
    _count: mapCounts(label._count),
    taskRelationships: mapTaskLabels(label.task_labels),
  };
}

export const labelFactory = {
  toClientLabel,
};


