/**
 * Reusable authentication input component
 * Provides consistent styling for form inputs with error handling
 * Now uses the modern Figma floating label design
 */

import { FormField } from '@/app/components/ui/FigmaFloatingLabelInput';

interface AuthInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string;
  error?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function AuthInput({ 
  label, 
  error, 
  onChange, 
  value = '',
  ...props 
}: AuthInputProps) {
  // Handle the onChange event to convert from string to React.ChangeEvent
  const handleChange = (newValue: string) => {
    if (onChange) {
      // Create a synthetic event that mimics the original onChange
      const syntheticEvent = {
        target: { 
          value: newValue,
          name: props.name || '',
          type: props.type || 'text'
        }
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(syntheticEvent);
    }
  };

  return (
    <div className="mb-5">
      <FormField
        label={label}
        value={value as string}
        onChange={handleChange}
        type={props.type || 'text'}
        placeholder={props.placeholder}
        disabled={props.disabled}
        className="w-full"
      />
      {error && (
        <p className="mt-1 text-error text-sm">{error}</p>
      )}
    </div>
  );
}
