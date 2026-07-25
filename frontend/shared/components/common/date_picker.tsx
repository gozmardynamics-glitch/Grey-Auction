'use client';

import * as React from 'react';

import {
  Button,
  Calendar,
  Field,
  FieldLabel,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '.';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

interface Props {
  label?: string;
  onFrequencyChange?: (frequency: string) => void;
  onDateChange?: (date: Date | undefined) => void;
}

export const DatePickerSimple: React.FC<Props> = ({
  label,
  onFrequencyChange,
  onDateChange,
}) => {
  const [date, setDate] = React.useState<Date>();
  const [frequency, setFrequency] = React.useState('daily');

  const handleDateChange = (newDate: Date | undefined) => {
    setDate(newDate);
    onDateChange?.(newDate);
  };

  const handleFrequencyChange = (newFrequency: string) => {
    setFrequency(newFrequency);
    onFrequencyChange?.(newFrequency);
  };

  return (
    <Field className="w-full">
      {label && <FieldLabel>{label}</FieldLabel>}
      <div className="flex">
        <Select value={frequency} onValueChange={handleFrequencyChange}>
          <SelectTrigger className="h-10 w-24 border-r-0 rounded-r-none border-border bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>
        <Popover>
          <PopoverTrigger
            asChild
            className="bg-background h-10 border-l-0 rounded-l-none"
          >
            <Button
              variant="outline"
              className="justify-start font-normal flex-1"
            >
              <CalendarIcon />
              {date ? (
                format(date, 'dd-MM-yyyy')
              ) : (
                <span>{format(new Date(), 'dd-MM-yyyy')}</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateChange}
              defaultMonth={date}
            />
          </PopoverContent>
        </Popover>
      </div>
    </Field>
  );
};
