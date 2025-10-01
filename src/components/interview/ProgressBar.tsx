import React from "react";
import { calculatePercentage } from "../../lib/utils";

interface ProgressBarProps {
  current: number;
  total: number;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  total,
  className = "",
}) => {
  const percentage = calculatePercentage(current, total);

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex justify-between text-sm text-gray-600">
        <span>Progress</span>
        <span>
          {current} of {total}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-primary-500 h-full rounded-full transition-all duration-300 ease-out"
          data-progress={percentage}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
