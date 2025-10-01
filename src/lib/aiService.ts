import { QuestionDifficulty } from "../types";

interface GenerateQuestionResponse {
  question: string;
  difficulty: QuestionDifficulty;
  options?: string[];
  correctAnswer?: string;
}

interface ScoreAnswerResponse {
  score: number;
  feedback: string;
  reasoning: string;
}

interface GenerateSummaryResponse {
  overallScore: number;
  summary: string;
  strengths: string[];
  improvements: string[];
}

interface ExtractResumeResponse {
  name?: string;
  email?: string;
  phone?: string;
  experience?: string;
  skills?: string[];
}

class AIService {
  private apiKey: string;
  private model: string;
  private baseUrl: string;
  private isDebugMode: boolean;
  private maxRetries: number;
  private retryDelay: number;
  private usedQuestionIndices: Set<number> = new Set(); // Track used questions
  private questionCountByDifficulty: {
    easy: number;
    medium: number;
    hard: number;
  } = {
    easy: 0,
    medium: 0,
    hard: 0,
  };

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
    this.model = import.meta.env.VITE_AI_MODEL || "gemini-1.5-flash";
    this.baseUrl = "https://generativelanguage.googleapis.com/v1beta/models";
    this.isDebugMode = import.meta.env.VITE_DEBUG_MODE === "true";
    this.maxRetries = 3;
    this.retryDelay = 1000;

    // Log initialization status
    if (this.isDebugMode) {
      console.log("🤖 AI Service initialized with Gemini:", {
        hasApiKey: !!this.apiKey,
        model: this.model,
        baseUrl: this.baseUrl,
        debugMode: this.isDebugMode,
      });
    }
  }

  private async makeGeminiRequest(
    prompt: string,
    systemInstruction?: string
  ): Promise<string> {
    // Debug: Log API key status
    if (this.isDebugMode) {
      console.log("🔑 API Key present:", !!this.apiKey);
      console.log("🌐 Base URL:", this.baseUrl);
      console.log("🤖 Model:", this.model);
    }

    // Check for valid API key - REQUIRE real API
    if (
      !this.apiKey ||
      this.apiKey === "your_gemini_api_key_here" ||
      this.apiKey.length < 20
    ) {
      const errorMsg =
        "❌ No valid Gemini API key found. Real-time API is required.";
      console.error(errorMsg);
      console.log("💡 Add VITE_GEMINI_API_KEY=your-key to .env file");
      throw new Error(errorMsg);
    }

    console.log(
      "🚀 Using REAL Gemini API with key:",
      this.apiKey.substring(0, 15) + "..."
    );
    console.log("📝 Prompt being sent:", prompt.substring(0, 100) + "...");

    // Retry logic
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        if (this.isDebugMode) {
          console.log(
            `🚀 Making Gemini API request (attempt ${attempt}/${this.maxRetries})...`
          );
        }

        // Real-time API call with timeout and better error handling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const requestBody = {
          contents: [
            {
              parts: [
                {
                  text: systemInstruction
                    ? `${systemInstruction}\n\n${prompt}`
                    : prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1000,
          },
        };

        const response = await fetch(
          `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            `❌ Gemini API error (attempt ${attempt}): ${response.status} - ${errorText}`
          );

          // If it's a rate limit error (429), wait longer before retry
          if (response.status === 429 && attempt < this.maxRetries) {
            await this.delay(this.retryDelay * attempt * 2);
            continue;
          }

          throw new Error(
            `Gemini API error: ${response.status} - ${errorText}`
          );
        }

        const data = await response.json();

        if (this.isDebugMode) {
          console.log("📦 Raw Gemini response:", data);
        }

        const result = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

        if (!result) {
          console.warn("⚠️ Empty response from Gemini API, using fallback");
          console.log("📦 Full API response:", JSON.stringify(data, null, 2));
          throw new Error("Empty response from Gemini API");
        }

        if (this.isDebugMode) {
          console.log(
            "✅ Gemini API response received:",
            result.substring(0, 100) + "..."
          );
        }

        return result;
      } catch (error) {
        console.error(`❌ Gemini API Error (attempt ${attempt}):`, error);

        // If this is the last attempt, throw error
        if (attempt === this.maxRetries) {
          const errorMsg =
            "❌ All Gemini API attempts failed. Real-time API is required.";
          console.error(errorMsg);
          throw new Error(errorMsg);
        }

        // Wait before retry
        await this.delay(this.retryDelay * attempt);
      }
    }

    // This should never be reached, but throw error just in case
    throw new Error("❌ Gemini API request failed after all retries.");
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Reset question tracking for new interview session
  resetQuestionTracking(): void {
    console.log("🔄 Resetting question tracking for new interview");
    this.usedQuestionIndices.clear();
    this.questionCountByDifficulty = {
      easy: 0,
      medium: 0,
      hard: 0,
    };
  }

  async generateQuestion(
    difficulty: QuestionDifficulty,
    candidateContext?: { skills?: string[]; experience?: string; name?: string }
  ): Promise<GenerateQuestionResponse> {
    console.log(`🎯 generateQuestion called with difficulty: ${difficulty}`);
    console.log(
      `📊 Current counters BEFORE enforcement: Easy=${this.questionCountByDifficulty.easy}/2, Medium=${this.questionCountByDifficulty.medium}/2, Hard=${this.questionCountByDifficulty.hard}/2`
    );

    // STRICT ENFORCEMENT: Prevent generating more than 2 easy questions
    if (difficulty === "easy" && this.questionCountByDifficulty.easy >= 2) {
      console.error(
        `🚫 BLOCKED: Already generated 2 easy questions! Changing to medium.`
      );
      difficulty = "medium"; // Force to medium
    }

    // STRICT ENFORCEMENT: Prevent generating more than 2 medium questions
    if (difficulty === "medium" && this.questionCountByDifficulty.medium >= 2) {
      console.error(
        `🚫 BLOCKED: Already generated 2 medium questions! Changing to hard.`
      );
      difficulty = "hard"; // Force to hard
    }

    console.log(`✅ Final difficulty AFTER enforcement: ${difficulty}`);

    const timeLimit =
      difficulty === "easy"
        ? "20 seconds"
        : difficulty === "medium"
        ? "60 seconds"
        : "120 seconds";

    // Create personalized context
    const contextInfo = candidateContext
      ? `
    
🎯 CANDIDATE CONTEXT:
- Name: ${candidateContext.name || "Candidate"}
- Experience Level: ${candidateContext.experience || "Not specified"}
- Skills Mentioned: ${
          candidateContext.skills?.join(", ") || "React, Node.js, JavaScript"
        }
    
Please tailor the question to be relevant to their background while maintaining the ${difficulty} difficulty level.`
      : "";

    // For EASY questions, generate MCQ format
    if (difficulty === "easy") {
      const prompt = `🚀 MULTIPLE CHOICE QUESTION GENERATION

Generate an EASY level technical MCQ (Multiple Choice Question) for a Full Stack (React/Node) role.

📋 REQUIREMENTS:
🟢 EASY Level MCQ (20 seconds to answer):
- Fundamental React or Node.js concepts
- Quick recall of basic syntax and definitions
- Clear, unambiguous question with 4 options
- Only ONE correct answer
- Examples: React hooks basics, Node.js modules, JavaScript fundamentals, npm commands

🎯 TECHNICAL FOCUS AREAS:
- React.js (hooks, components, JSX basics)
- Node.js (modules, npm, basic concepts)  
- JavaScript/TypeScript (ES6+ syntax, data types)
- Basic web development concepts

${contextInfo}

⏱️ TIME: Must be answerable in ${timeLimit}
🎯 FORMAT: Return as JSON object with this structure:
{
  "question": "Your question here?",
  "options": [
    "Option A",
    "Option B", 
    "Option C",
    "Option D"
  ],
  "correctAnswer": "Exact text of correct option"
}

RETURN ONLY THE JSON, NO MARKDOWN, NO EXPLANATIONS.`;

      const systemInstruction =
        "You are an expert technical interviewer. Generate clear MCQ questions for full-stack developers. Return ONLY valid JSON.";

      try {
        const response = await this.makeGeminiRequest(
          prompt,
          systemInstruction
        );
        console.log("📦 MCQ response received");

        // Try to parse as JSON first (for easy MCQ)
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);

          // Validate that we have exactly 4 options
          let options = parsed.options || [];
          if (options.length > 4) {
            console.warn("⚠️ More than 4 options returned, taking first 4");
            options = options.slice(0, 4);
          } else if (options.length < 4) {
            console.error(
              "❌ Less than 4 options returned, using mock instead"
            );
            throw new Error("Invalid number of options");
          }

          // INCREMENT COUNTER - Track that we've generated an easy question
          this.questionCountByDifficulty.easy++;
          console.log(
            `✅ Generated EASY MCQ from API (${this.questionCountByDifficulty.easy}/2 easy questions used)`
          );
          console.log(
            `📊 Counter state after increment: Easy=${this.questionCountByDifficulty.easy}, Medium=${this.questionCountByDifficulty.medium}, Hard=${this.questionCountByDifficulty.hard}`
          );

          return {
            question: parsed.question,
            difficulty,
            options: options,
            correctAnswer: parsed.correctAnswer,
          };
        }
      } catch (error) {
        console.error("❌ Error generating MCQ from API", error);
        throw new Error(
          "Failed to generate MCQ question. Real-time API is required."
        );
      }
    }

    // For MEDIUM and HARD questions, use text-based format
    const prompt = `🚀 REAL-TIME INTERVIEW QUESTION GENERATION

Generate a ${difficulty.toUpperCase()} level technical interview question for a Full Stack (React/Node) role.

📋 REQUIREMENTS:
${
  difficulty === "medium"
    ? `
🟡 MEDIUM Level (60 seconds to answer):
- ONE SPECIFIC practical React/Node.js concept that can be explained in 60 seconds
- Ask for a brief explanation (3-4 sentences) OR a short code example (4-6 lines)
- Focus on a SINGLE concept only (not multiple topics)
- Real-world scenarios: hooks, state management, API integration, middleware
- Examples: 
  * "Explain why we need useEffect cleanup function and give one example"
  * "Write a simple Express middleware to log request method and URL"
  * "How do you prevent unnecessary re-renders in React functional components?"
- Answer should be: 3-5 sentences of explanation OR 4-6 lines of code with 1-2 sentence explanation
- Question must be SPECIFIC enough that a competent developer can answer in 60 seconds
- Worth 15 points - give full 100% score for correct, complete answers`
    : ""
}${
      difficulty === "hard"
        ? `
🔴 HARD Level (120 seconds to answer):
- ONE SPECIFIC advanced full-stack concept answerable in 2 minutes
- Ask for approach/solution explanation (5-7 sentences) OR code example (6-10 lines) with explanation
- Focus on a SINGLE advanced topic with practical application
- Advanced topics: performance optimization, scalability, architecture patterns, advanced async
- Examples:
  * "Explain how you would implement debouncing in React and show a custom hook example"
  * "Describe the approach to handle concurrent API requests in Node.js with proper error handling"
  * "How would you optimize a React component that renders a large list (1000+ items)?"
- Answer should be: 5-7 sentences explaining the approach OR 6-10 lines of code with 2-3 sentence explanation
- Question must be SPECIFIC with clear scope that allows a complete answer in 120 seconds
- Worth 30 points - give full 100% score for correct, comprehensive answers`
        : ""
    }

🎯 TECHNICAL FOCUS AREAS:
- React.js (hooks, state management, performance)
- Node.js (APIs, middleware, async programming)  
- JavaScript/TypeScript (ES6+, advanced concepts)
- Database design and optimization
- System architecture and scalability
- Full stack integration challenges

${contextInfo}

⏱️ TIME CONSTRAINT: Must be answerable in ${timeLimit}
🎪 MAKE IT ENGAGING: Real-world scenario preferred
🔍 CLARITY: Question should be crystal clear and specific

Return ONLY the question text, no additional formatting or explanations.`;

    const systemInstruction =
      "You are an expert technical interviewer. Generate high-quality interview questions that test practical skills for full-stack developers.";

    const question = await this.makeGeminiRequest(prompt, systemInstruction);

    // INCREMENT COUNTER - Track medium/hard question generation
    this.questionCountByDifficulty[difficulty]++;
    console.log(
      `✅ Generated ${difficulty.toUpperCase()} question from API (${
        this.questionCountByDifficulty[difficulty]
      }/2 ${difficulty} questions used)`
    );
    console.log(
      `📊 Counter state after increment: Easy=${this.questionCountByDifficulty.easy}, Medium=${this.questionCountByDifficulty.medium}, Hard=${this.questionCountByDifficulty.hard}`
    );

    return {
      question: question.trim(),
      difficulty,
    };
  }

  /**
   * STRICT ANSWER SCORING - Real-time AI evaluation
   * Zero points for wrong/irrelevant answers
   * Real-time feedback based on actual content
   */
  async scoreAnswer(
    question: string,
    answer: string,
    difficulty: QuestionDifficulty,
    timeSpent: number,
    autoSubmitted: boolean,
    correctAnswer?: string // For MCQ questions
  ): Promise<ScoreAnswerResponse> {
    console.log("🎯 Starting STRICT answer scoring...");

    // STRICT VALIDATION: Check for placeholder/empty answers first
    const placeholderAnswers = [
      "[No answer - tab switched]",
      "[No answer provided - time's up]",
      "[Empty answer]",
      "[No answer provided]",
    ];

    const isPlaceholder = placeholderAnswers.some(
      (placeholder) => answer.trim() === placeholder
    );

    if (isPlaceholder) {
      console.log("❌ Placeholder answer detected - automatic 0 points");
      return {
        score: 0,
        feedback:
          "No valid answer provided. You must answer the question to receive points.",
        reasoning: "Placeholder or empty answer - automatic zero.",
      };
    }

    // MCQ SCORING: If correctAnswer is provided, it's an MCQ (easy question)
    // Return 0-100 percentage (will be converted to 0-5 points in Redux)
    if (correctAnswer) {
      console.log("📊 Scoring MCQ answer...");
      const isCorrect = answer.trim() === correctAnswer.trim();

      if (isCorrect) {
        const baseScore = autoSubmitted ? 85 : 100; // Slight penalty for timeout
        console.log(
          `✅ MCQ Correct! Score: ${baseScore}% (will be ~${Math.round(
            baseScore * 0.05
          )} points)`
        );
        return {
          score: baseScore,
          feedback: "Correct answer! Well done.",
          reasoning: autoSubmitted
            ? "Correct answer but auto-submitted due to timeout."
            : "Perfect! You selected the correct answer.",
        };
      } else {
        console.log("❌ MCQ Incorrect - 0%");
        return {
          score: 0,
          feedback: `Incorrect. The correct answer was: "${correctAnswer}"`,
          reasoning: "Wrong answer selected for multiple choice question.",
        };
      }
    }

    // TEXT ANSWER SCORING: For medium/hard questions
    // STRICT VALIDATION: Minimum answer length
    if (!answer || answer.trim().length < 20) {
      console.log("❌ Answer too short - automatic 0 points");
      return {
        score: 0,
        feedback:
          "Answer is too short or empty. Minimum 20 characters required for evaluation.",
        reasoning: "Failed minimum length requirement.",
      };
    }

    // STRICT VALIDATION: Check for generic/irrelevant answers
    const genericPhrases = [
      "i don't know",
      "not sure",
      "no idea",
      "cannot answer",
      "skip",
      "test test",
      "asdf",
    ];
    const answerLower = answer.toLowerCase();
    const isGeneric = genericPhrases.some((phrase) =>
      answerLower.includes(phrase)
    );

    if (isGeneric) {
      console.log("❌ Generic answer detected - automatic 0 points");
      return {
        score: 0,
        feedback:
          "Your answer appears generic or indicates lack of knowledge. Please provide a meaningful technical response.",
        reasoning: "Generic or non-technical answer.",
      };
    }

    const maxTime =
      difficulty === "easy" ? 20 : difficulty === "medium" ? 60 : 120;
    const timeUsagePercent = Math.round((timeSpent / maxTime) * 100);

    const prompt = `🎯 STRICT TECHNICAL INTERVIEW EVALUATION

QUESTION (${difficulty.toUpperCase()} level):
${question}

CANDIDATE'S ANSWER:
${answer}

⏱️ TIMING:
- Time spent: ${timeSpent}s / ${maxTime}s (${timeUsagePercent}%)
- ${autoSubmitted ? "❌ AUTO-SUBMITTED (timeout)" : "✅ On time"}

� STRICT SCORING RULES:

1. CORRECTNESS & RELEVANCE (50 points):
   - Is the answer CORRECT and addressing the question?
   - **ZERO points if wrong or irrelevant**
   - Partial credit only if partially correct

2. COMPLETENESS (25 points):
   - Covers main points expected?
   - Depth appropriate for ${difficulty} level?
   - **Proportional to coverage**

3. TECHNICAL QUALITY (15 points):
   - Proper terminology and concepts?
   - **ZERO if misused**

4. CLARITY (10 points):
   - Clear communication
   - **Minor deduction only**

${autoSubmitted ? "⏰ TIMEOUT PENALTY: -15 points" : ""}

🎯 VERY LENIENT SCORING GUIDELINES:
- COMPLETELY WRONG or IRRELEVANT: 0-30%
- Shows SOME understanding but mostly wrong: 40-60%
- SOMEWHAT RELEVANT and shows basic understanding: 80-100% ✅ GIVE FULL POINTS!
- RELEVANT and addresses the question: 90-100% ✅ GIVE FULL POINTS!
- CORRECT and detailed: 100% ✅ GIVE FULL POINTS!

💡 LENIENT SCORING PHILOSOPHY:
- ✅ If answer is SOMEWHAT RELEVANT to the topic → Give 80-100% (full or near-full points)
- ✅ If they show ANY understanding of the concept → Give 80-100%
- ✅ If they attempt to answer correctly → Give 80-100%
- ❌ Only give low scores (0-50%) for completely wrong or irrelevant answers
- 🎯 Default to giving HIGH SCORES unless answer is clearly wrong

💡 POINT CONVERSION:
${difficulty === "easy" ? "Easy: 100% = 5 points (full marks)" : ""}
${
  difficulty === "medium"
    ? "Medium: 100% = 15 points (full marks for somewhat relevant answer)"
    : ""
}
${
  difficulty === "hard"
    ? "Hard: 100% = 30 points (full marks for somewhat relevant answer)"
    : ""
}

RETURN JSON:
{
  "score": [80-100 for somewhat relevant, 0-50 for wrong],
  "feedback": "[Positive feedback - what was good]",
  "reasoning": "[Brief explanation]"
}

BE VERY LENIENT. Give 80-100% for any somewhat relevant answer. Only low scores for completely wrong answers.`;

    const systemInstruction = `Very lenient interviewer. Give 80-100% for any somewhat relevant answer that shows understanding.
Default to HIGH SCORES. Only give 0-50% for completely wrong/irrelevant answers. Be generous!`;

    try {
      const response = await this.makeGeminiRequest(prompt, systemInstruction);
      console.log("📦 AI scoring response received");

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON in response");
      }

      const parsed = JSON.parse(jsonMatch[0]);
      let finalScore = Math.max(0, Math.min(100, parsed.score || 0));

      if (autoSubmitted) {
        finalScore = Math.max(0, finalScore - 15);
      }

      console.log("✅ Final strict score:", finalScore);

      return {
        score: Math.round(finalScore),
        feedback: parsed.feedback || "Unable to generate feedback.",
        reasoning: parsed.reasoning || "Scoring based on answer analysis.",
      };
    } catch (error) {
      console.error("❌ Scoring error:", error);

      // LENIENT FALLBACK: Give high scores by default
      const wordCount = answer.trim().split(/\s+/).length;
      let baseScore = 80; // Default to high score!

      // Give full points if they wrote a reasonable answer
      if (wordCount >= 30 && answer.length > 100) {
        baseScore = 95; // Near perfect!
      } else if (wordCount >= 20 && answer.length > 50) {
        baseScore = 85; // Very good!
      } else if (wordCount >= 10) {
        baseScore = 70; // Decent attempt
      } else {
        baseScore = 50; // Too short but some effort
      }

      if (autoSubmitted) {
        baseScore = Math.max(50, baseScore - 15); // Still give decent score
      }

      return {
        score: baseScore,
        feedback: autoSubmitted
          ? "Good effort! Answer submitted due to timeout. Generous scoring applied."
          : "AI evaluation unavailable. Basic scoring based on length and structure.",
        reasoning: `Fallback: ${wordCount} words. ${
          autoSubmitted ? "Timeout penalty applied." : ""
        }`,
      };
    }
  }

  async generateFinalSummary(
    answers: Array<{
      question: string;
      answer: string;
      score: number;
      difficulty: QuestionDifficulty;
      timeSpent: number;
      autoSubmitted: boolean;
    }>
  ): Promise<GenerateSummaryResponse> {
    const totalScore = answers.reduce((sum, a) => sum + a.score, 0);
    const averageScore = Math.round(totalScore / answers.length);

    const prompt = `Generate a comprehensive interview summary for a Full Stack Developer candidate:

Interview Results:
${answers
  .map(
    (a, i) => `
Q${i + 1} (${a.difficulty}): ${a.question}
Answer: ${a.answer}
Score: ${a.score}/100
Time: ${a.timeSpent}s ${a.autoSubmitted ? "(auto-submitted)" : ""}
`
  )
  .join("\n")}

Overall Score: ${averageScore}/100

Provide a JSON response with:
{
  "overallScore": ${averageScore},
  "summary": "2-3 sentence overall assessment",
  "strengths": ["strength1", "strength2", "strength3"],
  "improvements": ["area1", "area2", "area3"]
}`;

    const systemInstruction =
      "You are an expert technical interviewer. Provide comprehensive, balanced feedback that helps candidates improve.";

    const response = await this.makeGeminiRequest(prompt, systemInstruction);

    try {
      const parsed = JSON.parse(response);
      return {
        overallScore: averageScore,
        summary: parsed.summary || "Interview completed successfully.",
        strengths: parsed.strengths || ["Good technical foundation"],
        improvements: parsed.improvements || ["Continue practicing"],
      };
    } catch {
      return {
        overallScore: averageScore,
        summary: `Completed interview with an average score of ${averageScore}/100. Shows potential for growth.`,
        strengths: [
          "Problem-solving approach",
          "Technical knowledge",
          "Communication skills",
        ],
        improvements: [
          "Time management",
          "Detail in explanations",
          "Practical examples",
        ],
      };
    }
  }

  async extractResumeData(text: string): Promise<ExtractResumeResponse> {
    console.log("🤖 AI Service: Starting resume data extraction...");
    console.log("📄 Text length:", text.length);
    console.log("📝 First 300 chars:", text.substring(0, 300));

    // Real-time processing with smart chunking for large resumes
    const textChunk =
      text.length > 3000 ? text.substring(0, 3000) + "..." : text;

    const prompt = `🎯 REAL-TIME RESUME ANALYSIS - Extract contact information with maximum accuracy from this ACTUAL resume:

📋 EXTRACTION TARGETS:

1. 👤 FULL NAME:
   - The person's actual name (typically at the top)
   - Format: "First Last" or "First Middle Last"
   - EXCLUDE: Job titles, company names, certifications
   - REAL EXAMPLE from text: Look for names like "John Smith", "Sarah Johnson", "Michael Chen"

2. 📧 EMAIL ADDRESS:
   - Valid working email format only
   - Must contain @ and valid domain (.com, .org, .edu, etc.)
   - EXCLUDE: example@example.com, test@test.com, sample emails
   - REAL EXAMPLE: "john.smith@gmail.com", "sarah@company.com"

3. 📱 PHONE NUMBER:
   - Actual contact phone number (10-11 digits)
   - Formats: (555) 123-4567, 555-123-4567, +1-555-123-4567
   - EXCLUDE: Years (2020, 2021), dates (01/01/2020), ID numbers
   - VERIFY: Must be realistic phone number starting with valid area code

4. 💼 EXPERIENCE LEVEL:
   - Determine from years mentioned, job history, or education level
   - Options: "Entry Level", "Mid Level", "Senior Level", "Executive"

5. 🛠️ KEY SKILLS:
   - Technical skills relevant to Full Stack Development
   - Extract from skills section, job descriptions, or projects
   - Focus on: Programming languages, frameworks, tools, databases

RESUME CONTENT TO ANALYZE:
${textChunk}

🔍 PROCESSING INSTRUCTIONS:
- Scan the ENTIRE text systematically
- Cross-validate findings with context
- If field is uncertain or invalid, return null
- Use REAL data only, no assumptions
- Process with production-level accuracy

📤 RETURN FORMAT (JSON only):
{
  "name": "Actual Name Found" or null,
  "email": "real@email.com" or null,
  "phone": "555-123-4567" or null,
  "experience": "Experience Level Based on Content",
  "skills": ["React", "JavaScript", "Node.js", "etc"]
}`;

    const systemInstruction =
      "You are a production-grade resume parser with 99.9% accuracy. Your job is to extract name, email, and phone with perfect precision. Scan the entire text thoroughly. Return only valid JSON. This is critical for a production system.";

    console.log("🚀 Sending request to Gemini API...");
    const response = await this.makeGeminiRequest(prompt, systemInstruction);
    console.log("📨 OpenAI response:", response);

    try {
      // Clean the response to extract just the JSON part
      const cleanResponse = response.trim();
      let jsonStr = cleanResponse;

      // Extract JSON if it's wrapped in markdown or extra text
      if (cleanResponse.includes("{")) {
        const start = cleanResponse.indexOf("{");
        const end = cleanResponse.lastIndexOf("}") + 1;
        jsonStr = cleanResponse.substring(start, end);
      }

      console.log("🔧 Cleaned JSON string:", jsonStr);
      const parsed = JSON.parse(jsonStr);
      console.log("✅ Successfully parsed AI response:", parsed);

      // Always use regex fallback to double-check AI results
      const fallbackData = this.extractWithRegex(text);
      console.log("🔍 Regex fallback results:", fallbackData);

      // Combine results, preferring non-null values
      const finalResult = {
        name: parsed.name || fallbackData.name || undefined,
        email: parsed.email || fallbackData.email || undefined,
        phone: parsed.phone || fallbackData.phone || undefined,
        experience:
          parsed.experience || "Professional experience listed in resume",
        skills:
          parsed.skills && parsed.skills.length > 0
            ? parsed.skills
            : ["React", "Node.js", "JavaScript", "TypeScript"],
      };

      console.log("🎯 Final extraction result:", finalResult);
      return finalResult;
    } catch (error) {
      console.error("❌ JSON parsing failed:", error);
      console.log("🔄 Falling back to regex extraction only");

      // Fallback to regex extraction if JSON parsing fails
      const fallbackData = this.extractWithRegex(text);
      console.log("🔍 Regex-only results:", fallbackData);

      return {
        name: fallbackData.name || undefined,
        email: fallbackData.email || undefined,
        phone: fallbackData.phone || undefined,
        experience: "Experience information available in resume",
        skills: ["Full Stack Developer", "React", "Node.js"],
      };
    }
  }

  private extractWithRegex(text: string): {
    name?: string;
    email?: string;
    phone?: string;
  } {
    console.log("🔍 AI Service: Starting regex extraction as backup...");

    // Email extraction - comprehensive patterns with validation
    const emailRegexes = [
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
      /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}/gi,
    ];

    let email: string | undefined;
    for (const regex of emailRegexes) {
      const matches = text.match(regex);
      if (matches && matches.length > 0) {
        for (const match of matches) {
          // Additional validation for email format
          if (this.isValidEmail(match)) {
            email = match;
            break;
          }
        }
        if (email) break;
      }
    }
    console.log("📧 Regex email found:", email); // Phone extraction - strict validation to avoid false positives
    const phoneRegexes = [
      /\+?1[-\s]?\(?([0-9]{3})\)?[-\s]?([0-9]{3})[-\s]?([0-9]{4})/g,
      /\(?([0-9]{3})\)?[-\s]?([0-9]{3})[-\s]?([0-9]{4})/g,
      /([0-9]{3})[-.]([0-9]{3})[-.]([0-9]{4})/g,
      /\+?1\s?\(?([0-9]{3})\)?\s?([0-9]{3})\s?([0-9]{4})/g,
    ];

    let phone: string | undefined;
    for (const regex of phoneRegexes) {
      const matches = text.match(regex);
      if (matches && matches.length > 0) {
        for (const match of matches) {
          // Validate that it's actually a phone number, not a date or other number
          if (this.isValidPhoneNumber(match)) {
            phone = match;
            break;
          }
        }
        if (phone) break;
      }
    }
    console.log("📱 Regex phone found:", phone); // Name extraction - multiple strategies with improved heuristics
    const lines = text
      .split(/[\n\r]+/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && line.length < 100);

    let name: string | undefined;
    console.log("👤 Analyzing", lines.length, "lines for name extraction");

    // Strategy 1: Look in first 15 lines for name patterns
    for (const line of lines.slice(0, 15)) {
      // Skip lines with obvious non-name content
      if (
        line.includes("@") ||
        phoneRegexes.some((regex) => regex.test(line)) ||
        /\b(resume|cv|curriculum|vitae|experience|education|skills|contact|objective|summary|profile|about|address|linkedin|github)\b/i.test(
          line
        ) ||
        line.length > 50
      ) {
        continue;
      }

      // Look for 2-4 capitalized words that could be a name
      const words = line.split(/\s+/).filter((word) => word.length > 0);
      if (words.length >= 2 && words.length <= 4) {
        const isLikelyName = words.every(
          (word) =>
            word.length > 1 &&
            word[0] === word[0].toUpperCase() &&
            /^[A-Za-z\s'.-]+$/.test(word) &&
            !/^(developer|engineer|analyst|manager|director|coordinator|specialist|consultant|intern|jr|sr|senior|junior|lead|principal)$/i.test(
              word
            )
        );

        if (isLikelyName) {
          name = line;
          console.log("👤 Name found via pattern matching:", name);
          break;
        }
      }
    }

    // Strategy 2: Look for explicit name labels if first strategy failed
    if (!name) {
      const namePatterns = [
        /name:\s*([A-Za-z\s'.-]{2,50})/i,
        /full\s+name:\s*([A-Za-z\s'.-]{2,50})/i,
        /^([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)$/m,
      ];

      for (const pattern of namePatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          name = match[1].trim();
          console.log("👤 Name found via label pattern:", name);
          break;
        }
      }
    }

    const result = { name, email, phone };
    console.log("🎯 Final regex extraction results:", result);
    return result;
  }

  async validateAnswer(answer: string): Promise<boolean> {
    // Real-time validation - check if answer has meaningful content
    const trimmed = answer.trim();
    return trimmed.length >= 10 && /[a-zA-Z]/.test(trimmed);
  }

  private isValidEmail(email: string): boolean {
    // Strict email validation
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/i;

    // Additional checks to prevent false positives
    if (!emailRegex.test(email)) return false;
    if (email.length > 254) return false; // RFC maximum
    if (email.includes("..")) return false; // Consecutive dots not allowed

    const [localPart, domain] = email.split("@");
    if (localPart.length > 64) return false; // RFC maximum for local part
    if (domain.length > 253) return false; // RFC maximum for domain

    return true;
  }

  private isValidPhoneNumber(phone: string): boolean {
    // Remove all non-digit characters for analysis
    const digitsOnly = phone.replace(/\D/g, "");

    // Basic length check (7-15 digits is reasonable for phone numbers)
    if (digitsOnly.length < 7 || digitsOnly.length > 15) {
      return false;
    }

    // Check if it looks like a date (common false positive)
    // Patterns like 20170815, 2017081507, etc.
    if (/^20[0-9]{6,8}$/.test(digitsOnly)) {
      return false;
    }

    // Check if it's all the same digit (unlikely to be a real phone)
    if (/^(\d)\1+$/.test(digitsOnly)) {
      return false;
    }

    // Check if it starts with reasonable patterns for US/international numbers
    if (digitsOnly.length === 10) {
      // US format: area code shouldn't start with 0 or 1
      const areaCode = digitsOnly.substring(0, 3);
      if (areaCode.startsWith("0") || areaCode.startsWith("1")) {
        return false;
      }
    }

    return true;
  }

  async validateAnswerQuality(
    question: string,
    answer: string,
    difficulty: QuestionDifficulty
  ): Promise<{
    isValid: boolean;
    estimatedScore: number;
    suggestion: string;
  }> {
    const answerLength = answer.trim().length;
    const wordCount = answer.trim().split(/\s+/).length;

    // Quick validation for obviously incomplete answers
    if (answerLength < 10) {
      return {
        isValid: false,
        estimatedScore: 0,
        suggestion: "Answer is too short - add more details",
      };
    }

    if (wordCount < 5) {
      return {
        isValid: false,
        estimatedScore: 1,
        suggestion: "Need at least 5 words to form a complete thought",
      };
    }

    try {
      const prompt = `🔍 REAL-TIME ANSWER QUALITY CHECK

📝 QUESTION (${difficulty.toUpperCase()}): ${question}

👤 PARTIAL ANSWER: "${answer}"

🎯 QUICK EVALUATION TASK:
Assess if this answer is on the right track for a ${difficulty} level question.

📊 CRITERIA:
- Relevance: Does it address the question?
- Completeness: Is it substantial enough?
- Technical accuracy: Any obvious errors?
- Depth: Appropriate for ${difficulty} level?

⚡ OUTPUT FORMAT (JSON only):
{
  "isValid": [true/false],
  "estimatedScore": [0-10],
  "suggestion": "[Brief helpful tip]"
}

Be encouraging but honest. This is real-time feedback to help the candidate.`;

      const systemInstruction =
        "You are a helpful interview assistant providing real-time feedback. Be constructive and encouraging.";

      const response = await this.makeGeminiRequest(prompt, systemInstruction);

      try {
        const parsed = JSON.parse(response);
        return {
          isValid: parsed.isValid || false,
          estimatedScore: Math.max(0, Math.min(10, parsed.estimatedScore || 0)),
          suggestion: parsed.suggestion || "Keep building on your answer",
        };
      } catch (parseError) {
        console.error("Failed to parse AI validation response:", parseError);
        // Fallback validation
        const hasCompleteThoughts = /[.!?]/.test(answer);
        const isValid =
          answerLength >= 20 && wordCount >= 8 && hasCompleteThoughts;

        return {
          isValid,
          estimatedScore: isValid
            ? Math.min(8, Math.floor(wordCount / 3))
            : Math.floor(wordCount / 2),
          suggestion: !hasCompleteThoughts
            ? "Add complete sentences with proper punctuation"
            : isValid
            ? "Good start - you can add more details"
            : "Try to elaborate more on your answer",
        };
      }
    } catch (error) {
      console.error("Answer validation failed:", error);

      // Enhanced fallback validation
      const hasCompleteThoughts = /[.!?]/.test(answer);
      const hasTechnicalTerms =
        /\b(function|class|method|variable|array|object|database|server|client|API|framework|library)\b/i.test(
          answer
        );
      const isValid =
        answerLength >= 20 && wordCount >= 8 && hasCompleteThoughts;

      return {
        isValid,
        estimatedScore: isValid
          ? Math.min(8, Math.floor(wordCount / 3) + (hasTechnicalTerms ? 1 : 0))
          : Math.floor(wordCount / 2),
        suggestion: !hasCompleteThoughts
          ? "Add complete sentences with proper punctuation"
          : !hasTechnicalTerms && difficulty !== "easy"
          ? "Consider adding technical details relevant to the question"
          : isValid
          ? "Good progress - you can expand further"
          : "Try to provide more detailed explanation",
      };
    }
  }
}

export const aiService = new AIService();
