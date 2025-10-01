import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateCandidate } from "../../store/interviewSlice";
import { Candidate } from "../../types";
import { validateEmail, validatePhone } from "../../lib/utils";
import Input from "../ui/Input";
import Button from "../ui/Button";

interface MissingFieldsFormProps {
  candidate: Candidate;
  missingFields: string[];
  onComplete: () => void;
}

const MissingFieldsForm: React.FC<MissingFieldsFormProps> = ({
  candidate,
  missingFields,
  onComplete,
}) => {
  const dispatch = useDispatch();
  const candidates = useSelector((state: any) => state.interview.candidates);

  const [formData, setFormData] = useState({
    name: candidate.name || "",
    email: candidate.email || "",
    phone: candidate.phone || "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>(
    {}
  );
  const [reattemptError, setReattemptError] = useState<string | null>(null);

  // Real-time validation
  useEffect(() => {
    const newErrors: Record<string, string> = {};

    // Only validate touched fields
    if (
      touchedFields.name &&
      missingFields.includes("name") &&
      !formData.name.trim()
    ) {
      newErrors.name = "Full name is required";
    }

    if (touchedFields.email && missingFields.includes("email")) {
      if (!formData.email.trim()) {
        newErrors.email = "Email address is required";
      } else if (!validateEmail(formData.email)) {
        newErrors.email = "Please enter a valid email address";
      }
    }

    if (touchedFields.phone && missingFields.includes("phone")) {
      if (!formData.phone.trim()) {
        newErrors.phone = "Phone number is required";
      } else if (!validatePhone(formData.phone)) {
        newErrors.phone = "Please enter a valid phone number";
      }
    }

    setErrors(newErrors);
  }, [formData, missingFields, touchedFields]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Mark field as touched for real-time validation
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (missingFields.includes("name") && !formData.name.trim()) {
      newErrors.name = "Full name is required to personalize your interview";
    }

    if (missingFields.includes("email")) {
      if (!formData.email.trim()) {
        newErrors.email = "Email address is required for your interview record";
      } else if (!validateEmail(formData.email)) {
        newErrors.email =
          "Please enter a valid email address (e.g., john@example.com)";
      }
    }

    if (missingFields.includes("phone")) {
      if (!formData.phone.trim()) {
        newErrors.phone = "Phone number is required for contact information";
      } else if (!validatePhone(formData.phone)) {
        newErrors.phone =
          "Please enter a valid phone number (e.g., +1-555-123-4567)";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Function to check if candidate already completed interview with these credentials
  const checkExistingCandidate = (finalData: {
    name: string;
    email: string;
    phone: string;
  }) => {
    return candidates.find((existingCandidate: Candidate) => {
      if (
        existingCandidate.status !== "completed" ||
        existingCandidate.id === candidate.id
      )
        return false;

      // Check if any of the key identifiers match
      const emailMatch =
        finalData.email &&
        existingCandidate.email &&
        existingCandidate.email.toLowerCase().trim() ===
          finalData.email.toLowerCase().trim();
      const phoneMatch =
        finalData.phone &&
        existingCandidate.phone &&
        existingCandidate.phone.replace(/\D/g, "") ===
          finalData.phone.replace(/\D/g, "");
      const nameMatch =
        finalData.name &&
        existingCandidate.name &&
        existingCandidate.name.toLowerCase().trim() ===
          finalData.name.toLowerCase().trim();

      return emailMatch || phoneMatch || nameMatch;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setReattemptError(null);

    if (validateForm()) {
      // Prepare final data with completed information
      const finalData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
      };

      // Check if candidate with these credentials already completed interview
      const existingCompletedCandidate = checkExistingCandidate(finalData);

      if (existingCompletedCandidate) {
        setReattemptError(
          `❌ Interview already completed with these credentials.\n` +
            `Name: ${existingCompletedCandidate.name}\n` +
            `Email: ${existingCompletedCandidate.email}\n` +
            `Phone: ${existingCompletedCandidate.phone}\n` +
            `Completed on: ${new Date(
              existingCompletedCandidate.updatedAt ||
                existingCompletedCandidate.createdAt
            ).toLocaleDateString()}\n` +
            `Score: ${existingCompletedCandidate.totalScore}/100\n\n` +
            `To maintain test integrity, re-attempts with the same credentials are not allowed.`
        );
        setIsSubmitting(false);
        return;
      }

      console.log("✅ All required fields provided, updating candidate...");

      // Update candidate with the missing information
      const updates: Partial<Candidate> = finalData;

      dispatch(updateCandidate({ id: candidate.id, updates }));

      console.log("🎯 Candidate updated, proceeding to interview...");
      onComplete();
    } else {
      console.log("❌ Form validation failed, please fix errors");
      setIsSubmitting(false);
    }
  };

  // Determine which fields were successfully extracted
  const extractedFields = {
    name: !missingFields.includes("name") && candidate.name,
    email: !missingFields.includes("email") && candidate.email,
    phone: !missingFields.includes("phone") && candidate.phone,
  };

  const hasExtractedFields = Object.values(extractedFields).some(Boolean);

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-amber-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Complete Your Profile
        </h2>
        <p className="text-gray-600">
          We need a few more details before starting your AI interview. This
          helps us personalize your experience.
        </p>
      </div>

      {/* Successfully Extracted Fields */}
      {hasExtractedFields && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-green-400 mt-0.5"
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
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800 mb-2">
                ✅ Successfully Extracted from Resume:
              </h3>
              <div className="space-y-1 text-sm text-green-700">
                {extractedFields.name && (
                  <div className="flex justify-between">
                    <span className="font-medium">Name:</span>
                    <span>{candidate.name}</span>
                  </div>
                )}
                {extractedFields.email && (
                  <div className="flex justify-between">
                    <span className="font-medium">Email:</span>
                    <span>{candidate.email}</span>
                  </div>
                )}
                {extractedFields.phone && (
                  <div className="flex justify-between">
                    <span className="font-medium">Phone:</span>
                    <span>{candidate.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Re-attempt Error */}
      {reattemptError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-red-400 mt-0.5"
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
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 mb-2">
                ❌ Interview Already Completed
              </h3>
              <div className="text-sm text-red-700 whitespace-pre-line">
                {reattemptError}
              </div>
              <div className="mt-3">
                <Button
                  type="button"
                  onClick={() => {
                    setReattemptError(null);
                    // Reset form to allow trying different credentials
                    setFormData({
                      name: candidate.name || "",
                      email: candidate.email || "",
                      phone: candidate.phone || "",
                    });
                    setTouchedFields({});
                    setErrors({});
                  }}
                  size="sm"
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  Try Different Information
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Missing Fields Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-amber-800 mb-4 flex items-center">
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            Please Provide Missing Information:
          </h3>

          <div className="space-y-4">
            {missingFields.includes("name") && (
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Full Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter your full name (e.g., John Smith)"
                  error={errors.name}
                  required
                  className="w-full"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>
            )}

            {missingFields.includes("email") && (
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email Address <span className="text-red-500">*</span>
                </label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter your email (e.g., john@example.com)"
                  error={errors.email}
                  required
                  className="w-full"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
            )}

            {missingFields.includes("phone") && (
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="Enter your phone (e.g., +1-555-123-4567)"
                  error={errors.phone}
                  required
                  className="w-full"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Validating Information...
            </>
          ) : (
            <>
              Start My AI Interview
              <svg
                className="w-4 h-4 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </>
          )}
        </Button>

        {/* Help Text */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">
            What happens next?
          </h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>
              • You'll get 6 interview questions: 2 Easy → 2 Medium → 2 Hard
            </li>
            <li>
              • Each question has a time limit: Easy (20s), Medium (60s), Hard
              (120s)
            </li>
            <li>• AI will score your answers and provide feedback</li>
            <li>• You'll receive a final summary and score at the end</li>
          </ul>
        </div>
      </form>
    </div>
  );
};

export default MissingFieldsForm;
