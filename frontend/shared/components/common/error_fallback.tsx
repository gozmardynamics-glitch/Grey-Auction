import { notFound } from 'next/navigation';

const ErrorFallback = ({
  error,
}: {
  error?: { status?: number; message?: string };
}) => {
  if (error?.status === 404) notFound();
  return <main>{error?.message || 'Something went wrong'}</main>;
};

export { ErrorFallback };
