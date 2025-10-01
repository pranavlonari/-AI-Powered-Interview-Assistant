import React, { useState } from "react";
import { Candidate } from "../../types";
import Button from "../ui/Button";
import Input from "../ui/Input";

interface MissingFieldsCollectionProps {
  candidateData: Partial<Candidate>;
  onComplete: (completeData: Partial<Candidate>) => void;
}

const MissingFieldsCollection: React.FC<MissingFieldsCollectionProps> = ({
  candidateData,
  onComplete,
}) => {
  const [formData, setFormData] = useState({
    name: candidateData.name || "",
    email: candidateData.email || "",
    phone: candidateData.phone || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine which fields are missing
  const missingFields = {
    name: !candidateData.name?.trim(),
    email: !candidateData.email?.trim(),
    phone: !candidateData.phone?.trim(),
  };

  const hasMissingFields = Object.values(missingFields).some(Boolean);

  // If no fields are missing, proceed directly
  if (!hasMissingFields) {
    onComplete(candidateData);
    return null;
  }

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleaned = phone.replace(/[\s\-\(\)\.]/g, "");
    return cleaned.length >= 10 && phoneRegex.test(cleaned);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const newErrors: Record<string, string> = {};

    // Validate required fields
    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      // All fields are valid, proceed
      const completeData = {
        ...candidateData,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
      };
      onComplete(completeData);
    } else {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
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
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Complete Your Information
        </h2>
        <p className="text-sm text-gray-600">
          We need a few more details before starting your interview. Please fill
          in the missing information below.
        </p>
      </div>

      {/* Extracted Info Summary */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-green-800 mb-2">
          ✅ Successfully Extracted from Resume:
        </h3>
        <div className="space-y-1 text-sm text-green-700">
          {!missingFields.name && (
            <div>
              • <strong>Name:</strong> {candidateData.name}
            </div>
          )}
          {!missingFields.email && (
            <div>
              • <strong>Email:</strong> {candidateData.email}
            </div>
          )}
          {!missingFields.phone && (
            <div>
              • <strong>Phone:</strong> {candidateData.phone}
            </div>
          )}
        </div>
      </div>

      {/* Missing Fields Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-amber-800 mb-3">
            ⚠️ Please Provide Missing Information:
          </h3>

          <div className="space-y-4">
            {missingFields.name && (
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Full Name *
                </label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Enter your full name"
                  error={errors.name}
                  required
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                )}
              </div>
            )}

            {missingFields.email && (
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email Address *
                </label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="Enter your email address"
                  error={errors.email}
                  required
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                )}
              </div>
            )}

            {missingFields.phone && (
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Phone Number *
                </label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="Enter your phone number"
                  error={errors.phone}
                  required
                />
                {errors.phone && (
                  <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
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
          {isSubmitting ? "Validating..." : "Start Interview"}
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
        </Button>

        <p className="text-xs text-gray-500 text-center">
          This information is required to personalize your interview experience
          and generate relevant questions.
        </p>
      </form>
    </div>
  );
};

export default MissingFieldsCollection;
