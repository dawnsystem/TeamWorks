import { useState } from 'react';
import { Clock, Calendar as CalendarIcon } from 'lucide-react';

interface ReminderPickerProps {
  onSelect: (date: Date) => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ReminderPicker({ onSelect, onCancel, loading }: ReminderPickerProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customDateTime, setCustomDateTime] = useState('');

  const presets = [
    { label: '15 minutos antes', minutes: -15 },
    { label: '30 minutos antes', minutes: -30 },
    { label: '1 hora antes', minutes: -60 },
    { label: '1 día antes', minutes: -1440 },
  ];

  const handlePresetClick = (minutes: number) => {
    const date = new Date();
    date.setMinutes(date.getMinutes() + minutes);
    onSelect(date);
  };

  const handleCustomSubmit = () => {
    if (!customDateTime) return;
    const date = new Date(customDateTime);
    if (isNaN(date.getTime())) {
      return;
    }
    onSelect(date);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2">
      {!showCustom ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            {presets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handlePresetClick(preset.minutes)}
                disabled={loading}
                className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition disabled:opacity-50 flex items-center gap-2 justify-center"
              >
                <Clock className="w-4 h-4" />
                {preset.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowCustom(true)}
            className="w-full px-3 py-2 text-sm bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition flex items-center gap-2 justify-center"
          >
            <CalendarIcon className="w-4 h-4" />
            Personalizado
          </button>
          <button
            onClick={onCancel}
            className="w-full px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition"
          >
            Cancelar
          </button>
        </>
      ) : (
        <div className="space-y-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha y hora
            </label>
            <input
              type="datetime-local"
              value={customDateTime}
              onChange={(e) => setCustomDateTime(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCustomSubmit}
              disabled={!customDateTime || loading}
              className="flex-1 px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
            >
              Confirmar
            </button>
            <button
              onClick={() => {
                setShowCustom(false);
                setCustomDateTime('');
              }}
              className="flex-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
              Atrás
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
