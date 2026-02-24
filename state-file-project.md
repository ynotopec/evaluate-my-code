# State File — Project

## A) Router / Decision Flow

```mermaid
flowchart TD
    START([App boot]) --> UI[Unhide app and bind UI listeners]
    UI --> INIT[initializeQuestionBank()]
    INIT --> FETCH{questions.json loaded?}
    FETCH -- No --> SETUP_ERR[Show setup error / disable submit & next]
    FETCH -- Yes --> VALID{All 5 themes available?}
    VALID -- No --> SETUP_ERR
    VALID -- Yes --> LOAD_Q[loadNextRandomQuestion()]

    LOAD_Q --> FINISHED{isFinished?}
    FINISHED -- Yes --> END_LOCKED([Locked / submitted])
    FINISHED -- No --> NEXT_THEME[nextTheme()]
    NEXT_THEME --> PICK[pickQuestionForTheme(theme)]
    PICK --> HAS_Q{question found?}
    HAS_Q -- No --> WARN[Show warning in output]
    HAS_Q -- Yes --> PRESENT[loadQuestion(question)]

    PRESENT --> ANSWER_EVT{Submit answer clicked}
    ANSWER_EVT --> ALREADY{Already answered current question?}
    ALREADY -- Yes --> WARN_REPEAT[Warn and require next question]
    ALREADY -- No --> CHECK[ evaluateCurrentAnswer() ]
    CHECK --> SELECTED{Choice selected?}
    SELECTED -- No --> WARN_NOSEL[Warn to select an answer]
    SELECTED -- Yes --> SCORE[Score: 10 if correct else 0]
    SCORE --> UPDATE[Persist attempt + analytics + integrity log]

    UPDATE --> NEXT_EVT{Next random question clicked}
    NEXT_EVT --> LOAD_Q

    PRESENT --> TIMER_TICK{Timer tick}
    TIMER_TICK --> NOLIMIT{No limit mode enabled?}
    NOLIMIT -- Yes --> INFINITE[Show ∞ timer]
    NOLIMIT -- No --> DEC[Decrement remaining time]
    DEC --> ZERO{Remaining time = 0?}
    ZERO -- Yes --> FINISH_TIME[finishAssessment('time elapsed')]
    ZERO -- No --> PRESENT

    PRESENT --> MANUAL_STOP{Stop & score clicked?}
    MANUAL_STOP -- Yes --> FINISH_MANUAL[finishAssessment('manual stop')]

    FINISH_TIME --> END_LOCKED
    FINISH_MANUAL --> END_LOCKED
```

## B) Single Sequence for a Critical Test Case

### Critical case: Candidate submits a correct answer, then manually finishes assessment

```mermaid
sequenceDiagram
    participant C as Candidate
    participant UI as Browser UI
    participant APP as App State (script.js)
    participant QB as Question Bank (questions.json)

    C->>UI: Open assessment page
    UI->>APP: Boot script + initializeQuestionBank()
    APP->>QB: fetch questions.json
    QB-->>APP: QCM list (all themes)
    APP->>APP: loadNextRandomQuestion()
    APP-->>UI: Render randomized options for active question

    C->>UI: Select correct option
    C->>UI: Click "Submit answer"
    UI->>APP: evaluateCurrentAnswer()
    APP->>APP: Compare selectedIndex with correctOptionIndex
    APP->>APP: scoreHistory.push({score:10, weight,...})
    APP->>APP: updateScore(10) + updateSessionAnalytics()
    APP-->>UI: Show "✅ Correct answer. +10 points"

    C->>UI: Click "Stop & score"
    UI->>APP: finishAssessment('manual stop')
    APP->>APP: Set isFinished=true; disable controls
    APP->>APP: Compute average score and completion summary
    APP->>APP: Log integrity event
    APP-->>UI: Show submitted state + final summary
```
