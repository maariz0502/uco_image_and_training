"use client";

import { useState, useEffect, useRef } from "react";

// Define the shape of a single option
export type DropdownOption = {
  label: string;
  value: string;
};

interface MultiSelectProps {
  label: string;             // Label above the box (e.g. "Assign Roles")
  options: DropdownOption[]; // The list of all possible choices
  selectedValues: string[];  // The list of currently selected values
  onChange: (values: string[]) => void; // Callback when selection changes
  placeholder?: string;
}

export default function MultiSelectDropdown({
  label,
  options,
  selectedValues,
  onChange,
  placeholder = "Select options..."
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((v) => v !== value)); // Remove
    } else {
      onChange([...selectedValues, value]); // Add
    }
  };

  return (
    <div className="relative w-full max-w-xs" ref={containerRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-gray-300 text-left px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex justify-between items-center"
      >
        <span className="block truncate text-gray-700">
          {selectedValues.length === 0
            ? <span className="text-gray-400">{placeholder}</span>
            : `${selectedValues.length} selected`}
        </span>
        <svg className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white shadow-xl max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          {options.map((option) => {
            const isSelected = selectedValues.includes(option.value);
            return (
              <div
                key={option.value}
                onClick={() => toggleOption(option.value)}
                className={`
                  cursor-pointer select-none relative py-2 pl-3 pr-9 
                  ${isSelected ? 'bg-blue-50 text-blue-900' : 'text-gray-900 hover:bg-gray-100'}
                `}
              >
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    readOnly
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3 pointer-events-none"
                  />
                  <span className={`block truncate ${isSelected ? 'font-semibold' : 'font-normal'}`}>
                    {option.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}