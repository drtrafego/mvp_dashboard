"use client"

import * as React from "react"
import { Moon, Sun, Laptop } from "lucide-react"
import { useTheme } from "next-themes"

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

export function ModeToggle() {
    const { setTheme, theme } = useTheme()
    const [open, setOpen] = React.useState(false)
    const [mounted, setMounted] = React.useState(false)

    // Avoid hydration mismatch by only rendering theme after mount
    React.useEffect(() => {
        setMounted(true)
    }, [])

    // Show placeholder during SSR to avoid hydration mismatch
    const themeLabel = mounted
        ? (theme === 'system' ? 'Sistema' : theme === 'dark' ? 'Escuro' : 'Claro')
        : 'Tema'

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-orange-500" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-blue-400" />
                    <span className="sr-only">Toggle theme</span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        {themeLabel}
                    </span>
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-1" align="end">
                <div className="flex flex-col gap-1">
                    <button
                        onClick={() => { setTheme("light"); setOpen(false); }}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition"
                    >
                        <Sun className="h-4 w-4" />
                        <span>Claro</span>
                    </button>
                    <button
                        onClick={() => { setTheme("dark"); setOpen(false); }}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition"
                    >
                        <Moon className="h-4 w-4" />
                        <span>Escuro</span>
                    </button>
                    <button
                        onClick={() => { setTheme("system"); setOpen(false); }}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition"
                    >
                        <Laptop className="h-4 w-4" />
                        <span>Sistema</span>
                    </button>
                </div>
            </PopoverContent>
        </Popover>
    )
}
