import React from "react";
import { Candidate } from "../../types";

interface CandidateStatsProps {
  candidates: Candidate[];
}

const CandidateStats: React.FC<CandidateStatsProps> = ({ candidates }) => {
  const stats = {
    total: candidates.length,
    completed: candidates.filter((c) => c.status === "completed").length,
    inProgress: candidates.filter((c) => c.status === "in-progress").length,
    pending: candidates.filter((c) => c.status === "pending").length,
    paused: candidates.filter((c) => c.status === "paused").length,
  };

  const completedCandidates = candidates.filter(
    (c) => c.status === "completed"
  );
  const averageScore =
    completedCandidates.length > 0
      ? Math.round(
          completedCandidates.reduce((sum, c) => sum + c.totalScore, 0) /
            completedCandidates.length
        )
      : 0;

  // Find the highest score among all candidates
  const highestScore =
    candidates.length > 0
      ? Math.max(...candidates.map((c) => c.totalScore))
      : 0;

  const statCards = [
    {
      label: "Total Candidates",
      value: stats.total,
      color: "bg-primary-50 text-primary-600",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
    },
    {
      label: "Completed",
      value: stats.completed,
      color: "bg-success-50 text-success-600",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      label: "In Progress",
      value: stats.inProgress,
      color: "bg-blue-50 text-blue-600",
      icon: (
        <svg
          className="w-6 h-6"
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
      ),
    },
    {
      label: "Average Score",
      value: averageScore,
      color: "bg-purple-50 text-purple-600",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
    {
      label: "Highest Score",
      value: highestScore,
      color: "bg-warning-50 text-warning-600",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
      {statCards.map((stat, index) => (
        <div key={index} className="bg-white rounded-lg shadow-soft p-6">
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${stat.color}`}>{stat.icon}</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CandidateStats;
