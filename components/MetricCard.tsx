import React from 'react';

interface MetricCardProps {
  count: number;
  label: string;
  accentColor: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({ count, label, accentColor }) => {
  return (
    <div className={`flex items-center gap-2.5 bg-white border border-gray-200 rounded-xl px-3.5 py-2 shadow-sm min-w-[80px]`}>
      <div className={`w-1 h-8 rounded-full ${accentColor}`} />
      <div className="flex flex-col leading-none">
        <span className="text-lg font-black text-gray-900">{count}</span>
        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
    </div>
  );
};
