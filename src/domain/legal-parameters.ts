import type { Cents } from './money';

export interface ContributionRate {
  /** Rate in basis points: 1 bp = 0.01 %; 5.50 % = 550. */
  readonly basisPoints: number;
  readonly source: string;
}

export interface IncomeTaxBracket {
  /** Inclusive upper limit of the bracket in cents; `null` for the last, open-ended bracket. */
  readonly upperLimitCents: Cents | null;
  readonly rateBasisPoints: number;
}

export interface LegalParameters {
  readonly year: number;
  readonly sem: ContributionRate;
  readonly ivm: ContributionRate;
  readonly lpt: ContributionRate;
  readonly incomeTax: {
    readonly source: string;
    /** Ordered ascending; each bracket starts where the previous one ends (the first one starts at 0). */
    readonly brackets: readonly IncomeTaxBracket[];
  };
}

/** Legal rates and income tax brackets in force for 2026 (spec section 6). */
export const LEGAL_PARAMETERS_2026: LegalParameters = {
  year: 2026,
  sem: {
    basisPoints: 550,
    source: 'CCSS, Reglamento del Seguro de Salud',
  },
  ivm: {
    basisPoints: 433,
    source: 'CCSS, Reglamento del Seguro de IVM (graduated increase, from 2026-01-01)',
  },
  lpt: {
    basisPoints: 100,
    source: 'Ley 7983 (LPT) / Ley Orgánica del Banco Popular',
  },
  incomeTax: {
    source: 'Ministerio de Hacienda decree, 2026',
    brackets: [
      { upperLimitCents: 91_800_000n, rateBasisPoints: 0 },
      { upperLimitCents: 134_700_000n, rateBasisPoints: 1000 },
      { upperLimitCents: 236_400_000n, rateBasisPoints: 1500 },
      { upperLimitCents: 472_700_000n, rateBasisPoints: 2000 },
      { upperLimitCents: null, rateBasisPoints: 2500 },
    ],
  },
};

/** The single legal year in force (spec Q1). Changing it updates every calculation and the displayed year. */
export const CURRENT_LEGAL_PARAMETERS: LegalParameters = LEGAL_PARAMETERS_2026;
