import type { ComponentProps, ComponentType, ElementType } from 'react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
interface InputWithIconProps extends ComponentProps<'input'> {
  icon: ElementType | ComponentType<LucideIcon>;
  iconPosition?: 'left' | 'right';
  iconClassName?: string;
  onIconClick?: () => void;
}

const Input = ({ className, type, ...props }: ComponentProps<'input'>) => {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground border-input h-12 w-full min-w-0 rounded-lg border bg-card px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed md:text-sm',
        'focus-visible:border-ring focus-visible:ring-ring/50 disabled:bg-input focus-visible:ring-[3px]',
        'aria-invalid:ring-destructive/20 aria-invalid:border-destructive placeholder:text-sm',
        className
      )}
      {...props}
    />
  );
};

const InputWithIcon = ({
  icon: Icon,
  iconPosition = 'right',
  className,
  iconClassName,
  onIconClick,
  ...props
}: InputWithIconProps) => {
  return (
    <div className="relative">
      <input
        data-slot="input"
        className={cn(
          'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground border-input h-12 w-full min-w-0 rounded-lg border bg-card px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed md:text-sm',
          'focus-visible:border-ring focus-visible:ring-ring/50 disabled:bg-input focus-visible:ring-[3px]',
          'aria-invalid:ring-destructive/20 aria-invalid:border-destructive placeholder:text-sm',
          className
        )}
        {...props}
      />
      <Icon
        onClick={onIconClick}
        className={cn(
          'absolute top-1/2 size-9 -translate-y-1/2 text-s p-2 cursor-pointer peer-focus:text-neutral-700 bg-secondary text-background transition-colors rounded-md',
          iconClassName,
          {
            'right-4': iconPosition === 'right',
            'left-4': iconPosition === 'left',
            'cursor-pointer': onIconClick,
          }
        )}
      />
    </div>
  );
};

export { Input, InputWithIcon };
