"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { cn } from "@/app/lib/utils";
import { ChevronDown } from "@styled-icons/boxicons-regular/ChevronDown";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectFieldProps {
  label: string;
  value?: string;
  onChange?: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
  className?: string;
}

export function SelectField({ label, value = "", onChange, options, disabled = false, className }: SelectFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const hasValue = !!value && value.length > 0;
  const isActive = isFocused || hasValue;

  const selectedOption = options.find(opt => opt.value === value);

  const borderColor = useMemo(() => {
    if (isActive) return "var(--color-primary)";
    if (isHovered) return "#525252";
    return "var(--color-border)";
  }, [isActive, isHovered]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange?.(optionValue);
    setIsOpen(false);
    setIsFocused(false);
  };

  return (
    <div
      className={cn("relative w-full min-w-[240px] max-w-[400px]", className)}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      ref={dropdownRef}
    >
      <fieldset
        className="relative h-[55px] rounded-lg border-2 cursor-pointer"
        style={{
          position: "relative",
          height: "45px",
          border: `${isActive ? "2px" : "1px"} solid ${borderColor}`,
          borderRadius: "8px",
          transition: `border-color ${isActive ? "180ms" : "70ms"} ease-in-out, border-width 180ms ease-in-out`,
          backgroundColor: "transparent",
          display: "flex",
          alignItems: "center",
        }}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
      >
        <label
          className={cn(
            "absolute pointer-events-none",
            isActive
              ? "left-4 -top-2 text-xs px-2 h-5 flex items-center font-bold"
              : "left-5 top-1/2 -translate-y-1/2 text-base h-[22px] flex items-center font-normal"
          )}
          style={{
            color: isActive ? "var(--color-primary)" : isHovered ? "var(--text)" : "var(--color-text-secondary)",
            fontFamily: "var(--font-sans)",
            background: isActive ? "var(--surface)" : "transparent",
            padding: isActive ? "0 8px" : "0 8px 0 8px",
            height: isActive ? "14px" : "22px",
            display: "flex",
            alignItems: "center",
            transition: "all 180ms cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          {label}
        </label>

        <div className="flex-1 px-5 py-2 text-text">
          {selectedOption ? selectedOption.label : ''}
        </div>

        <div className="pr-4 flex items-center">
          <ChevronDown 
            size={20} 
            className={cn(
              "text-text-secondary transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </div>
      </fieldset>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {options.map((option) => (
            <div
              key={option.value}
              className={cn(
                "px-4 py-2 cursor-pointer hover:bg-/10 transition-colors text-text",
                option.value === value && "bg-primary/10 text-primary"
              )}
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


