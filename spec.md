# AL MYSTERY ROOM

## Master Product & Technical Specification

**Document Type:** Software Requirements Specification (SRS) + Technical Design Document
**Development Methodology:** Spec-Driven Development
**Project Name:** AL Mystery Room
**Version:** 1.0.0
**Status:** Initial Development Specification
**Frontend:** React.js
**Backend:** Node.js + Express.js
**Database:** MongoDB
**AI Engine:** Google Gemini API
**Architecture:** MERN Stack

---

# 1. PROJECT OVERVIEW

## 1.1 Project Vision

AL Mystery Room is an AI-powered interactive detective investigation platform where users become detectives and solve fictional criminal mysteries generated dynamically by Artificial Intelligence.

Users provide a short scenario, story idea, or mystery theme. The AI transforms this input into a complete fictional investigation containing:

* A crime or mysterious incident.
* Multiple suspects.
* A hidden culprit.
* Suspect profiles and motives.
* Evidence and investigation documents.
* WhatsApp conversations.
* CCTV recordings and transcripts.
* Images and photographic evidence.
* Witness statements.
* Contradictions and hidden clues.

The user investigates the available evidence, connects the clues, identifies inconsistencies, and ultimately selects the person they believe is responsible.

The platform evaluates the user's decision against the investigation's actual solution.

## 1.2 Core Concept

**Give AI a story. Get a mystery. Become the detective.**

Example:

User Input:

"A wealthy businessman is found dead inside his locked office. Four employees were present in the building that night."

AI Output:

* Crime Scene: Businessman's private office.
* Suspects: Four employees.
* Culprit: One employee, secretly determined by AI.
* Evidence: CCTV footage, WhatsApp conversations, fingerprints report, witness statements, photographs.
* Hidden Clues: Contradictions in statements and suspicious timestamps.

The user must investigate the available material and identify the murderer.

## 1.3 Primary Objectives

1. Allow users to generate unique mysteries using AI.
2. Create believable fictional investigations.
3. Provide interactive evidence for investigation.
4. Maintain consistency across all generated clues.
5. Prevent users from accessing the culprit before submitting an answer.
6. Evaluate the user's detective skills.
7. Provide an engaging, immersive detective experience.

---

# 2. TARGET USERS

The platform is designed for:

* Mystery and crime-story enthusiasts.
* Students looking for interactive experiences.
* Puzzle and investigation game lovers.
* Casual gamers.
* Users interested in AI-generated storytelling.

---

# 3. CORE USER JOURNEY

The entire application must follow this flow:

### STEP 1: Landing Page

The user visits the website.

They see:

* Brand identity.
* A compelling hero section.
* Brief explanation of the game.
* How it works.
* Example mystery.
* Call-to-action button: "Start Investigating".

### STEP 2: Create Mystery

The user clicks Start Investigating.

They are redirected to the mystery creation interface.

The user provides:

* Mystery title (optional).
* Story or scenario description.
* Mystery category.
* Difficulty level.
* Number of suspects.
* Preferred investigation type (optional).

Difficulty options:

1. Easy
2. Medium
3. Hard
4. Expert

The user clicks:

"Generate Mystery"

### STEP 3: AI Mystery Generation

The backend sends the user's scenario and selected preferences to Gemini.

Gemini generates a complete investigation package.

The generated investigation must contain:

* Case overview.
* Crime details.
* Suspect information.
* Hidden culprit.
* Motives.
* Timeline.
* Evidence files.
* Witness statements.
* Contradictions.
* Solution explanation.

The backend validates the generated investigation and stores it in MongoDB.

IMPORTANT:

The culprit and solution must NEVER be included in the frontend's initial investigation response.

### STEP 4: Investigation Dashboard

After successful generation, the user enters the investigation room.

The dashboard contains:

A. Case Overview

* Case ID.
* Case title.
* Crime type.
* Crime location.
* Incident date and time.
* Case description.
* Difficulty.

B. Suspects

* Suspect photographs or fictional avatars.
* Name.
* Age.
* Occupation.
* Relationship with the victim.
* Initial statement.
* Possible motive (where appropriate).

C. Evidence Room

Evidence is divided into categories:

1. Digital Evidence

   * WhatsApp conversations.
   * SMS conversations.
   * Email exchanges.
   * Call records.

2. Visual Evidence

   * Crime scene photographs.
   * CCTV recordings or simulated footage.
   * Objects found at the crime scene.
   * Photographs of suspects.

3. Physical Evidence

   * Fingerprint reports.
   * DNA reports.
   * Weapon reports.
   * Forensic findings.

4. Witness Evidence

   * Witness statements.
   * Interview transcripts.
   * Security guard statements.

5. Documents

   * Police reports.
   * Medical reports.
   * Timeline records.
   * Investigation notes.

Not every mystery needs every evidence category. Gemini should generate evidence appropriate to the scenario.

### STEP 5: Evidence Investigation

Users can click individual evidence cards to inspect them.

Examples:

WhatsApp Evidence:
Display a realistic chat interface containing:

* Contact name.
* Profile image.
* Message timestamps.
* Sent and received messages.
* Read receipts (optional).

CCTV Evidence:
Display:

* CCTV preview.
* Camera ID.
* Recording timestamp.
* Location.
* AI-generated video or a simulated recording.
* Optional transcript describing visible events.

Photographic Evidence:
Display:

* Image preview.
* Evidence ID.
* Capture timestamp.
* Description.
* Investigation notes.

Documents:
Display documents in a readable viewer.

Users should be able to:

* Open evidence.
* Zoom into images.
* Read complete conversations.
* View evidence descriptions.
* Mark evidence as important.
* Add private investigation notes.
* Revisit previously inspected evidence.

### STEP 6: Submit Investigation

Once the user believes they have solved the mystery, they click:

"Submit Final Verdict"

The application opens a verdict interface.

The user must select one suspect as the culprit.

Optional:
Allow the user to provide a short explanation supporting their decision.

Before submission, show a confirmation dialog.

### STEP 7: Investigation Results

After submission, the backend compares the selected suspect with the actual culprit.

Display:

If Correct:

* Congratulations message.
* Correct culprit identification.
* Explanation of the crime.
* Important clues that revealed the culprit.
* Explanation of misleading evidence.
* Detective score.

If Incorrect:

* Incorrect verdict message.
* Actual culprit.
* Complete explanation.
* Evidence that should have exposed the culprit.
* Detective score.

The result should provide a complete explanation rather than simply displaying Correct or Incorrect.

---

# 4. AI INTEGRATION: GOOGLE GEMINI

## 4.1 AI Responsibilities

Gemini is responsible for generating the investigation content.

It must generate:

1. Mystery scenario.
2. Crime details.
3. Victim profile.
4. Suspect profiles.
5. Actual culprit.
6. Motive and backstory.
7. Crime timeline.
8. Evidence files.
9. Digital conversations.
10. Witness statements.
11. Forensic reports.
12. Hidden clues.
13. Misleading clues.
14. Final solution.
15. Explanation of the investigation.

## 4.2 AI Generation Architecture

Use the following architecture:

User Input
|
v
React Frontend
|
v
Express API
|
v
Mystery Generation Service
|
v
Google Gemini API
|
v
Structured JSON Response
|
v
JSON Validation
|
v
Investigation Consistency Validation
|
v
MongoDB Storage
|
v
Safe Investigation Response
|
v
React Investigation Dashboard

## 4.3 Gemini Output Requirements

Gemini MUST return structured JSON.

Do not depend on free-form text or Markdown for the primary investigation data.

Suggested JSON structure:

{
"caseTitle": "The Midnight Incident",
"difficulty": "medium",
"category": "murder",

"caseOverview": {
"description": "...",
"location": "...",
"incidentDate": "...",
"incidentTime": "...",
"victim": {
"name": "...",
"age": 45,
"occupation": "..."
}
},

"suspects": [
{
"id": "S001",
"name": "...",
"age": 32,
"occupation": "...",
"relationshipToVictim": "...",
"statement": "...",
"motive": "...",
"avatarPrompt": "..."
}
],

"timeline": [],

"evidence": [
{
"id": "E001",
"type": "whatsapp",
"title": "...",
"description": "...",
"timestamp": "...",
"relatedSuspects": ["S001"],
"content": {}
}
],

"solution": {
"culpritId": "S001",
"motive": "...",
"method": "...",
"explanation": "...",
"keyEvidenceIds": ["E001"],
"redHerrings": []
}
}

This is a conceptual schema. The implementation must define and enforce a complete JSON schema for every evidence type.

## 4.4 AI Consistency Rules

These rules are CRITICAL.

Gemini must follow:

1. The actual culprit must be one of the generated suspects.
2. Every suspect must have a unique ID.
3. Every evidence item must have a unique ID.
4. Evidence timestamps must be logically consistent.
5. The crime timeline must not contradict the evidence.
6. Witness statements must remain consistent with established facts.
7. At least three meaningful clues must support the correct solution.
8. Misleading clues must not make the actual solution impossible.
9. The final explanation must reference existing evidence IDs.
10. There must be exactly one intended culprit.
11. The solution must be logically deducible from the available evidence.
12. Evidence must not reveal the culprit too obviously unless the difficulty is Easy.

If the generated JSON fails validation, the backend should attempt a controlled regeneration or repair.

Do not expose partially generated or invalid investigations to users.

## 4.5 Gemini API Security

* Store GEMINI_API_KEY in backend environment variables.
* Never expose the API key in React.
* Never hardcode API credentials.
* Use backend service functions for Gemini requests.
* Configure request timeouts.
* Handle API quota errors.
* Handle invalid JSON responses.
* Implement retry limits.
* Add rate limiting to mystery generation.

---

# 5. TECHNICAL ARCHITECTURE

## 5.1 Technology Stack

FRONTEND:

* React.js
* Vite
* React Router
* Tailwind CSS
* Lucide React
* Axios
* Framer Motion

BACKEND:

* Node.js
* Express.js
* MongoDB
* Mongoose
* Google Gemini SDK
* Zod for validation
* JWT (if authentication is implemented)
* Multer (if file uploads are implemented)

AI:

* Google Gemini API.

IMAGE STORAGE:

* Cloudinary or another configurable image storage provider.

DEVELOPMENT:

* Git
* GitHub
* VS Code
* Environment variables.

## 5.2 Architecture Principles

Follow a modular architecture.

Frontend and backend must remain separate.

Recommended project structure:

al-mystery-room/
│
├── client/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   ├── layout/
│   │   │   ├── evidence/
│   │   │   ├── suspects/
│   │   │   └── investigation/
│   │   │
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── CreateMystery.jsx
│   │   │   ├── InvestigationRoom.jsx
│   │   │   └── Results.jsx
│   │   │
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── context/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   │   ├── gemini.service.js
│   │   │   ├── mystery.service.js
│   │   │   └── validation.service.js
│   │   │
│   │   ├── prompts/
│   │   │   └── mystery.prompt.js
│   │   │
│   │   ├── middleware/
│   │   ├── validators/
│   │   ├── utils/
│   │   └── app.js
│   │
│   ├── .env.example
│   └── package.json
│
├── docs/
│   ├── SPEC.md
│   ├── ARCHITECTURE.md
│   └── API.md
│
├── .gitignore
└── README.md

The folder structure may evolve, but responsibilities must remain separated.

---

# 6. DATABASE DESIGN

Use MongoDB with Mongoose.

## 6.1 Mystery Collection

Each mystery document should contain:

* _id
* caseTitle
* caseDescription
* category
* difficulty
* createdAt
* victim
* suspects
* timeline
* evidence
* solution
* generationStatus

IMPORTANT:

The solution object must be stored privately on the backend.

The frontend must never receive the actual culprit ID before verdict submission.

## 6.2 User Collection

For an authenticated version:

* _id
* username
* email
* passwordHash
* createdAt
* detectiveStats

Password storage must use secure hashing.

## 6.3 Investigation Collection

Stores an individual user's progress.

Fields:

* _id
* userId (optional for guest mode)
* mysteryId
* openedEvidenceIds
* bookmarkedEvidenceIds
* investigationNotes
* selectedSuspectId
* submittedAt
* isCompleted
* score

## 6.4 Result Collection

Stores:

* investigationId
* mysteryId
* selectedSuspectId
* actualCorrectness
* score
* submittedAt

Do not duplicate sensitive solution data unnecessarily.

---

# 7. BACKEND API SPECIFICATION

All APIs must use a consistent JSON response structure.

Base URL:

/api/v1

## 7.1 Mystery APIs

POST /api/v1/mysteries/generate

Purpose:
Generate a mystery using Gemini.

Request:

{
"scenario": "A businessman is found dead...",
"difficulty": "medium",
"suspectCount": 4,
"category": "murder"
}

Response:

{
"success": true,
"data": {
"mysteryId": "...",
"caseTitle": "...",
"caseOverview": {},
"suspects": [],
"timeline": [],
"evidence": []
}
}

The response must exclude the solution.

GET /api/v1/mysteries/:id

Purpose:
Retrieve the public investigation data.

Response must never contain the actual culprit or hidden solution.

## 7.2 Evidence APIs

GET /api/v1/mysteries/:id/evidence

Purpose:
Retrieve evidence belonging to a mystery.

GET /api/v1/mysteries/:id/evidence/:evidenceId

Purpose:
Retrieve a particular evidence item.

## 7.3 Investigation APIs

POST /api/v1/investigations

Purpose:
Start an investigation.

GET /api/v1/investigations/:id

Purpose:
Retrieve investigation progress.

PATCH /api/v1/investigations/:id/progress

Purpose:
Update bookmarks, opened evidence, and notes.

## 7.4 Verdict API

POST /api/v1/investigations/:id/verdict

Request:

{
"selectedSuspectId": "S001",
"reasoning": "The CCTV timestamp contradicts..."
}

Backend responsibilities:

1. Validate investigation ownership.
2. Verify the investigation has not already been submitted.
3. Verify the selected suspect exists.
4. Retrieve the actual culprit privately.
5. Compare the selected suspect with the correct culprit.
6. Calculate the detective score.
7. Save the result.
8. Return the result and solution explanation.

Response:

{
"success": true,
"data": {
"correct": true,
"score": 100,
"actualCulprit": {},
"explanation": "...",
"keyEvidence": []
}
}

Never accept the correct answer from the frontend.

Never allow the frontend to directly query the solution field.

---

# 8. GAME MECHANICS & SCORING

The platform should reward logical investigation rather than random guessing.

Suggested scoring system:

Correct culprit identification: 70 points.

Evidence investigation: 20 points.

Reasoning quality: 10 points (optional, if a reliable evaluation mechanism is implemented).

Maximum score: 100.

For the initial MVP, keep scoring deterministic:

* Correct culprit: 70 points.
* Incorrect culprit: 0 points.
* Evidence exploration: Up to 20 points.
* Reasoning evaluation: Optional and disabled until implemented reliably.

Do not let the AI arbitrarily change scores.

The backend must calculate all deterministic scoring.

Optional future features:

* Investigation timer.
* Hints.
* Detective rankings.
* Achievements.
* Daily mysteries.
* Multiplayer investigations.

These are NOT required for the initial MVP.

---

# 9. UI/UX DESIGN SPECIFICATION

## 9.1 Overall Design Direction

The website should feel like a premium detective investigation platform.

Design inspiration:

* Modern detective investigation interfaces.
* Classified police documents.
* Digital forensic investigation systems.
* Cinematic mystery environments.

The design should be immersive without becoming visually cluttered.

## 9.2 Visual Identity

Suggested theme:

Primary background:
#0B0E14

Secondary background:
#121722

Card background:
#181F2B

Primary accent:
#C9A45C

Secondary accent:
#8B9BB4

Primary text:
#F4F1EA

Secondary text:
#A6ADBB

Success:
#35B779

Danger:
#E05252

Use a premium dark investigation aesthetic with subtle gold accents.

Avoid:

* Excessive gradients.
* Excessive glassmorphism.
* Overloaded dashboards.
* Unnecessary animations.
* Generic SaaS dashboard styling.

## 9.3 Landing Page

Required sections:

1. Navigation bar.
2. Hero section.
3. Mystery creation CTA.
4. How It Works.
5. Example Evidence Preview.
6. Features.
7. Footer.

Suggested hero headline:

"Every Mystery Has a Secret. Can You Find It?"

Supporting text:

"Create your own investigation, uncover hidden evidence, interrogate the clues, and identify the culprit. Your detective instincts are your only weapon."

CTA:

"Enter the Mystery Room"

## 9.4 Mystery Creation Page

Design requirements:

* Clean input interface.
* Large scenario text area.
* Difficulty selector.
* Suspect count selector.
* Mystery category selector.
* Generate button.
* Generation progress animation.

During generation, display investigation-themed loading messages.

Examples:

"Analyzing the crime scene..."
"Connecting the evidence..."
"Interrogating the suspects..."
"Building the investigation..."

These messages are visual progress indicators, not claims that separate AI operations are occurring.

## 9.5 Investigation Dashboard

Suggested layout:

LEFT SIDEBAR:

* Case Overview.
* Suspects.
* Evidence Categories.
* Investigation Notes.

MAIN AREA:

* Selected evidence.
* Evidence preview.
* Interactive evidence viewer.

RIGHT PANEL:

* Suspect overview.
* Case timeline.
* Investigation progress.

Responsive behavior:

Desktop:
Three-column investigation layout.

Tablet:
Two-column layout.

Mobile:
Collapsible navigation and full-width evidence viewer.

## 9.6 Evidence Components

Build separate reusable components:

* WhatsAppEvidence.jsx
* SMSEvidence.jsx
* CCTVEvidence.jsx
* ImageEvidence.jsx
* DocumentEvidence.jsx
* WitnessStatement.jsx
* ForensicReport.jsx

Every evidence type should have its own appropriate visual presentation.

Do not display every evidence item using the same generic card layout.

IMPORTANT:

CCTV footage, photographs, and other media must be genuinely generated or clearly presented as simulated content.

Do not label a static image as an actual video recording.

---

# 10. FUNCTIONAL REQUIREMENTS

The application must satisfy the following:

FR-01: Users can enter their own mystery scenario.

FR-02: Users can select investigation difficulty.

FR-03: Users can select the number of suspects.

FR-04: The system can generate mysteries through Gemini.

FR-05: The backend validates generated JSON.

FR-06: Every mystery has exactly one intended culprit.

FR-07: The system generates multiple evidence types.

FR-08: Users can inspect suspect profiles.

FR-09: Users can open and inspect evidence.

FR-10: Users can bookmark evidence.

FR-11: Users can maintain investigation notes.

FR-12: Users can submit a final verdict.

FR-13: The system validates the submitted suspect.

FR-14: The system calculates the detective score.

FR-15: The system reveals the solution after submission.

FR-16: Users can view their completed investigation.

FR-17: Users can start a new mystery.

FR-18: Investigation progress must persist across page refreshes.

FR-19: The system must prevent duplicate verdict submissions.

FR-20: The system must prevent access to hidden solutions before submission.

---

# 11. NON-FUNCTIONAL REQUIREMENTS

## Performance

* Landing page should load quickly.
* Avoid unnecessary frontend re-renders.
* Use lazy loading for evidence images.
* Handle long Gemini generation requests properly.
* Display loading and error states.

## Security

* Keep Gemini credentials on the backend.
* Validate all incoming API requests.
* Sanitize user-generated input.
* Implement API rate limiting.
* Prevent unauthorized solution access.
* Secure authenticated endpoints.
* Use appropriate CORS configuration.
* Never trust client-side scoring.

## Reliability

* Handle Gemini API failures.
* Handle MongoDB connection failures.
* Handle malformed AI responses.
* Prevent duplicate mystery generation requests.
* Maintain investigation state.
* Provide meaningful error messages.

## Scalability

* Keep AI services modular.
* Separate generation from investigation management.
* Use reusable frontend components.
* Design database schemas for future expansion.

---

# 12. ERROR HANDLING

The application must handle:

1. Gemini API unavailable.
2. Gemini rate limit exceeded.
3. Invalid AI-generated JSON.
4. Investigation not found.
5. Evidence not found.
6. Invalid suspect selection.
7. Duplicate verdict submission.
8. MongoDB connection failure.
9. Network interruption.
10. Generation timeout.

Display user-friendly error messages.

Never expose internal stack traces, API keys, or sensitive backend information.

---

# 13. IMPORTANT AI CONTENT RULES

All mysteries are fictional.

The system must:

* Generate fictional names and characters.
* Avoid presenting generated crimes as actual real-world incidents.
* Avoid using real people's private conversations or identities.
* Clearly label generated WhatsApp chats and CCTV content as fictional evidence.
* Avoid creating real-world accusations against identifiable individuals.
* Avoid using real police department branding in a misleading manner.

The AI should prioritize logical consistency and entertainment.

---

# 14. TESTING REQUIREMENTS

Before considering the application complete, test:

### Mystery Generation

* Generate a murder mystery.
* Generate a theft mystery.
* Generate a kidnapping mystery.
* Generate a mystery with four suspects.
* Generate an easy mystery.
* Generate an expert mystery.
* Test empty scenario input.
* Test extremely long scenario input.
* Test malformed Gemini output.

### Investigation

* Open every evidence category.
* Verify timestamps.
* Verify suspect relationships.
* Verify evidence bookmarks.
* Verify notes persistence.
* Refresh the investigation page.
* Verify the investigation remains accessible.

### Security

* Attempt to retrieve the solution before submission.
* Attempt to modify the culprit ID through frontend requests.
* Attempt duplicate verdict submissions.
* Attempt unauthorized investigation access.
* Verify API keys are not exposed in frontend bundles.

### Results

* Submit the correct culprit.
* Submit an incorrect culprit.
* Verify scoring.
* Verify explanation.
* Verify the actual culprit matches the generated solution.

---

# 15. MVP DEVELOPMENT PRIORITIES

Build the project in the following order.

PHASE 1: FOUNDATION

* Initialize MERN project.
* Configure React and Express.
* Connect MongoDB.
* Configure environment variables.
* Establish frontend routing.
* Establish backend API structure.

PHASE 2: AI ENGINE

* Integrate Gemini.
* Build mystery generation prompts.
* Define JSON schemas.
* Implement JSON validation.
* Implement investigation consistency checks.
* Save mysteries in MongoDB.

PHASE 3: FRONTEND EXPERIENCE

* Build landing page.
* Build mystery creation page.
* Build investigation dashboard.
* Build suspect cards.
* Build evidence viewers.
* Build investigation notes.

PHASE 4: GAME LOGIC

* Implement investigation creation.
* Implement progress persistence.
* Implement verdict submission.
* Implement backend scoring.
* Implement results page.
* Protect hidden solutions.

PHASE 5: POLISH & TESTING

* Responsive design.
* Loading animations.
* Error handling.
* Security testing.
* AI consistency testing.
* UI refinement.
* Production build verification.

---

# 16. OUT OF SCOPE FOR INITIAL MVP

Do not implement these unless explicitly requested:

* Multiplayer detective mode.
* Real-time collaborative investigations.
* Voice interrogation.
* Live AI suspect conversations.
* Payment gateway.
* Subscription system.
* Public leaderboard.
* Social networking.
* Admin analytics dashboard.
* Mobile application.
* Real CCTV integration.

Keep the architecture extensible so these can be added later.

---

# 17. DEFINITION OF DONE

The project is considered complete when:

1. A user can open the website.
2. A user can submit a custom mystery scenario.
3. Gemini successfully generates a structured investigation.
4. The generated investigation is saved in MongoDB.
5. The user can inspect all generated suspects.
6. The user can explore the evidence.
7. The user can bookmark evidence and maintain notes.
8. The user can submit a final verdict.
9. The backend checks the actual culprit.
10. The user receives a complete investigation report.
11. The hidden solution remains protected before submission.
12. The application works on desktop and mobile.
13. All critical errors are handled.
14. No major functional requirement remains unimplemented.

---

# 18. CODEX DEVELOPMENT RULES

These rules are mandatory.

## Rule 1: Follow the Specification

This document is the single source of truth.

Do not invent additional major features or change the product direction without approval.

## Rule 2: Plan Before Implementation

Before writing code:

* Inspect the existing repository.
* Understand the existing architecture.
* Identify missing components.
* Create an implementation plan.
* Identify dependencies.
* Break work into manageable tasks.

## Rule 3: Modular Development

* Use reusable React components.
* Keep controllers separate from services.
* Keep Gemini integration separate from business logic.
* Keep database models separate.
* Avoid unnecessary monolithic files.

## Rule 4: No Fake Functionality

Never create buttons that do nothing.

Never use hardcoded mystery results as if they came from Gemini.

Never simulate a successful API response when the real integration is expected.

If an external service is unavailable, show an honest error state.

## Rule 5: Type and Data Validation

Validate:

* Frontend form inputs.
* Backend request bodies.
* Gemini-generated JSON.
* Database relationships.
* Verdict submissions.

## Rule 6: Security First

Never expose:

* Gemini API keys.
* Hidden culprit information.
* Internal solution objects.
* Sensitive environment variables.

## Rule 7: Maintain Documentation

Update the documentation when architecture, API contracts, or implementation decisions change.

## Rule 8: Test After Every Major Phase

Do not build the entire application and test everything at the end.

Test each major module before moving forward.

## Rule 9: Preserve Existing Functionality

If working with an existing repository, inspect before modifying.

Do not delete working functionality without a valid reason.

## Rule 10: Report Progress

After completing each phase, report:

* What was implemented.
* Files created or modified.
* Tests performed.
* Issues remaining.
* Next development phase.

---

# 19. FINAL PRODUCT PRINCIPLE

AL Mystery Room is not simply an AI story generator.

It is an interactive investigation experience.

The AI creates the mystery, but the user must solve it.

The evidence should feel believable, the clues should reward observation, the culprit should be logically discoverable, and the final reveal should make the entire investigation come together.

**The central product philosophy:**

"Don't tell users a mystery. Give them the evidence and make them solve it."

END OF MASTER SPECIFICATION.
