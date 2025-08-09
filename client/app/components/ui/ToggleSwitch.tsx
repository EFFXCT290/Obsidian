"use client";

import { forwardRef, useState, InputHTMLAttributes } from "react";
import { cn } from "@/app/lib/utils";

interface ToggleSwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  checked?: boolean;
  defaultChecked?: boolean;
}

export const ToggleSwitch = forwardRef<HTMLInputElement, ToggleSwitchProps>(
  ({ checked, defaultChecked, onChange, className, disabled, ...props }, ref) => {
    const [internalChecked, setInternalChecked] = useState(defaultChecked || false);
    const isControlled = checked !== undefined;
    const isOn = isControlled ? checked : internalChecked;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) setInternalChecked(e.target.checked);
      onChange?.(e);
    };

    return (
      <label className={cn("inline-flex items-center cursor-pointer select-none", disabled && "opacity-50 cursor-not-allowed", className)}>
        <input
          type="checkbox"
          className="sr-only"
          checked={isControlled ? checked : internalChecked}
          defaultChecked={defaultChecked}
          onChange={handleChange}
          ref={ref}
          disabled={disabled}
          aria-checked={isOn}
          {...props}
        />
        <span className={cn("relative w-[48px] h-[24px] flex items-center rounded-full transition-all duration-300 ease-out", isOn ? "bg-[#099FEB]" : "bg-[#888888]")}> 
          <span className={cn("absolute top-[3px] w-[18px] h-[18px] rounded-full bg-[#D9D9D9] transition-all duration-300 ease-out", isOn ? "left-[27px]" : "left-[3px]")} />
        </span>
      </label>
    );
  }
);

ToggleSwitch.displayName = "ToggleSwitch";


