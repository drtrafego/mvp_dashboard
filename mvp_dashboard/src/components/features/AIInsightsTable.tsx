"use client";

import { Card, Title, Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell, Badge } from "@tremor/react";

interface AIInsight {
    id: string;
    externalAdId: string;
    performancePrediction: "High" | "Medium" | "Low";
    recommendation: string;
    confidenceScore: string;
    createdAt: Date;
}

export function AIInsightsTable({ insights }: { insights: AIInsight[] }) {
    const getBadgeColor = (prediction: string) => {
        switch (prediction) {
            case "High":
                return "green";
            case "Medium":
                return "yellow";
            case "Low":
                return "red";
            default:
                return "gray";
        }
    };

    return (
        <Card>
            <Title>AI Creative Insights</Title>
            <Table className="mt-4">
                <TableHead>
                    <TableRow>
                        <TableHeaderCell>Ad ID</TableHeaderCell>
                        <TableHeaderCell>Prediction</TableHeaderCell>
                        <TableHeaderCell>Confidence</TableHeaderCell>
                        <TableHeaderCell>Recommendation</TableHeaderCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {insights.map((insight) => (
                        <TableRow key={insight.id}>
                            <TableCell>{insight.externalAdId.slice(0, 10)}...</TableCell>
                            <TableCell>
                                <Badge color={getBadgeColor(insight.performancePrediction)}>
                                    {insight.performancePrediction}
                                </Badge>
                            </TableCell>
                            <TableCell>{(parseFloat(insight.confidenceScore) * 100).toFixed(0)}%</TableCell>
                            <TableCell className="max-w-md truncate">{insight.recommendation}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Card>
    );
}
