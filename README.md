# InterviewIQ

AI-powered mock interview coach for college students.

Live app: https://interviewiq-mauve.vercel.app

## What it does

InterviewIQ simulates real job interviews tailored to your exact role and company. Enter a job title and company name, choose your interview type, and the AI generates 5 realistic questions specific to that company. After each answer you get an instant score out of 10, a specific strength, and one actionable improvement. At the end you receive a full performance report with overall score, strengths, focus areas, and a personalized summary.

## Features

- Company-specific questions for Google, Meta, Amazon, Microsoft and more
- Technical, Behavioral, and Mixed interview modes
- Per-answer AI scoring with green/amber/red feedback
- STAR-format coaching for behavioral interviews
- Built-in 3-minute countdown timer per question
- Question history pills showing your score progression
- Animated results report with score ring
- Shareable score card
- Fully responsive dark-mode UI
- Ctrl+Enter shortcut to submit answers

## Built with

- React
- OpenAI API (gpt-4o-mini)
- CSS animations
- Vercel (deployment)
- OpenAI Codex (built using the Codex Creator Challenge)

## Running locally

Clone the repo and install dependencies:

git clone https://github.com/codestdoufu/interviewiq.git
cd interviewiq
npm install

Create a .env file in the root folder:

REACT_APP_OPENAI_API_KEY=your_openai_api_key_here

Start the app:

npm start

Open http://localhost:3000 in your browser.

## Built for

OpenAI x Handshake Codex Creator Challenge 2026