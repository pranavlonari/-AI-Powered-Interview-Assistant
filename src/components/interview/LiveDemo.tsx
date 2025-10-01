import React, { useState, useEffect } from "react";

interface LiveDemoProps {
  show?: boolean;
}

const LiveDemo: React.FC<LiveDemoProps> = ({ show = false }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const demoSteps = [
    { stage: "File validation...", delay: 1000, progress: 15 },
    { stage: "Reading PDF content...", delay: 1500, progress: 30 },
    { stage: "Extracting raw text...", delay: 1200, progress: 50 },
    { stage: "AI analyzing patterns...", delay: 2000, progress: 70 },
    { stage: "Validating contact info...", delay: 1000, progress: 85 },
    { stage: "Processing complete!", delay: 500, progress: 100 },
  ];

  const sampleData = {
    name: "John Smith",
    email: "john.smith@email.com",
    phone: "(555) 123-4567",
  };

  const startDemo = () => {
    setIsRunning(true);
    setCurrentStep(0);
    setProgress(0);
  };

  const resetDemo = () => {
    setIsRunning(false);
    setCurrentStep(0);
    setProgress(0);
  };

  useEffect(() => {
    if (isRunning && currentStep < demoSteps.length) {
      const timer = setTimeout(() => {
        setProgress(demoSteps[currentStep].progress);
        if (currentStep < demoSteps.length - 1) {
          setCurrentStep((prev) => prev + 1);
        } else {
          // Demo complete
          setTimeout(() => {
            setIsRunning(false);
          }, 2000);
        }
      }, demoSteps[currentStep].delay);

      return () => clearTimeout(timer);
    }
  }, [isRunning, currentStep]);

  if (!show) return null;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-blue-900">
          🚀 Real-Time Processing Demo
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={startDemo}
            disabled={isRunning}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {isRunning ? "Running..." : "Start Demo"}
          </button>
          <button
            onClick={resetDemo}
            className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
          >
            Reset
          </button>
        </div>
      </div>

      {isRunning && (
        <div className="space-y-4">
          {/* Current Processing Stage */}
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-blue-800 font-medium">
              {demoSteps[currentStep]?.stage || "Initializing..."}
            </span>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-xs text-blue-600 mb-1">
              <span>Processing Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-out"
                data-progress={progress}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Sample Extracted Data */}
          {progress >= 70 && (
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <h4 className="text-sm font-medium text-green-800 mb-2">
                ✅ Live Data Extraction:
              </h4>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="text-center">
                  <div className="text-green-600 font-medium">Name</div>
                  <div className="text-green-900 animate-pulse">
                    {progress >= 85 ? sampleData.name : "..."}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-green-600 font-medium">Email</div>
                  <div className="text-green-900 animate-pulse">
                    {progress >= 90 ? sampleData.email : "..."}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-green-600 font-medium">Phone</div>
                  <div className="text-green-900 animate-pulse">
                    {progress >= 95 ? sampleData.phone : "..."}
                  </div>
                </div>
              </div>
            </div>
          )}

          {progress === 100 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center">
                <svg
                  className="h-5 w-5 text-green-500 mr-2"
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
                <span className="text-green-800 font-medium">
                  Real-time processing complete! Ready for interview.
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {!isRunning && (
        <div className="text-center py-4">
          <p className="text-blue-700 mb-2">
            🎯 Experience the real-time resume processing in action
          </p>
          <p className="text-sm text-blue-600">
            This demo shows how your actual resumes will be processed with live
            feedback
          </p>
        </div>
      )}
    </div>
  );
};

export default LiveDemo;
