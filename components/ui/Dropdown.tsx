"use client";

import { useEffect, useRef, useState, useId } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Check } from "lucide-react";

interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export function Dropdown({
  options,
  value,
  onChange,
  placeholder = "Select...",
  label,
  error,
  disabled = false,
  className,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const id = useId();

  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions =
    search
      ? options.filter((o) =>
          o.label.toLowerCase().includes(search.toLowerCase())
        )
      : options;

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-foreground"
        >
          {label}
        </label>
      )}

      <div
        ref={dropdownRef}
        className="relative"
      >
        {/* Trigger */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            "flex w-full items-center justify-between gap-2 rounded-lg border bg-background px-3 py-2 text-sm ring-offset-background transition-colors",
            "hover:border-muted-foreground/30",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-destructive",
            !selectedOption && "text-muted-foreground"
          )}
        >
          <span className={cn(!selectedOption && "text-muted-foreground")}>
            {selectedOption?.label || placeholder}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              isOpen && "rotate-180"
            )}
          />
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-card shadow-lg animate-in fade-in zoom-in-95 duration-100">
            {/* Search */}
            <div className="p-1 border-b border-border">
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                autoFocus
              />
            </div>

            {/* Options */}
            <div className="max-h-[200px] overflow-y-auto p-1">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                  No options found
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    disabled={option.disabled}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={cn(
                      "flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition-colors",
                      "hover:bg-muted/50",
                      "disabled:cursor-not-allowed disabled:opacity-50",
                      option.value === value && "bg-primary/10 text-primary"
                    )}
                  >
                    {option.icon && (
                      <span className="flex-shrink-0">{option.icon}</span>
                    )}
                    <span className="flex-1">{option.label}</span>
                    {option.value === value && (
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
