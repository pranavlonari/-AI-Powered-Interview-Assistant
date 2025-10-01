import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  InterviewState,
  Candidate,
  Question,
  Answer,
  QuestionDifficulty,
  InterviewConfig,
} from "../types";
import { aiService } from "../lib/aiService";
import { generateId } from "../lib/utils";

const initialConfig: InterviewConfig = {
  totalQuestions: 6,
  questionsPerDifficulty: {
    easy: 2,
    medium: 2,
    hard: 2,
  },
  timeLimits: {
    easy: 20,
    medium: 60,
    hard: 120,
  },
  role: "Full Stack (React/Node)",
};

const initialState: InterviewState = {
  currentCandidate: null,
  candidates: [],
  currentQuestion: null,
  timer: {
    isRunning: false,
    timeLeft: 0,
    totalTime: 0,
  },
  isInterviewActive: false,
  showWelcomeBack: false,
  config: initialConfig,
};

// Async thunks
export const generateQuestion = createAsyncThunk(
  "interview/generateQuestion",
  async (difficulty: QuestionDifficulty, { getState, rejectWithValue }) => {
    try {
      console.log(`🤖 Generating ${difficulty} question with REAL AI...`);

      const state = getState() as { interview: InterviewState };
      const candidate = state.interview.currentCandidate;

      // Pass candidate context to AI for personalized questions
      const candidateContext = candidate
        ? {
            name: candidate.name,
            experience: "Mid Level", // Could be determined from resume analysis
            skills: [
              "React",
              "Node.js",
              "JavaScript",
              "TypeScript",
              "Express",
              "MongoDB",
            ], // From resume or default
          }
        : undefined;

      const response = await aiService.generateQuestion(
        difficulty,
        candidateContext
      );

      console.log(
        "✅ Question generated successfully:",
        response.question.substring(0, 50) + "..."
      );

      return {
        id: generateId(),
        question: response.question,
        difficulty: response.difficulty,
        timeLimit: initialConfig.timeLimits[difficulty],
        category: "Full Stack Development",
        options: response.options, // MCQ options for easy questions
        correctAnswer: response.correctAnswer, // Correct answer for MCQ
      };
    } catch (error) {
      console.error("❌ Failed to generate question:", error);
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to generate question"
      );
    }
  }
);

export const scoreAnswer = createAsyncThunk(
  "interview/scoreAnswer",
  async ({
    question,
    answer,
    difficulty,
    timeSpent,
    autoSubmitted,
    correctAnswer,
  }: {
    question: string;
    answer: string;
    difficulty: QuestionDifficulty;
    timeSpent: number;
    autoSubmitted: boolean;
    correctAnswer?: string; // For MCQ questions
  }) => {
    const response = await aiService.scoreAnswer(
      question,
      answer,
      difficulty,
      timeSpent,
      autoSubmitted,
      correctAnswer
    );
    return {
      ...response,
      timeSpent,
      autoSubmitted,
    };
  }
);

export const generateFinalSummary = createAsyncThunk(
  "interview/generateFinalSummary",
  async (candidateId: string, { getState }) => {
    const state = getState() as { interview: InterviewState };
    const candidate = state.interview.candidates.find(
      (c) => c.id === candidateId
    );

    if (!candidate) {
      throw new Error("Candidate not found");
    }

    const response = await aiService.generateFinalSummary(candidate.answers);
    return {
      candidateId,
      summary: response.summary,
      overallScore: response.overallScore,
    };
  }
);

const interviewSlice = createSlice({
  name: "interview",
  initialState,
  reducers: {
    createCandidate: (
      state,
      action: PayloadAction<
        Omit<
          Candidate,
          | "id"
          | "createdAt"
          | "updatedAt"
          | "answers"
          | "totalScore"
          | "timeSpent"
        >
      >
    ) => {
      const newCandidate: Candidate = {
        ...action.payload,
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        answers: [],
        totalScore: 0,
        timeSpent: 0,
      };

      state.candidates.push(newCandidate);
      state.currentCandidate = newCandidate;
    },

    updateCandidate: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<Candidate> }>
    ) => {
      const { id, updates } = action.payload;
      const candidateIndex = state.candidates.findIndex((c) => c.id === id);

      if (candidateIndex !== -1) {
        state.candidates[candidateIndex] = {
          ...state.candidates[candidateIndex],
          ...updates,
          updatedAt: new Date().toISOString(),
        };

        if (state.currentCandidate?.id === id) {
          state.currentCandidate = state.candidates[candidateIndex];
        }
      }
    },

    setCurrentCandidate: (state, action: PayloadAction<string | null>) => {
      const candidateId = action.payload;
      if (candidateId) {
        const candidate = state.candidates.find((c) => c.id === candidateId);
        state.currentCandidate = candidate || null;
      } else {
        state.currentCandidate = null;
      }
    },

    startInterview: (state) => {
      if (state.currentCandidate) {
        state.isInterviewActive = true;
        state.currentCandidate.status = "in-progress";
        state.currentCandidate.startTime = new Date().toISOString();
        state.currentCandidate.currentQuestionIndex = 0;

        // Reset AI question tracking for new interview
        aiService.resetQuestionTracking();
        console.log("🔄 Interview started - question tracking reset");

        // Update in candidates array
        const candidateIndex = state.candidates.findIndex(
          (c) => c.id === state.currentCandidate!.id
        );
        if (candidateIndex !== -1) {
          state.candidates[candidateIndex] = state.currentCandidate;
        }
      }
    },

    pauseInterview: (state) => {
      state.isInterviewActive = false;
      state.timer.isRunning = false;

      if (state.currentCandidate) {
        state.currentCandidate.status = "paused";
        const candidateIndex = state.candidates.findIndex(
          (c) => c.id === state.currentCandidate!.id
        );
        if (candidateIndex !== -1) {
          state.candidates[candidateIndex] = state.currentCandidate;
        }
      }
    },

    resumeInterview: (state) => {
      state.isInterviewActive = true;
      state.showWelcomeBack = false;

      if (state.currentCandidate) {
        state.currentCandidate.status = "in-progress";

        // Reset AI service counter based on already answered questions
        const answeredQuestions = state.currentCandidate.answers;
        const easyCount = answeredQuestions.filter(
          (a) => a.difficulty === "easy"
        ).length;
        const mediumCount = answeredQuestions.filter(
          (a) => a.difficulty === "medium"
        ).length;
        const hardCount = answeredQuestions.filter(
          (a) => a.difficulty === "hard"
        ).length;

        console.log(
          `🔄 Resuming interview - syncing AI counter with answered questions:`
        );
        console.log(
          `   Easy: ${easyCount}, Medium: ${mediumCount}, Hard: ${hardCount}`
        );
        console.log(
          `   Current question index: ${state.currentCandidate.currentQuestionIndex}`
        );

        // Sync the counter to match answered questions
        aiService.syncQuestionCounter(easyCount, mediumCount, hardCount);

        const candidateIndex = state.candidates.findIndex(
          (c) => c.id === state.currentCandidate!.id
        );
        if (candidateIndex !== -1) {
          state.candidates[candidateIndex] = state.currentCandidate;
        }
      }
    },

    completeInterview: (state) => {
      state.isInterviewActive = false;
      state.timer.isRunning = false;
      state.currentQuestion = null; // Clear current question
      state.showWelcomeBack = false; // Hide welcome back modal

      if (state.currentCandidate) {
        state.currentCandidate.status = "completed";
        state.currentCandidate.endTime = new Date().toISOString();

        // Recalculate final total score to ensure accuracy
        const validAnswers = state.currentCandidate.answers.filter(
          (ans) =>
            !isNaN(ans.score) && ans.score !== null && ans.score !== undefined
        );
        if (validAnswers.length > 0) {
          const totalScore = validAnswers.reduce(
            (sum, ans) => sum + ans.score,
            0
          );
          state.currentCandidate.totalScore = Math.round(totalScore);
        }

        console.log(
          `✅ Interview completed with final score: ${state.currentCandidate.totalScore}/100`
        );

        const candidateIndex = state.candidates.findIndex(
          (c) => c.id === state.currentCandidate!.id
        );
        if (candidateIndex !== -1) {
          state.candidates[candidateIndex] = state.currentCandidate;
        }
      }
    },

    setCurrentQuestion: (state, action: PayloadAction<Question | null>) => {
      state.currentQuestion = action.payload;

      if (action.payload) {
        state.timer = {
          isRunning: true,
          timeLeft: action.payload.timeLimit,
          totalTime: action.payload.timeLimit,
        };
      }
    },

    updateTimer: (
      state,
      action: PayloadAction<{ timeLeft: number; isRunning: boolean }>
    ) => {
      state.timer.timeLeft = action.payload.timeLeft;
      state.timer.isRunning = action.payload.isRunning;
    },

    submitAnswer: (
      state,
      action: PayloadAction<{ answer: string; autoSubmitted: boolean }>
    ) => {
      if (state.currentCandidate && state.currentQuestion) {
        const timeSpent = state.timer.totalTime - state.timer.timeLeft;

        const newAnswer: Answer = {
          id: generateId(),
          questionId: state.currentQuestion.id,
          question: state.currentQuestion.question,
          answer: action.payload.answer,
          difficulty: state.currentQuestion.difficulty,
          timeLimit: state.currentQuestion.timeLimit,
          timeSpent,
          score: 0, // Will be updated when scoring is complete
          feedback: "",
          submittedAt: new Date().toISOString(),
          autoSubmitted: action.payload.autoSubmitted,
        };

        state.currentCandidate.answers.push(newAnswer);
        state.currentCandidate.timeSpent += timeSpent;
        state.currentCandidate.currentQuestionIndex += 1;

        // Update in candidates array
        const candidateIndex = state.candidates.findIndex(
          (c) => c.id === state.currentCandidate!.id
        );
        if (candidateIndex !== -1) {
          state.candidates[candidateIndex] = state.currentCandidate;
        }

        // Reset timer
        state.timer = {
          isRunning: false,
          timeLeft: 0,
          totalTime: 0,
        };
      }
    },

    showWelcomeBackModal: (state, action: PayloadAction<boolean>) => {
      state.showWelcomeBack = action.payload;
    },

    clearCurrentSession: (state) => {
      state.currentCandidate = null;
      state.currentQuestion = null;
      state.isInterviewActive = false;
      state.timer = {
        isRunning: false,
        timeLeft: 0,
        totalTime: 0,
      };
      state.showWelcomeBack = false;
    },

    deleteCandidate: (state, action: PayloadAction<string>) => {
      const candidateId = action.payload;
      state.candidates = state.candidates.filter((c) => c.id !== candidateId);

      if (state.currentCandidate?.id === candidateId) {
        state.currentCandidate = null;
        state.isInterviewActive = false;
        state.currentQuestion = null;
        state.timer = {
          isRunning: false,
          timeLeft: 0,
          totalTime: 0,
        };
      }
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(generateQuestion.fulfilled, (state, action) => {
        console.log("✅ Question generated and set in state");
        console.log(
          `⏱️ Timer initialization: difficulty=${action.payload.difficulty}, timeLimit=${action.payload.timeLimit}s`
        );
        console.log(
          `⏱️ Current question index: ${state.currentCandidate?.currentQuestionIndex}, Total questions: ${state.config.totalQuestions}`
        );
        state.currentQuestion = action.payload;
        state.timer = {
          isRunning: true,
          timeLeft: action.payload.timeLimit,
          totalTime: action.payload.timeLimit,
        };
        console.log(
          `⏱️ Timer set: ${state.timer.timeLeft}s (difficulty: ${action.payload.difficulty})`
        );
      })
      .addCase(generateQuestion.rejected, (_, action) => {
        console.error("❌ Question generation failed:", action.payload);
        // Could add error state here if needed
      })

      .addCase(scoreAnswer.fulfilled, (state, action) => {
        if (state.currentCandidate) {
          const lastAnswerIndex = state.currentCandidate.answers.length - 1;
          if (lastAnswerIndex >= 0) {
            const answer = state.currentCandidate.answers[lastAnswerIndex];

            // Apply scoring with proper handling of empty/wrong answers and NaN prevention
            let aiScore = action.payload.score; // AI returns 0-100

            // Ensure score is a valid number
            if (isNaN(aiScore) || aiScore === null || aiScore === undefined) {
              aiScore = 0;
              console.log("📉 Applied 0 score for NaN/null/undefined score");
            }

            // Assign 0 points for placeholder answers ONLY (not for short MCQ answers like "fs")
            const placeholderAnswers = [
              "[No answer provided - time's up]",
              "[No answer - tab switched]",
              "[Empty answer]",
            ];

            if (placeholderAnswers.includes(answer.answer)) {
              aiScore = 0;
              console.log("📉 Applied 0 score for placeholder answer");
            }

            // For text answers (medium/hard), check minimum length
            // Don't apply this to MCQ answers (easy) which can be short like "fs"
            if (
              answer.difficulty !== "easy" &&
              answer.answer.trim().length < 20 &&
              !placeholderAnswers.includes(answer.answer)
            ) {
              aiScore = 0;
              console.log("📉 Applied 0 score for too short text answer");
            }

            // Ensure AI score is within valid range (0-100)
            aiScore = Math.max(0, Math.min(100, Math.round(aiScore)));

            // Convert AI score (0-100) to actual points based on difficulty
            // Easy: 5 points max, Medium: 15 points max, Hard: 30 points max
            const maxPoints =
              answer.difficulty === "easy"
                ? 5
                : answer.difficulty === "medium"
                ? 15
                : 30;
            const actualPoints = Math.round((aiScore / 100) * maxPoints);

            answer.score = actualPoints; // Store actual points (not percentage)
            answer.feedback = action.payload.feedback || "No feedback provided";

            console.log(
              `📊 Question scored: ${aiScore}% = ${actualPoints}/${maxPoints} points (${answer.difficulty})`
            );

            // Calculate total score as SUM of all answer points (not average)
            // Total possible: 2 easy (10) + 2 medium (30) + 2 hard (60) = 100 points
            const validAnswers = state.currentCandidate.answers.filter(
              (ans) =>
                !isNaN(ans.score) &&
                ans.score !== null &&
                ans.score !== undefined
            );

            console.log(
              "🔍 All answers:",
              state.currentCandidate.answers.map((a, i) => ({
                index: i + 1,
                difficulty: a.difficulty,
                score: a.score,
                isValid:
                  !isNaN(a.score) && a.score !== null && a.score !== undefined,
              }))
            );

            if (validAnswers.length > 0) {
              // Calculate total score and round to avoid decimals
              const totalScore = validAnswers.reduce(
                (sum, ans) => sum + ans.score,
                0
              );
              state.currentCandidate.totalScore = Math.round(totalScore);

              console.log(
                `🧮 Total calculation: ${validAnswers
                  .map((a) => a.score)
                  .join(" + ")} = ${totalScore} → rounded to ${
                  state.currentCandidate.totalScore
                }`
              );
            } else {
              state.currentCandidate.totalScore = 0;
            }

            console.log(
              `📊 Updated candidate total score: ${state.currentCandidate.totalScore}/100 (${validAnswers.length} valid answers out of ${state.currentCandidate.answers.length} total)`
            );

            // Update in candidates array
            const candidateIndex = state.candidates.findIndex(
              (c) => c.id === state.currentCandidate!.id
            );
            if (candidateIndex !== -1) {
              state.candidates[candidateIndex] = state.currentCandidate;
            }
          }
        }
      })

      .addCase(generateFinalSummary.fulfilled, (state, action) => {
        const { candidateId, summary } = action.payload;
        const candidateIndex = state.candidates.findIndex(
          (c) => c.id === candidateId
        );

        if (candidateIndex !== -1) {
          // Only update the summary, NOT the totalScore
          // totalScore is already correctly calculated as sum of individual answer scores
          state.candidates[candidateIndex].finalSummary = summary;

          if (state.currentCandidate?.id === candidateId) {
            state.currentCandidate.finalSummary = summary;
          }

          console.log(
            `✅ Final summary generated for candidate. Total score maintained at: ${state.candidates[candidateIndex].totalScore}/100`
          );
        }
      });
  },
});

export const {
  createCandidate,
  updateCandidate,
  setCurrentCandidate,
  startInterview,
  pauseInterview,
  resumeInterview,
  completeInterview,
  setCurrentQuestion,
  updateTimer,
  submitAnswer,
  showWelcomeBackModal,
  clearCurrentSession,
  deleteCandidate,
} = interviewSlice.actions;

// Selector functions
export const selectAllCandidates = (state: { interview: InterviewState }) =>
  state.interview.candidates;

export const selectCompletedCandidates = (state: {
  interview: InterviewState;
}) =>
  state.interview.candidates.filter(
    (candidate) => candidate.status === "completed"
  );

// Check if candidate with same credentials has already completed interview
export const selectExistingCompletedCandidate = (
  state: { interview: InterviewState },
  credentials: { email?: string; phone?: string; name?: string }
) => {
  const { email, phone, name } = credentials;

  return state.interview.candidates.find((candidate) => {
    if (candidate.status !== "completed") return false;

    // Check if any of the key identifiers match
    const emailMatch =
      email &&
      candidate.email &&
      candidate.email.toLowerCase().trim() === email.toLowerCase().trim();
    const phoneMatch =
      phone &&
      candidate.phone &&
      candidate.phone.replace(/\D/g, "") === phone.replace(/\D/g, "");
    const nameMatch =
      name &&
      candidate.name &&
      candidate.name.toLowerCase().trim() === name.toLowerCase().trim();

    return emailMatch || phoneMatch || nameMatch;
  });
};

export default interviewSlice.reducer;
