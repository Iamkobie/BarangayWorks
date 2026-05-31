import { useMapStore } from '../../store/mapStore';
import type { JobCategory } from '../../types';
import { mockWorkers } from '../../data/mockWorkers';

const JOB_CATEGORIES: { value: JobCategory; label: string; emoji: string; color: string; bgColor: string; borderColor: string }[] = [
  { value: 'plumber', label: 'Plumber', emoji: '🔧', color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-300' },
  { value: 'electrician', label: 'Electrician', emoji: '⚡', color: 'text-amber-700', bgColor: 'bg-amber-50', borderColor: 'border-amber-300' },
  { value: 'carpenter', label: 'Carpenter', emoji: '🪚', color: 'text-emerald-700', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-300' },
  { value: 'mason', label: 'Mason', emoji: '🧱', color: 'text-violet-700', bgColor: 'bg-violet-50', borderColor: 'border-violet-300' },
  { value: 'laborer', label: 'Laborer', emoji: '💪', color: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-300' },
];

/**
 * Get count of workers matching a specific category from mock data.
 */
function getWorkerCount(category: JobCategory): number {
  return mockWorkers.filter((w) => w.primarySkill === category).length;
}

/**
 * FilterPanel - Displays job category filter buttons with colorful icons and count badges.
 * Features smooth hover animations and distinct visual styling per category.
 */
export default function FilterPanel() {
  const { selectedCategories, toggleCategory, clearCategories } = useMapStore();

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-800">Job Category</h3>
        {selectedCategories.length > 0 && (
          <button
            onClick={clearCategories}
            className="text-xs font-medium text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center transition-all duration-200 hover:scale-105 shadow-sm"
            aria-label="Clear all category filters"
          >
            Clear all ✕
          </button>
        )}
      </div>
      <div className="space-y-2">
        {JOB_CATEGORIES.map(({ value, label, emoji, color, bgColor, borderColor }) => {
          const isSelected = selectedCategories.includes(value);
          const count = getWorkerCount(value);
          return (
            <button
              key={value}
              onClick={() => toggleCategory(value)}
              className={`
                w-full text-left px-4 py-3 min-h-[48px] rounded-xl text-sm font-medium
                transition-all duration-200 ease-out
                border-2 flex items-center gap-3
                hover:scale-[1.02] hover:shadow-md active:scale-[0.98]
                ${isSelected
                  ? `${bgColor} ${color} ${borderColor} shadow-sm`
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }
              `}
              aria-pressed={isSelected}
              aria-label={`Filter by ${label}`}
            >
              <span className="text-xl flex-shrink-0" role="img" aria-hidden="true">{emoji}</span>
              <span className="flex-1">{label}</span>
              <span className={`
                text-xs font-bold px-2 py-0.5 rounded-full
                ${isSelected ? 'bg-white/70 text-gray-700' : 'bg-gray-100 text-gray-500'}
              `}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
