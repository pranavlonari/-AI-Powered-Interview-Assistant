import React from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { Candidate } from "../../types";
import { formatTime } from "../../lib/utils";

interface WelcomeBackModalProps {
  isOpen: boolean;
  candidate: Candidate | null;
  onContinue: () => void;
  onStartNew?: () => void; // Optional now - not used for incomplete interviews
  onEndTest?: () => void;
}

const WelcomeBackModal: React.FC<WelcomeBackModalProps> = ({
  isOpen,
  candidate,
  onContinue,
  onEndTest,
}) => {
  if (!candidate) return null;

  const progress = candidate.currentQuestionIndex;
  const totalQuestions = 6;

  return (
    <Modal isOpen={isOpen} onClose={() => {}}>
      <div className="p-6">
        <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4">
          <svg
            className="w-8 h-8 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
          Welcome Back, {candidate.name}!
        </h3>

        <div className="text-center">
          <p className="text-gray-600 mb-4">
            We found your previous interview session. You can continue where you
            left off.
          </p>

          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="text-center">
              <p className="text-sm text-blue-700 mb-1">Progress</p>
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className={`bg-blue-600 h-2 rounded-full transition-all duration-300`}
                    data-progress={`${(progress / totalQuestions) * 100}%`}
                    style={{
                      width: `${Math.min(
                        100,
                        (progress / totalQuestions) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>
              <p className="text-sm text-blue-800">
                {progress} of {totalQuestions} questions completed
              </p>
            </div>
          </div>

          <div className="space-y-2 mb-6">
            <div className="text-xs text-gray-500 space-y-1">
              <div className="flex justify-between">
                <span>Questions Answered:</span>
                <span className="font-medium">{candidate.answers.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Current Score:</span>
                <span className="font-medium">
                  {candidate.totalScore}/100 points
                </span>
              </div>
              <div className="flex justify-between">
                <span>Time Spent:</span>
                <span className="font-medium">
                  {formatTime(
                    candidate.answers.reduce((sum, a) => sum + a.timeSpent, 0)
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button onClick={onContinue} size="lg" className="w-full">
              Resume Interview
            </Button>

            {candidate.answers.length > 0 && onEndTest && (
              <Button
                onClick={() => {
                  if (
                    window.confirm(
                      `Are you sure you want to end your interview early?\n\n` +
                        `You have answered ${candidate.answers.length} questions.\n` +
                        `Your score will be calculated based on completed questions only.\n\n` +
                        `This action cannot be undone.`
                    )
                  ) {
                    onEndTest();
                  }
                }}
                variant="outline"
                size="lg"
                className="w-full border-red-300 text-red-600 hover:bg-red-50"
              >
                End Test Early
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default WelcomeBackModal;
