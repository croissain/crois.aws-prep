# crois.aws-prep

AWS certification practice app built with Next.js and Tailwind CSS.

## Development

```bash
npm install
npm run dev
```

## Adding exams and questions

- Add an exam definition to `data/exams.json`.
- Add questions to `data/questions.json` using the same `examId`.
- Questions support single or multiple correct choices through `correctChoiceIds`.
- Add fixed practice tests to `data/presets.json`. Each preset has an `examId`, a `name`, a `source` and its own ordered `questions`; they appear as question sets on the mock exam setup screen and are also included in practice mode.

The included questions are original examples for development and are not official AWS exam questions.
