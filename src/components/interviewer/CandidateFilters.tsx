import React from "react";
import { FilterConfig, SortConfig, SortField, SortOrder } from "../../types";
import Input from "../ui/Input";
import Button from "../ui/Button";

interface CandidateFiltersProps {
  filterConfig: FilterConfig;
  onFilterChange: (config: FilterConfig) => void;
  sortConfig: SortConfig;
  onSortChange: (config: SortConfig) => void;
}

const CandidateFilters: React.FC<CandidateFiltersProps> = ({
  filterConfig,
  onFilterChange,
  sortConfig,
  onSortChange,
}) => {
  const handleSearchChange = (value: string) => {
    onFilterChange({
      ...filterConfig,
      searchQuery: value || undefined,
    });
  };

  const handleStatusFilterChange = (status: string) => {
    const currentStatuses = filterConfig.status || [];
    const newStatuses = currentStatuses.includes(status as any)
      ? currentStatuses.filter((s) => s !== status)
      : [...currentStatuses, status as any];

    onFilterChange({
      ...filterConfig,
      status: newStatuses.length > 0 ? newStatuses : undefined,
    });
  };

  const handleScoreRangeChange = (min: number, max: number) => {
    onFilterChange({
      ...filterConfig,
      scoreRange: { min, max },
    });
  };

  const handleSortChange = (field: SortField) => {
    const newOrder: SortOrder =
      sortConfig.field === field && sortConfig.order === "asc" ? "desc" : "asc";
    onSortChange({ field, order: newOrder });
  };

  const clearFilters = () => {
    onFilterChange({});
  };

  const statusOptions = [
    {
      value: "pending",
      label: "Pending",
      color: "bg-secondary-100 text-secondary-800",
    },
    {
      value: "in-progress",
      label: "In Progress",
      color: "bg-primary-100 text-primary-800",
    },
    {
      value: "paused",
      label: "Paused",
      color: "bg-warning-100 text-warning-800",
    },
    {
      value: "completed",
      label: "Completed",
      color: "bg-success-100 text-success-800",
    },
  ];

  const getSortIcon = (field: SortField) => {
    if (sortConfig.field !== field) {
      return (
        <svg
          className="w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
      );
    }

    return sortConfig.order === "asc" ? (
      <svg
        className="w-4 h-4 text-primary-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
        />
      </svg>
    ) : (
      <svg
        className="w-4 h-4 text-primary-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"
        />
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      {/* Search and Clear */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by name, email, or phone..."
            value={filterConfig.searchQuery || ""}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={clearFilters}>
          Clear Filters
        </Button>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-6">
        {/* Status Filter */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Status
          </label>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleStatusFilterChange(option.value)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filterConfig.status?.includes(option.value as any)
                    ? option.color
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Score Range Filter */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Score Range
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              max="100"
              placeholder="Min"
              value={filterConfig.scoreRange?.min || ""}
              onChange={(e) =>
                handleScoreRangeChange(
                  parseInt(e.target.value) || 0,
                  filterConfig.scoreRange?.max || 100
                )
              }
              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
            />
            <span className="text-gray-500">-</span>
            <input
              type="number"
              min="0"
              max="100"
              placeholder="Max"
              value={filterConfig.scoreRange?.max || ""}
              onChange={(e) =>
                handleScoreRangeChange(
                  filterConfig.scoreRange?.min || 0,
                  parseInt(e.target.value) || 100
                )
              }
              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>

        {/* Sort Options */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Sort By
          </label>
          <div className="flex gap-2">
            {[
              { field: "name" as SortField, label: "Name" },
              { field: "score" as SortField, label: "Score" },
              { field: "createdAt" as SortField, label: "Date" },
              { field: "status" as SortField, label: "Status" },
            ].map((option) => (
              <button
                key={option.field}
                onClick={() => handleSortChange(option.field)}
                className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  sortConfig.field === option.field
                    ? "bg-primary-100 text-primary-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {option.label}
                {getSortIcon(option.field)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateFilters;
