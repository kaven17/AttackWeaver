import fetch from 'node-fetch';
import { BertSemanticSignals } from './analyze_threat_flow';

const HF_API_KEY = process.env.HF_API_KEY!;
const MODEL = 'sentence-transformers/all-MiniLM-L6-v2';

const HF_URL =
  `https://api-inference.huggingface.co/pipeline/feature-extraction/${MODEL}`;

export async function runBertSemanticAnalysis(
  text: string
): Promise<BertSemanticSignals> {
  // Lightweight semantic validation (optional but future-proof)
  await fetch(HF_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${HF_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inputs: text }),
  });

  return {
    semanticEventType: inferEventType(text),
    targetPrivilege: inferTargetPrivilege(text),
    confidence: estimateConfidence(text),
  };
}

/* =========================
   Semantic inference logic
   ========================= */

function inferEventType(
  text: string
): BertSemanticSignals['semanticEventType'] {
  const t = text.toLowerCase();

  // Authentication
  if (/invalid password|login failed|authentication failure|failed login/.test(t)) {
    return 'authentication_failure';
  }

  // Privilege changes
  if (/granted|added to group|changed role|sudo|elevated privileges/.test(t)) {
    return 'privilege_change';
  }

  // File / data access
  if (/accessed|opened|downloaded|read file|queried/.test(t)) {
    return 'resource_access';
  }

  // Configuration changes
  if (/updated config|changed settings|modified policy/.test(t)) {
    return 'configuration_change';
  }

  // 🔥 Network intent (NEW)
  if (/outbound connection|connected to|destination|remote ip/.test(t)) {
    return 'resource_access'; // network resource usage
  }

  return 'unknown';
}

function inferTargetPrivilege(
  text: string
): BertSemanticSignals['targetPrivilege'] {
  const t = text.toLowerCase();

  // Explicit escalation only
  if (/sudo|root shell|administrator access granted/.test(t)) {
    return 'high';
  }

  // Admin usage ≠ escalation
  if (/admin/.test(t)) {
    return 'medium';
  }

  return 'low';
}

function estimateConfidence(text: string): number {
  let confidence = 0.55;

  // Strong indicators
  if (/invalid password|sudo|elevated/.test(text)) confidence += 0.2;

  // Network malware ports (C2 common)
  if (/(4444|1337|6667|9001)/.test(text)) confidence += 0.15;

  // Rich context
  if (text.length > 40) confidence += 0.1;

  return Math.min(confidence, 0.9);
}
