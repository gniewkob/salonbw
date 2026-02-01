'use client';

import { useMemo } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import type { RevenueDataPoint } from '@/types';

interface Props {
    data: RevenueDataPoint[];
    loading?: boolean;
    showTips?: boolean;
}

export default function RevenueChart({
    data,
    loading,
    showTips = false,
}: Props) {
    const chartData = useMemo(() => {
        return data.map((point) => ({
            label: point.label,
            Przychód: point.revenue,
            Napiwki: point.tips,
            Wizyty: point.appointments,
        }));
    }, [data]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg text-gray-500">
                Brak danych dla wybranego okresu
            </div>
        );
    }

    return (
        <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                        dataKey="label"
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        axisLine={{ stroke: '#d1d5db' }}
                    />
                    <YAxis
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        axisLine={{ stroke: '#d1d5db' }}
                        tickFormatter={(value) =>
                            value >= 1000
                                ? `${(value / 1000).toFixed(0)}k`
                                : value
                        }
                    />
                    <Tooltip
                        formatter={(value, name) => [
                            name === 'Wizyty'
                                ? value
                                : `${Number(value).toLocaleString('pl-PL')} PLN`,
                            name,
                        ]}
                        contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        }}
                    />
                    <Legend />
                    <Bar
                        dataKey="Przychód"
                        fill="#25B4C1"
                        radius={[4, 4, 0, 0]}
                    />
                    {showTips && (
                        <Bar
                            dataKey="Napiwki"
                            fill="#10b981"
                            radius={[4, 4, 0, 0]}
                        />
                    )}
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
