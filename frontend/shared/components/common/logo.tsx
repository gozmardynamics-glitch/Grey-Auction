import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  href?: string;
  src?: string;
  alt?: string;
  className?: string;
}

const Logo = ({ href = '/', src, alt = 'Logo', className }: LogoProps) => {
  const content = src ? (
    <Image src={src} alt={alt} width={120} height={40} className={className} />
  ) : (
    <span className={cn('text-4xl font-bold text-primary', className)}>
      LOGO
    </span>
  );

  return <Link href={href}>{content}</Link>;
};

export { Logo };
export type { LogoProps };
