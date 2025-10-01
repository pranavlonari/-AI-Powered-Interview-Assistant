import React, { useState, useEffect } from "react";

interface RealTimeProcessingProps {
  isProcessing: boolean;
  progress: number;
  stage: string;
  extractedData?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

const RealTimeProcessing: React.FC<RealTimeProcessingProps> = ({
  isProcessing,
  progress,
  stage,
  extractedData,
}) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    if (isProcessing) {
      const interval = setInterval(() => {
        setAnimatedProgress((prev) => {
          if (prev < progress) {
            return Math.min(prev + 2, progress);
          }
          return progress;
        });
      }, 50);

      return () => clearInterval(interval);
    }
  }, [progress, isProcessing]);

  if (!isProcessing && !extractedData) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center mb-3">
        <div className="flex-shrink-0">
          {isProcessing ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          ) : (
            <div className="rounded-full h-5 w-5 bg-green-500 flex items-center justify-center">
              <svg
                className="h-3 w-3 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          )}
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-blue-900">
            {isProcessing
              ? "Processing Resume..."
              : "Resume Processed Successfully!"}
          </h3>
          <p className="text-sm text-blue-700">{stage}</p>
        </div>
      </div>

      {isProcessing && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-blue-600 mb-1">
            <span>Progress</span>
            <span>{animatedProgress}%</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              data-progress={animatedProgress}
              style={{ width: `${animatedProgress}%` }}
            />
          </div>
        </div>
      )}

      {extractedData && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-green-800 mb-2">
            ✅ Extracted Information:
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-white rounded-md p-2 border border-green-200">
              <div className="text-xs text-green-600 font-medium">Name</div>
              <div className="text-sm text-green-900">
                {extractedData.name || (
                  <span className="text-red-500 italic">Not found</span>
                )}
              </div>
            </div>
            <div className="bg-white rounded-md p-2 border border-green-200">
              <div className="text-xs text-green-600 font-medium">Email</div>
              <div className="text-sm text-green-900">
                {extractedData.email || (
                  <span className="text-red-500 italic">Not found</span>
                )}
              </div>
            </div>
            <div className="bg-white rounded-md p-2 border border-green-200">
              <div className="text-xs text-green-600 font-medium">Phone</div>
              <div className="text-sm text-green-900">
                {extractedData.phone || (
                  <span className="text-red-500 italic">Not found</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="mt-3 text-xs text-blue-600">
          <div className="flex items-center space-x-2">
            <span>🤖</span>
            <span>AI analyzing your resume in real-time...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealTimeProcessing;
