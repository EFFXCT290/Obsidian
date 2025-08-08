"use client";

import React, { useState } from "react";
import { cn } from "@/app/lib/utils";

export interface FormFieldProps {
  label: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  className?: string;
}

export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  (
    {
      label,
      value = "",
      onChange,
      placeholder,
      type = "text",
      disabled = false,
      className,
    },
    ref,
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const hasValue = value.length > 0;
    const isActive = isFocused || hasValue;
    const isNumberInput = type === "number";

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e.target.value);
    };

    const getBorderColor = () => {
      if (isActive) {
        return "var(--color-primary)";
      }
      if (isHovered) {
        return "#525252";
      }
      return "var(--color-border)";
    };

    const inputStyle: React.CSSProperties = {
      width: "100%",
      height: "55px", // Fixed height matches container
      padding: isNumberInput ? "0 36px 0 20px" : "0 20px", // Extra padding for number input to make room for custom arrows
      backgroundColor: "transparent",
      border: "none",
      outline: "none",
      fontFamily: "var(--font-geist-sans)",
      fontSize: "16px",
      color: "var(--text)",
      lineHeight: "1.5",
      boxSizing: "border-box",
      display: "block",
      cursor: disabled ? "not-allowed" : "text",
      opacity: disabled ? 0.5 : 1,
      // Hide default number input arrows
      ...(isNumberInput && {
        WebkitAppearance: "none",
        MozAppearance: "textfield",
        appearance: "textfield",
      }),
    };

    const fieldContainerStyle: React.CSSProperties = {
      position: "relative", 
      height: "45px",
      border: `${isActive ? '2px' : '1px'} solid ${getBorderColor()}`,
      borderRadius: "8px",
      transition: `border-color ${isActive ? "180ms" : "70ms"} ease-in-out, border-width 180ms ease-in-out`,
      backgroundColor: "transparent", // match background
      display: "flex",
      alignItems: "center",
    };

    // Custom arrow styles
    const arrowButtonStyle: React.CSSProperties = {
      position: "absolute",
      right: "8px",
      width: "20px",
      height: "20px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      color: "var(--color-text-secondary)",
      transition: "color 150ms ease-in-out",
      zIndex: 10,
    };

    const arrowUpStyle: React.CSSProperties = {
      ...arrowButtonStyle,
      top: "50%",
      transform: "translateY(-50%)",
      marginTop: "-5px",
    };

    const arrowDownStyle: React.CSSProperties = {
      ...arrowButtonStyle,
      top: "50%",
      transform: "translateY(-50%)",
      marginTop: "5px",
    };

    const handleArrowClick = (direction: 'up' | 'down') => {
      if (disabled) return;
      
      const currentValue = parseFloat(value) || 0;
      const newValue = direction === 'up' ? currentValue + 1 : currentValue - 1;
      onChange?.(newValue.toString());
    };

    return (
      <div
        className={cn("relative w-full min-w-[240px] max-w-[400px]", className)}
        onMouseEnter={() => !disabled && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <fieldset
          className="relative h-[55px] rounded-lg border-2"
          style={fieldContainerStyle}
        >
          {/* Floating label for both states */}
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
            htmlFor={label}
          >
            {label}
          </label>

          {/* Input field */}
          <input
            ref={ref}
            type={type}
            value={value}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={disabled}
            placeholder={isActive ? placeholder : ""}
            style={inputStyle}
            className="formfield-input"
          />

          {/* Custom number input arrows */}
          {isNumberInput && (
            <>
              {/* Arrow Up */}
              <button
                type="button"
                style={arrowUpStyle}
                onClick={() => handleArrowClick('up')}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--color-primary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--color-text-secondary)";
                }}
                disabled={disabled}
                className="hover:color-primary"
              >
                <svg width="14" height="14" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M6 2L10 6L9.3 6.7L6 3.4L2.7 6.7L2 6L6 2Z" />
                </svg>
              </button>

              {/* Arrow Down */}
              <button
                type="button"
                style={arrowDownStyle}
                onClick={() => handleArrowClick('down')}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--color-primary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--color-text-secondary)";
                }}
                disabled={disabled}
                className="hover:color-primary"
              >
                <svg width="14" height="14" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M6 10L2 6L2.7 5.3L6 8.6L9.3 5.3L10 6L6 10Z" />
                </svg>
              </button>
            </>
          )}
        </fieldset>
      </div>
    );
  },
);

FormField.displayName = "FormField";
