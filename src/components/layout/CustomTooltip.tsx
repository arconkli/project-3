import { memo } from 'react';

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color?: string;
    unit?: string;
  }>;
  label?: string;
}

const CustomTooltip = memo(({ active, payload, label }: TooltipProps) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="p-4 border border-gray-700 bg-black rounded-lg shadow-lg" role="tooltip">
      <p className="font-bold text-base text-white mb-2" aria-label={`Month: ${label}`}>{label}</p>
      {payload.map((entry, index) => (
        <p key={`item-${index}`} className="text-sm mb-1" style={{ color: entry.color || '#FFFFFF' }}>
          {entry.name}: {entry.value} {entry.name === 'views' ? 'M' : entry.unit || ''}
        </p>
      ))}
    </div>
  );
});

CustomTooltip.displayName = 'CustomTooltip';

export default CustomTooltip;