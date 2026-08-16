import { Question } from "./types";

type ScrapedQuestion = {
  url?: string;
  question_no?: string;
  question?: string;
  options?: Record<string, string>;
  discussion?: string[];
  most_voted?: string;
  community_answer?: string;
  vote_counts?: Record<string, number>;
};

const DB_NAME = "kumo-study";
const STORE = "question-banks";
const ACTIVE_KEY = "active";

const tagRules: Array<[string, RegExp]> = [
  ["Amazon S3", /\bS3\b|simple storage service|storage gateway/i],
  ["Amazon EC2", /\bEC2\b|elastic compute cloud|auto scaling|launch template/i],
  ["VPC & Networking", /\bVPC\b|subnet|route table|NAT gateway|transit gateway|direct connect|VPN|network ACL|security group/i],
  ["IAM & Organizations", /\bIAM\b|identity and access|organizations|permission boundary|service control polic|\bSCP\b/i],
  ["Databases", /\bRDS\b|Aurora|DynamoDB|ElastiCache|Neptune|DocumentDB|database/i],
  ["Serverless", /Lambda|API Gateway|Step Functions|Fargate|serverless/i],
  ["Messaging & Integration", /\bSQS\b|\bSNS\b|EventBridge|Kinesis|Amazon MQ/i],
  ["Security Services", /\bKMS\b|Secrets Manager|WAF|Shield|GuardDuty|Macie|Security Hub|Cognito/i],
  ["Monitoring & Governance", /CloudWatch|CloudTrail|AWS Config|Systems Manager|Trusted Advisor/i],
  ["Analytics", /Athena|Redshift|Glue|QuickSight|OpenSearch|Lake Formation|EMR/i],
  ["Containers", /\bECS\b|\bEKS\b|container|Kubernetes/i],
  ["Migration & Transfer", /DataSync|Migration Hub|DMS|Snowball|transfer family/i]
];

function meaningfulTags(prompt: string, choices: Array<{ text: string }>) {
  const text = `${prompt} ${choices.map(choice => choice.text).join(" ")}`;
  const domains: Array<[string, RegExp]> = [
    ["Security", /secure|security|encrypt|permission|access|credential|secret|compliance|identity|authentication/i],
    ["Resilience", /available|availability|resilien|fault.?toler|failover|disaster|recover|replica|multi.?az|backup/i],
    ["Performance", /performance|latency|throughput|scale|high.?speed|fast|accelerat|cache|iops|real.?time/i],
    ["Cost Optimization", /cost|least expensive|cost.?effective|savings|reserved instance|spot instance|archive/i]
  ];
  const domain = domains.find(([, pattern]) => pattern.test(text))?.[0] || "Architecture Design";
  return [domain, ...tagRules.filter(([, pattern]) => pattern.test(text)).map(([tag]) => tag).slice(0, 3)];
}

export function normalizeQuestionBank(input: unknown): Question[] {
  if (!Array.isArray(input)) throw new Error("The JSON root must be an array of questions.");
  const normalized = input.map((raw, index) => normalizeQuestion(raw as ScrapedQuestion | Question, index));
  const valid = normalized.filter((question): question is Question => question !== null);
  if (!valid.length) throw new Error("No valid questions were found in this file.");
  return valid;
}

/** Converts either scraper JSON or native crois.aws-prep JSON into the app schema. */
export function convertQuestionBankJson(json: string): Question[] {
  let parsed: unknown;
  try { parsed = JSON.parse(json); }
  catch { throw new Error("This file is not valid JSON. Check for a trailing comma or incomplete download."); }
  return normalizeQuestionBank(parsed);
}

function normalizeQuestion(raw: ScrapedQuestion | Question, index: number): Question | null {
  if (!raw || typeof raw !== "object") return null;
  if ("prompt" in raw && Array.isArray(raw.choices)) {
    if (!raw.prompt || !raw.choices.length || !raw.correctChoiceIds?.length) return null;
    const staleTags = raw.tags?.some(tag => tag === "Imported" || /^Topic \d+$/i.test(tag));
    return { ...raw, id: raw.id || `imported-${index + 1}`, examId: raw.examId || "aws-saa-c03", tags: staleTags ? meaningfulTags(raw.prompt, raw.choices) : raw.tags };
  }
  const scraped = raw as ScrapedQuestion;
  if (!scraped.question || !scraped.options || !scraped.most_voted) return null;
  const choices = Object.entries(scraped.options).map(([id, text]) => ({ id: id.toLowerCase(), text }));
  const asksForMultiple = /\((?:choose|select)\s+(?:two|three)\)|(?:choose|select)\s+(?:two|three)/i.test(scraped.question);
  const expected = /three/i.test(scraped.question) ? 3 : asksForMultiple ? 2 : 1;
  const discussed = scraped.discussion?.map(value => value.match(/Selected Answer:\s*([A-Z]{1,4})/i)?.[1]).find(value => value?.length === expected);
  const voteFallback = asksForMultiple && scraped.vote_counts
    ? Object.entries(scraped.vote_counts).sort((a, b) => b[1] - a[1]).slice(0, expected).map(([id]) => id).join("")
    : "";
  const answer = discussed || voteFallback || scraped.most_voted;
  const correctChoiceIds = [...new Set(answer.toLowerCase().split(""))].filter(id => choices.some(choice => choice.id === id));
  if (!correctChoiceIds.length) return null;
  const explanation = cleanDiscussion(scraped.discussion?.[0]) || scraped.community_answer || "Community answer only; no explanation was provided.";
  return {
    id: `imported-${index + 1}`,
    examId: "aws-saa-c03",
    prompt: scraped.question,
    choices,
    correctChoiceIds,
    explanation,
    tags: meaningfulTags(scraped.question, choices),
    multiple: correctChoiceIds.length > 1
  };
}

function cleanDiscussion(value?: string) {
  return value?.replace(/\s*upvoted\s+\d+\s+times.*$/i, "").trim() || "";
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveQuestionBank(questions: Question[]) {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE, "readwrite");
    transaction.objectStore(STORE).put(questions, ACTIVE_KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
}

export async function loadQuestionBank(): Promise<Question[] | null> {
  const db = await openDatabase();
  const result = await new Promise<Question[] | undefined>((resolve, reject) => {
    const request = db.transaction(STORE).objectStore(STORE).get(ACTIVE_KEY);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  db.close();
  if (!result) return null;
  const migrated = result.map((question, index) => normalizeQuestion(question, index)).filter((question): question is Question => question !== null);
  if (migrated.some((question, index) => question.tags.join("|") !== result[index]?.tags.join("|"))) await saveQuestionBank(migrated);
  return migrated;
}

export async function deleteQuestionBank() {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE, "readwrite");
    transaction.objectStore(STORE).delete(ACTIVE_KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
}
