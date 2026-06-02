# Rehearse — User Flow Diagram

**14 screens/states · 8 decision points · 4 system processes · 3 error recovery paths**

---

```mermaid
flowchart TD
    A([START: Enter App]) --> B[Home Screen\nIntro + 'Start Session' CTA]
    B --> C[/Click 'Start Session'/]
    C --> D[Context Intake Screen\n4 required inputs]

    D --> E[/Upload Resume PDF/]
    D --> F[/Enter Portfolio URL/]
    D --> G[/Enter Job Posting URL/]
    D --> H[/Select Interview Stage\nRecruiter · Hiring Manager · Portfolio Review/]

    E & F & G & H --> I{All 4 fields\ncompleted?}

    I -- No --> J[Inline validation errors\nHighlight missing fields]
    J --> D

    I -- Yes --> K[[SYSTEM: Parse resume\nScrape portfolio\nParse job posting]]

    K --> L{Parsing\nresult?}
    L -- PDF invalid --> M[Error: Invalid file\nPrompt retry]
    M --> E
    L -- Job URL unreachable --> N[Error: URL unreachable\nPrompt retry]
    N --> G
    L -- Portfolio unreachable --> O[Warning: Portfolio unavailable\nNote it and proceed]
    O --> P
    L -- All parsed --> P[[SYSTEM: Web search\nGlassdoor · Reddit · Blind\nLinkedIn · Company blog]]

    P --> Q[Research Loading Screen\nProgress indicator with context]
    Q --> R{Data coverage\nlevel?}

    R -- Rich --> S[Research Screen\n🟢 High coverage\nCompany-specific insights displayed]
    R -- Sparse --> T[Research Screen\n🟡 Low coverage\nDisclaimer: questions will be\nless company-specific]
    R -- None --> U[Research Screen\n🔴 No data found\nGeneric questions only\nUser explicitly informed]

    S --> V[/Click 'Begin Simulation'/]
    T --> V
    U --> V

    V --> W[[SYSTEM: Load stage persona\nGenerate question set\nfrom profile + job posting]]
    W --> X[Simulation Screen\nPersona intro + first question]

    X --> Y{Voice input\nsupported?}
    Y -- Yes --> Z[Voice mode default\nMic active · text fallback shown]
    Y -- No --> AA[Text-only mode\nMic unavailable notice shown]

    Z --> AB[Persona asks Question N]
    AA --> AB

    AB --> AC{Input\nmethod}
    AC -- Voice --> AD[/User speaks answer/]
    AC -- Text --> AE[/User types answer/]

    AD --> AF{Transcription\nsucceeded?}
    AF -- Yes --> AG[Transcript displayed\nUser confirms or edits]
    AF -- No --> AH[Transcription failed\nRetry prompt · or switch to text]
    AH --> AC
    AG --> AI[/Submit answer/]
    AE --> AI

    AI --> AJ[[SYSTEM: Evaluate response\nClarity · Specificity · Relevance\nAI fluency · Overall impression]]

    AJ --> AK{More\nquestions?}
    AK -- Yes, next question --> AB
    AK -- No, simulation complete --> AL[[SYSTEM: Generate\nfeedback report]]

    AL --> AM[Feedback Report Screen\nPer-question scores\nStrengths · Gaps · Recommendations\nSample stronger answers]

    AM --> AN{Next action?}
    AN -- Redo same stage --> V
    AN -- Prep different stage --> D
    AN -- Start over new company --> B
    AN -- Done --> AO([END: Exit Session])
```

---

## Key Design Decisions Captured

- **Portfolio failure is a warning, not a blocker** — app notes it and proceeds
- **Transcription failure has a clear recovery path** — retry or switch to text, never a dead end
- **Three post-report exits** — redo same stage, swap stage, fresh company — all must be visible on feedback screen
- **Research loading shows context** — "Searching Glassdoor, Reddit..." not a blank spinner
- **Data coverage is always disclosed** — three levels (rich / sparse / none), user never misled
