import { Injectable, Logger } from '@nestjs/common';

/**
 * USD-based rate table, as returned by every provider below:
 * `rates[X]` = how many units of X one USD buys.
 */
export interface UsdRates {
  source: string;
  rates: Record<string, number>;
}

interface ForexProvider {
  name: string;
  fetchUsdRates(timeoutMs: number): Promise<UsdRates | null>;
}

/**
 * Primary: fawazahmed0/exchange-api — open source (MIT), no API key, no rate
 * limit, includes NGN. Served from jsDelivr, with the Cloudflare Pages host as
 * a second URL for the same data.
 */
const FAWAZ_URLS = [
  'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.min.json',
  'https://latest.currency-api.pages.dev/v1/currencies/usd.min.json',
];

/**
 * Fallback: open.er-api.com — free, keyless, includes NGN.
 *
 * Deliberately not Frankfurter (api.frankfurter.app): it is open source and
 * keyless, but it publishes ECB reference rates, which do not include NGN — the
 * platform's base currency — so it cannot drive these rates.
 */
const ER_API_URL = 'https://open.er-api.com/v6/latest/USD';

/**
 * ISO-4217 fiat allowlist.
 *
 * fawazahmed0's feed mixes fiat, crypto and commodity tickers in one map, which
 * breaks a fiat rate table two ways: crypto symbols overflow the 3-char code
 * column (`1INCH`), and 3-letter crypto tickers (BTC/ETH/ADA) would be stored
 * as if they were currencies. Filtering to this allowlist keeps the table purely
 * fiat, which is what "forex rate" means here.
 */
const FIAT_CODES = new Set(
  (
    'AED AFN ALL AMD ANG AOA ARS AUD AWG AZN BAM BBD BDT BGN BHD BIF BMD BND BOB ' +
    'BRL BSD BTN BWP BYN BZD CAD CDF CHF CLF CLP CNH CNY COP CRC CUP CVE CZK DJF ' +
    'DKK DOP DZD EGP ERN ETB EUR FJD FKP FOK GBP GEL GGP GHS GIP GMD GNF GTQ GYD ' +
    'HKD HNL HRK HTG HUF IDR ILS IMP INR IQD IRR ISK JEP JMD JOD JPY KES KGS KHR ' +
    'KID KMF KRW KWD KYD KZT LAK LBP LKR LRD LSL LYD MAD MDL MGA MKD MMK MNT MOP ' +
    'MRU MUR MVR MWK MXN MYR MZN NAD NGN NIO NOK NPR NZD OMR PAB PEN PGK PHP PKR ' +
    'PLN PYG QAR RON RSD RUB RWF SAR SBD SCR SDG SEK SGD SHP SLE SLL SOS SRD SSP ' +
    'STN SYP SZL THB TJS TMT TND TOP TRY TTD TVD TWD TZS UAH UGX USD UYU UZS VES ' +
    'VND VUV WST XAF XCD XCG XDR XOF XPF YER ZAR ZMW ZWG ZWL'
  ).split(' '),
);

/** Keeps only fiat codes, so nothing non-ISO or over-long reaches the DB. */
function toFiatOnly(raw: Record<string, number>): Record<string, number> {
  const rates: Record<string, number> = {};
  for (const [code, value] of Object.entries(raw)) {
    const upper = code.toUpperCase();
    const n = Number(value);
    if (!FIAT_CODES.has(upper)) continue;
    if (!Number.isFinite(n) || n <= 0) continue;
    rates[upper] = n;
  }
  return rates;
}

@Injectable()
export class ForexProviderService {
  private readonly logger = new Logger(ForexProviderService.name);

  private readonly providers: ForexProvider[] = [
    {
      name: 'fawazahmed0',
      fetchUsdRates: async (timeoutMs) => {
        for (const url of FAWAZ_URLS) {
          try {
            const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
            if (!res.ok) continue;
            const json = (await res.json()) as { usd?: Record<string, number> };
            if (json?.usd && typeof json.usd === 'object') {
              const rates = toFiatOnly(json.usd);
              if (Object.keys(rates).length > 0) {
                return { source: 'fawazahmed0', rates };
              }
            }
          } catch (error) {
            this.logger.debug(
              `${url} failed: ${(error as Error).message}`,
            );
          }
        }
        return null;
      },
    },
    {
      name: 'open.er-api.com',
      fetchUsdRates: async (timeoutMs) => {
        try {
          const res = await fetch(ER_API_URL, { signal: AbortSignal.timeout(timeoutMs) });
          if (!res.ok) return null;
          const json = (await res.json()) as {
            result?: string;
            rates?: Record<string, number>;
          };
          if (json?.result !== 'success' || !json.rates) return null;
          const rates = toFiatOnly(json.rates);
          return Object.keys(rates).length > 0
            ? { source: 'open.er-api.com', rates }
            : null;
        } catch (error) {
          this.logger.debug(
            `open.er-api.com failed: ${(error as Error).message}`,
          );
          return null;
        }
      },
    },
  ];

  /**
   * Tries each provider in order and returns the first usable USD rate table,
   * or null when every provider is unreachable. Never throws: exchange rates are
   * a soft dependency, and callers keep their last known values on null.
   */
  async getUsdRates(timeoutMs = 8000): Promise<UsdRates | null> {
    for (const provider of this.providers) {
      const result = await provider.fetchUsdRates(timeoutMs);
      if (result) {
        this.logger.log(`Forex rates from ${result.source}`);
        return result;
      }
      this.logger.warn(`Forex provider ${provider.name} unavailable, trying next`);
    }
    return null;
  }
}
