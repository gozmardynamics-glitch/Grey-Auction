import { Injectable, Logger } from '@nestjs/common';

/**
 * Answer shapes returned by Jev (System One).
 *
 * The API returns one answer object per question id, discriminated by `type`.
 */
export interface NoulAnswer {
  type: 'noul';
  noul: number; // probability the statement is true (0–1)
}

export interface ChoiceAnswer {
  type: 'choice';
  choice: string;
  confidence: number;
  probabilities: Record<string, number>;
}

export interface ScoreAnswer {
  type: 'score';
  score: number;
  confidence: number;
  probabilities: Record<string, number>;
}

export type JevAnswer = NoulAnswer | ChoiceAnswer | ScoreAnswer;

export interface JevResponse {
  model: string;
  answers: Record<string, JevAnswer>;
  usage?: { input_tokens?: number; output_tokens?: number };
}

export type JevQuestion =
  | { type: 'noul'; instructions: string }
  | { type: 'choice'; instructions: string; criteria: Record<string, string> }
  | { type: 'score'; instructions: string; criteria: string[] };

const TYPESAFE_ENDPOINT = 'https://api.typesafe.ai/v1/systemone';
const DEFAULT_MODEL = 'jev-latest';
const REQUEST_TIMEOUT_MS = 20_000;

/**
 * Thin client for TypeSafe's Jev (System One) model.
 *
 * Jev returns typed judgments — probabilities and constrained choices — rather
 * than generated text, so callers can branch on the values directly instead of
 * parsing prose.
 *
 * Failure policy: this is an assistive service. When the key is missing or the
 * API errors, `evaluate` returns `null` and callers fall back to their
 * deterministic path. A moderation outage must never block a listing.
 */
@Injectable()
export class TypeSafeService {
  private readonly logger = new Logger(TypeSafeService.name);
  private readonly apiKey = process.env.TYPESAFE_API_KEY || '';
  private readonly model = process.env.TYPESAFE_MODEL || DEFAULT_MODEL;

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  /**
   * Send one state with any number of questions. All questions are evaluated
   * in parallel by Jev against the same state.
   */
  async evaluate(
    state: string | Record<string, unknown>,
    questions: Record<string, JevQuestion>,
  ): Promise<JevResponse | null> {
    if (!this.isConfigured()) return null;
    if (!state || Object.keys(questions).length === 0) return null;

    try {
      const res = await fetch(TYPESAFE_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ state, model: this.model, questions }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => 'unknown error');
        this.logger.warn(
          `TypeSafe ${res.status}: ${detail.slice(0, 200)}`,
        );
        return null;
      }

      const json = (await res.json()) as JevResponse;
      if (!json?.answers) {
        this.logger.warn('TypeSafe returned no answers');
        return null;
      }
      return json;
    } catch (error: any) {
      // Timeouts and network errors are expected and non-fatal.
      this.logger.warn(`TypeSafe request failed: ${error?.message ?? error}`);
      return null;
    }
  }

  /** Convenience: single yes/no probability. Returns null when unavailable. */
  async noul(
    state: string | Record<string, unknown>,
    instructions: string,
  ): Promise<number | null> {
    const res = await this.evaluate(state, {
      q: { type: 'noul', instructions },
    });
    const answer = res?.answers?.q;
    return answer && answer.type === 'noul' ? answer.noul : null;
  }
}
