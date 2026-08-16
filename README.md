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

The included questions are original examples for development and are not official AWS exam questions.
