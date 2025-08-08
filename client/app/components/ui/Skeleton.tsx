/**
 * Skeleton Components
 * 
 * Loading placeholders that match the theme and provide
 * a smooth loading experience for authentication forms.
 */

interface SkeletonProps {
  className?: string;
  width?: string;
}

interface FormFieldSkeletonProps {
  label?: string;
  placeholder?: string;
}

/**
 * FormFieldSkeleton Component
 * 
 * Skeleton for form input fields with label and placeholder
 */
export function FormFieldSkeleton({ label, placeholder }: FormFieldSkeletonProps) {
  return (
    <div className="space-y-2">
      <div className="h-4 bg-text-secondary rounded w-24 animate-pulse"></div>
      <div className="h-10 bg-surface border border-border rounded px-3 animate-pulse"></div>
    </div>
  );
}

/**
 * ButtonSkeleton Component
 * 
 * Skeleton for buttons with consistent styling
 */
export function ButtonSkeleton() {
  return (
    <div className="w-full h-10 bg-primary rounded-lg animate-pulse"></div>
  );
}

/**
 * TextSkeleton Component
 * 
 * Skeleton for text elements with customizable width
 */
export function TextSkeleton({ width = "w-32" }: SkeletonProps) {
  return (
    <div className={`h-4 bg-text-secondary rounded animate-pulse ${width}`}></div>
  );
}
