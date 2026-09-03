"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AdminFilterSelectOption {
  value: string;
  label: string;
}

interface AdminFilterSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  options: AdminFilterSelectOption[];
  className?: string;
}

export function AdminFilterSelect({
  value,
  onValueChange,
  placeholder,
  options,
  className = "w-full sm:w-[180px]",
}: AdminFilterSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
