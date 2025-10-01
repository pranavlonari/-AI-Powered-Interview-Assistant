import React from "react";
import { Candidate } from "../../types";
import { getScoreColor, getStatusColor, formatDate } from "../../lib/utils";

interface CandidateListProps {
  candidates: Candidate[];
  onCandidateClick: (candidate: Candidate) => void;
  onDeleteCandidate: (candidate: Candidate, event: React.MouseEvent) => void;
}

const CandidateList: React.FC<CandidateListProps> = ({
  candidates,
  onCandidateClick,
  onDeleteCandidate,
}) => {
  return (
    <div className="overflow-hidden">
      {/* Table Header */}
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
        <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
          <div className="col-span-3">Candidate</div>
          <div className="col-span-2">Contact</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Score</div>
          <div className="col-span-2">Progress</div>
          <div className="col-span-1">Actions</div>
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-gray-200">
        {candidates.map((candidate) => (
          <div
            key={candidate.id}
            onClick={() => onCandidateClick(candidate)}
            className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <div className="grid grid-cols-12 gap-4 items-center">
              {/* Candidate Info */}
              <div className="col-span-3">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-600">
                      {candidate.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {candidate.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(candidate.createdAt).split(",")[0]}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="col-span-2">
                <p className="text-sm text-gray-900">{candidate.email}</p>
                <p className="text-sm text-gray-500">{candidate.phone}</p>
              </div>

              {/* Status */}
              <div className="col-span-2">
                <span
                  className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                    candidate.status
                  )}`}
                >
                  {candidate.status.charAt(0).toUpperCase() +
                    candidate.status.slice(1)}
                </span>
              </div>

              {/* Score */}
              <div className="col-span-2">
                <div className="flex items-center">
                  <span
                    className={`text-lg font-bold ${getScoreColor(
                      candidate.totalScore
                    )}`}
                  >
                    {candidate.totalScore}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">/100</span>
                </div>
              </div>

              {/* Progress */}
              <div className="col-span-2">
                <div className="flex items-center">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        candidate.status === "completed"
                          ? "bg-success-500"
                          : candidate.status === "in-progress"
                          ? "bg-primary-500"
                          : "bg-gray-400"
                      }`}
                      style={{
                        width: `${Math.min(
                          (candidate.answers.length / 6) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-600">
                    {candidate.answers.length}/6
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="col-span-1">
                <button
                  onClick={(e) => onDeleteCandidate(candidate, e)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  title={`Delete ${candidate.name}'s interview`}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CandidateList;
