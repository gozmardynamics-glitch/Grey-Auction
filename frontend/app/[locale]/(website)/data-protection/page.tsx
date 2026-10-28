import LegalPage from '../components/legal_page';

/**
 * The NDPA accountability statement. Kept as its own page rather than a section
 * of the privacy policy: the policy tells a visitor what happens to their data,
 * this tells an auditor, a seller's compliance team or the Commission how we meet
 * the Act — lawful basis per activity, rights handling, processors, transfers,
 * security, breach procedure and registration.
 */
export default function DataProtectionPage() {
  return <LegalPage slug="data-protection" />;
}
