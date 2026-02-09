"use client";

import { useMemo } from "react";
import { BRAZIL_STATES } from "./brazil-states-data";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type RegionData = {
    name: string;
    value: number;
};

type Props = {
    data: RegionData[];
    className?: string;
};

// Start of Day normalization mapping (GA4 English -> PT-BR/Internal ID)
const normalizeRegionName = (ga4Name: string): string => {
    const n = ga4Name.toLowerCase();
    if (n.includes("sao paulo") || n.includes("são paulo")) return "SP";
    if (n.includes("rio de janeiro")) return "RJ";
    if (n.includes("minas gerais")) return "MG";
    if (n.includes("bahia")) return "BA";
    if (n.includes("parana") || n.includes("paraná")) return "PR";
    if (n.includes("rio grande do sul")) return "RS";
    if (n.includes("pernambuco")) return "PE";
    if (n.includes("ceara") || n.includes("ceará")) return "CE";
    if (n.includes("para")) return "PA"; // Pará
    if (n.includes("santa catarina")) return "SC";
    if (n.includes("distrito federal") || n.includes("federal district")) return "DF";
    if (n.includes("goias") || n.includes("goiás")) return "GO";
    if (n.includes("maranhao") || n.includes("maranhão")) return "MA";
    if (n.includes("amazonas")) return "AM";
    if (n.includes("espirito santo") || n.includes("espírito santo")) return "ES";
    if (n.includes("paraiba") || n.includes("paraíba")) return "PB";
    if (n.includes("rio grande do norte")) return "RN";
    if (n.includes("mato grosso")) {
        return n.includes("sul") ? "MS" : "MT";
    }
    if (n.includes("alagoas")) return "AL";
    if (n.includes("piaui") || n.includes("piauí")) return "PI";
    if (n.includes("sergipe")) return "SE";
    if (n.includes("rondonia") || n.includes("rondônia")) return "RO";
    if (n.includes("tocantins")) return "TO";
    if (n.includes("acre")) return "AC";
    if (n.includes("amapa") || n.includes("amapá")) return "AP";
    if (n.includes("roraima")) return "RR";

    return "";
};

export function BrazilHeatMap({ data, className }: Props) {
    // 1. Process Data Map
    const dataMap = useMemo(() => {
        const map = new Map<string, number>();
        let maxVal = 0;

        data.forEach(item => {
            const id = normalizeRegionName(item.name);
            if (id) {
                const current = map.get(id) || 0;
                map.set(id, current + item.value);
                if ((current + item.value) > maxVal) maxVal = current + item.value;
            }
        });

        return { map, max: maxVal > 0 ? maxVal : 1 };
    }, [data]);

    // 2. Color Scale Function (Orange/Gold theme)
    const getColor = (id: string) => {
        const value = dataMap.map.get(id) || 0;
        const intensity = value / dataMap.max;

        // Base color: #f59e0b (Amber-500) -> rgb(245, 158, 11)
        // Lightest: #fffbeb (Amber-50) -> rgb(255, 251, 235)

        if (value === 0) return "#f3f4f6"; // Gray-100 for no data

        // Simple opacity based interpolation for "Heat" style
        // Or distinct steps
        if (intensity > 0.8) return "#b45309"; // Amber-700
        if (intensity > 0.6) return "#d97706"; // Amber-600
        if (intensity > 0.4) return "#f59e0b"; // Amber-500
        if (intensity > 0.2) return "#fbbf24"; // Amber-400
        return "#fcd34d"; // Amber-300
    };

    return (
        <div className={`w-full h-full flex items-center justify-center ${className}`}>
            <TooltipProvider>
                <svg
                    viewBox="100 0 500 500" // Adjusted viewbox for Brazil shape
                    className="w-full h-full max-h-[400px]"
                    style={{ filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.1))" }}
                >
                    {BRAZIL_STATES.map((state) => {
                        const value = dataMap.map.get(state.id) || 0;
                        return (
                            <Tooltip key={state.id}>
                                <TooltipTrigger asChild>
                                    <path
                                        d={state.path}
                                        fill={getColor(state.id)}
                                        stroke="#ffffff"
                                        strokeWidth="0.5"
                                        className="transition-all duration-200 hover:opacity-80 cursor-pointer hover:stroke-gray-400"
                                        style={{ outline: "none" }}
                                    />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <div className="flex flex-col gap-1">
                                        <span className="font-bold">{state.name}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {value} acessos
                                        </span>
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        );
                    })}
                </svg>
            </TooltipProvider>

            {/* Gradient Legend Overlay */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                <div className="bg-white/80 dark:bg-black/50 backdrop-blur px-2 py-1 rounded text-[10px] font-mono text-gray-500">
                    1
                </div>
                <div className="h-1.5 flex-1 mx-2 bg-gradient-to-r from-amber-100 via-amber-400 to-amber-800 rounded-full opacity-80" />
                <div className="bg-white/80 dark:bg-black/50 backdrop-blur px-2 py-1 rounded text-[10px] font-mono text-gray-500">
                    {dataMap.max.toLocaleString()}
                </div>
            </div>
        </div>
    );
}
