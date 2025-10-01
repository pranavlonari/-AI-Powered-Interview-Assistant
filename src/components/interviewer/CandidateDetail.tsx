import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import Modal from "../ui/Modal";
import { formatDate, formatTime, getStatusColor } from "../../lib/utils";

interface CandidateDetailProps {
  candidateId: string;
  isOpen: boolean;
  onClose: () => void;
}

const CandidateDetail: React.FC<CandidateDetailProps> = ({
  candidateId,
  isOpen,
  onClose,
}) => {
  // Always get the latest candidate data from Redux
  const candidate = useSelector((state: RootState) =>
    state.interview.candidates.find((c) => c.id === candidateId)
  );

  // If candidate not found, close the modal
  if (!candidate) {
    return null;
  }
  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case "easy":
        return "text-success-600 bg-success-100";
      case "medium":
        return "text-warning-600 bg-warning-100";
      case "hard":
        return "text-error-600 bg-error-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Candidate Details"
      size="xl"
    >
      <div className="space-y-6">
        {/* Header Info */}
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-xl font-bold text-primary-600">
                {candidate.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="ml-4">
              <h3 className="text-xl font-semibold text-gray-900">
                {candidate.name}
              </h3>
              <p className="text-gray-600">{candidate.email}</p>
              <p className="text-gray-600">{candidate.phone}</p>
            </div>
          </div>
          <div className="text-right">
            <span
              className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(
                candidate.status
              )}`}
            >
              {candidate.status.charAt(0).toUpperCase() +
                candidate.status.slice(1)}
            </span>
            <p className="text-sm text-gray-500 mt-1">
              Started: {formatDate(candidate.createdAt)}
            </p>
          </div>
        </div>

        {/* Score Overview */}
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="grid grid-cols-4 gap-4 text-center mb-4">
            <div>
              <div
                className={`text-3xl font-bold ${
                  candidate.totalScore === 0
                    ? "text-error-600"
                    : candidate.totalScore >= 60
                    ? "text-success-600"
                    : "text-warning-600"
                }`}
              >
                {candidate.totalScore}
              </div>
              <div className="text-sm text-gray-500">
                Overall Score (out of 100)
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">
                {candidate.answers.length}
              </div>
              <div className="text-sm text-gray-500">Questions Answered</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">
                {formatTime(candidate.timeSpent)}
              </div>
              <div className="text-sm text-gray-500">Total Time</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">
                {candidate.answers.filter((a) => a.autoSubmitted).length}
              </div>
              <div className="text-sm text-gray-500">Auto-submitted</div>
            </div>
          </div>
          {/* Score Breakdown */}
          <div className="border-t pt-4 mt-4">
            <h5 className="text-sm font-semibold text-gray-700 mb-3">
              Score Breakdown:
            </h5>
            <div className="grid grid-cols-4 gap-3 text-sm">
              <div className="bg-success-50 border border-success-200 rounded-lg p-3 text-center">
                <div className="font-medium text-success-700 mb-2 text-xs">
                  Easy Questions
                </div>
                <div className="text-2xl text-success-900 font-bold">
                  {candidate.answers
                    .filter((a) => a.difficulty === "easy")
                    .reduce((sum, a) => sum + a.score, 0)}
                </div>
                <div className="text-xs text-success-600 mt-1">out of 10</div>
              </div>
              <div className="bg-warning-50 border border-warning-200 rounded-lg p-3 text-center">
                <div className="font-medium text-warning-700 mb-2 text-xs">
                  Medium Questions
                </div>
                <div className="text-2xl text-warning-900 font-bold">
                  {candidate.answers
                    .filter((a) => a.difficulty === "medium")
                    .reduce((sum, a) => sum + a.score, 0)}
                </div>
                <div className="text-xs text-warning-600 mt-1">out of 30</div>
              </div>
              <div className="bg-error-50 border border-error-200 rounded-lg p-3 text-center">
                <div className="font-medium text-error-700 mb-2 text-xs">
                  Hard Questions
                </div>
                <div className="text-2xl text-error-900 font-bold">
                  {candidate.answers
                    .filter((a) => a.difficulty === "hard")
                    .reduce((sum, a) => sum + a.score, 0)}
                </div>
                <div className="text-xs text-error-600 mt-1">out of 60</div>
              </div>
              <div className="bg-primary-50 border-2 border-primary-400 rounded-lg p-3 text-center">
                <div className="font-bold text-primary-700 mb-2 text-xs">
                  TOTAL SCORE
                </div>
                <div className="text-2xl text-primary-900 font-bold">
                  {candidate.totalScore}
                </div>
                <div className="text-xs text-primary-600 mt-1">out of 100</div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Summary */}
        {candidate.finalSummary && (
          <div className="bg-blue-50 rounded-lg p-6">
            <h4 className="font-semibold text-blue-900 mb-3">
              AI Assessment Summary
            </h4>
            <p className="text-blue-800">{candidate.finalSummary}</p>
          </div>
        )}

        {/* Questions and Answers */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-4">
            Interview Responses
          </h4>

          {candidate.answers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No questions answered yet.
            </div>
          ) : (
            <div className="space-y-6">
              {candidate.answers.map((answer, index) => (
                <div
                  key={answer.id}
                  className="border border-gray-200 rounded-lg p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          Question {index + 1}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(
                            answer.difficulty
                          )}`}
                        >
                          {answer.difficulty.charAt(0).toUpperCase() +
                            answer.difficulty.slice(1)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTime(answer.timeSpent)} /{" "}
                          {formatTime(answer.timeLimit)}
                        </span>
                        {answer.autoSubmitted && (
                          <span className="px-2 py-1 text-xs bg-warning-100 text-warning-800 rounded-full">
                            Auto-submitted
                          </span>
                        )}
                      </div>
                      <p className="text-gray-900 font-medium">
                        {answer.question}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <div
                        className={`text-2xl font-bold ${
                          answer.score === 0
                            ? "text-error-600"
                            : answer.score >=
                              (answer.difficulty === "easy"
                                ? 4
                                : answer.difficulty === "medium"
                                ? 12
                                : 24)
                            ? "text-success-600"
                            : "text-warning-600"
                        }`}
                      >
                        {answer.score}
                      </div>
                      <div className="text-sm text-gray-500">
                        /
                        {answer.difficulty === "easy"
                          ? 5
                          : answer.difficulty === "medium"
                          ? 15
                          : 30}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">
                        Answer:
                      </h5>
                      <div className="bg-gray-50 rounded-md p-3">
                        <p className="text-gray-900 whitespace-pre-wrap">
                          {answer.answer || "No answer provided"}
                        </p>
                      </div>
                    </div>

                    {answer.feedback && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">
                          AI Feedback:
                        </h5>
                        <div className="bg-blue-50 rounded-md p-3">
                          <p className="text-blue-900">{answer.feedback}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resume Text Preview */}
        {candidate.resumeText && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Resume Content</h4>
            <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                {candidate.resumeText}
              </pre>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default CandidateDetail;
