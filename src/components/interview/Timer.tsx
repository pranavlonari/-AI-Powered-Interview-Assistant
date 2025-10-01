import React, { useEffect, useState } from "react";
import { formatTime } from "../../lib/utils";

interface TimerProps {
  timeLeft: number;
  totalTime: number;
  isRunning: boolean;
  onTimeUp: () => void;
}

const Timer: React.FC<TimerProps> = ({
  timeLeft,
  totalTime,
  isRunning,
  onTimeUp,
}) => {
  const [isWarning, setIsWarning] = useState(false);

  useEffect(() => {
    // Show warning when less than 25% time remaining
    const warningThreshold = Math.max(10, totalTime * 0.25);
    setIsWarning(timeLeft <= warningThreshold && timeLeft > 0);
  }, [timeLeft, totalTime]);

  useEffect(() => {
    if (timeLeft === 0 && isRunning) {
      console.log("⏱️ Timer reached 0, triggering auto-submission");
      // Add small delay to ensure state is properly synchronized
      const timer = setTimeout(() => {
        onTimeUp();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [timeLeft, isRunning, onTimeUp]);

  const percentage = totalTime > 0 ? (timeLeft / totalTime) * 100 : 0;

  const getTimerColor = () => {
    if (timeLeft === 0) return "text-error-600";
    if (isWarning) return "text-warning-600";
    return "text-gray-900";
  };

  const getProgressColor = () => {
    if (timeLeft === 0) return "bg-error-500";
    if (isWarning) return "bg-warning-500";
    return "bg-primary-500";
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          Time Remaining
        </span>
        <span className={`text-lg font-mono font-bold ${getTimerColor()}`}>
          {formatTime(timeLeft)}
        </span>
      </div>

      <div className="relative">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-linear ${getProgressColor()}`}
            data-progress={percentage}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {isWarning && isRunning && (
          <div className="absolute -top-8 right-0 animate-bounce">
            <div className="bg-warning-100 text-warning-800 text-xs px-2 py-1 rounded-md shadow-sm">
              Time running out!
            </div>
          </div>
        )}
      </div>

      {timeLeft === 0 && (
        <div className="text-center">
          <span className="text-sm text-error-600 font-medium">
            Time's up! Answer will be submitted automatically.
          </span>
        </div>
      )}
    </div>
  );
};

export default Timer;
