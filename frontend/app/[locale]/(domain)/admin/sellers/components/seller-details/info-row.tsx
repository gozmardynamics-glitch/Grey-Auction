import { TypographyP, TypographySmall } from '@/shared/components/common';

export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <TypographySmall>{label}</TypographySmall>
      <TypographyP>{value}</TypographyP>
    </div>
  );
}
