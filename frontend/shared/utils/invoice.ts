const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function downloadInvoicePdf(invoiceId: string): Promise<void> {
  const res = await fetch(`${apiBase}/invoices/${invoiceId}/pdf`);

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
