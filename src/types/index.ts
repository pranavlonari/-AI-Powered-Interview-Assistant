// Types for the interview system
export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  resumeFile?: File;
  resumeText?: string;
  createdAt: string;
  updatedAt: string;
  status: "pending" | "in-progress" | "completed" | "paused";
  currentQuestionIndex: number;
  startTime?: string;
  endTime?: string;
  totalScore: number;
  finalSummary?: string;
  answers: Answer[];
  timeSpent: number; // in seconds
}

export interface Answer {
  id: string;
  questionId: string;
  question: string;
  answer: string;
  difficulty: QuestionDifficulty;
  timeLimit: number;
  timeSpent: number;
  score: number;
  feedback: string;
  submittedAt: string;
  autoSubmitted: boolean;
}

export type QuestionDifficulty = "easy" | "medium" | "hard";

export interface Question {
  id: string;
  question: string;
  difficulty: QuestionDifficulty;
  timeLimit: number; // in seconds
  category: string;
  options?: string[]; // For MCQ (easy questions only)
  correctAnswer?: string; // For MCQ (easy questions only)
}

export interface InterviewConfig {
  totalQuestions: number;
  questionsPerDifficulty: {
    easy: number;
    medium: number;
    hard: number;
  };
  timeLimits: {
    easy: number;
    medium: number;
    hard: number;
  };
  role: string;
}

export interface Timer {
  isRunning: boolean;
  timeLeft: number;
  totalTime: number;
}

export interface InterviewState {
  currentCandidate: Candidate | null;
  candidates: Candidate[];
  currentQuestion: Question | null;
  timer: Timer;
  isInterviewActive: boolean;
  showWelcomeBack: boolean;
  config: InterviewConfig;
}

export interface AppState {
  interview: InterviewState;
}

// File upload types
export interface FileUploadResult {
  success: boolean;
  data?: {
    name?: string;
    email?: string;
    phone?: string;
    text: string;
  };
  error?: string;
}

// API Response types for AI services
export interface AIQuestionResponse {
  question: string;
  difficulty: QuestionDifficulty;
  category: string;
  options?: string[]; // For MCQ (easy questions only)
  correctAnswer?: string; // For MCQ (easy questions only)
}

export interface AIScoreResponse {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

export interface AISummaryResponse {
  overallScore: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
}

// Navigation types
export type TabType = "interviewee" | "interviewer";

// Component Props types
export interface ChatMessageProps {
  message: string;
  sender: "ai" | "candidate";
  timestamp: string;
  isQuestion?: boolean;
}

export interface TimerProps {
  timeLeft: number;
  totalTime: number;
  isRunning: boolean;
  onTimeUp: () => void;
}

export interface CandidateCardProps {
  candidate: Candidate;
  onClick: (candidate: Candidate) => void;
}

export interface ProgressBarProps {
  current: number;
  total: number;
  className?: string;
}

// Form types
export interface ResumeUploadFormData {
  name: string;
  email: string;
  phone: string;
}

export interface MissingFieldsFormData {
  name?: string;
  email?: string;
  phone?: string;
}

// Modal types
export interface WelcomeBackModalProps {
  isOpen: boolean;
  candidate: Candidate;
  onResume: () => void;
  onRestart: () => void;
}

export interface CandidateDetailModalProps {
  isOpen: boolean;
  candidate: Candidate | null;
  onClose: () => void;
}

// Error types
export interface AppError {
  message: string;
  code?: string;
  details?: any;
}

// Utility types
export type SortField = "name" | "score" | "createdAt" | "status";
export type SortOrder = "asc" | "desc";

export interface SortConfig {
  field: SortField;
  order: SortOrder;
}

export interface FilterConfig {
  status?: Candidate["status"][];
  scoreRange?: {
    min: number;
    max: number;
  };
  searchQuery?: string;
}
