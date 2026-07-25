import type { ButtonHTMLAttributes, ReactNode, TouchEvent } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

const variantClasses: Record<string, string> = {
  primary: 'bg-primary-600 text-white active:bg-primary-700',
  secondary: 'bg-gray-200 text-gray-700 active:bg-gray-300',
  danger: 'bg-red-500 text-white active:bg-red-600',
  ghost: 'bg-transparent text-primary-600 active:bg-primary-50',
};

const sizeClasses: Record<string, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2.5 text-base rounded-xl',
  lg: 'px-6 py-3 text-lg rounded-xl',
};

export function Button({ variant = 'primary', size = 'md', className = '', children, onClick, ...props }: Props) {
  const handleTouch = (e: TouchEvent<HTMLButtonElement>) => {
    // Prevent the default touch behavior (scrolling, zooming)
    // Then trigger the click handler if it exists
    if (onClick) {
      e.preventDefault();
      onClick(e as unknown as React.MouseEvent<HTMLButtonElement>);
    }
  };

  return (
    <button
      type="button"
      className={`font-medium transition-colors duration-150 min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation select-none ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      onTouchEnd={handleTouch}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}
