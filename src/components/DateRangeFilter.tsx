import React, { useState } from 'react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { Calendar, CalendarIcon, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangeFilterProps {
  onDateRangeChange: (range: DateRange) => void;
  defaultRange?: string;
}

const predefinedRanges = {
  today: { label: 'Today', days: 0 },
  last7: { label: 'Last 7 Days', days: 7 },
  last30: { label: 'Last 30 Days', days: 30 },
  last90: { label: 'Last 90 Days', days: 90 },
  custom: { label: 'Custom Range', days: null }
};

export function DateRangeFilter({ onDateRangeChange, defaultRange = 'today' }: DateRangeFilterProps) {
  const [selectedRange, setSelectedRange] = useState(defaultRange);
  const [customRange, setCustomRange] = useState<{ from?: Date; to?: Date }>({});
  const [isCustomOpen, setIsCustomOpen] = useState(false);

  const getCurrentDateRange = (): DateRange => {
    const now = new Date();
    
    if (selectedRange === 'custom') {
      return {
        from: customRange.from || startOfDay(now),
        to: customRange.to || endOfDay(now)
      };
    }
    
    const range = predefinedRanges[selectedRange as keyof typeof predefinedRanges];
    if (range.days === 0) {
      return {
        from: startOfDay(now),
        to: endOfDay(now)
      };
    }
    
    return {
      from: startOfDay(subDays(now, range.days - 1)),
      to: endOfDay(now)
    };
  };

  const handleRangeChange = (value: string) => {
    setSelectedRange(value);
    
    if (value !== 'custom') {
      const range = getCurrentDateRange();
      onDateRangeChange(range);
    }
  };

  const handleCustomRangeApply = () => {
    if (customRange.from && customRange.to) {
      onDateRangeChange({
        from: startOfDay(customRange.from),
        to: endOfDay(customRange.to)
      });
      setIsCustomOpen(false);
    }
  };

  // Initialize with default range
  React.useEffect(() => {
    const range = getCurrentDateRange();
    onDateRangeChange(range);
  }, []);

  const currentRange = getCurrentDateRange();
  const formatDateRange = (range: DateRange) => {
    if (selectedRange !== 'custom') {
      return predefinedRanges[selectedRange as keyof typeof predefinedRanges].label;
    }
    return `${format(range.from, 'MMM d')} - ${format(range.to, 'MMM d, yyyy')}`;
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={selectedRange} onValueChange={handleRangeChange}>
        <SelectTrigger className="w-40">
          <Calendar className="h-4 w-4 mr-2" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(predefinedRanges).map(([key, range]) => (
            <SelectItem key={key} value={key}>
              {range.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedRange === 'custom' && (
        <Popover open={isCustomOpen} onOpenChange={setIsCustomOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn(
              "w-60 justify-start text-left font-normal",
              !customRange.from && "text-muted-foreground"
            )}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {customRange.from && customRange.to ? (
                `${format(customRange.from, 'MMM d')} - ${format(customRange.to, 'MMM d, yyyy')}`
              ) : (
                <span>Pick date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">From Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customRange.from ? format(customRange.from, 'MMM d, yyyy') : 'Select'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={customRange.from}
                        onSelect={(date) => setCustomRange(prev => ({ ...prev, from: date }))}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">To Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customRange.to ? format(customRange.to, 'MMM d, yyyy') : 'Select'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={customRange.to}
                        onSelect={(date) => setCustomRange(prev => ({ ...prev, to: date }))}
                        disabled={(date) => customRange.from ? date < customRange.from : false}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCustomOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCustomRangeApply}
                  disabled={!customRange.from || !customRange.to}
                >
                  Apply
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}

      <div className="text-sm text-muted-foreground">
        {formatDateRange(currentRange)}
      </div>
    </div>
  );
}