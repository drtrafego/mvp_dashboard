"use client";

import React, { useEffect } from "react";
import { RangeCalendar, Button, Popover, PopoverTrigger, PopoverContent, ButtonGroup } from "@heroui/react";
import { today, getLocalTimeZone, parseDate } from "@internationalized/date";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";

export default function DateRangeHeader() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Default to last 30 days if no params
    const defaultEnd = today(getLocalTimeZone());
    const defaultStart = defaultEnd.subtract({ days: 30 });

    const [value, setValue] = React.useState({
        start: defaultStart,
        end: defaultEnd,
    });

    const [isOpen, setIsOpen] = React.useState(false);

    // Sync from URL on mount/update
    useEffect(() => {
        const fromParam = searchParams.get("from");
        const toParam = searchParams.get("to");

        if (fromParam && toParam) {
            try {
                setValue({
                    start: parseDate(fromParam),
                    end: parseDate(toParam),
                });
            } catch (e) {
                // Invalid date in URL, ignore
            }
        }
    }, [searchParams]);

    const handleDateChange = (newValue: any) => {
        setValue(newValue);
        // We generally wait for a specific "Apply" or user interaction to close, 
        // but for RangeCalendar, usually selection happens on click.
        // Let's update URL immediately or on close? 
        // Immediate update might trigger heavy server actions.
        // Let's defer update to a "Apply" button or just update on selection end?
        // RangeCalendar `onChange` fires on every click (start then end).
        // A better UX is to have presets and an "Apply" button or auto-apply when range is complete.
        // For now, let's auto-apply if both start/end are present and different (or same for single day).

        if (newValue.start && newValue.end) {
            updateUrl(newValue.start, newValue.end);
        }
    };

    const updateUrl = (start: any, end: any) => {
        const params = new URLSearchParams(searchParams);
        params.set("from", start.toString());
        params.set("to", end.toString());
        router.push(`${pathname}?${params.toString()}`);
    };

    const applyPreset = (days: number) => {
        const end = today(getLocalTimeZone());
        const start = end.subtract({ days: days });
        setValue({ start, end });
        updateUrl(start, end);
        setIsOpen(false);
    };

    return (
        <Popover placement="bottom" isOpen={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger>
                <Button
                    variant="bordered"
                    className="bg-background border-default-200 text-default-700 font-medium min-w-[240px] justify-start gap-3"
                    startContent={<CalendarIcon className="w-4 h-4 text-default-500" />}
                    endContent={<ChevronDown className="w-4 h-4 text-default-400" />}
                >
                    {value.start && value.end
                        ? `${value.start.toString()} - ${value.end.toString()}`
                        : "Selecione o período"}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-auto bg-background border border-default-200 shadow-lg rounded-xl overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                    {/* Presets Sidebar */}
                    <div className="flex flex-col p-2 gap-1 border-r border-default-100 bg-default-50 min-w-[140px]">
                        <p className="text-xs font-semibold text-default-500 px-2 py-1 mb-1">Períodos</p>
                        <Button size="sm" variant="light" className="justify-start h-8" onPress={() => applyPreset(0)}>Hoje</Button>
                        <Button size="sm" variant="light" className="justify-start h-8" onPress={() => applyPreset(6)}>Últimos 7 dias</Button>
                        <Button size="sm" variant="light" className="justify-start h-8" onPress={() => applyPreset(14)}>Últimos 15 dias</Button>
                        <Button size="sm" variant="light" className="justify-start h-8" onPress={() => applyPreset(29)}>Últimos 30 dias</Button>
                        <Button size="sm" variant="light" className="justify-start h-8" onPress={() => applyPreset(89)}>Últimos 3 meses</Button>
                    </div>

                    {/* Calendar Area */}
                    <div className="p-3">
                        <RangeCalendar
                            aria-label="Date Range Selection"
                            value={value as any}
                            onChange={handleDateChange}
                            visibleMonths={2}
                            pageBehavior="visible"
                            className="bg-transparent shadow-none border-none"
                        />
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
