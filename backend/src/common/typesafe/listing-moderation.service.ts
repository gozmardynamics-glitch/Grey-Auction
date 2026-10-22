import { Injectable, Logger } from '@nestjs/common';
import { TypeSafeService, JevQuestion } from './typesafe.service';

export type ModerationDecision = 'approve' | 'review' | 'reject';

export interface ModerationRuleResult {
  rule: string;
  label: string;
  probability: number;
  triggered: boolean;
}

export interface ModerationVerdict {
  /** True when Jev was actually consulted (false = service unavailable). */
  evaluated: boolean;
  decision: ModerationDecision;
  /** Highest per-rule probability seen, 0 when not evaluated. */
  maxProbability: number;
  rules: ModerationRuleResult[];
  model?: string;
}

interface Rule {
  id: string;
  label: string;
  instructions: string;
}

/**
 * Each rule is one atomic Noul question. They are evaluated in parallel against
 * the same listing state, then combined here in code — so thresholds and the
 * "any serious violation wins" policy stay tunable without touching prompts.
 */
const RULES: Rule[] = [
  {
    id: 'prohibited_goods',
    label: 'Prohibited goods',
    instructions:
      'The listing offers goods that a mainstream auction marketplace would prohibit: firearms or ammunition, controlled drugs, live animals or wildlife products, human remains, or stolen property.',
  },
  {
    id: 'counterfeit_risk',
    label: 'Counterfeit or replica risk',
    instructions:
      'The listing presents a branded or designer item as genuine while showing signs of being a counterfeit, replica, or unauthorized reproduction (for example implausibly low price, "inspired by" language, missing authentication, or grading claims that avoid verification).',
  },
  {
    id: 'misleading_claims',
    label: 'Misleading claims',
    instructions:
      'The listing makes concrete claims a buyer would rely on that are unverifiable or contradictory, such as invented certifications, fabricated provenance, or guarantees the seller cannot substantiate.',
  },
  {
    id: 'off_platform_dealing',
    label: 'Off-platform dealing',
    instructions:
      'The listing asks the buyer to transact outside the marketplace, for example by sharing a phone number, messaging handle, external payment link, or by soliciting direct contact before a sale.',
  },
  {
    id: 'stolen_or_untraceable',
    label: 'Stolen or untraceable goods',
    instructions:
      'The listing implies the item has no lawful provenance or is being sold to avoid records — for example serial numbers removed, "no questions asked", or cash-only disposal of serialized goods.',
  },
];

/** Any single rule at or above this probability blocks the listing. */
const REJECT_THRESHOLD = Number(process.env.MODERATION_REJECT_THRESHOLD ?? 0.85);
/** Any rule at or above this probability routes the listing to human review. */
const REVIEW_THRESHOLD = Number(process.env.MODERATION_REVIEW_THRESHOLD ?? 0.6);

/**
 * Listing moderation backed by TypeSafe Jev.
 *
 * Returns a verdict instead of a boolean so the admin UI can show *which* rule
 * fired and with what probability. When TypeSafe is unavailable the verdict is
 * `evaluated: false` and the decision defaults to `review` — a moderation
 * outage should slow listings down, never silently wave them through.
 */
@Injectable()
export class ListingModerationService {
  private readonly logger = new Logger(ListingModerationService.name);

  constructor(private readonly typeSafe: TypeSafeService) {}

  /** Build the state Jev judges: the listing as a buyer would see it. */
  private buildState(listing: {
    title: string;
    description?: string | null;
    category?: string | null;
    specifications?: Record<string, unknown> | null;
  }): Record<string, unknown> {
    return {
      listing: {
        title: listing.title,
        description: listing.description ?? '',
        category: listing.category ?? '',
        specifications: listing.specifications ?? {},
      },
    };
  }

  async moderateListing(listing: {
    title: string;
    description?: string | null;
    category?: string | null;
    specifications?: Record<string, unknown> | null;
  }): Promise<ModerationVerdict> {
    if (!this.typeSafe.isConfigured()) {
      return { evaluated: false, decision: 'review', maxProbability: 0, rules: [] };
    }

    const questions: Record<string, JevQuestion> = {};
    for (const rule of RULES) {
      questions[rule.id] = { type: 'noul', instructions: rule.instructions };
    }

    const response = await this.typeSafe.evaluate(this.buildState(listing), questions);

    if (!response) {
      return { evaluated: false, decision: 'review', maxProbability: 0, rules: [] };
    }

    const results: ModerationRuleResult[] = RULES.map((rule) => {
      const answer = response.answers[rule.id];
      const probability = answer && answer.type === 'noul' ? answer.noul : 0;
      return {
        rule: rule.id,
        label: rule.label,
        probability,
        triggered: probability >= REVIEW_THRESHOLD,
      };
    });

    const maxProbability = results.reduce((max, r) => Math.max(max, r.probability), 0);

    let decision: ModerationDecision = 'approve';
    if (maxProbability >= REJECT_THRESHOLD) decision = 'reject';
    else if (maxProbability >= REVIEW_THRESHOLD) decision = 'review';

    const fired = results.filter((r) => r.triggered);
    if (decision !== 'approve') {
      this.logger.log(
        `Listing "${listing.title}" → ${decision} (${fired
          .map((r) => `${r.rule}=${r.probability.toFixed(2)}`)
          .join(', ')})`,
      );
    }

    return {
      evaluated: true,
      decision,
      maxProbability,
      rules: results,
      model: response.model,
    };
  }
}
