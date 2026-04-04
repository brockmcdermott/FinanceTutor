# Requirements Document
## AI-Powered Business Finance Tutor Prototype

## 1. Introduction

This project is a web-based AI tutoring prototype designed to help learners understand foundational business finance and accounting concepts through realistic, scenario-based practice. The system focuses on helping learners move beyond memorizing formulas by teaching when to use financial concepts, how to interpret them, and how to connect them to real business decisions.

The prototype is based on the project proposal and the course project requirements. It is intended to be a working prototype that demonstrates the key ideas of the project rather than a fully production-complete system.

## 2. Problem Statement

Many students, early entrepreneurs, and non-finance learners struggle to understand the financial concepts used to evaluate a business. Learners often memorize formulas such as ROI or cap rate without understanding when those formulas apply, how to interpret the results, or how those metrics affect decisions. They also confuse related ideas such as:
- revenue vs. profit
- gross profit vs. net profit
- fixed vs. variable expenses
- cash flow vs. accounting profit
- cap rate vs. ROI

This prototype solves that problem by providing guided, AI-supported tutoring around realistic business scenarios.

## 3. Project Goals

The system must:
- teach foundational business finance concepts in practical context
- provide guided practice through realistic scenarios
- accept learner answers in both numeric and written form
- analyze learner responses
- provide targeted feedback and hints
- track learner progress over time
- adapt future problems based on demonstrated understanding
- remain easy to extend with additional topics later

## 4. Scope

### In Scope
- Web application only
- Mobile-responsive UI
- User accounts and saved progress
- Finance tutoring scenarios covering:
  - revenue
  - gross profit
  - net profit
  - fixed vs. variable expenses
  - cash flow
  - ROI
  - cap rate
- Mock AI responses by default
- Ability to switch to real AI through `.env` configuration
- Rule-based learner model
- Seeded scenario content
- Progress tracking and simple adaptive sequencing

### Out of Scope
- Native mobile app
- Advanced machine learning models beyond a simple learner model
- Full production-grade analytics platform
- Complex instructor/admin management tools
- Large-scale deployment concerns beyond prototype readiness

## 5. Functional Requirements

### 5.1 User Accounts
The system shall:
- support authenticated user accounts
- save learner attempts and progress
- associate tutoring history with a user profile

### 5.2 Topic and Scenario Selection
The system shall:
- display available tutoring topics
- allow a learner to choose a topic
- retrieve realistic practice scenarios related to the chosen topic
- support multiple scenarios per topic

### 5.3 Scenario-Based Practice
The system shall:
- present a scenario involving a realistic business or investment case
- ask one or more related finance questions
- support numeric answer input
- support short written explanation input
- support future addition of topics and scenarios through seed/config data

### 5.4 Answer Evaluation
The system shall:
- evaluate learner numeric responses
- compare learner responses to expected answers
- identify likely misconceptions when possible
- evaluate short written explanations using mock AI or real AI
- store the result of each attempt

### 5.5 Feedback and Hinting
The system shall:
- provide feedback after an attempt
- explain what was correct
- explain what was incorrect
- explain why the correct formula or reasoning applies
- provide hints without immediately revealing the answer
- support multiple levels of hints when appropriate

### 5.6 Learner Modeling
The system shall:
- maintain a simple mastery record for each skill/topic
- update learner progress after each attempt
- record repeated mistakes or misconception patterns
- allow future extension to more advanced learner modeling

### 5.7 Adaptive Sequencing
The system shall:
- choose the next question based on learner performance
- provide easier or scaffolded follow-up problems when the learner struggles
- provide harder or adjacent-topic problems when the learner succeeds
- prioritize remediation of repeatedly missed concepts

### 5.8 Progress Tracking
The system shall:
- display learner progress by topic or skill
- show recently practiced topics
- identify weaker topics
- provide a short session summary after practice

### 5.9 AI Mode Configuration
The system shall:
- run in mock AI mode by default
- support optional real AI integration through environment variables
- gracefully fall back to mock mode if no API key is available or if API calls fail

## 6. Non-Functional Requirements

### 6.1 Usability
The interface shall:
- be polished and modern
- remain simple and easy to understand
- avoid unnecessary complexity
- work well on desktop and mobile browsers

### 6.2 Extensibility
The system shall:
- be designed so that new topics can be added later
- support changes through seed data or structured config
- avoid hardcoding all content directly into UI components

### 6.3 Maintainability
The system shall:
- use clear modular architecture
- separate UI, tutoring logic, AI provider logic, and data access
- include documentation sufficient for class presentation and future development

### 6.4 Reliability
The system shall:
- remain usable even when real AI is unavailable
- fail gracefully on API errors
- support a stable demo experience

## 7. Recommended Technology Constraints

The system should be built using:
- Next.js
- TypeScript
- Supabase

The system should:
- use a web-only architecture
- support responsive layouts
- use environment-based configuration for AI provider mode

## 8. Content Requirements

The first version must include seeded content for:
- revenue
- gross profit
- net profit
- fixed vs. variable expenses
- cash flow
- ROI
- cap rate

Scenarios should use practical contexts such as:
- coffee shop
- rental property
- salon
- campground
- small service business

## 9. Acceptance Criteria

The prototype is acceptable if it can demonstrate:
1. a learner can sign in
2. a learner can choose a finance topic
3. a learner can complete a realistic scenario
4. the system can evaluate numeric and written answers
5. the system can provide useful feedback and hints
6. the system can track progress by concept
7. the system can adapt the next scenario in a simple rule-based way
8. the system can run in mock mode without external AI
9. the system can optionally switch to real AI via `.env`
10. the prototype clearly demonstrates the key project ideas for class

## 10. Alignment with Course Requirements

The course project requirements emphasize:
- building a working prototype
- focusing on the key ideas of the project
- clearly explaining the problem being solved
- explaining what the prototype teaches
- explaining how the prototype supports the learner
- explaining what AI techniques are used
- providing a running example of how the system works in practice

This system is designed to satisfy those requirements by centering the prototype around scenario-based tutoring, targeted feedback, and adaptive learner support.