# AI-Powered Interview Assistant  
**Author:** Pranav Lonari  

---

## Overview  
This project is a **React-based AI Interview Assistant** that helps conduct mock technical interviews in a structured and automated way. It provides two synchronized views:  

- **Interviewee (Chat)** – where candidates upload resumes, answer AI-generated interview questions, and track their progress with timers.  
- **Interviewer (Dashboard)** – where interviewers can monitor candidates, view scores, chat history, and summaries.  

The application supports **local persistence**, so all progress is saved even after a page refresh or browser restart.  

---

## Features  

### 🔹 Interviewee (Chat)  
- **Resume Upload (PDF/DOCX):**  
  - Extracts **Name, Email, and Phone** from the uploaded resume.  
  - If any details are missing, the chatbot asks the candidate before starting.  
- **Interview Flow:**  
  - 6 questions total → **2 Easy (20s each)**, **2 Medium (60s each)**, **2 Hard (120s each)**.  
  - AI dynamically generates one question at a time.  
  - Automatic submission when time runs out.  
  - At the end, AI calculates a **final score** and generates a **short summary**.  
- **Session Persistence:**  
  - If the candidate refreshes or closes the page, progress is restored on reopening.  
  - A **“Welcome Back” modal** helps resume the session.  
- **Tab-Switch Detection:**  
  - If the candidate switches browser tabs during the interview, the test is **instantly auto-submitted** to prevent cheating.  

### 🔹 Interviewer (Dashboard)  
- **Candidate List:** Ordered by score with summaries.  
- **Detailed Candidate View:**  
  - Profile details (Name, Email, Phone).  
  - Chat history (Questions, Answers, AI evaluation).  
  - Final score and summary.  
- **Search & Sort:** Quickly find candidates by name, email, or score.  
- **Local Data Storage:** Uses persistent state so interview data is not lost.  

---

## Tech Stack  

- **Frontend:** React  
- **State Management & Persistence:** Redux + redux-persist / IndexedDB  
- **UI Components:** Ant Design / shadcn (modern responsive UI )  
- **Resume Parsing:** PDF/DOCX text extraction libraries  
- **AI Logic:** Dynamic question generation & scoring system  
- **Storage:** Local persistence for timers, answers, and progress  

---

## Installation & Setup  

1. Clone this repository:  
   ```bash
   git clone https://github.com/your-username/interview-assistant.git
   cd interview-assistant
   ```
2. Install dependencies:  
   ```bash
   npm install
   ```
3. Run the app:  
   ```bash
   npm start
   ```
4. Open in browser:  
   ```
   http://localhost:3000
   ```

---

## Usage  

1. Go to the **Interviewee tab** → Upload resume → Fill missing fields if asked → Start interview.  
2. Answer questions within time limits (auto-submit if time runs out).  
3. After 6 questions, final score + AI summary is shown.  
4. Switching browser tabs during the test will **instantly auto-submit** the interview.  
5. Switch to the **Interviewer tab** → View candidate list, search/sort, and explore detailed reports.  
6. Resume unfinished interviews anytime with **Welcome Back modal**.  

---

## Error Handling  

- Invalid resume formats → Friendly error messages.  
- Missing fields → Chatbot requests them before interview starts.  
- Timers + auto-submit prevent blocking interview flow.  
- Tab switch → Immediate auto-submission to ensure fairness.  

---

