'use client';

import { cn } from '@/lib/utils';
import { forwardRef, InputHTMLAttributes } from 'react';
import { Search } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, error, type = 'text', ...props }, ref) => {
    return (
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          type={type}
          className={cn(
            'w-full h-10 px-4 bg-white border border-indigo-100 rounded-xl text-gray-800 placeholder:text-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
            'transition-all duration-200',
            icon && 'pl-10',
            error && 'border-red-500 focus:ring-red-500',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export const SearchInput = forwardRef<HTMLInputElement, Omit<InputProps, 'icon'>>(
  (props, ref) => (
    <Input ref={ref} icon={<Search className="w-4 h-4" />} {...props} />
  )
);

SearchInput.displayName = 'SearchInput';
