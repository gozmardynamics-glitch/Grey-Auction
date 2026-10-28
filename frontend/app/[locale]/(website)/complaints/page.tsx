import LegalPage from '../components/legal_page';

/**
 * Complaints Policy. Public because a complainant is entitled to know the
 * process before they use it — and because the escalation route (internal review,
 * then FCCPC or the NDPC) is part of the promise, not a footnote.
 */
export default function ComplaintsPage() {
  return <LegalPage slug="complaints-policy" />;
}
