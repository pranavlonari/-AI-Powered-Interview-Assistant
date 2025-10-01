import React from "react";
import { Candidate } from "../../types";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { formatDate } from "../../lib/utils";

interface WelcomeBackModalProps {
  isOpen: boolean;
  candidate: Candidate;
  onResume: () => void;
  onRestart: () => void;
}

const WelcomeBackModal: React.FC<WelcomeBackModalProps> = ({
  isOpen,
  candidate,
  onResume,
  onRestart,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}} // Prevent closing without action
      title="Welcome Back!"
      showCloseButton={false}
      size="md"
    >
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-primary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Hi {candidate.name}!
          </h3>
          <p className="text-gray-600">
            You have an unfinished interview session from{" "}
            <span className="font-medium">
              {formatDate(candidate.updatedAt)}
            </span>
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-gray-900">
                {candidate.currentQuestionIndex}
              </div>
              <div className="text-sm text-gray-500">Questions Completed</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">
                {candidate.answers.length > 0
                  ? Math.round(
                      candidate.answers.reduce((sum, a) => sum + a.score, 0) /
                        candidate.answers.length
                    )
                  : 0}
              </div>
              <div className="text-sm text-gray-500">Current Score</div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Button onClick={onResume} size="lg" className="w-full">
            Resume Interview
          </Button>
          <Button
            onClick={onRestart}
            variant="outline"
            size="lg"
            className="w-full"
          >
            Start Over
          </Button>
        </div>

        <div className="text-xs text-gray-500 text-center">
          <p>
            Resuming will continue from where you left off. Starting over will
            reset your progress completely.
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default WelcomeBackModal;
