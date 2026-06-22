const { chromium } = require('playwright')
const path = require('path')

const BASE = 'http://localhost:3000'
const OUT = path.join(__dirname, '../screenshots')

const SESSION_DATA = {
  setup: {
    resumeText: `Flora Ghnassia — Product Designer
f.ghnassia@gmail.com · flora.design · London, UK

EXPERIENCE

Senior Product Designer · Yummylabs (2022–present)
Leading product design for Knowunity, an AI-powered learning platform used by 15M+ students across Europe. Own the design system, core student experience, and AI-native features including adaptive quiz generation and personalized study plans.

Product Designer · Maze (2020–2022)
Designed Maze's core research platform: moderated and unmoderated testing flows, prototype import from Figma, and team collaboration features. Shipped the block-based report builder (0→1) that became the company's primary retention driver.

UX Designer · BPCE Group (2018–2020)
Redesigned internal banking tools for 12,000 employees. Led accessibility audit that achieved WCAG 2.1 AA compliance across 40+ screens.

SKILLS
Product strategy, design systems, AI-native UX, user research, Figma, prototyping, cross-functional collaboration

EDUCATION
Master's in Interaction Design · Sciences Po Paris (2018)`,
    portfolioUrl: 'https://flora.design',
    jobPostingUrl: 'https://linear.app/jobs/senior-product-designer',
    stage: 'hiring-manager',
  },
  context: {
    companyName: 'Linear',
    roleTitle: 'Senior Product Designer',
    jobInsights: [
      {
        category: 'Role Focus',
        points: [
          'Own end-to-end design for Linear\'s core issue tracking and project management surfaces',
          'Work directly with founders and engineering leads on product direction',
          'Define interaction patterns that set the standard for productivity tools',
        ],
      },
      {
        category: 'Culture & Values',
        points: [
          'Deeply opinionated product culture — Linear has strong convictions about what good software feels like',
          'Speed and craft are non-negotiable: "fast by default, no compromise on quality"',
          'Small team, high ownership — you\'ll shape the product, not just execute specs',
        ],
      },
      {
        category: 'AI Integration',
        points: [
          'Actively investing in AI features: AI-assisted project planning, smart assignee suggestions',
          'Looking for designers who can reason about AI affordances, not just use them as tools',
        ],
      },
    ],
    resumeProfile: {
      title: 'Senior Product Designer at Yummylabs',
      experience: '6 years · mid-senior',
      highlight: 'Led design for 15M-user AI learning platform; shipped 0→1 research block builder at Maze',
    },
  },
  research: {
    companyName: 'Linear',
    roleTitle: 'Senior Product Designer',
    coverageLevel: 'rich',
    sourceCount: 4,
    insights: `Linear is a project management tool built for high-performance engineering teams. Founded in 2019 by Karri Saarinen (former Airbnb design lead) and Jori Lallo, the company raised $35M Series B in 2022.

Key product principles: keyboard-first, sub-50ms interactions, opinionated UX with minimal configuration. Linear competes with Jira and Asana but targets teams who value speed and craft over feature breadth.

Recent moves: expanding into AI with "Linear AI" (April 2024) — auto-assigns issues, summarizes threads, suggests priorities. Growing beyond engineering teams into marketing and ops workflows.

Design culture: Karri Saarinen still reviews major design decisions. The team is known for sweating details — dark mode, animation quality, empty states.`,
    sources: [
      { title: 'Linear raises $35M Series B to build the future of project management', url: 'https://linear.app/blog', snippet: 'Linear has raised a $35M Series B led by Iconiq Growth.', source: 'linear.app' },
      { title: 'Karri Saarinen on designing Linear', url: 'https://linear.app/blog/design', snippet: 'We believe software should be fast. Not just fast — instantaneous.', source: 'linear.app' },
      { title: 'Linear AI: Intelligent project management', url: 'https://linear.app/ai', snippet: 'Linear AI helps engineering teams stay organized with smart suggestions.', source: 'linear.app' },
      { title: 'Linear 2024 product update', url: 'https://linear.app/changelog', snippet: 'New AI features, improved mobile app, and expanded integrations.', source: 'linear.app' },
    ],
  },
  simulation: {
    personaName: 'Jordan Kim',
    personaRole: 'Head of Design at Linear',
    behaviorNote: 'Direct, expects specificity. Pushes on "why" behind decisions. Has little patience for vague answers or buzzword-heavy takes on AI.',
    questions: [
      'Walk me through a recent project where you had to design for a complex user workflow. What was the core tension you were trying to resolve?',
      'How do you think about the relationship between speed and discoverability in a productivity tool? Where do you draw the line?',
      'Tell me about a time you pushed back on a product decision. What happened?',
      'How are you integrating AI into your design process today — not as a feature, but as a tool?',
      'What does "good AI UX" look like to you? Give me a concrete example from something you\'ve shipped or that you admire.',
      'How do you work with engineers who have strong opinions about UX?',
      'Describe your relationship with data in design decisions.',
      'What\'s a design pattern you think is broken in most productivity tools?',
    ],
    answers: [
      {
        questionId: 'q1',
        questionText: 'Walk me through a recent project where you had to design for a complex user workflow. What was the core tension you were trying to resolve?',
        userAnswer: 'At Yummylabs I redesigned the adaptive quiz flow. Core tension: teachers needed control over what students practiced, but over-configuration killed the AI\'s effectiveness. We ended up with a "guardrails not gates" model — teachers set constraints, AI fills the space. Reduced drop-off by 34%.',
        scores: [
          { criterion: 'structure', level: 'strong', rationale: 'Clear problem → tension → solution arc with outcome' },
          { criterion: 'specificity', level: 'strong', rationale: 'Named the company, the pattern, and quantified outcome' },
          { criterion: 'relevance', level: 'strong', rationale: 'Directly relevant to productivity tool design complexity' },
          { criterion: 'communication', level: 'strong', rationale: 'Concise, clear, confident delivery' },
          { criterion: 'ai_fluency', level: 'strong', rationale: 'Shows sophisticated understanding of human-AI collaboration design' },
        ],
        whatWorked: 'Excellent structure and the "guardrails not gates" framing is memorable and precise. The 34% metric grounds the answer in impact.',
        whatToImprove: 'Could add a sentence on what you learned from this pattern — showing reflection makes it more compelling for a senior design role.',
        sampleAnswer: 'At Yummylabs I redesigned the adaptive quiz flow. The core tension was that teachers needed to feel in control, but over-specifying content killed the AI\'s ability to adapt. We called the solution "guardrails not gates" — teachers define topic scope and difficulty ceiling, the AI owns sequencing and question selection. We ran 4 rounds of teacher co-design sessions before finalizing. Drop-off in the quiz flow decreased 34%. What I took from it: when you\'re designing for AI, your job is often defining the contract between human intent and machine autonomy, not the experience itself.',
      },
      {
        questionId: 'q2',
        questionText: 'How do you think about the relationship between speed and discoverability in a productivity tool? Where do you draw the line?',
        userAnswer: 'I think speed is actually a form of trust. Users who feel the tool is fast trust it enough to explore. But discoverability can\'t depend on slowness — it needs to live in the margins. Command bar, progressive disclosure, contextual hints. Linear does this well.',
        scores: [
          { criterion: 'structure', level: 'strong', rationale: 'Clear position with supporting reasoning' },
          { criterion: 'specificity', level: 'moderate', rationale: 'Good conceptual answer but could cite specific examples from own work' },
          { criterion: 'relevance', level: 'strong', rationale: 'Directly answers the question and references Linear' },
          { criterion: 'communication', level: 'strong', rationale: 'Sharp and opinionated — good for a senior role interview' },
          { criterion: 'ai_fluency', level: 'moderate', rationale: 'Didn\'t touch on AI angle here, though question didn\'t require it' },
        ],
        whatWorked: 'The "speed as trust" framing is sharp and shows a designer who thinks in principles, not just patterns.',
        whatToImprove: 'Name a specific decision you made in your own work where this tension came up. Abstract answers are good; anchored ones are better.',
        sampleAnswer: 'Speed and discoverability feel like a tension, but I think they compound each other — users who trust the tool is fast are willing to explore it. So the question isn\'t "speed or discovery?" it\'s "how do we make discovery fast?" At Maze, we moved advanced filters from a settings panel into the canvas header because users were already hovering there. Discovery jumped 40% without any tutorial. The line I draw: if discoverability requires slowing down the happy path, it\'s in the wrong place.',
      },
      {
        questionId: 'q3',
        questionText: 'Tell me about a time you pushed back on a product decision. What happened?',
        userAnswer: 'Product wanted to add an onboarding checklist to the Maze dashboard. I argued it was the wrong moment — users arrived with a specific task in mind, not in learning mode. We ran a quick test with 8 users. 6 of them immediately dismissed the checklist without reading it. We shipped contextual tooltips instead, tied to first use of each feature.',
        scores: [
          { criterion: 'structure', level: 'strong', rationale: 'Clear setup, conflict, resolution, outcome' },
          { criterion: 'specificity', level: 'strong', rationale: 'Specific numbers, specific method, specific alternative' },
          { criterion: 'relevance', level: 'strong', rationale: 'Shows ability to advocate without ego, use evidence' },
          { criterion: 'communication', level: 'strong', rationale: 'Crisp narrative that shows judgment' },
          { criterion: 'ai_fluency', level: 'weak', rationale: 'No AI angle, but question didn\'t require one' },
        ],
        whatWorked: 'Strong use of evidence (8-user test) to move from opinion to data. Shows influence through research rather than authority.',
        whatToImprove: 'End with what you learned from the pattern, not just what you shipped. Senior designers reflect on process, not just outcomes.',
        sampleAnswer: 'Product wanted a checklist-style onboarding on the Maze dashboard. My read was that users arrive with a task — they\'re not in learning mode. I proposed we test it first: 8-user moderated session, half saw the checklist, half didn\'t. 6 of 8 in the checklist group dismissed it immediately. We shipped contextual tooltips triggered on first use instead. Retention at day 7 improved 12% in the next cohort. What I took from it: I was right about the diagnosis but I needed data to be heard — that\'s a healthy constraint.',
      },
      {
        questionId: 'q4',
        questionText: 'How are you integrating AI into your design process today — not as a feature, but as a tool?',
        userAnswer: 'I use Claude for early synthesis — pasting in user research transcripts and asking for patterns I might be missing. I also use it to stress-test design rationale: I describe a decision and ask it to steelman the opposing view. It\'s not about speed, it\'s about having a thinking partner at 11pm when no one else is available.',
        scores: [
          { criterion: 'structure', level: 'moderate', rationale: 'Two examples but could be better organized' },
          { criterion: 'specificity', level: 'strong', rationale: 'Specific use cases, specific tools, specific context' },
          { criterion: 'relevance', level: 'strong', rationale: 'Exactly what was asked — genuine personal practice' },
          { criterion: 'communication', level: 'strong', rationale: 'The "11pm" line is memorable and human' },
          { criterion: 'ai_fluency', level: 'strong', rationale: 'Shows nuanced understanding of AI as thinking partner, not just generator' },
        ],
        whatWorked: 'The specificity here is excellent. Using Claude to steelman opposing views shows sophisticated AI literacy — you\'re using it to think better, not just faster.',
        whatToImprove: 'Could add one more sentence on what you\'ve learned from AI-assisted synthesis that surprised you — shows genuine curiosity.',
        sampleAnswer: 'Two main ways. First, synthesis: I paste research transcripts into Claude and ask for patterns, then compare against my own read. It surfaces things I\'ve primed myself to miss. Second, I use it as a devil\'s advocate — I describe a design decision and ask it to argue against it. Not to change my mind automatically, but to make sure I can defend my reasoning. The honest truth: it\'s made me more rigorous because I know I\'ll have to respond to the steelman. That\'s changed how I document design rationale.',
      },
      {
        questionId: 'q5',
        questionText: "What does 'good AI UX' look like to you? Give me a concrete example from something you've shipped or that you admire.",
        userAnswer: 'Good AI UX is when the AI is working but you\'re not aware it\'s AI. The best example I\'ve seen recently is Notion AI summarize — it surfaces at the right moment, in context, without a modal or a sidebar. You\'re reading, it offers to help, you say yes, it disappears again.',
        scores: [
          { criterion: 'structure', level: 'moderate', rationale: 'Definition then example, but definition is thin' },
          { criterion: 'specificity', level: 'moderate', rationale: 'Notion AI is a fair example but generic — not from own work' },
          { criterion: 'relevance', level: 'strong', rationale: 'Directly answers the question' },
          { criterion: 'communication', level: 'moderate', rationale: 'Clear but not particularly sharp or opinionated' },
          { criterion: 'ai_fluency', level: 'moderate', rationale: 'Shows awareness but could go deeper into design principles' },
        ],
        whatWorked: 'The "invisible when it works" principle is correct and well-stated.',
        whatToImprove: 'You were asked for something you shipped — the Notion example is admired, not yours. Lead with your own work, even if it\'s imperfect. Interviewers at Linear will notice the dodge.',
        sampleAnswer: 'Good AI UX doesn\'t announce itself. At Yummylabs, our AI quiz generator had a "generating..." spinner for 3 seconds that users started associating with slowness, even when results were good. We removed the spinner and replaced it with a smooth transition into the first question. Confidence scores jumped 18% in post-session surveys. The lesson: AI latency is a design problem as much as an engineering one, and masking it well is a legitimate craft decision. From things I admire: Cursor\'s inline suggestions are great because they never interrupt — they appear where your cursor already is.',
      },
      {
        questionId: 'q6',
        questionText: 'How do you work with engineers who have strong opinions about UX?',
        userAnswer: 'I try to understand where their opinion comes from — usually it\'s either a technical constraint they haven\'t surfaced yet, or they\'ve seen the user pain firsthand and have a point. I treat eng opinions as unprocessed user research.',
        scores: [
          { criterion: 'structure', level: 'weak', rationale: 'Abstract and short — needs a story' },
          { criterion: 'specificity', level: 'weak', rationale: 'No example, no context, no outcome' },
          { criterion: 'relevance', level: 'strong', rationale: 'Addresses the question conceptually' },
          { criterion: 'communication', level: 'moderate', rationale: 'The "unprocessed user research" frame is interesting but underdeveloped' },
          { criterion: 'ai_fluency', level: 'weak', rationale: 'Not applicable to this question' },
        ],
        whatWorked: 'The "unprocessed user research" framing is genuinely insightful and could be the core of a strong answer.',
        whatToImprove: 'This answer needs a story. Tell me about a specific engineer, a specific disagreement, and how it resolved. Abstract frameworks without examples read as avoidance at senior level.',
        sampleAnswer: 'I treat engineer opinions as unprocessed user research — they\'ve often seen failure modes I haven\'t because they\'re closer to production. At Maze, an engineer pushed back hard on a multi-step filter interaction I designed. His argument was that the state management would be brittle and cause bugs. I heard "I don\'t like your design." He heard "she doesn\'t understand the system." We sat down together with the Figma file open and walked through what triggered each state change. Turns out his concern was valid — I had designed an impossible transition. We redesigned it together in 30 minutes. That\'s the best design collaboration I\'ve had: one where the engineer had to be heard before I could be heard.',
      },
      {
        questionId: 'q7',
        questionText: 'Describe your relationship with data in design decisions.',
        userAnswer: 'Data informs but doesn\'t decide. I use it to identify where something is broken, not to tell me what to fix. Analytics shows me the symptom; user research shows me the disease.',
        scores: [
          { criterion: 'structure', level: 'moderate', rationale: 'Position stated clearly but no example' },
          { criterion: 'specificity', level: 'weak', rationale: 'All principle, no example — needs grounding' },
          { criterion: 'relevance', level: 'strong', rationale: 'Directly answers the question' },
          { criterion: 'communication', level: 'strong', rationale: 'The symptom/disease metaphor is sharp and memorable' },
          { criterion: 'ai_fluency', level: 'weak', rationale: 'Missed opportunity to discuss AI-assisted data analysis' },
        ],
        whatWorked: 'Strong principle, well-expressed. The analytics/research distinction is mature.',
        whatToImprove: 'One concrete example would transform this from a principle into evidence of practice. "At Maze, I had a drop-off I couldn\'t explain in Mixpanel until I watched 5 recordings — then it was obvious."',
        sampleAnswer: 'Analytics tells me where something is broken; user research tells me why. I don\'t let them play each other\'s roles. At Maze, we had a 40% drop-off on step 3 of the block report builder. Mixpanel couldn\'t tell me why — the step looked fine in aggregate. I watched 8 session recordings and saw that users were trying to reorder blocks by dragging the block title, not the drag handle. We added a wider drag target and drop-off fell to 12%. Data found the problem; observation solved it.',
      },
      {
        questionId: 'q8',
        questionText: "What's a design pattern you think is broken in most productivity tools?",
        userAnswer: 'Notification systems. Most tools treat notifications as "things that happened" rather than "actions I need to take." So you end up with a feed that grows indefinitely and a badge count that means nothing. The best version I\'ve seen is Linear\'s own inbox — action-oriented, clears when done.',
        scores: [
          { criterion: 'structure', level: 'strong', rationale: 'Problem → diagnosis → example structure works well' },
          { criterion: 'specificity', level: 'strong', rationale: 'Named the pattern, the failure mode, and a counter-example' },
          { criterion: 'relevance', level: 'strong', rationale: 'Shows product taste and specific knowledge of Linear' },
          { criterion: 'communication', level: 'strong', rationale: 'Opinionated and well-reasoned — good for a senior role' },
          { criterion: 'ai_fluency', level: 'moderate', rationale: 'Could have mentioned AI-powered notification prioritization as an improvement vector' },
        ],
        whatWorked: 'Strong answer. Naming Linear\'s inbox specifically shows you\'ve done your homework and have genuine product taste. The "things that happened vs. actions to take" distinction is insightful.',
        whatToImprove: 'Minor: you could add one sentence on how you\'d approach fixing this as a design challenge — shows you think in solutions, not just diagnoses.',
        sampleAnswer: 'Notification systems are almost universally broken because they model "things that happened" instead of "things to do." That distinction sounds small but drives completely different information architecture — one optimizes for completeness, the other for resolution. You end up with a badge count that grows until users ignore it entirely. Linear\'s inbox is the best version I\'ve seen: every item has a clear action, closing it means resolving it, and the model is "zero is the goal." I\'d extend that pattern with AI-assisted prioritization — surface the two things that actually need me today, not everything that moved.',
      },
    ],
  },
  report: {
    overallImpressionLevel: 'moderate',
    overallImpressionSummary: 'Strong on strategic thinking and AI fluency, with some gaps in anchoring principles to specific work examples. Q1 and Q3 showed excellent evidence-based reasoning. Q6 and Q7 need stories to back up frameworks. You have the depth — the interview is about surfacing it.',
    generatedAt: new Date().toISOString(),
  },
}

async function run() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })

  async function shot(name, fn) {
    const page = await context.newPage()
    try {
      await fn(page)
      await page.waitForTimeout(800)
      await page.screenshot({ path: `${OUT}/${name}`, fullPage: false })
      console.log(`✅ ${name}`)
    } catch (e) {
      console.error(`❌ ${name}: ${e.message}`)
    } finally {
      await page.close()
    }
  }

  const seedSession = (page, data) =>
    page.evaluate((d) => sessionStorage.setItem('rehearse-session', JSON.stringify(d)), data)

  // 1. Home — default
  await shot('home-default.png', async (page) => {
    await page.goto(BASE, { waitUntil: 'networkidle' })
  })

  // 2. Home — returning user (mock verify endpoint)
  await shot('home-returning.png', async (page) => {
    await page.route('**/api/auth/verify*', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        email: 'f.ghnassia@gmail.com',
        sessions: [{
          slug: 'linear-hm-abc123',
          companyName: 'Linear',
          stage: 'hiring-manager',
          createdAt: new Date().toISOString(),
          score: 6.8,
          overallLevel: 'moderate',
          weakSpots: [],
          hasDebrief: false,
        }],
      }),
    }))
    // Navigate first so localStorage is accessible, then set token
    await page.goto(BASE, { waitUntil: 'domcontentloaded' })
    await page.evaluate(() => localStorage.setItem('rehearse_token', 'fake-token-12345'))
    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForTimeout(1500)
  })

  // 3. Setup — empty
  await shot('setup-empty.png', async (page) => {
    await page.goto(`${BASE}/setup`, { waitUntil: 'networkidle' })
  })

  // 4. Setup — filled (seed sessionStorage so form hydrates)
  await shot('setup-filled.png', async (page) => {
    await page.goto(BASE, { waitUntil: 'load' })
    await seedSession(page, { setup: SESSION_DATA.setup })
    await page.goto(`${BASE}/setup`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1200)
  })

  // 5. Confirm page
  await shot('confirm.png', async (page) => {
    await page.goto(BASE, { waitUntil: 'load' })
    await seedSession(page, { setup: SESSION_DATA.setup, context: SESSION_DATA.context })
    await page.goto(`${BASE}/confirm`, { waitUntil: 'networkidle' })
  })

  // 6. Research page
  await shot('research.png', async (page) => {
    await page.goto(BASE, { waitUntil: 'load' })
    await seedSession(page, {
      setup: SESSION_DATA.setup,
      context: SESSION_DATA.context,
      research: SESSION_DATA.research,
    })
    await page.goto(`${BASE}/research`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)
  })

  // 7. Simulation — persona card (ready phase)
  await shot('simulation-persona.png', async (page) => {
    await page.goto(BASE, { waitUntil: 'load' })
    await seedSession(page, {
      setup: SESSION_DATA.setup,
      context: SESSION_DATA.context,
      research: SESSION_DATA.research,
      simulation: SESSION_DATA.simulation,
    })
    await page.goto(`${BASE}/simulation`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)
  })

  // 8. Simulation — mid interview (need to click Begin)
  await shot('simulation-interview.png', async (page) => {
    await page.goto(BASE, { waitUntil: 'load' })
    await seedSession(page, {
      setup: SESSION_DATA.setup,
      context: SESSION_DATA.context,
      research: SESSION_DATA.research,
      simulation: SESSION_DATA.simulation,
    })
    await page.goto(`${BASE}/simulation`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(800)
    // Click the "Begin Interview" button
    const beginBtn = page.locator('button').filter({ hasText: /begin/i }).first()
    const hasbtn = await beginBtn.count()
    if (hasbtn > 0) {
      await beginBtn.click()
      await page.waitForTimeout(1500)
    }
  })

  // 9–11. Report pages — mock /api/report so no real API call needed
  const reportApiResponse = {
    evaluatedAnswers: SESSION_DATA.simulation.answers,
    overallImpressionLevel: SESSION_DATA.report.overallImpressionLevel,
    overallImpressionSummary: SESSION_DATA.report.overallImpressionSummary,
    generatedAt: SESSION_DATA.report.generatedAt,
  }
  const reportSeed = {
    setup: SESSION_DATA.setup,
    context: SESSION_DATA.context,
    research: SESSION_DATA.research,
    simulation: SESSION_DATA.simulation,
    report: SESSION_DATA.report,
  }

  const setupReport = async (page) => {
    await page.route('**/api/report', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(reportApiResponse),
    }))
    await page.goto(BASE, { waitUntil: 'load' })
    await seedSession(page, reportSeed)
    await page.goto(`${BASE}/report`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1200)
  }

  // 9. Report overview
  await shot('report-overview.png', async (page) => {
    await setupReport(page)
  })

  // 10. Report — question detail (click first question card)
  await shot('report-question-detail.png', async (page) => {
    await setupReport(page)
    // Click Q1 card in the grid
    const qCards = page.locator('button').filter({ hasText: /Q1/i })
    const cardCount = await qCards.count()
    if (cardCount > 0) {
      await qCards.first().click()
      await page.waitForTimeout(600)
    }
    // Try to open the sample answer accordion
    const accordion = page.locator('button').filter({ hasText: /see a stronger answer|sample answer/i }).first()
    const accCount = await accordion.count()
    if (accCount > 0) {
      await accordion.click()
      await page.waitForTimeout(400)
    }
    // Scroll to show the detail section
    await page.evaluate(() => {
      const el = document.querySelector('.border-t')
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' })
    })
    await page.waitForTimeout(300)
  })

  // 11. Report — save prompt (scroll to email input)
  await shot('report-save-prompt.png', async (page) => {
    await setupReport(page)
    await page.evaluate(() => {
      const inputs = document.querySelectorAll('input[type="email"]')
      if (inputs.length > 0) inputs[0].scrollIntoView({ behavior: 'instant', block: 'center' })
    })
    await page.waitForTimeout(400)
  })

  // 12. Sessions populated (demo mode)
  await shot('sessions-populated.png', async (page) => {
    await page.goto(`${BASE}/sessions?demo=true`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(800)
  })

  // 13. Compact view (morning-of) — mock the API
  await shot('compact-view.png', async (page) => {
    const savedSession = {
      slug: 'linear-hm-abc123',
      createdAt: new Date().toISOString(),
      setup: SESSION_DATA.setup,
      context: SESSION_DATA.context,
      simulation: { ...SESSION_DATA.simulation, answers: SESSION_DATA.simulation.answers },
      report: SESSION_DATA.report,
    }
    await page.route('**/api/sessions/linear-hm-abc123', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(savedSession),
    }))
    await page.goto(`${BASE}/r/linear-hm-abc123?compact=true`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)
  })

  await browser.close()
  console.log('\nAll screenshots saved to screenshots/')
}

run().catch(console.error)
