import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store";
import {
  createCandidate,
  startInterview,
  resumeInterview,
  showWelcomeBackModal,
  clearCurrentSession,
  completeInterview,
  generateFinalSummary,
} from "../store/interviewSlice";
import ResumeUpload from "../components/interview/ResumeUpload";
import MissingFieldsForm from "../components/interview/MissingFieldsForm";
import InterviewChat from "../components/interview/InterviewChat";
import WelcomeBackModal from "../components/interview/WelcomeBackModal";
import { Candidate } from "../types";

const IntervieweePage: React.FC = () => {
  const dispatch = useDispatch();
  const {
    currentCandidate,
    showWelcomeBack,
    isInterviewActive,
    currentQuestion,
  } = useSelector((state: RootState) => state.interview);

  const [phase, setPhase] = useState<"upload" | "missing-fields" | "interview">(
    "upload"
  );
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [isStateRestored, setIsStateRestored] = useState(false);

  useEffect(() => {
    // Comprehensive state restoration on page load/refresh ONLY
    const restoreInterviewState = () => {
      console.log("🔄 Restoring interview state on page load/refresh");

      if (currentCandidate) {
        console.log(
          `👤 Found candidate: ${currentCandidate.name} (${currentCandidate.status})`
        );

        // ONLY show welcome back modal for in-progress or paused interviews after page refresh
        // NEVER show for completed or pending interviews
        if (
          (currentCandidate.status === "in-progress" ||
            currentCandidate.status === "paused") &&
          !isStateRestored // Only on first load, not during active session
        ) {
          console.log("✅ Showing welcome back modal for incomplete interview");
          dispatch(showWelcomeBackModal(true));
        } else if (currentCandidate.status === "completed") {
          console.log(
            "❌ Interview already completed - clearing session and starting fresh"
          );
          // Clear the completed interview so user can start a new one
          dispatch(clearCurrentSession());
        }
        // For pending interviews, stay on upload page
      }

      setIsStateRestored(true);
    };

    // Only run once on mount
    if (!isStateRestored) {
      restoreInterviewState();
    }
  }, [currentCandidate, dispatch, isStateRestored]);

  // Additional effect for handling browser refresh during active interview
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isInterviewActive && currentQuestion) {
        e.preventDefault();
        e.returnValue =
          "You have an active interview. Are you sure you want to leave?";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isInterviewActive, currentQuestion]);

  const handleResumeUploadSuccess = (candidateData: Partial<Candidate>) => {
    // Check for missing required fields
    const missing: string[] = [];
    if (!candidateData.name) missing.push("name");
    if (!candidateData.email) missing.push("email");
    if (!candidateData.phone) missing.push("phone");

    if (missing.length > 0) {
      setMissingFields(missing);
      dispatch(
        createCandidate({
          ...candidateData,
          status: "pending",
          currentQuestionIndex: 0,
        } as Omit<Candidate, "id" | "createdAt" | "updatedAt" | "answers" | "totalScore" | "timeSpent">)
      );
      setPhase("missing-fields");
    } else {
      dispatch(
        createCandidate({
          ...candidateData,
          status: "pending",
          currentQuestionIndex: 0,
        } as Omit<Candidate, "id" | "createdAt" | "updatedAt" | "answers" | "totalScore" | "timeSpent">)
      );
      setPhase("interview");
    }
  };

  const handleMissingFieldsComplete = () => {
    setPhase("interview");
  };

  const handleStartInterview = () => {
    dispatch(startInterview());
  };

  const handleResumeInterview = () => {
    // Prevent resuming if interview is already completed
    if (currentCandidate?.status === "completed") {
      console.log("❌ Cannot resume - interview is already completed");
      alert(
        "This interview has already been completed. Please start a new interview."
      );
      dispatch(clearCurrentSession());
      setPhase("upload");
      return;
    }

    console.log("▶️ Resuming interview");
    dispatch(resumeInterview());
    dispatch(showWelcomeBackModal(false));
    setPhase("interview");
  };

  const handleRestartInterview = () => {
    dispatch(clearCurrentSession());
    setPhase("upload");
    setMissingFields([]);
  };

  const handleEndTestEarly = async () => {
    try {
      if (currentCandidate) {
        dispatch(completeInterview());
        await dispatch(generateFinalSummary(currentCandidate.id) as any);
        dispatch(showWelcomeBackModal(false));
        setPhase("interview"); // This will show the results screen
      }
    } catch (error) {
      console.error("Error ending test early:", error);
    }
  };

  if (showWelcomeBack && currentCandidate) {
    return (
      <WelcomeBackModal
        isOpen={true}
        candidate={currentCandidate}
        onContinue={handleResumeInterview}
        onStartNew={handleRestartInterview}
        onEndTest={handleEndTestEarly}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          AI Interview Assessment
        </h1>
        <p className="text-lg text-gray-600">
          Full Stack Developer Position (React/Node.js)
        </p>
      </div>

      {phase === "upload" && (
        <div className="bg-white rounded-lg shadow-soft p-8">
          <div className="max-w-2xl mx-auto">
            {/* Show existing candidate warning if present (but not for completed interviews) */}
            {currentCandidate && currentCandidate.status !== "completed" && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start">
                  <svg
                    className="h-5 w-5 text-amber-400 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  <div className="ml-3 flex-1">
                    <h3 className="text-sm font-medium text-amber-800">
                      Previous Interview Found
                    </h3>
                    <p className="mt-1 text-sm text-amber-700">
                      We found an existing interview session for{" "}
                      <strong>{currentCandidate.name || "a candidate"}</strong>{" "}
                      ({currentCandidate.status}). You can resume your
                      interview.
                    </p>
                    <div className="mt-3 flex gap-3">
                      <button
                        onClick={() => {
                          if (currentCandidate.status === "pending") {
                            // Check if missing fields need to be completed
                            const missing: string[] = [];
                            if (!currentCandidate.name) missing.push("name");
                            if (!currentCandidate.email) missing.push("email");
                            if (!currentCandidate.phone) missing.push("phone");

                            if (missing.length > 0) {
                              setMissingFields(missing);
                              setPhase("missing-fields");
                            } else {
                              setPhase("interview");
                            }
                          } else {
                            setPhase("interview");
                          }
                        }}
                        className="text-sm bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700 font-medium"
                      >
                        Resume Interview
                      </button>
                      {currentCandidate.answers.length > 0 && (
                        <button
                          onClick={handleEndTestEarly}
                          className="text-sm bg-white text-red-600 border border-red-300 px-4 py-2 rounded hover:bg-red-50 font-medium"
                        >
                          End Test
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Upload Your Resume
              </h2>
              <p className="text-gray-600">
                Please upload your resume in PDF or DOCX format to begin the
                interview process.
              </p>
            </div>

            <ResumeUpload onSuccess={handleResumeUploadSuccess} />
          </div>
        </div>
      )}

      {phase === "missing-fields" && currentCandidate && (
        <div className="bg-white rounded-lg shadow-soft p-8">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Complete Your Profile
              </h2>
              <p className="text-gray-600">
                We need some additional information before starting the
                interview.
              </p>
            </div>

            <MissingFieldsForm
              candidate={currentCandidate}
              missingFields={missingFields}
              onComplete={handleMissingFieldsComplete}
            />
          </div>
        </div>
      )}

      {phase === "interview" && currentCandidate && (
        <div className="bg-white rounded-lg shadow-soft overflow-hidden">
          <InterviewChat
            candidate={currentCandidate}
            isActive={isInterviewActive}
            onStart={handleStartInterview}
          />
        </div>
      )}
    </div>
  );
};

export default IntervieweePage;
