type RawReminder = {
  id: string;
  taskId: string;
  fechaHora: Date;
  enviado: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export function toClientReminder(reminder: RawReminder | null | undefined) {
  if (!reminder) return reminder;

  return {
    id: reminder.id,
    taskId: reminder.taskId,
    fechaHora: reminder.fechaHora.toISOString(),
    enviado: reminder.enviado,
    createdAt: reminder.createdAt.toISOString(),
    updatedAt: reminder.updatedAt.toISOString(),
  };
}

export const reminderFactory = {
  toClientReminder,
};


