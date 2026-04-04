# High-Level Design
## AI-Powered Business Finance Tutor Prototype

## 1. Overview

This project is a web-based tutoring prototype that teaches foundational business finance and accounting concepts using realistic scenarios, adaptive practice, and AI-supported feedback. The goal is to help learners understand not only how to compute financial metrics, but also how to interpret them in practical business contexts.

The system focuses on concepts such as revenue, gross profit, net profit, fixed vs. variable expenses, cash flow, ROI, and cap rate. Learners interact with realistic business scenarios, submit numeric and written answers, receive guided feedback, and progress through increasingly targeted practice.

The prototype is intentionally designed to demonstrate the core tutoring and AI ideas of the project without overbuilding infrastructure beyond what is needed for a polished class-ready demo.

## 2. Design Goals

The design should:
- feel modern, polished, and simple
- support both desktop and mobile web experiences
- emphasize the tutoring workflow over unnecessary platform complexity
- allow use of mock AI responses during development/demo
- support later addition of a real AI API key through `.env`
- track learner progress and adapt future practice
- remain flexible enough to add more topics later

## 3. System Architecture

The system uses a straightforward web application architecture:

- **Frontend:** Next.js web app with TypeScript
- **Backend/Application Logic:** Next.js server-side logic, route handlers, or server actions
- **Database/Auth:** Supabase
- **AI Layer:** abstraction supporting both mock AI and real AI provider mode
- **Content Layer:** seeded scenarios, topics, and questions
- **Learner Model:** lightweight rule-based mastery/progress engine

## 4. Major Subsystems

### 4.1 Presentation Layer
Responsible for the learner-facing UI.

Key views:
- Home / Dashboard
- Topic selection
- Practice session
- Review / Results
- Progress / Mastery view
- Settings

Key UI goals:
- simple polished cards
- clear hierarchy
- easy-to-read prompts and feedback
- mobile responsiveness
- limited clutter

### 4.2 Tutoring Workflow Engine
Responsible for managing the main learning flow:
1. learner chooses a topic
2. system loads a scenario
3. learner answers questions
4. system evaluates the response
5. system provides feedback/hints
6. learner model updates
7. next problem is selected

This is the core educational flow of the application.

### 4.3 Content Management Layer
Responsible for organizing:
- topics
- skills
- scenarios
- scenario questions
- expected answers
- misconception tags
- hints and scaffolding metadata

This layer should be content-driven so new topics can be added later with minimal code changes.

### 4.4 AI Feedback Layer
Responsible for analyzing learner explanations and generating tutoring feedback.

Modes:
- **Mock mode:** default, deterministic and demo-safe
- **Real AI mode:** enabled later with API key in `.env`

Responsibilities:
- produce response feedback
- explain mistakes
- provide hint text
- provide follow-up questions
- support graceful fallback to mock mode on failure

### 4.5 Learner Modeling Layer
Responsible for tracking learner understanding and driving adaptation.

Tracks:
- skill mastery/confidence
- recent attempts
- repeated errors
- misconception history
- recommended next practice direction

The initial implementation will be rule-based rather than fully probabilistic.

### 4.6 Persistence Layer
Responsible for storing:
- users
- topics
- scenarios
- attempts
- feedback history
- progress/mastery
- session history

Supabase will provide the main database and user account support.

## 5. Primary User Flow

### Main Practice Flow
1. User signs in
2. User opens dashboard
3. User selects a finance topic
4. User receives a realistic scenario
5. User submits numeric and written responses
6. System checks correctness
7. System generates targeted feedback and hints
8. System updates learner progress
9. System selects an appropriate next scenario
10. User views progress summary

This flow directly supports the project goal of guided, adaptive finance tutoring.

## 6. Educational Strategy

The system is based on scenario-based learning and guided tutoring.

It teaches:
- conceptual understanding
- correct formula usage
- interpretation of results
- distinction between commonly confused finance concepts

It supports learners by:
- giving hints instead of only final answers
- identifying likely misconceptions
- breaking difficult problems into smaller steps
- providing repeated practice where needed
- adapting based on demonstrated understanding

## 7. AI Usage Strategy

The system uses AI in a focused, bounded way.

### Primary AI Roles
- analyze short written explanations
- generate targeted tutoring feedback
- produce hint wording
- support follow-up question generation

### Non-AI Logic
Certain tasks should remain deterministic:
- numeric answer checking
- basic expected answer matching
- core progress state updates
- session persistence

This hybrid approach keeps the prototype explainable, stable, and demo-friendly.

## 8. Extensibility Strategy

The design should support future expansion by allowing:
- additional finance topics
- entirely new subject areas
- more scenarios per topic
- richer misconception tracking
- more advanced learner modeling
- instructor/admin features later if desired

This is achieved by:
- storing content outside UI components
- separating tutoring logic from presentation
- separating AI provider logic from business logic
- using modular services and data models

## 9. Error Handling and Reliability

The prototype should prioritize demo stability.

High-level reliability rules:
- if real AI is unavailable, use mock AI
- if the user has no progress yet, show seeded recommendations
- if a scenario cannot load, provide a fallback experience
- if a feedback request fails, preserve the learner’s attempt and show a safe fallback response

## 10. Security and Privacy Considerations

As a prototype, the system should still follow reasonable security basics:
- authenticated access for saved progress
- environment variables for API keys
- no hardcoded secrets in source code
- basic access control around learner data

## 11. Deployment Perspective

This is a web-only prototype. The architecture should be simple to deploy and easy to demo. Mobile support is achieved through responsive design, not a separate native application.

## 12. Summary

At a high level, this system is a modular tutoring web application with five core pillars:
- realistic finance scenarios
- answer evaluation
- AI-supported feedback
- learner progress tracking
- adaptive next-question selection

The overall architecture is intentionally lightweight, clear, and extendable so the project can demonstrate strong educational and AI ideas without unnecessary complexity.