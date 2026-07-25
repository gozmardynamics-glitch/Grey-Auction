import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const TypographyH1 = ({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) => {
  return (
    <h1
      className={cn(
        'scroll-m-20 text-3xl md:text-4xl font-bold tracking-tight text-balance',
        className
      )}
      {...props}
    >
      {children}
    </h1>
  );
};

const TypographyH2 = ({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) => {
  return (
    <h2
      className={cn(
        'scroll-m-20 pb-2 text-2xl md:text-3xl font-semibold tracking-tight first:mt-0',
        className
      )}
      {...props}
    >
      {children}
    </h2>
  );
};

const TypographyH3 = ({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) => {
  return (
    <h3
      className={cn(
        'scroll-m-20 text-xl md:text-2xl font-semibold tracking-tight',
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
};

const TypographyH4 = ({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) => {
  return (
    <h4
      className={cn(
        'scroll-m-20 text-base md:text-xl font-semibold tracking-tight',
        className
      )}
      {...props}
    >
      {children}
    </h4>
  );
};

const TypographyP = ({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) => {
  return (
    <p className={cn('font-black text-sm', className)} {...props}>
      {children}
    </p>
  );
};

const TypographySmall = ({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) => {
  return (
    <small
      className={cn('text-xs leading-none font-medium text-muted-foreground', className)}
      {...props}
    >
      {children}
    </small>
  );
};

export {
  TypographyH1,
  TypographyH2,
  TypographyH3,
  TypographyH4,
  TypographyP,
  TypographySmall,
};
