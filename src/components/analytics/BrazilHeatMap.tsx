"use client";

import React, { useMemo, useState } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Brazil TopoJSON URL (Proved/Standard)
const BRAZIL_TOPO_JSON = "https://gist.githubusercontent.com/ruliana/1ccaaab05ea113b0dff3b22be3b4d637/raw/196c0332d38cb935cfca227d28f7cecfa70b412e/br-states.json";

type RegionData = {
    name: string;
    value: number;
};

type Props = {
    data: RegionData[];
    className?: string;
};

// Normalization: GA4 Name -> TopoJSON ID (Usually 2-letter code or matching name)
// The TopoJSON from the URL likely uses IDs like "BR-SP" or just "SP" or full names.
// We will inspect properties in the render, but standard mapping usually works.
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
    const { dataMap, maxVal } = useMemo(() => {
        const map = new Map<string, number>();
        let max = 0;

        data.forEach(item => {
            const id = normalizeRegionName(item.name);
            if (id) {
                const current = map.get(id) || 0;
                map.set(id, current + item.value);
                if ((current + item.value) > max) max = current + item.value;
            }
        });

        return { dataMap: map, maxVal: max > 0 ? max : 1 };
    }, [data]);

    // 2. Color Scale
    // Amber Scale: #fffbeb (0) -> #b45309 (Max)
    const colorScale = scaleLinear<string>()
        .domain([0, maxVal])
        .range(["#27272a", "#f59e0b"]); // Dark Gray (Empty) -> Amber (Full)

    return (
        <div className={`w-full h-full flex items-center justify-center relative ${className}`}>
            <ComposableMap
                projection="geoMercator"
                projectionConfig={{
                    scale: 600,
                    center: [-54, -15] // Center over Brazil
                }}
                className="w-full h-full max-h-[400px]"
                style={{ width: "100%", height: "100%" }}
            >
                <ZoomableGroup
                    center={[-54, -15]}
                    zoom={1}
                    disablePanning={true}
                    disableZooming={true}
                >
                    <Geographies geography={BRAZIL_TOPO_JSON}>
                        {({ geographies }) =>
                            geographies.map((geo) => {
                                // The TopoJSON 'id' for Brazil states usually matches the 2-letter code (e.g. "BR-SP" or "SP" or based on properties)
                                // Let's inspect properties in case 'id' is ISO numeric.
                                // The Gist `br-states.json` usually has `id` as "SP", "RJ", etc directly.
                                const geoId = geo.id as string;
                                const value = dataMap.get(geoId) || 0;
                                const hasData = dataMap.has(geoId);

                                return (
                                    <TooltipProvider key={geo.rsmKey}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Geography
                                                    geography={geo}
                                                    fill={hasData ? colorScale(value) : "#27272a"}
                                                    stroke="#18181b" // Darker border
                                                    strokeWidth={0.5}
                                                    style={{
                                                        default: { outline: "none" },
                                                        hover: { fill: "#fbbf24", outline: "none", cursor: "default" }, // Hover highlight
                                                        pressed: { outline: "none" },
                                                    }}
                                                />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-bold">{geo.properties?.name || geoId}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {value} acessos
                                                    </span>
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                );
                            })
                        }
                    </Geographies>
                </ZoomableGroup>
            </ComposableMap>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                <div className="bg-white/80 dark:bg-black/50 backdrop-blur px-2 py-1 rounded text-[10px] font-mono text-gray-500">
                    0
                </div>
                <div className="h-1.5 flex-1 mx-2 bg-gradient-to-r from-[#27272a] to-[#f59e0b] rounded-full opacity-80" />
                <div className="bg-white/80 dark:bg-black/50 backdrop-blur px-2 py-1 rounded text-[10px] font-mono text-gray-500">
                    {maxVal.toLocaleString()}
                </div>
            </div>
        </div>
    );
}

