"use client";

import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "next-themes";

export interface ChartData {
    type: "line" | "bar" | "pie";
    title: string;
    data: any[];
    dataKeys: string[]; // Keys for the values (e.g., ["price"], ["portfolio_value"])
    xAxisKey?: string; // Key for the X-axis (e.g., "date", "name")
    colors?: string[];
}

interface ChartRendererProps {
    chartData: ChartData;
}

// Brand Colors (The Lazy Rich Identity)
const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];
const GRADIENTS = [
    { id: "colorEmerald", start: "#10b981", end: "#10b981" },
    { id: "colorBlue", start: "#3b82f6", end: "#3b82f6" },
    { id: "colorYellow", start: "#f59e0b", end: "#f59e0b" },
    { id: "colorRed", start: "#ef4444", end: "#ef4444" },
    { id: "colorPurple", start: "#8b5cf6", end: "#8b5cf6" },
];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/80 dark:bg-black/80 backdrop-blur-md border border-white/20 dark:border-white/10 p-3 rounded-xl shadow-lg">
                <p className="font-medium text-sm mb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                        <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-muted-foreground">
                            {entry.name}:
                        </span>
                        <span className="font-semibold">
                            {typeof entry.value === 'number'
                                ? entry.value.toLocaleString()
                                : entry.value}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export function ChartRenderer({ chartData }: ChartRendererProps) {
    const { type, title, data, dataKeys, xAxisKey = "name", colors = COLORS } = chartData;
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const commonAxisProps = {
        style: {
            fontSize: '11px',
            fontFamily: 'var(--font-pretendard)',
            fill: isDark ? '#a1a1aa' : '#71717a'
        },
        tickLine: false,
        axisLine: false,
        dy: 10
    };

    const renderChart = () => {
        switch (type) {
            case "line":
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                {GRADIENTS.map((grad, index) => (
                                    <linearGradient key={grad.id} id={grad.id} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={colors[index % colors.length] || grad.start} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={colors[index % colors.length] || grad.end} stopOpacity={0} />
                                    </linearGradient>
                                ))}
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#333" : "#eee"} />
                            <XAxis
                                dataKey={xAxisKey}
                                {...commonAxisProps}
                            />
                            <YAxis
                                {...commonAxisProps}
                                dx={-10}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                            {dataKeys.map((key, index) => (
                                <Area
                                    key={key}
                                    type="monotone"
                                    dataKey={key}
                                    stroke={colors[index % colors.length]}
                                    fillOpacity={1}
                                    fill={`url(#${GRADIENTS[index % GRADIENTS.length].id})`}
                                    strokeWidth={2}
                                    animationDuration={1500}
                                />
                            ))}
                        </AreaChart>
                    </ResponsiveContainer>
                );
            case "bar":
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#333" : "#eee"} />
                            <XAxis
                                dataKey={xAxisKey}
                                {...commonAxisProps}
                            />
                            <YAxis
                                {...commonAxisProps}
                                dx={-10}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                            {dataKeys.map((key, index) => (
                                <Bar
                                    key={key}
                                    dataKey={key}
                                    fill={colors[index % colors.length]}
                                    radius={[6, 6, 0, 0]}
                                    animationDuration={1500}
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                );
            case "pie":
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey={dataKeys[0]}
                                stroke="none"
                                animationDuration={1500}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                );
            default:
                return null;
        }
    };

    return (
        <Card className="w-full my-4 bg-white/40 dark:bg-black/40 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
            <CardHeader className="pb-2 bg-gradient-to-r from-transparent via-white/10 to-transparent">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                    {/* Optional Icon if needed */}
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">{renderChart()}</CardContent>
        </Card>
    );
}
