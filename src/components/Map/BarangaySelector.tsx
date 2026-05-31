import { useState, useRef, useEffect } from 'react';
import { useMapStore } from '../../store/mapStore';
import { barangays } from '../../data/barangays';
import { mockWorkers } from '../../data/mockWorkers';
import { filterBarangays } from '../../utils/filters';

/**
 * Get count of workers in a specific barangay from mock data.
 */
function getBarangayWorkerCount(barangayName: string): number {
  return mockWorkers.filter((w) => w.barangay === barangayName).length;
}

/**
 * BarangaySelector - Dropdown with typeahead filtering for barangay selection.
 * Features a pin icon, animated dropdown, and worker count per barangay.
 */
export default function BarangaySelector() {
  const { selectedBarangay, setBarangay, clearBarangay } = useMapStore();
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const barangayNames = barangays.map((b) => b.name);
  const filtered =
    search.length >= 1 ? filterBarangays(search, barangayNames) : barangayNames;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (name: string) => {
    setBarangay(name);
    setSearch('');
    setIsOpen(false);
  };

  const handleClear = () => {
    clearBarangay();
    setSearch('');
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <label className="block text-sm font-semibold text-gray-800 mb-2">
        📍 Barangay
      </label>
      {selectedBarangay ? (
        <div className="flex items-center gap-2 p-3 border-2 border-blue-200 rounded-xl bg-blue-50 transition-all duration-200">
          <span className="text-blue-600">📍</span>
          <span className="flex-1 text-sm font-medium text-blue-800 truncate">{selectedBarangay}</span>
          <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full font-medium">
            {getBarangayWorkerCount(selectedBarangay)} workers
          </span>
          <button
            onClick={handleClear}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-blue-400 hover:text-red-500 rounded-lg hover:bg-white/50 transition-all duration-200"
            aria-label="Clear barangay selection"
          >
            ✕
          </button>
        </div>
      ) : (
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">📍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Search barangay..."
            className="w-full pl-10 pr-4 py-3 min-h-[48px] border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300 transition-all duration-200 hover:border-gray-300"
          />
        </div>
      )}
      {isOpen && !selectedBarangay && (
        <ul className="absolute z-50 mt-2 w-full max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-xl animate-scale-in">
          {filtered.length > 0 ? (
            filtered.map((name) => {
              const count = getBarangayWorkerCount(name);
              return (
                <li key={name}>
                  <button
                    onClick={() => handleSelect(name)}
                    className="w-full text-left px-4 py-3 min-h-[44px] text-sm hover:bg-blue-50 focus:bg-blue-50 flex items-center justify-between transition-colors duration-150 first:rounded-t-xl last:rounded-b-xl"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-gray-400 text-xs">📍</span>
                      <span className="text-gray-700">{name}</span>
                    </span>
                    {count > 0 && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                        {count}
                      </span>
                    )}
                  </button>
                </li>
              );
            })
          ) : (
            <li className="px-4 py-3 text-sm text-gray-500 text-center">No barangays found</li>
          )}
        </ul>
      )}
    </div>
  );
}
