import React, { useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { parseResume } from "../../lib/resumeParser";
import { FileUploadResult, Candidate } from "../../types";
import Button from "../ui/Button";
import RealTimeProcessing from "./RealTimeProcessing";

interface ResumeUploadProps {
  onSuccess: (candidateData: Partial<Candidate>) => void;
}

const ResumeUpload: React.FC<ResumeUploadProps> = ({ onSuccess }) => {
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<Partial<Candidate> | null>(
    null
  );
  const [showPreview, setShowPreview] = useState(false);
  const [processingStage, setProcessingStage] = useState("");
  const [processingProgress, setProcessingProgress] = useState(0);
  const [showReattemptWarning, setShowReattemptWarning] = useState(false);
  const [existingCandidate, setExistingCandidate] = useState<Candidate | null>(
    null
  );

  // Get Redux state to check for existing candidates
  const candidates = useSelector((state: any) => state.interview.candidates);

  // STRICT: Only PDF and DOCX allowed - no other formats
  const allowedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  const allowedExtensions = [".pdf", ".docx"];

  // Strict file type validation
  const isStrictlyValidFile = (
    file: File
  ): { valid: boolean; error?: string } => {
    // Check MIME type
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: "Invalid file type. Only PDF and DOCX files are accepted.",
      };
    }

    // Check file extension
    const fileName = file.name.toLowerCase();
    const hasValidExtension = allowedExtensions.some((ext) =>
      fileName.endsWith(ext)
    );

    if (!hasValidExtension) {
      return {
        valid: false,
        error:
          "Invalid file extension. Only .pdf and .docx files are accepted.",
      };
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return {
        valid: false,
        error: "File size must be less than 10MB.",
      };
    }

    // Check minimum file size (at least 1KB to avoid empty files)
    if (file.size < 1024) {
      return {
        valid: false,
        error: "File appears to be empty or corrupted.",
      };
    }

    return { valid: true };
  };

  // Function to check if candidate already completed interview
  const checkExistingCandidate = useCallback(
    (candidateData: Partial<Candidate>) => {
      return candidates.find((candidate: Candidate) => {
        if (candidate.status !== "completed") return false;

        // Normalize data for comparison
        const normalizeEmail = (email?: string) =>
          email ? email.toLowerCase().trim() : "";
        const normalizePhone = (phone?: string) =>
          phone ? phone.replace(/\D/g, "") : "";
        const normalizeName = (name?: string) =>
          name ? name.toLowerCase().trim().replace(/\s+/g, " ") : "";

        // Check if any of the key identifiers match (strict comparison)
        const emailMatch =
          candidateData.email &&
          candidate.email &&
          normalizeEmail(candidateData.email) ===
            normalizeEmail(candidate.email);

        const phoneMatch =
          candidateData.phone &&
          candidate.phone &&
          normalizePhone(candidateData.phone) ===
            normalizePhone(candidate.phone) &&
          normalizePhone(candidateData.phone).length >= 10; // Ensure it's a full phone number

        const nameMatch =
          candidateData.name &&
          candidate.name &&
          normalizeName(candidateData.name) === normalizeName(candidate.name) &&
          candidateData.name.trim().length > 2; // Ensure it's not just initials

        // Must match at least one complete identifier
        return emailMatch || phoneMatch || nameMatch;
      });
    },
    [candidates]
  );

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setIsUploading(true);

      try {
        // STRICT VALIDATION: Only PDF and DOCX allowed
        const validation = isStrictlyValidFile(file);
        if (!validation.valid) {
          throw new Error(validation.error || "Invalid file");
        }

        console.log("✅ File validation passed:", {
          name: file.name,
          type: file.type,
          size: `${(file.size / 1024).toFixed(2)} KB`,
        });

        // Real-time processing feedback
        setProcessingStage("📄 Reading file content...");
        setProcessingProgress(20);

        // Parse resume with real-time updates
        console.log(
          "🚀 Starting REAL-TIME resume parsing for file:",
          file.name
        );

        setProcessingStage("Extracting text from document...");
        setProcessingProgress(40);

        const result: FileUploadResult = await parseResume(file);

        setProcessingStage("AI analyzing contact information...");
        setProcessingProgress(80);

        // Add delay for better UX
        await new Promise((resolve) => setTimeout(resolve, 1000));

        console.log("✅ Resume parsing completed with REAL DATA:", result);

        setProcessingProgress(100);
        setProcessingStage("Processing complete!");

        if (result.success && result.data) {
          const candidateData: Partial<Candidate> = {
            name: result.data.name || "",
            email: result.data.email || "",
            phone: result.data.phone || "",
            resumeFile: file,
            resumeText: result.data.text,
            status: "pending",
            currentQuestionIndex: 0,
          };

          // Check if candidate with same credentials already completed interview
          const existingCompletedCandidate =
            checkExistingCandidate(candidateData);

          if (existingCompletedCandidate) {
            setExistingCandidate(existingCompletedCandidate);
            setShowReattemptWarning(true);
            setError(
              `❌ Interview already completed with these credentials.\n` +
                `Name: ${existingCompletedCandidate.name}\n` +
                `Email: ${existingCompletedCandidate.email}\n` +
                `Phone: ${existingCompletedCandidate.phone}\n` +
                `Completed on: ${new Date(
                  existingCompletedCandidate.updatedAt ||
                    existingCompletedCandidate.createdAt
                ).toLocaleDateString()}\n` +
                `Score: ${existingCompletedCandidate.totalScore}/100\n\n` +
                `To maintain test integrity, re-attempts with the same credentials are not allowed. ` +
                `Please use different contact information if this is a different candidate.`
            );
            return;
          }

          // Show extraction preview first
          setExtractedData(candidateData);
          setShowPreview(true);

          // Auto-proceed after 3 seconds or wait for user confirmation
          setTimeout(() => {
            onSuccess(candidateData);
          }, 3000);
        } else {
          throw new Error(result.error || "Failed to process resume.");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred."
        );
      } finally {
        setIsUploading(false);
      }
    },
    [onSuccess]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      if (e.target.files && e.target.files[0]) {
        handleFile(e.target.files[0]);
      }
    },
    [handleFile]
  );

  return (
    <div className="space-y-6">
      {/* Real-time Processing Feedback */}
      <RealTimeProcessing
        isProcessing={isUploading}
        progress={processingProgress}
        stage={processingStage}
        extractedData={
          extractedData
            ? {
                name: extractedData.name,
                email: extractedData.email,
                phone: extractedData.phone,
              }
            : undefined
        }
      />

      {/* Drag & Drop Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? "border-primary-500 bg-primary-50"
            : error
            ? "border-error-300 bg-error-50"
            : "border-gray-300 hover:border-primary-400"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="resume-upload"
          accept=".pdf,.docx"
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
          aria-label="Upload resume file (PDF or DOCX)"
        />

        <div className="space-y-4">
          {isUploading ? (
            <div className="animate-bounce">
              <svg
                className="mx-auto h-12 w-12 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
          ) : (
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}

          <div>
            <p className="text-lg font-medium text-gray-900">
              {isUploading ? "Processing resume..." : "Drop your resume here"}
            </p>
            <p className="text-sm text-gray-500">
              {isUploading
                ? "Please wait while we extract your information"
                : "or click to browse files"}
            </p>
          </div>

          {!isUploading && (
            <div className="flex items-center justify-center">
              <Button variant="outline" size="sm" disabled={isUploading}>
                Choose File
              </Button>
            </div>
          )}

          <div className="text-xs text-gray-400">
            <p>Supports PDF and DOCX files</p>
            <p>Maximum file size: 10MB</p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-error-50 p-4">
          <div className="flex">
            <svg
              className="h-5 w-5 text-error-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-error-800">
                Upload Error
              </h3>
              <p className="mt-1 text-sm text-error-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Extraction Preview */}
      {showPreview && extractedData && (
        <div className="rounded-md bg-green-50 border border-green-200 p-4">
          <div className="flex items-start">
            <svg
              className="h-5 w-5 text-green-400 mt-0.5"
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
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-green-800">
                Resume Processed Successfully!
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p className="mb-2">We extracted the following information:</p>
                <div className="grid grid-cols-1 gap-1 bg-white rounded p-3 border border-green-200">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Name:</span>
                    <span
                      className={
                        extractedData.name ? "text-green-800" : "text-amber-600"
                      }
                    >
                      {extractedData.name || "Not found - will ask you"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Email:</span>
                    <span
                      className={
                        extractedData.email
                          ? "text-green-800"
                          : "text-amber-600"
                      }
                    >
                      {extractedData.email || "Not found - will ask you"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Phone:</span>
                    <span
                      className={
                        extractedData.phone
                          ? "text-green-800"
                          : "text-amber-600"
                      }
                    >
                      {extractedData.phone || "Not found - will ask you"}
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-xs">
                  Proceeding automatically in a few seconds...
                </p>
              </div>
              <div className="mt-3">
                <Button
                  onClick={() => onSuccess(extractedData)}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  Continue Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Re-attempt Warning */}
      {showReattemptWarning && existingCandidate && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4">
          <div className="flex items-start">
            <svg
              className="h-5 w-5 text-red-400 mt-0.5"
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
              <h3 className="text-sm font-medium text-red-800">
                Interview Already Completed
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p className="mb-3">
                  A candidate with these credentials has already completed the
                  interview:
                </p>
                <div className="bg-white rounded p-3 border border-red-200">
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="font-medium">Name:</span>
                      <span>{existingCandidate.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Email:</span>
                      <span>{existingCandidate.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Phone:</span>
                      <span>{existingCandidate.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Completed:</span>
                      <span>
                        {new Date(
                          existingCandidate.updatedAt ||
                            existingCandidate.createdAt
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Score:</span>
                      <span className="font-bold">
                        {existingCandidate.totalScore}/100
                      </span>
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-xs">
                  To maintain test integrity, re-attempts with the same
                  credentials are not allowed. Please use different contact
                  information if this is a different candidate.
                </p>
              </div>
              <div className="mt-3">
                <Button
                  onClick={() => {
                    setShowReattemptWarning(false);
                    setExistingCandidate(null);
                    setError(null);
                    setExtractedData(null);
                  }}
                  size="sm"
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  Try Different Resume
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">
          What happens next?
        </h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>
            • We'll extract your name, email, and phone number from your resume
          </li>
          <li>
            • If any information is missing, you'll be asked to provide it
          </li>
          <li>
            • The AI interview will begin with 6 questions (Easy → Medium →
            Hard)
          </li>
          <li>
            • Each question has a time limit, so prepare to think quickly!
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ResumeUpload;
