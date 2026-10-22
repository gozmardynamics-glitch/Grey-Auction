import { ListingModerationService } from './listing-moderation.service';
import type { TypeSafeService, JevResponse } from './typesafe.service';

/** Minimal TypeSafeService double — only `isConfigured` and `evaluate` are used. */
function makeTypeSafe(
  opts: { configured?: boolean; response?: JevResponse | null },
): TypeSafeService {
  return {
    isConfigured: () => opts.configured ?? true,
    evaluate: jest.fn().mockResolvedValue(opts.response ?? null),
  } as unknown as TypeSafeService;
}

function nouls(values: Record<string, number>): JevResponse {
  const answers: JevResponse['answers'] = {};
  for (const [id, noul] of Object.entries(values)) {
    answers[id] = { type: 'noul', noul };
  }
  return { model: 'jev-test', answers };
}

const LISTING = {
  title: 'Certified pre-owned Rolex Submariner',
  description: 'Full box and papers. Serviced 2024. Serial intact.',
  category: 'watches',
  specifications: { brand: 'Rolex' },
};

describe('ListingModerationService', () => {
  it('approves a clean listing when every rule is below the review threshold', async () => {
    const service = new ListingModerationService(
      makeTypeSafe({
        response: nouls({
          prohibited_goods: 0.01,
          counterfeit_risk: 0.08,
          misleading_claims: 0.05,
          off_platform_dealing: 0.02,
          stolen_or_untraceable: 0.03,
        }),
      }),
    );

    const verdict = await service.moderateListing(LISTING);

    expect(verdict.evaluated).toBe(true);
    expect(verdict.decision).toBe('approve');
    expect(verdict.rules).toHaveLength(5);
    expect(verdict.rules.every((r) => !r.triggered)).toBe(true);
  });

  it('rejects when any single rule crosses the reject threshold', async () => {
    const service = new ListingModerationService(
      makeTypeSafe({
        response: nouls({
          prohibited_goods: 0.97,
          counterfeit_risk: 0.1,
          misleading_claims: 0.1,
          off_platform_dealing: 0.1,
          stolen_or_untraceable: 0.1,
        }),
      }),
    );

    const verdict = await service.moderateListing({
      title: 'Bulk ammunition, no questions asked',
      description: 'Cash only.',
      category: 'misc',
    });

    expect(verdict.decision).toBe('reject');
    expect(verdict.maxProbability).toBeCloseTo(0.97);
    const fired = verdict.rules.filter((r) => r.triggered).map((r) => r.rule);
    expect(fired).toContain('prohibited_goods');
  });

  it('routes to review when a rule is between the review and reject thresholds', async () => {
    const service = new ListingModerationService(
      makeTypeSafe({
        response: nouls({
          prohibited_goods: 0.05,
          counterfeit_risk: 0.72,
          misleading_claims: 0.2,
          off_platform_dealing: 0.1,
          stolen_or_untraceable: 0.1,
        }),
      }),
    );

    const verdict = await service.moderateListing(LISTING);

    expect(verdict.decision).toBe('review');
    expect(verdict.rules.find((r) => r.rule === 'counterfeit_risk')?.triggered).toBe(true);
  });

  it('fails safe to review when TypeSafe is not configured', async () => {
    const service = new ListingModerationService(
      makeTypeSafe({ configured: false }),
    );

    const verdict = await service.moderateListing(LISTING);

    expect(verdict.evaluated).toBe(false);
    expect(verdict.decision).toBe('review');
  });

  it('fails safe to review when the API returns nothing', async () => {
    const service = new ListingModerationService(makeTypeSafe({ response: null }));

    const verdict = await service.moderateListing(LISTING);

    expect(verdict.evaluated).toBe(false);
    expect(verdict.decision).toBe('review');
  });
});
