"use client";

import { ChevronDown, X } from "lucide-react";
import { useState } from "react";

interface FilterOption {
  value: string;
  label: string;
}

interface FilterButtonProps {
  label: string;
  options: FilterOption[];
  activeValue?: string | null;
  onSelect: (value: string) => void;
  onClear: () => void;
}

export function FilterButton({
  label,
  options,
  activeValue,
  onSelect,
  onClear,
}: FilterButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const activeLabel = activeValue
    ? (options.find((o) => o.value === activeValue)?.label ?? label)
    : null;

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 h-(--input-button-height) px-3 py-2.5 border rounded-md transition-colors duration-300 text-sm font-medium cursor-pointer active:scale-95 ${
          activeValue
            ? "bg-primary/15 border-primary text-primary"
            : "bg-background border-border text-foreground"
        }`}
      >
        {activeLabel ?? label}
        {activeValue ? (
          <X
            size={14}
            onClick={(e) => {
              e.stopPropagation();
              onClear();
              setIsOpen(false);
            }}
            className="hover:opacity-70"
          />
        ) : (
          <ChevronDown
            size={16}
            className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-auto mt-2 w-48 max-w-[calc(100vw-2rem)] shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onSelect(option.value);
                setIsOpen(false);
              }}
              className={`w-full h-10 text-left px-4 py-1.5 text-foreground rounded-md text-sm transition-colors cursor-pointer border border-border-strong ${
                option.value === activeValue
                  ? "bg-primary font-semibold"
                  : "bg-background hover:bg-input"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {isOpen && (
        <button
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40"
          aria-label="Close dropdown"
        />
      )}
    </div>
  );
}
