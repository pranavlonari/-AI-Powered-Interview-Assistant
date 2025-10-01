import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../store";
import {
  generateQuestion,
  scoreAnswer,
  submitAnswer,
  updateTimer,
  setCurrentQuestion,
  completeInterview,
  generateFinalSummary,
} from "../../store/interviewSlice";
import { Candidate, QuestionDifficulty } from "../../types";
import Button from "../ui/Button";
import Textarea from "../ui/Textarea";
import Timer from "./Timer";
import ProgressBar from "./ProgressBar";
import { formatTime } from "../../lib/utils";
import { aiService } from "../../lib/aiService";

interface InterviewChatProps {
  candidate: Candidate;
  isActive: boolean;
  onStart: () => void;
}

const InterviewChat: React.FC<InterviewChatProps> = ({
  candidate,
  isActive,
  onStart,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { currentQuestion, timer, config } = useSelector(
    (state: RootState) => state.interview
  );

  const [currentAnswer, setCurrentAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isAnswerValid, setIsAnswerValid] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const [selectedOption, setSelectedOption] = useState<string>(""); // For MCQ questions
  const [isLoadingNextQuestion, setIsLoadingNextQuestion] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const nextQuestionTimeoutRef = useRef<number | null>(null);
  const isGeneratingRef = useRef<boolean>(false);

  const currentQuestionIndex = candidate.currentQuestionIndex;
  const totalQuestions = config.totalQuestions;
  const isInterviewComplete =
    candidate.status === "completed" || currentQuestionIndex >= totalQuestions;

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (nextQuestionTimeoutRef.current) {
        clearTimeout(nextQuestionTimeoutRef.current);
      }
    };
  }, []);

  // Tab visibility detection - auto-complete interview if user switches tabs
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.hidden && isActive && currentQuestion && !isSubmitting) {
        console.log(
          "🚨 Tab switched during active interview - auto-completing test"
        );

        // Auto-submit current question
        if (currentQuestion) {
          setIsSubmitting(true);
          dispatch(
            submitAnswer({
              answer: currentAnswer.trim() || "[No answer - tab switched]",
              autoSubmitted: true,
            })
          );

          // Score the answer
          await dispatch(
            scoreAnswer({
              question: currentQuestion.question,
              answer: currentAnswer.trim() || "[No answer - tab switched]",
              difficulty: currentQuestion.difficulty,
              timeSpent: timer.totalTime - timer.timeLeft,
              autoSubmitted: true,
            })
          ).unwrap();
        }

        // Complete the interview immediately
        dispatch(completeInterview());
        await dispatch(generateFinalSummary(candidate.id)).unwrap();
        setShowResults(true);
        setIsSubmitting(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [
    isActive,
    currentQuestion,
    isSubmitting,
    currentAnswer,
    timer,
    dispatch,
    candidate.id,
  ]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [candidate.answers, currentQuestion, showResults]);

  // Timer effect with enhanced auto-submission
  useEffect(() => {
    let interval: number;

    if (timer.isRunning && timer.timeLeft > 0) {
      interval = setInterval(() => {
        const newTimeLeft = timer.timeLeft - 1;
        console.log(`⏱️ Timer: ${newTimeLeft} seconds remaining`);

        dispatch(
          updateTimer({
            timeLeft: Math.max(0, newTimeLeft),
            isRunning: newTimeLeft > 0,
          })
        );

        // Direct auto-submission when timer reaches 0
        if (newTimeLeft === 0) {
          console.log("⏰ Time is up! Triggering auto-submission immediately");
          // Call handleSubmitAnswer directly with a small delay to ensure state updates
          setTimeout(() => {
            if (!isSubmitting) {
              handleSubmitAnswer(true);
            }
          }, 100);
        }
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [timer.isRunning, timer.timeLeft, dispatch, isSubmitting]);

  // Auto-submission is handled by Timer component's onTimeUp callback only

  // Generate question ONLY when interview starts OR resumes (not on every question change)
  useEffect(() => {
    if (isActive && !currentQuestion && !isInterviewComplete && !isSubmitting) {
      // For new interview (no answers yet)
      if (candidate.answers.length === 0 && currentQuestionIndex === 0) {
        console.log(
          "🚀 Starting NEW interview - generating first question immediately"
        );
        generateNextQuestion();
      }
      // For resumed interview (has answers, needs next question)
      else if (
        candidate.answers.length > 0 &&
        candidate.answers.length === currentQuestionIndex &&
        currentQuestionIndex < totalQuestions
      ) {
        console.log(
          `🔄 Resuming interview - generating question ${
            currentQuestionIndex + 1
          } (already answered ${candidate.answers.length})`
        );
        generateNextQuestion();
      }
    }
  }, [isActive, currentQuestion, isInterviewComplete]);

  // Enhanced real-time answer validation with AI scoring
  useEffect(() => {
    const validateAnswer = async () => {
      if (!currentAnswer.trim()) {
        setIsAnswerValid(false);
        setValidationMessage("");
        return;
      }

      const answerLength = currentAnswer.trim().length;

      // Quick length validation first
      if (answerLength < 10) {
        setIsAnswerValid(false);
        setValidationMessage("⚠ Answer too short - add more details");
        return;
      }

      try {
        console.log("🔍 Validating answer with AI...");

        // Use AI for comprehensive answer validation
        if (currentQuestion) {
          const validationResult = await aiService.validateAnswerQuality(
            currentQuestion.question,
            currentAnswer,
            currentQuestion.difficulty
          );

          setIsAnswerValid(validationResult.isValid);

          if (validationResult.isValid) {
            setValidationMessage(
              `✅ Good answer! Estimated score: ${validationResult.estimatedScore}/10`
            );
          } else {
            setValidationMessage(`⚠ ${validationResult.suggestion}`);
          }
        } else {
          // Fallback validation without question context
          const isValid = answerLength >= 20 && /[.!?]/.test(currentAnswer);
          setIsAnswerValid(isValid);
          setValidationMessage(
            isValid
              ? "✓ Good answer structure"
              : "⚠ Add more details and complete sentences"
          );
        }
      } catch (error) {
        console.error("❌ Answer validation failed:", error);

        // Enhanced fallback validation
        const wordCount = currentAnswer.trim().split(/\s+/).length;
        const hasCompleteThoughts = /[.!?]/.test(currentAnswer);
        const isValid =
          answerLength >= 20 && wordCount >= 5 && hasCompleteThoughts;

        setIsAnswerValid(isValid);
        setValidationMessage(
          isValid
            ? "✓ Good answer structure"
            : wordCount < 5
            ? "⚠ Add more words (need at least 5)"
            : !hasCompleteThoughts
            ? "⚠ Add complete sentences"
            : "⚠ Add more details"
        );
      }
    };

    const debounceTimer = setTimeout(validateAnswer, 1000); // Increased delay for AI calls
    return () => clearTimeout(debounceTimer);
  }, [currentAnswer, currentQuestion]);

  const generateNextQuestion = async () => {
    // Prevent multiple simultaneous generations (race condition guard)
    if (isGeneratingRef.current) {
      console.log("⚠️ Already generating question, skipping duplicate call");
      return;
    }

    // Get CURRENT questionIndex from Redux store (not from component state/props)
    // This ensures we use the latest value after submitAnswer increments it
    const latestQuestionIndex = candidate.currentQuestionIndex;

    console.log(
      `📊 Using latest questionIndex: ${latestQuestionIndex} (was: ${currentQuestionIndex})`
    );

    // Safety check: Don't generate more questions than configured
    if (latestQuestionIndex >= totalQuestions) {
      console.log(
        `⚠️ Already at max questions (${totalQuestions}), not generating more`
      );
      return;
    }

    isGeneratingRef.current = true;
    const difficulty = getQuestionDifficulty(latestQuestionIndex);
    console.log(
      `🎯 Requesting ${difficulty} question for question ${
        latestQuestionIndex + 1
      } (index: ${latestQuestionIndex})`
    );
    console.log(
      `📊 Questions answered: ${candidate.answers.length}, Easy: ${
        candidate.answers.filter((a) => a.difficulty === "easy").length
      }, Medium: ${
        candidate.answers.filter((a) => a.difficulty === "medium").length
      }, Hard: ${
        candidate.answers.filter((a) => a.difficulty === "hard").length
      }`
    );

    try {
      await dispatch(generateQuestion(difficulty)).unwrap();
      console.log("✅ Question successfully loaded");
      setIsLoadingNextQuestion(false);
    } catch (error) {
      console.error("❌ Failed to generate question:", error);
      setIsLoadingNextQuestion(false);
      // Could show error message to user or retry
    } finally {
      isGeneratingRef.current = false;
    }
  };

  const getQuestionDifficulty = (questionIndex: number): QuestionDifficulty => {
    console.log(
      `🔍 Determining difficulty for question index: ${questionIndex}`
    );
    console.log(
      `📊 Config: Easy=${config.questionsPerDifficulty.easy}, Medium=${config.questionsPerDifficulty.medium}, Hard=${config.questionsPerDifficulty.hard}`
    );
    console.log(
      `📊 Current state: questionIndex=${questionIndex}, answers.length=${candidate.answers.length}, currentQuestionIndex=${currentQuestionIndex}`
    );

    if (questionIndex < config.questionsPerDifficulty.easy) {
      console.log(
        `✅ Question ${
          questionIndex + 1
        } should be EASY (index ${questionIndex} < ${
          config.questionsPerDifficulty.easy
        })`
      );
      return "easy";
    } else if (
      questionIndex <
      config.questionsPerDifficulty.easy + config.questionsPerDifficulty.medium
    ) {
      console.log(
        `✅ Question ${
          questionIndex + 1
        } should be MEDIUM (index ${questionIndex} < ${
          config.questionsPerDifficulty.easy +
          config.questionsPerDifficulty.medium
        })`
      );
      return "medium";
    } else {
      console.log(
        `✅ Question ${
          questionIndex + 1
        } should be HARD (index ${questionIndex} >= ${
          config.questionsPerDifficulty.easy +
          config.questionsPerDifficulty.medium
        })`
      );
      return "hard";
    }
  };

  const handleSubmitAnswer = async (autoSubmitted = false) => {
    console.log(
      `🚀 handleSubmitAnswer called - autoSubmitted: ${autoSubmitted}, isSubmitting: ${isSubmitting}`
    );

    if (isSubmitting || !currentQuestion) {
      console.log("⚠️ Cannot submit - already submitting or no question");
      return;
    }

    // Prevent multiple simultaneous submissions
    setIsSubmitting(true);

    // Clear any pending generation timeouts to prevent race conditions
    if (nextQuestionTimeoutRef.current) {
      clearTimeout(nextQuestionTimeoutRef.current);
      nextQuestionTimeoutRef.current = null;
    }

    try {
      console.log(
        `📝 Submitting answer for question ${
          currentQuestionIndex + 1
        }/${totalQuestions}`
      );

      // Determine answer based on question type
      const isMCQ =
        currentQuestion.options && currentQuestion.options.length > 0;
      const answerToSubmit = isMCQ ? selectedOption : currentAnswer.trim();

      // Handle empty answers for auto-submission with better fallback
      const finalAnswer =
        answerToSubmit ||
        (autoSubmitted ? "[No answer provided - time's up]" : "[Empty answer]");

      // Allow empty answers to be submitted to prevent stuck states
      if (!answerToSubmit && !autoSubmitted) {
        console.log("⚠️ Submitting empty answer for manual submission");
        // Continue with submission instead of returning
      }

      // Submit the answer to Redux store
      dispatch(
        submitAnswer({
          answer: finalAnswer,
          autoSubmitted,
        })
      );

      // Score the answer with AI
      const scoringResult = await dispatch(
        scoreAnswer({
          question: currentQuestion.question,
          answer: finalAnswer,
          difficulty: currentQuestion.difficulty,
          timeSpent: timer.totalTime - timer.timeLeft,
          autoSubmitted,
          correctAnswer: currentQuestion.correctAnswer, // For MCQ scoring
        })
      ).unwrap();

      // Calculate actual points from the score
      const maxPoints =
        currentQuestion.difficulty === "easy"
          ? 5
          : currentQuestion.difficulty === "medium"
          ? 15
          : 30;
      const actualPoints = Math.round((scoringResult.score / 100) * maxPoints);

      console.log(
        `✅ Answer scored: ${scoringResult.score}% = ${actualPoints}/${maxPoints} points`
      );

      // Show real-time feedback for 3 seconds
      setValidationMessage(
        `✅ Scored: ${actualPoints}/${maxPoints} points - ${scoringResult.feedback}`
      );
      setIsAnswerValid(true);

      // Clear answer but keep feedback visible briefly
      setCurrentAnswer("");
      setSelectedOption(""); // Clear MCQ selection

      // Clear feedback after showing it
      setTimeout(() => {
        setValidationMessage("");
        setIsAnswerValid(false);
      }, 3000);

      // Don't clear currentQuestion immediately - wait until new one loads
      // This prevents blank screen between questions

      // Check if interview is complete
      if (currentQuestionIndex + 1 >= totalQuestions) {
        console.log("🎯 Interview completed - generating final summary");
        dispatch(completeInterview());
        await dispatch(generateFinalSummary(candidate.id)).unwrap();
        setShowResults(true);
      } else {
        console.log(
          `➡️ Moving to next question (${
            currentQuestionIndex + 2
          }/${totalQuestions})`
        );
        // Auto-generate next question after brief delay
        setIsLoadingNextQuestion(true);
        nextQuestionTimeoutRef.current = setTimeout(() => {
          generateNextQuestion();
        }, 1500); // Give user time to see the submission feedback
      }
    } catch (error) {
      console.error("Failed to submit answer:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDifficultyColor = (difficulty: QuestionDifficulty): string => {
    switch (difficulty) {
      case "easy":
        return "text-success-600 bg-success-100";
      case "medium":
        return "text-warning-600 bg-warning-100";
      case "hard":
        return "text-error-600 bg-error-100";
    }
  };

  const getDifficultyLabel = (difficulty: QuestionDifficulty): string => {
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  };

  const handleEndTestEarly = async () => {
    const confirmEnd = window.confirm(
      `Are you sure you want to end the interview early?\n\n` +
        `You have answered ${candidate.answers.length} out of ${totalQuestions} questions.\n` +
        `Your current score: ${candidate.totalScore}/100 points\n\n` +
        `This action cannot be undone.`
    );

    if (confirmEnd) {
      console.log("🛑 Ending interview immediately");

      // Stop timer and clear question
      dispatch(updateTimer({ timeLeft: 0, isRunning: false }));
      dispatch(setCurrentQuestion(null));

      // Complete the interview immediately
      dispatch(completeInterview());

      // Generate summary
      try {
        await dispatch(generateFinalSummary(candidate.id)).unwrap();
      } catch (error) {
        console.error("Error generating summary:", error);
      }

      setShowResults(true);
      setIsSubmitting(false);
      setCurrentAnswer("");
      setSelectedOption("");
    }
  };

  // Safeguard: Don't show interview UI if interview is completed
  if (candidate.status === "completed" && !showResults) {
    return (
      <div className="p-8 text-center">
        <div className="max-w-md mx-auto">
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h2 className="text-xl font-semibold text-green-900 mb-2">
              Interview Already Completed
            </h2>
            <p className="text-green-700 mb-4">
              You have already completed this interview. Your results have been
              saved.
            </p>
            <div className="space-y-2 text-sm text-green-800">
              <div className="flex justify-between">
                <span>Questions Answered:</span>
                <span className="font-medium">
                  {candidate.answers.length}/{totalQuestions}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Final Score:</span>
                <span className="font-medium">{candidate.totalScore}/100</span>
              </div>
            </div>
          </div>
          <Button
            onClick={() => window.location.reload()}
            size="lg"
            className="w-full"
          >
            Start New Interview
          </Button>
        </div>
      </div>
    );
  }

  if (!isActive) {
    return (
      <div className="p-8 text-center">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Ready to Start Your Interview?
          </h2>
          <p className="text-gray-600 mb-6">
            You'll be asked {totalQuestions} questions across different
            difficulty levels. Each question has a time limit, so be prepared to
            think quickly!
          </p>

          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-900 mb-2">
              Interview Structure:
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>
                • {config.questionsPerDifficulty.easy} Easy questions (
                {formatTime(config.timeLimits.easy)} each)
              </li>
              <li>
                • {config.questionsPerDifficulty.medium} Medium questions (
                {formatTime(config.timeLimits.medium)} each)
              </li>
              <li>
                • {config.questionsPerDifficulty.hard} Hard questions (
                {formatTime(config.timeLimits.hard)} each)
              </li>
            </ul>
          </div>

          <Button
            onClick={() => {
              onStart();
              // Generate first question immediately after starting
              setTimeout(() => generateNextQuestion(), 500);
            }}
            size="lg"
          >
            Start Interview
          </Button>
        </div>
      </div>
    );
  }

  // Show results screen
  if (isInterviewComplete || showResults) {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-success-600"
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
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Interview Complete!
            </h2>
            <p className="text-lg text-gray-600">
              Thank you for completing the assessment.
            </p>
          </div>

          <div className="bg-white rounded-lg border p-6 mb-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary-600">
                  {candidate.totalScore}
                </div>
                <div className="text-sm text-gray-500">Overall Score</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatTime(candidate.timeSpent)}
                </div>
                <div className="text-sm text-gray-500">Total Time</div>
              </div>
            </div>
          </div>

          {candidate.finalSummary && (
            <div className="bg-gray-50 rounded-lg p-6 text-left">
              <h3 className="font-semibold text-gray-900 mb-3">
                AI Assessment Summary
              </h3>
              <p className="text-gray-700">{candidate.finalSummary}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[800px]">
      {/* Professional Header - Sticky */}
      <div className="p-4 border-b bg-white sticky top-0 z-10 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-bold">
                Q{currentQuestionIndex + 1}
              </span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </h3>
              {currentQuestion && (
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${getDifficultyColor(
                      currentQuestion.difficulty
                    )}`}
                  >
                    {getDifficultyLabel(currentQuestion.difficulty)} Level
                  </span>
                  <span className="text-xs font-semibold text-gray-600">
                    • Worth{" "}
                    {currentQuestion.difficulty === "easy"
                      ? "5"
                      : currentQuestion.difficulty === "medium"
                      ? "15"
                      : "30"}{" "}
                    points
                  </span>
                </div>
              )}
            </div>
          </div>
          <Button
            onClick={handleEndTestEarly}
            variant="outline"
            size="sm"
            className="text-sm border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 font-medium"
            disabled={isSubmitting}
          >
            End Test
          </Button>
        </div>
        <ProgressBar current={currentQuestionIndex} total={totalQuestions} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {/* Loading State - Show when no current question */}
        {!currentQuestion && candidate.answers.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-lg font-semibold text-gray-900">
                Loading your first question...
              </p>
              <p className="text-sm text-gray-500 mt-2">Please wait a moment</p>
            </div>
          </div>
        )}

        {/* Loading Next Question - Show during transitions */}
        {isLoadingNextQuestion && candidate.answers.length > 0 && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-lg font-medium text-gray-900">
                Loading next question...
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Preparing question {candidate.answers.length + 1} of{" "}
                {totalQuestions}
              </p>
            </div>
          </div>
        )}

        {/* MCQ Question Display - Show at top (sticky) */}
        {!isLoadingNextQuestion &&
          currentQuestion &&
          currentQuestion.options &&
          currentQuestion.options.length > 0 && (
            <div className="sticky top-0 z-10 bg-gray-50 p-6">
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    {currentQuestion.question}
                  </h3>
                </div>

                {/* MCQ Options */}
                <div className="space-y-3 mt-4">
                  {currentQuestion.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedOption(option)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        selectedOption === option
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedOption === option
                              ? "border-blue-500 bg-blue-500"
                              : "border-gray-300"
                          }`}
                        >
                          {selectedOption === option && (
                            <div className="w-2 h-2 rounded-full bg-white"></div>
                          )}
                        </div>
                        <span className="text-gray-800">{option}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

        {/* Previous Questions and Answers */}
        <div className="p-6 space-y-6">
          {candidate.answers.map((answer, index) => (
            <div key={answer.id} className="space-y-3">
              {/* Question */}
              <div className="flex justify-start">
                <div className="max-w-3xl bg-primary-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-medium">AI</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      Question {index + 1}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${getDifficultyColor(
                        answer.difficulty
                      )}`}
                    >
                      {getDifficultyLabel(answer.difficulty)}
                    </span>
                  </div>
                  <p className="text-gray-900">{answer.question}</p>
                </div>
              </div>

              {/* Answer */}
              <div className="flex justify-end">
                <div className="max-w-3xl bg-gray-100 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-gray-500">Your Answer</span>
                    <span className="text-xs text-gray-400">
                      {formatTime(answer.timeSpent)} /{" "}
                      {formatTime(answer.timeLimit)}
                    </span>
                    {answer.autoSubmitted && (
                      <span className="text-xs text-warning-600">
                        (Auto-submitted)
                      </span>
                    )}
                  </div>
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {answer.answer || "No answer provided"}
                  </p>
                  <div className="mt-2 pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">
                        Score:
                      </span>
                      <span className="text-sm font-bold text-primary-600">
                        {answer.score}/
                        {answer.difficulty === "easy"
                          ? 5
                          : answer.difficulty === "medium"
                          ? 15
                          : 30}{" "}
                        points
                      </span>
                    </div>
                    {answer.feedback && (
                      <p className="text-sm text-gray-600 mt-1">
                        {answer.feedback}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Current Medium/Hard Question - Show in chat flow at bottom */}
          {!isLoadingNextQuestion &&
            currentQuestion &&
            (!currentQuestion.options ||
              currentQuestion.options.length === 0) && (
              <div className="space-y-3">
                {/* Current Question Display */}
                <div className="flex justify-start">
                  <div className="max-w-3xl bg-primary-50 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white font-medium">
                          AI
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        Question {candidate.answers.length + 1}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${getDifficultyColor(
                          currentQuestion.difficulty
                        )}`}
                      >
                        {getDifficultyLabel(currentQuestion.difficulty)}
                      </span>
                      <span className="text-xs text-gray-500">
                        •{" "}
                        {currentQuestion.difficulty === "medium" ? "60" : "120"}{" "}
                        seconds
                      </span>
                    </div>
                    <p className="text-gray-900 text-lg">
                      {currentQuestion.question}
                    </p>
                  </div>
                </div>
              </div>
            )}
        </div>

        <div ref={chatEndRef} />
      </div>

      {/* Answer Input */}
      {currentQuestion && (
        <div className="p-4 border-t bg-gray-50">
          <div className="mb-4">
            <Timer
              timeLeft={timer.timeLeft}
              totalTime={timer.totalTime}
              isRunning={timer.isRunning}
              onTimeUp={() => {
                console.log("⏰ Timer onTimeUp callback triggered!");
                handleSubmitAnswer(true);
              }}
            />
          </div>

          <div className="space-y-3">
            {/* Text Input for Medium/Hard Questions */}
            {(!currentQuestion.options ||
              currentQuestion.options.length === 0) && (
              <div className="relative">
                <Textarea
                  placeholder="Type your answer here..."
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  className={`min-h-[100px] ${
                    validationMessage
                      ? isAnswerValid
                        ? "border-green-300 focus:border-green-500"
                        : "border-amber-300 focus:border-amber-500"
                      : ""
                  }`}
                  disabled={isSubmitting}
                />
                {validationMessage && (
                  <div
                    className={`absolute -bottom-6 left-0 text-xs ${
                      isAnswerValid ? "text-green-600" : "text-amber-600"
                    }`}
                  >
                    {validationMessage}
                  </div>
                )}
              </div>
            )}

            {/* Validation message for MCQ */}
            {currentQuestion.options &&
              currentQuestion.options.length > 0 &&
              validationMessage && (
                <div
                  className={`text-sm px-4 py-2 rounded-lg ${
                    isAnswerValid
                      ? "text-success-700 bg-success-50 border border-success-300"
                      : "text-amber-700 bg-amber-50 border border-amber-300"
                  }`}
                >
                  {validationMessage}
                </div>
              )}

            <div className="flex justify-between items-center pt-2">
              <div className="space-y-1">
                {currentQuestion &&
                  (!currentQuestion.options ||
                    currentQuestion.options.length === 0) && (
                    <>
                      <p className="text-sm text-gray-500">
                        Be specific and provide examples where possible.
                      </p>
                      <p className="text-xs text-gray-400">
                        Words:{" "}
                        {
                          currentAnswer
                            .trim()
                            .split(/\s+/)
                            .filter((word) => word.length > 0).length
                        }
                      </p>
                    </>
                  )}
                <button
                  onClick={handleEndTestEarly}
                  className="text-xs text-red-600 hover:text-red-800 underline"
                  disabled={isSubmitting}
                >
                  End interview early?
                </button>
              </div>
              <Button
                onClick={() => handleSubmitAnswer(false)}
                disabled={
                  isSubmitting ||
                  (currentQuestion.options && currentQuestion.options.length > 0
                    ? !selectedOption
                    : !currentAnswer.trim())
                }
                isLoading={isSubmitting}
                className={
                  isAnswerValid ? "bg-green-600 hover:bg-green-700" : ""
                }
              >
                {isSubmitting ? "Submitting..." : "Submit Answer"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewChat;
