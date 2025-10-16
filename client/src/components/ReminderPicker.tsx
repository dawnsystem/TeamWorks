import { useState } from 'react';
import { Clock, Calendar } from 'lucide-react';
import { addMinutes, addHours, addDays, format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ReminderPickerProps {
  taskDate?: string | null;
  onSelect: (date: Date) => void;
  onCancel: () => void;
}

export default function ReminderPicker({ taskDate, onSelect, onCancel }: ReminderPickerProps) {
  const [customDate, setCustomDate] = useState('');
  const [customTime, setCustomTime] = useState('');

  const baseDate = taskDate ? new Date(taskDate) : new Date();

  const presets = [
    { label: '15 minutos antes', date: addMinutes(baseDate, -15) },
    { label: '30 minutos antes', date: addMinutes(baseDate, -30) },
    { label: '1 hora antes', date: addHours(baseDate, -1) },
    { label: '1 día antes', date: addDays(baseDate, -1) },
  ];

  const handlePresetClick = (date: Date) => {
    onSelect(date);
  };

  const handleCustomSubmit = () => {
    if (!customDate || !customTime) {
      return;
    }
    const dateTime = new Date(`${customDate}T${customTime}`);
    onSelect(dateTime);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 w-80">
      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
        Añadir recordatorio
      </h3>

      {/* Presets */}
      <div className="space-y-2 mb-4">
        {presets.map((preset, index) => {
          const isPast = preset.date < new Date();
          return (
            <button
              key={index}
              onClick={() => !isPast && handlePresetClick(preset.date)}
              disabled={isPast}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                isPast
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{preset.label}</span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
                {format(preset.date, "d 'de' MMMM 'a las' HH:mm", { locale: es })}
              </div>
            </button>
          );
        })}
      </div>

      {/* Custom date/time */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Fecha y hora personalizada</span>
          </div>
        </label>
        <div className="space-y-2">
          <input
            type="date"
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="time"
            value={customTime}
            onChange={(e) => setCustomTime(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            <button
              onClick={handleCustomSubmit}
              disabled={!customDate || !customTime}
              className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-colors"
            >
              Añadir
            </button>
            <button
              onClick={onCancel}
              className="flex-1 px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
