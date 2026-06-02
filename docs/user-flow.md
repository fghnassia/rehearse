# Rehearse — User Flow Diagram
*Revised after IA evaluation — v2*

**Changes from v1:** Simulation split into 3 sub-states · Mid-simulation exit defined · Scores hidden during simulation · Copy report action · Pre-simulation notice · Error states assigned to specific routes · Stage pipeline indicator corrected

---

```mermaid
flowchart TD
    START([▶ Enter App]) --> HOME

    HOME["/ — Home
    App name · Value prop · CTA"]

    HOME --> |"Click 'Start Session'"| SETUP

    SETUP["**/setup — Session Setup**
    Pipeline: Setup → Research → Simulation → Report
    Resume upload · Portfolio URL
    Job posting URL · Stage selector
    ⚠ Notice: session runs as one continuous flow"]

    SETUP --> |"Upload resume"| RESUME_VALID{Resume\nvalid PDF?}
    RESUME_VALID -- No --> RESUME_ERR["Error: Invalid file
    Retry upload"]
    RESUME_ERR --> SETUP

    SETUP --> |"Enter portfolio URL"| PORT_VALID{Portfolio\nreachable?}
    PORT_VALID -- No --> PORT_WARN["⚠ Warning: Portfolio unavailable
    Noted — proceed anyway"]
    PORT_WARN --> SETUP_COMPLETE
    PORT_VALID -- Yes --> SETUP_COMPLETE

    SETUP --> |"Enter job posting URL"| JOB_VALID{Job URL\nreachable?}
    JOB_VALID -- No --> JOB_ERR["Error: URL unreachable
    Retry or paste manually"]
    JOB_ERR --> SETUP
    JOB_VALID -- Yes --> SETUP_COMPLETE

    RESUME_VALID -- Yes --> SETUP_COMPLETE
    SETUP --> |"Select stage"| STAGE_SELECTED[/"Stage selected
    Recruiter / HM / Portfolio"/]
    STAGE_SELECTED --> SETUP_COMPLETE

    SETUP_COMPLETE{All 4 fields\ncompleted?}
    SETUP_COMPLETE -- No --> SETUP_VALIDATION["Inline validation errors
    Highlight missing fields"]
    SETUP_VALIDATION --> SETUP
    SETUP_COMPLETE -- "← Back" --> HOME

    SETUP_COMPLETE -- Yes --> |"Click 'Research Company'"| RESEARCH_PARSE
    RESEARCH_PARSE[["SYSTEM: Parse resume
    Scrape portfolio · Parse job posting"]]
    RESEARCH_PARSE --> RESEARCH_A

    subgraph RESEARCH ["/research — Company Research"]
        RESEARCH_A["**State A: Researching**
        Live status: 'Searching Glassdoor… Reddit… Blind…'
        Sources shown as found — never silent spinner"]

        RESEARCH_A --> RESEARCH_SEARCH[["SYSTEM: Web search
        Glassdoor · Reddit · Blind · LinkedIn · Company blog"]]

        RESEARCH_SEARCH --> COVERAGE{Data\ncoverage?}

        COVERAGE -- Rich --> RESEARCH_B_RICH["**State B: Company Brief**
        🟢 High coverage · Sources listed
        Company-specific insights displayed"]

        COVERAGE -- Sparse --> RESEARCH_B_SPARSE["**State B: Company Brief**
        🟡 Low coverage · Disclaimer shown
        'Questions will be less company-specific'"]

        COVERAGE -- None --> RESEARCH_B_NONE["**State B: Company Brief**
        🔴 No data found · User explicitly informed
        Generic questions only"]
    end

    RESEARCH_B_RICH --> |"← Change inputs"| SETUP
    RESEARCH_B_SPARSE --> |"← Change inputs"| SETUP
    RESEARCH_B_NONE --> |"← Change inputs"| SETUP

    RESEARCH_B_RICH --> |"Click 'Begin Simulation'"| SIM_LOAD
    RESEARCH_B_SPARSE --> |"Click 'Begin Simulation'"| SIM_LOAD
    RESEARCH_B_NONE --> |"Click 'Begin Simulation'"| SIM_LOAD

    SIM_LOAD[["SYSTEM: Load stage persona
    Generate question set from profile + job posting + coverage data"]]
    SIM_LOAD --> SIM_READY

    subgraph SIMULATION ["/simulation — Interview Simulation"]

        SIM_READY["**State A: Ready**
        Persona name · Stage label · Brief
        Question count · Input mode notice"]

        SIM_READY --> |"Browser back/close"| ABANDONED
        SIM_READY --> |"Click 'Begin Interview'"| VOICE_CHECK

        VOICE_CHECK{Voice input\nsupported?}
        VOICE_CHECK -- Yes --> SIM_VOICE["Voice mode active
        Mic button shown · Text fallback available"]
        VOICE_CHECK -- No --> SIM_TEXT_ONLY["Text-only mode
        Mic unavailable notice shown"]

        SIM_VOICE --> SIM_B
        SIM_TEXT_ONLY --> SIM_B

        SIM_B["**State B: In Progress**
        Persona asks Question N · Progress: 'N of 7'
        ⚑ Evaluation runs silently — scores hidden until /report"]

        SIM_B --> |"Browser back/close"| ABANDONED
        SIM_B --> INPUT_METHOD{Input\nmethod?}

        INPUT_METHOD -- Voice --> SPEAK[/"User speaks answer"/]
        INPUT_METHOD -- Text --> TYPE[/"User types answer"/]

        SPEAK --> TRANSCRIBE{Transcription\nsucceeded?}
        TRANSCRIBE -- Yes --> TRANSCRIPT["Transcript shown
        One-pass edit · then confirm"]
        TRANSCRIBE -- No --> TRANSCRIBE_ERR["Error: Transcription failed
        Retry or switch to text"]
        TRANSCRIBE_ERR --> INPUT_METHOD

        TRANSCRIPT --> SUBMIT[/"Click 'Submit'"/]
        TYPE --> SUBMIT

        SUBMIT --> EVAL[["SYSTEM: Evaluate response
        Clarity · Specificity · Relevance · AI fluency · Impression
        ⚑ Scores stored — NOT displayed yet"]]

        EVAL --> MORE_Q{More\nquestions?}
        MORE_Q -- Yes --> SIM_B
        MORE_Q -- No, all answered --> SIM_C

        SIM_C["**State C: Complete**
        'Session complete. Generating your report…'
        Loading state with context"]

        SIM_C --> REPORT_GEN
    end

    ABANDONED(["Session abandoned
    → redirect to /"])
    ABANDONED --> HOME

    REPORT_GEN[["SYSTEM: Compile feedback report
    Aggregate scores · Generate recommendations
    Produce sample stronger answers"]]
    REPORT_GEN --> REPORT

    REPORT["**/report — Your Report**
    Session summary: Company · Role · Stage
    Overall impression + rating
    ─────────────────────────────────
    Per-question breakdown ×N:
    Question → Answer → Scores
    What worked · Gap + fix
    Sample stronger answer (calibration, not script)
    ─────────────────────────────────
    ⚠ 'This report lives only in this session.'
    📋 Copy report (plain text — no auth required)"]

    REPORT --> EXIT_CHOICE{What\nnext?}
    EXIT_CHOICE -- "Redo this stage" --> SIM_LOAD
    EXIT_CHOICE -- "Prep a different stage" --> SETUP
    EXIT_CHOICE -- "Start fresh" --> HOME
    EXIT_CHOICE -- "Done" --> END(["◼ Session ends"])
```

---

## Key Design Decisions in This Flow

| Decision | Rationale |
|---|---|
| Per-answer scores hidden until /report | Prevents users performing for the score rather than practicing authentically |
| State A (Ready) before simulation begins | Gives the user a moment to prepare — transition from "reading" to "in interview" |
| ABANDONED node for mid-simulation browser exit | Makes the behavior explicit — session is gone, user returns home |
| Copy report — no auth | Highest-friction post-session moment, near-zero implementation cost |
| Pre-simulation notice on /setup | User commits knowing the session is one continuous flow |
| Stage pipeline (not "Step 1 of 2") | Sets honest expectations for a high-anxiety user |
