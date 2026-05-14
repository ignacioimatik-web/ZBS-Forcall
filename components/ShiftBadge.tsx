import React from 'react';

interface ShiftBadgeProps {
  kind: string;
  type?: string;
}

const badgeConfig: Record<string, { label: string; className: string }> = {
  libranza: { label: 'L', className: 'bg-emerald-600 text-white' },
  dobla: { label: 'R', className: 'bg-orange-600 text-white' },
  guardia_medica: { label: 'M', className: 'bg-blue-600 text-white' },
  guardia_enfermeria: { label: 'E', className: 'bg-rose-600 text-white' },
  vacacion: { label: 'VAC', className: 'bg-violet-600 text-white' },
};

export const ShiftBadge: React.FC<ShiftBadgeProps> = ({ kind, type }) => {
  const key = kind === 'guardia' && type ? `guardia_${type}` : kind;
  const config = badgeConfig[key];

  if (!config) return null;

  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded leading-none shrink-0 ${config.className}`}>
      {config.label}
    </span>
  );
};
