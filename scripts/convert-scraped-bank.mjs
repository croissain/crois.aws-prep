import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const inputPath = process.argv[2];
const outputPath = process.argv[3] || "data/questions.json";
const examId = process.argv[4] || "aws-saa-c03";
const idPrefix = process.argv[5] || examId.replace(/^aws-/, "").split("-")[0];
if (!inputPath) throw new Error("Usage: node scripts/convert-scraped-bank.mjs <input.json> [output.json] [examId] [idPrefix]");

const input = JSON.parse(await readFile(inputPath, "utf8"));

const serviceRules = [
  ["Amazon S3", /\bS3\b|simple storage service|storage gateway/i],
  ["Amazon EC2", /\bEC2\b|elastic compute cloud|auto scaling group|launch template/i],
  ["VPC & Networking", /\bVPC\b|subnet|route table|NAT gateway|transit gateway|private link|direct connect|VPN|network ACL|security group/i],
  ["IAM & Organizations", /\bIAM\b|identity and access|organizations|control tower|permission boundary|service control polic|\bSCP\b/i],
  ["Databases", /\bRDS\b|Aurora|DynamoDB|ElastiCache|Neptune|DocumentDB|database/i],
  ["Load Balancing", /load balancer|\bALB\b|\bNLB\b|elastic load balancing/i],
  ["Serverless", /Lambda|API Gateway|Step Functions|Fargate|serverless/i],
  ["Messaging & Integration", /\bSQS\b|\bSNS\b|EventBridge|Kinesis|Amazon MQ|AppFlow/i],
  ["CloudFront & Edge", /CloudFront|Global Accelerator|edge location|Wavelength/i],
  ["Route 53", /Route 53|DNS|hosted zone/i],
  ["Monitoring & Governance", /CloudWatch|CloudTrail|AWS Config|Systems Manager|Trusted Advisor|Inspector/i],
  ["Security Services", /\bKMS\b|Secrets Manager|WAF|Shield|GuardDuty|Macie|Security Hub|Cognito|certificate manager|\bACM\b/i],
  ["Containers", /\bECS\b|\bEKS\b|container|Kubernetes|Docker/i],
  ["Analytics", /Athena|Redshift|Glue|QuickSight|OpenSearch|Lake Formation|EMR/i],
  ["Migration & Transfer", /DataSync|Migration Hub|Application Migration Service|DMS|Snowball|Snowcone|transfer family/i],
  ["Backup & Disaster Recovery", /AWS Backup|backup|disaster recovery|recovery point|recovery time|\bRPO\b|\bRTO\b/i]
];

function architecturalDomain(text) {
  const scores = [
    ["Security", /secure|security|encrypt|permission|access|credential|secret|certificate|firewall|attack|compliance|audit|identity|authentication|authorization/gi],
    ["Resilience", /available|availability|resilien|fault.?toler|failover|disaster|recover|replica|multi.?az|redundan|decoupl|durab|backup/gi],
    ["Performance", /performance|latency|throughput|scale|high.?speed|fast|accelerat|cache|iops|real.?time|query/gi],
    ["Cost Optimization", /cost|least expensive|cost.?effective|minimize.*cost|savings|reserved instance|spot instance|infrequent|archive/gi]
  ].map(([name, pattern]) => [name, (text.match(pattern) || []).length]);
  scores.sort((a, b) => b[1] - a[1]);
  return scores[0][1] ? scores[0][0] : "Architecture Design";
}

function tagsFor(question, options) {
  const text = `${question} ${Object.values(options).join(" ")}`;
  const services = serviceRules.filter(([, pattern]) => pattern.test(text)).map(([name]) => name).slice(0, 3);
  return [architecturalDomain(text), ...services].filter((tag, index, tags) => tags.indexOf(tag) === index);
}

function cleanExplanation(item) {
  const selected = item.discussion?.find(value => /Selected Answer:|Answer:/i.test(value)) || item.discussion?.[0] || "";
  const cleaned = selected
    .replace(/\s*upvoted\s+\d+\s+times[\s\S]*$/i, "")
    .replace(/^Selected Answer:\s*[A-Z]+\s*/i, "")
    .replace(/^Answer:\s*[A-Z]+\s*/i, "")
    .trim();
  return cleaned || item.community_answer || "The community-selected answer is shown above. Verify the reasoning against current AWS documentation.";
}

function answerIds(item, choices) {
  const asksForMultiple = /\((?:choose|select)\s+(?:two|three)\)|(?:choose|select)\s+(?:two|three)|which\s+(?:two|three)\b/i.test(item.question || "");
  const expected = /three/i.test(item.question || "") ? 3 : asksForMultiple ? 2 : 1;
  const discussed = (item.discussion || [])
    .map(value => value.match(/Selected Answer:\s*([A-Z]{1,4})/i)?.[1])
    .find(value => value && value.length === expected);
  const voteFallback = asksForMultiple && item.vote_counts
    ? Object.entries(item.vote_counts).sort((a, b) => b[1] - a[1]).slice(0, expected).map(([id]) => id).join("")
    : "";
  const raw = discussed || voteFallback || String(item.most_voted || "");
  return [...new Set(raw.toLowerCase().split(""))].filter(id => choices.some(choice => choice.id === id));
}

const questions = input.map((item, index) => {
  const choices = Object.entries(item.options || {}).map(([id, text]) => ({ id: id.toLowerCase(), text }));
  const correctChoiceIds = answerIds(item, choices);
  if (!item.question || choices.length < 2 || !correctChoiceIds.length) return null;
  return {
    id: `${idPrefix}-${String(index + 1).padStart(4, "0")}`,
    examId,
    prompt: item.question.trim(),
    choices,
    correctChoiceIds,
    explanation: cleanExplanation(item),
    tags: tagsFor(item.question, item.options),
    multiple: correctChoiceIds.length > 1
  };
}).filter(Boolean);

await writeFile(outputPath, `${JSON.stringify(questions, null, 2)}\n`);
console.log(`Converted ${questions.length} questions to ${path.resolve(outputPath)}`);
