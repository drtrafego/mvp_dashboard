"use client";

import { useMemo } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type RegionData = {
    name: string;
    value: number;
};

type BrazilMapProps = {
    data: RegionData[];
};

// Mapping GA4 "State of X" to BR State Codes
const STATE_MAPPING: Record<string, string> = {
    "State of Sao Paulo": "SP",
    "State of Rio de Janeiro": "RJ",
    "State of Minas Gerais": "MG",
    "State of Rio Grande do Sul": "RS",
    "State of Parana": "PR",
    "State of Santa Catarina": "SC",
    "State of Bahia": "BA",
    "Federal District": "DF",
    "State of Goias": "GO",
    "State of Pernambuco": "PE",
    "State of Ceara": "CE",
    "State of Espirito Santo": "ES",
    "State of Para": "PA",
    "State of Mato Grosso": "MT",
    "State of Amazonas": "AM",
    "State of Rio Grande do Norte": "RN",
    "State of Paraiba": "PB",
    "State of Maranhao": "MA",
    "State of Alagoas": "AL",
    "State of Piaui": "PI",
    "State of Mato Grosso do Sul": "MS",
    "State of Sergipe": "SE",
    "State of Rondonia": "RO",
    "State of Tocantins": "TO",
    "State of Acre": "AC",
    "State of Amapa": "AP",
    "State of Roraima": "RR",
};

// Grid Layout for Brazil (Hex/Square Style)
// 0,0 is top-left.
const BRAZIL_GRID = [
    { code: "RR", x: 2, y: 0 }, { code: "AP", x: 3, y: 0 },
    { code: "AM", x: 1, y: 1 }, { code: "PA", x: 3, y: 1 }, { code: "MA", x: 4, y: 1 }, { code: "CE", x: 5, y: 1 }, { code: "RN", x: 6, y: 1 },
    { code: "RO", x: 1, y: 2 }, { code: "MT", x: 2, y: 2 }, { code: "TO", x: 3, y: 2 }, { code: "PI", x: 4, y: 2 }, { code: "PB", x: 6, y: 2 },
    { code: "AC", x: 0, y: 2 }, { code: "BA", x: 5, y: 3 }, { code: "PE", x: 6, y: 3 }, { code: "AL", x: 7, y: 3 },
    { code: "MS", x: 2, y: 3 }, { code: "GO", x: 3, y: 3 }, { code: "DF", x: 4, y: 3 }, { code: "ES", x: 6, y: 4 }, { code: "SE", x: 7, y: 2 }, // Adjusted SE
    { code: "MG", x: 5, y: 4 },
    { code: "SP", x: 4, y: 5 }, { code: "RJ", x: 5, y: 5 },
    { code: "PR", x: 4, y: 6 },
    { code: "SC", x: 4, y: 7 },
    { code: "RS", x: 3, y: 8 },
];

export function BrazilGridMap({ data }: BrazilMapProps) {
    const processedData = useMemo(() => {
        const map = new Map<string, number>();
        let maxVal = 0;

        data.forEach(item => {
            const code = STATE_MAPPING[item.name] || item.name; // Fallback to name if not found
            if (code) {
                map.set(code, (map.get(code) || 0) + item.value);
                maxVal = Math.max(maxVal, map.get(code) || 0);
            }
        });

        return { map, maxVal: maxVal || 1 }; // Avoid div by zero
    }, [data]);

    const getColor = (value: number) => {
        if (value === 0) return "bg-gray-800 text-gray-600";
        const intensity = value / processedData.maxVal;
        if (intensity > 0.8) return "bg-orange-600 text-white font-bold";
        if (intensity > 0.5) return "bg-orange-500 text-white";
        if (intensity > 0.2) return "bg-orange-400 text-white";
        return "bg-orange-900/50 text-gray-300"; // Low value
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4">
            <div className="relative" style={{ width: "320px", height: "360px" }}>
                {BRAZIL_GRID.map((state) => {
                    const value = processedData.map.get(state.code) || 0;
                    const colorClass = getColor(value);

                    return (
                        <TooltipProvider key={state.code}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div
                                        className={`absolute flex items-center justify-center w-8 h-8 rounded-sm border border-gray-900/50 text-[10px] cursor-pointer transition-all hover:scale-110 hover:z-10 shadow-sm ${colorClass}`}
                                        style={{
                                            left: `${state.x * 36}px`,
                                            top: `${state.y * 36}px`,
                                        }}
                                    >
                                        {state.code}
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent className="bg-gray-900 border-gray-800 text-white text-xs">
                                    <p className="font-bold">{state.code}</p>
                                    <p>Acessos: {value}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    );
                })}
            </div>
            <div className="mt-4 flex gap-4 text-[10px] text-gray-500">
                <div className="flex items-center gap-1"><div className="w-2 h-2 bg-gray-800 rounded-full"></div> 0</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 bg-orange-900/50 rounded-full"></div> Baixo</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 bg-orange-500 rounded-full"></div> Alto</div>
            </div>
        </div>
    );
}
