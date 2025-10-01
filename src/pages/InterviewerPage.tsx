import React, { useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../store";
import { deleteCandidate } from "../store/interviewSlice";
import { Candidate, SortConfig, FilterConfig } from "../types";
import CandidateList from "../components/interviewer/CandidateList";
import CandidateDetail from "../components/interviewer/CandidateDetail";
import CandidateFilters from "../components/interviewer/CandidateFilters";
import CandidateStats from "../components/interviewer/CandidateStats";

const InterviewerPage: React.FC = () => {
  const dispatch = useDispatch();
  const { candidates } = useSelector((state: RootState) => state.interview);

  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(
    null
  );
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: "createdAt",
    order: "desc",
  });
  const [filterConfig, setFilterConfig] = useState<FilterConfig>({});

  // Filter and sort candidates
  const filteredAndSortedCandidates = useMemo(() => {
    let filtered = [...candidates];

    // Apply filters
    if (filterConfig.status && filterConfig.status.length > 0) {
      filtered = filtered.filter((candidate) =>
        filterConfig.status!.includes(candidate.status)
      );
    }

    if (filterConfig.scoreRange) {
      filtered = filtered.filter(
        (candidate) =>
          candidate.totalScore >= filterConfig.scoreRange!.min &&
          candidate.totalScore <= filterConfig.scoreRange!.max
      );
    }

    if (filterConfig.searchQuery) {
      const query = filterConfig.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (candidate) =>
          candidate.name.toLowerCase().includes(query) ||
          candidate.email.toLowerCase().includes(query) ||
          candidate.phone.includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.field) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "score":
          aValue = a.totalScore;
          bValue = b.totalScore;
          break;
        case "createdAt":
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortConfig.order === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.order === "asc" ? 1 : -1;
      }
      return 0;
    });

    return filtered;
  }, [candidates, sortConfig, filterConfig]);

  const handleCandidateClick = (candidate: Candidate) => {
    setSelectedCandidateId(candidate.id);
  };

  const handleCloseDetail = () => {
    setSelectedCandidateId(null);
  };

  const handleDeleteCandidate = (
    candidate: Candidate,
    event: React.MouseEvent
  ) => {
    event.stopPropagation(); // Prevent triggering row click

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${candidate.name}'s interview?\n\nThis action cannot be undone.`
    );

    if (confirmDelete) {
      dispatch(deleteCandidate(candidate.id));

      // Close detail modal if the deleted candidate was selected
      if (selectedCandidateId === candidate.id) {
        setSelectedCandidateId(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Interview Dashboard
        </h1>
        <p className="text-lg text-gray-600">
          Manage and review candidate interviews
        </p>
      </div>

      {/* Stats */}
      <CandidateStats candidates={candidates} />

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-soft p-6">
        <CandidateFilters
          filterConfig={filterConfig}
          onFilterChange={setFilterConfig}
          sortConfig={sortConfig}
          onSortChange={setSortConfig}
        />
      </div>

      {/* Candidate List */}
      <div className="bg-white rounded-lg shadow-soft">
        {filteredAndSortedCandidates.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
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
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No candidates found
            </h3>
            <p className="text-gray-600">
              {candidates.length === 0
                ? "No interviews have been conducted yet."
                : "No candidates match your current filters."}
            </p>
          </div>
        ) : (
          <CandidateList
            candidates={filteredAndSortedCandidates}
            onCandidateClick={handleCandidateClick}
            onDeleteCandidate={handleDeleteCandidate}
          />
        )}
      </div>

      {/* Candidate Detail Modal */}
      {selectedCandidateId && (
        <CandidateDetail
          candidateId={selectedCandidateId}
          isOpen={!!selectedCandidateId}
          onClose={handleCloseDetail}
        />
      )}
    </div>
  );
};

export default InterviewerPage;
