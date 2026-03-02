import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import { generateSalesHistory } from '../data/mockData';
import { useMemo } from 'react';

export function SparklineChart({ trend = 'rising' }) {
    const data = useMemo(() => generateSalesHistory(3000, trend).map((d, i) => ({ v: d.sales, i })), [trend]);
    const color = trend === 'rising' ? '#10b981' : trend === 'declining' ? '#ef4444' : '#3b82f6';

    return (
        <div style={{ width: 80, height: 36 }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} />
                    <Tooltip
                        contentStyle={{ background: '#0d0e1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 11, padding: '4px 8px' }}
                        formatter={(v) => [v.toLocaleString(), 'Sales']}
                        labelFormatter={() => ''}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
