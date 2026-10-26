import { getApiBase } from '@/shared/utils/api-client';

/**
 * Download a buyer-authorized invoice PDF.
 *
 * `GET /invoices/:id/pdf` sits behind JwtAuthGuard, so the caller must pass
 * the session token — the old unauthenticated fetch always 401'd and the
 * download silently produced an error page instead of a PDF.
 */
export async function downloadInvoicePdf(invoiceId: string, token?: string | null): Promise<void> {
  const res = await fetch(`${getApiBase()}/invoices/${invoiceId}/pdf`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Failed to download invoice PDF (${res.status})`);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `invoice-${invoiceId}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
