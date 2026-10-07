import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface UsageChartProps {
  data: any[];
  xKey: string;
  yKey1: string;
  yKey2?: string;
  color1?: string;
  color2?: string;
  title: string;
}

export const UsageChart: React.FC<UsageChartProps> = ({ 
  data, 
  xKey, 
  yKey1, 
  yKey2, 
  color1 = '#3b82f6', // blue-500
  color2 = '#10b981', // emerald-500
  title 
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">{title}</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={`color-${yKey1}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color1} stopOpacity={0.2}/>
                <stop offset="95%" stopColor={color1} stopOpacity={0}/>
              </linearGradient>
              {yKey2 && (
                <linearGradient id={`color-${yKey2}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color2} stopOpacity={0.2}/>
                  <stop offset="95%" stopColor={color2} stopOpacity={0}/>
                </linearGradient>
              )}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey={xKey} stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ color: '#0f172a' }}
            />
            <Area type="monotone" dataKey={yKey1} stroke={color1} fillOpacity={1} fill={`url(#color-${yKey1})`} />
            {yKey2 && (
              <Area type="monotone" dataKey={yKey2} stroke={color2} fillOpacity={1} fill={`url(#color-${yKey2})`} />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
