"use client";

import React, { useMemo, useState } from "react";
import { cn } from "@/app/lib/utils";

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

  const hasValue = !!value && value.length > 0;
  const isActive = isFocused || hasValue;

  const borderColor = useMemo(() => {
    if (isActive) return "var(--color-primary)";
    if (isHovered) return "#525252";
    return "var(--color-border)";
  }, [isActive, isHovered]);

  return (
    <div
      className={cn("relative w-full min-w-[240px] max-w-[400px]", className)}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <fieldset
        className="relative h-[55px] rounded-lg border-2"
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

        <select
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          className="w-full h-[55px] px-5 bg-transparent outline-none text-text"
          style={{ border: "none" }}
        >
          {!hasValue && <option value="" hidden />}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-surface text-text">
              {opt.label}
            </option>
          ))}
        </select>
      </fieldset>
    </div>
  );
}


