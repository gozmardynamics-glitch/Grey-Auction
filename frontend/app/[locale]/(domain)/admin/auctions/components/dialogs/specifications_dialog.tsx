'use client';

import {
  CircleCheck,
  Car,
  Shield,
  Thermometer,
  Palette,
  DoorOpen,
  Box,
  AlertTriangle,
  Cog,
  Gauge,
  Armchair,
  ParkingCircle,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Separator,
} from '@/shared/components/common';
import { type SpecificationItem } from '../auction_details_data';

// Keys map to admin.auctions.dialogs.specs.* catalog entries; DUMMY_SPECS
// labels carry the same catalog keys (model-as-keys).
const specIconMap: Record<string, LucideIcon> = {
  body: Car,
  airbags: Shield,
  climatisation: Thermometer,
  color: Palette,
  doorCount: DoorOpen,
  cubicCapacity: Box,
  emissionClass: AlertTriangle,
  gearbox: Cog,
  mileage: Gauge,
  seatCount: Armchair,
  parkingSensors: ParkingCircle,
  power: Zap,
};

interface SpecificationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  specs: SpecificationItem[];
}

export function SpecificationsDialog({
  open,
  onOpenChange,
  specs,
}: SpecificationsDialogProps) {
  const t = useTranslations('admin.auctions.dialogs');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            {t('specifications')}
          </DialogTitle>
        </DialogHeader>
        <Separator />
        <div className="grid grid-cols-2 gap-x-8 gap-y-0">
          {specs.map((spec, index) => {
            const Icon = specIconMap[spec.label] ?? CircleCheck;
            const label = t.has(`specs.${spec.label}`)
              ? t(`specs.${spec.label}` as 'specs.body')
              : spec.label;
            return (
              <div
                key={index}
                className="flex items-center gap-3 border-b py-4 last:border-b-0"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex flex-1 items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span className="text-sm font-medium">{spec.value}</span>
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
