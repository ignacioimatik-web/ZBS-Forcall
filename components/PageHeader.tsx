import React from 'react';

interface Metric {
  count: number;
  label: string;
  accentColor: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  metrics?: Metric[];
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, metrics, actions }) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
      <div className="min-w-0">
        <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-sm text-gray-500 font-medium mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
        {metrics && metrics.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {metrics.map((m) => (
              <div
                key={m.label}
                className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3.5 py-2 shadow-sm min-w-[80px]"
              >
                <div className={`w-1 h-8 rounded-full ${m.accentColor}`} />
                <div className="flex flex-col leading-none">
                  <span className="text-lg font-black text-gray-900">{m.count}</span>
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">{m.label}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
