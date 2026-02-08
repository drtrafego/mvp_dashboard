"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { addDays, format, subDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function DatePickerWithRange({
    className,
}: React.HTMLAttributes<HTMLDivElement>) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Initialize state from URL or default
    const [date, setDate] = React.useState<DateRange | undefined>(() => {
        const fromParam = searchParams.get("from");
        const toParam = searchParams.get("to");

        if (fromParam && toParam) {
            return {
                from: new Date(fromParam),
                to: new Date(toParam)
            };
        }

        // Default: Last 30 days
        return {
            from: subDays(new Date(), 30),
            to: new Date(),
        };
    });

    // Update URL when date changes
    useEffect(() => {
        if (date?.from && date?.to) {
            const params = new URLSearchParams(searchParams);
            params.set("from", format(date.from, "yyyy-MM-dd"));
            params.set("to", format(date.to, "yyyy-MM-dd"));
            router.push(`?${params.toString()}`);
        }
    }, [date, router, searchParams]);

    const presets = [
        { label: "Últimos 7 dias", days: 7 },
        { label: "Últimos 14 dias", days: 14 },
        { label: "Últimos 30 dias", days: 30 },
        { label: "Últimos 60 dias", days: 60 },
        { label: "Últimos 90 dias", days: 90 },
    ];

    const handlePresetSelect = (days: number | null) => {
        const to = new Date();
        const from = days ? addDays(to, -days) : new Date(2020, 0, 1);
        setDate({ from, to });
    };

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <button
                        id="date"
                        className={cn(
                            "w-[300px] justify-start text-left font-normal flex items-center gap-2 px-4 py-2 rounded-lg border border-input bg-background shadow-sm hover:bg-accent transition",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, "dd 'de' MMM, y", { locale: ptBR })} -{" "}
                                    {format(date.to, "dd 'de' MMM, y", { locale: ptBR })}
                                </>
                            ) : (
                                format(date.from, "dd 'de' MMM, y", { locale: ptBR })
                            )
                        ) : (
                            <span>Selecione um período</span>
                        )}
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <div className="flex">
                        {/* Presets Sidebar */}
                        <div className="border-r border-border p-2 space-y-1 w-[160px] bg-slate-50 dark:bg-slate-900/50">
                            {presets.map((preset) => (
                                <button
                                    key={preset.label}
                                    onClick={() => handlePresetSelect(preset.days)}
                                    className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md transition-colors"
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>

                        {/* Calendar */}
                        <div className="p-2">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={date?.from}
                                selected={date}
                                onSelect={setDate}
                                numberOfMonths={2}
                                locale={ptBR}
                                disabled={(date) =>
                                    date > new Date() || date < new Date("1900-01-01")
                                }
                            />
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}
