# Assessment welcome page

This repository contains a static webpage for an online technical assessment flow in **QCM-only mode** (multiple-choice questions).

Candidates can:

- answer randomized QCM questions loaded from a local question bank (`questions.json`),
- complete the assessment within a 1h30 time limit,
- get an application score out of 10,
- generate integrity events used for evaluation,
- track attempts and average scores across multiple questions.

## Run locally

```bash
python3 -m http.server 4173
```

Then open <http://localhost:4173>.
