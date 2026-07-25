import { Card, TypographyP, TypographySmall } from '@/shared/components/common';

export function ModalStatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <Card className="space-y-1 text-start border p-4 rounded-lg shadow-none">
      <TypographySmall className="text-xs text-muted-foreground">
        {label}
      </TypographySmall>
      <TypographyP className="text-sm font-semibold">{value}</TypographyP>
    </Card>
  );
}
