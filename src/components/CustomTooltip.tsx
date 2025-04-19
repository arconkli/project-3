import React from 'react';
import { TooltipProps } from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

interface CustomTooltipProps extends TooltipProps<ValueType, NameType> {
  currency?: boolean;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, currency = false }) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="bg-black/90 border border-gray-800 rounded-lg p-3 shadow-lg">
      <p className="text-gray-400 text-sm mb-1">{label}</p>
      {payload.map((item, index) => (
        <p key={index} className="text-sm font-medium" style={{ color: item.color }}>
          {item.name}: {currency ? '$' : ''}{item.value?.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

export default CustomTooltip; 