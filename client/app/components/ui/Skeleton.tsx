/**
 * Skeleton Components for loading states
 * Provides consistent loading animations for form elements
 */

interface FormFieldSkeletonProps {
  label?: string;
  placeholder?: string;
}

interface TextSkeletonProps {
  width?: string;
}

/**
 * FormFieldSkeleton Component
 * 
 * Skeleton for form input fields with label and placeholder
 */
export function FormFieldSkeleton({ label, placeholder }: FormFieldSkeletonProps) {
  return (
    <div className="relative mb-5">
      <div className="h-[55px] rounded-lg border-2 border-border bg-surface animate-pulse">
        {/* Floating label skeleton */}
        {label && (
          <div className="absolute left-4 -top-2 px-2 h-5 flex items-center">
            <div 
              className="w-16 h-3 bg-text-secondary/20 rounded animate-pulse"
              style={{ width: `${label.length * 0.6}rem` }}
            ></div>
          </div>
        )}
        {/* Input placeholder skeleton */}
        {placeholder && (
          <div className="absolute left-5 top-1/2 -translate-y-1/2">
            <div 
              className="h-4 bg-text-secondary/10 rounded animate-pulse"
              style={{ width: `${placeholder.length * 0.7}rem` }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * ButtonSkeleton Component
 * 
 * Skeleton for button elements
 */
export function ButtonSkeleton() {
  return (
    <div className="w-full h-10 bg-primary/20 rounded-md animate-pulse"></div>
  );
}

/**
 * TextSkeleton Component
 * 
 * Skeleton for text elements with customizable width
 */
export function TextSkeleton({ width = "w-32" }: TextSkeletonProps) {
  return (
    <div className={`h-4 bg-text-secondary/20 rounded animate-pulse ${width}`}></div>
  );
}
