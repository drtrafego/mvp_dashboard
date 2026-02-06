"use client";

import { Card, Title, AreaChart } from "@tremor/react";

interface MetricData {
    date: string;
    Google: number;
    Meta: number;
}

export function SpendComparisonChart({ data }: { data: MetricData[] }) {
    return (
        <Card>
            <Title>Spend Comparison: Google vs Meta</Title>
            <AreaChart
                className="mt-4 h-72"
                data={data}
                index="date"
                categories={["Google", "Meta"]}
                colors={["blue", "violet"]}
                valueFormatter={(number: number) =>
                    `$${Intl.NumberFormat("us").format(number).toString()}`
                }
            />
        </Card>
    );
}
