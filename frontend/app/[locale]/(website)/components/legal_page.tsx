import Link from 'next/link';
import { Card, CardContent } from '@/shared/components/common';
import { SERVER_API_BASE } from '@/lib/api-base';

const FALLBACKS: Record<string, { title: string; body: string }> = {
  terms: {
    title: 'Terms & Conditions',
    body: [
      'By accessing or using GreyAuction, you agree to these terms. Bidding is binding: when you win an auction you are obligated to complete the purchase at your final bid plus any applicable buyer premium, VAT and charges shown at checkout.',
      'All listings are provided by sellers. GreyAuction facilitates the auction; sellers are responsible for the accuracy of their descriptions and the condition of their items. Always inspect or request a condition report before bidding.',
      'Payments must be completed within the settlement window shown on your invoice. Failure to pay may result in suspension of your bidding privileges.',
      'We may update these terms from time to time. Continued use of the platform constitutes acceptance of the updated terms.',
    ].join('\n\n'),
  },
  'privacy-policy': {
    title: 'Privacy Policy',
    body: [
      'GreyAuction respects your privacy. We collect the information you provide when creating an account, placing bids, making purchases and communicating with sellers and support.',
      'We use this data to operate the platform, process payments and invoices, prevent fraud, and improve your experience. We do not sell your personal data.',
      'Cookies enable core features such as keeping you signed in and remembering your preferences. You can manage cookie preferences via the consent banner.',
      'You can request a copy or deletion of your personal data by contacting our support team.',
    ].join('\n\n'),
  },
  'data-protection': {
    title: 'Data Protection',
    body: [
      'This statement explains how GreyAuction meets its obligations under the Nigeria Data Protection Act 2023.',
      'It sets out the lawful basis for each activity, how each data subject right is handled, who processes data on our behalf, where data is transferred, how it is secured, and what happens in the event of a breach.',
    ].join('\n\n'),
  },
};

/** The other document in the pair, so each one can point at its counterpart. */
const SIBLINGS: Record<string, { slug: string; label: string }> = {
  'privacy-policy': { slug: 'data-protection', label: 'How we comply with the NDPA' },
  'data-protection': { slug: 'privacy-policy', label: 'What we do with your data' },
};

/* ─── A tiny markdown subset ────────────────────────────────────────────────
 * The policy text is authored in the admin editor, so it stays plain markdown:
 * headings, lists, tables, bold, italics and links. Rendering it here rather
 * than pulling in a parser keeps a legal page dependency-free — and a wall of
 * unbroken paragraphs is not a policy anyone can actually read. */

type Block =
  | { kind: 'h'; level: 2 | 3; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[] }
  | { kind: 'table'; head: string[]; rows: string[][] }
  | { kind: 'p'; text: string };

function parse(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let index = 0;

  const isTableRow = (line: string) => line.trim().startsWith('|') && line.trim().endsWith('|');
  const cells = (line: string) =>
    line.trim().slice(1, -1).split('|').map((cell) => cell.trim());

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (line.startsWith('### ')) {
      blocks.push({ kind: 'h', level: 3, text: line.slice(4).trim() });
      index += 1;
      continue;
    }
    if (line.startsWith('## ')) {
      blocks.push({ kind: 'h', level: 2, text: line.slice(3).trim() });
      index += 1;
      continue;
    }
    if (line.startsWith('# ')) {
      // The page title comes from the record; a leading H1 in the body is ignored.
      index += 1;
      continue;
    }

    if (isTableRow(line) && index + 1 < lines.length && /^\|[\s:|-]+\|$/.test(lines[index + 1].trim())) {
      const head = cells(line);
      index += 2; // skip the delimiter row
      const rows: string[][] = [];
      while (index < lines.length && isTableRow(lines[index])) {
        rows.push(cells(lines[index]));
        index += 1;
      }
      blocks.push({ kind: 'table', head, rows });
      continue;
    }

    if (/^\s*[-*] /.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\s*[-*] /.test(lines[index])) {
        items.push(lines[index].replace(/^\s*[-*] /, '').trim());
        index += 1;
      }
      blocks.push({ kind: 'ul', items });
      continue;
    }

    if (/^\s*\d+\. /.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\s*\d+\. /.test(lines[index])) {
        items.push(lines[index].replace(/^\s*\d+\. /, '').trim());
        index += 1;
      }
      blocks.push({ kind: 'ol', items });
      continue;
    }

    // Paragraph: consume until a blank line or the start of another block.
    const paragraph: string[] = [];
    while (
      index < lines.length &&
      lines[index].trim() &&
      !lines[index].startsWith('#') &&
      !/^\s*[-*] /.test(lines[index]) &&
      !/^\s*\d+\. /.test(lines[index]) &&
      !isTableRow(lines[index])
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    blocks.push({ kind: 'p', text: paragraph.join(' ') });
  }

  return blocks;
}

/** Inline formatting: **bold**, _italic_ and [text](/link). */
function inline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|_[^_]+_|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const token = match[0];

    if (token.startsWith('**')) {
      nodes.push(<strong key={match.index}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('_')) {
      nodes.push(<em key={match.index}>{token.slice(1, -1)}</em>);
    } else {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        const [, label, href] = linkMatch;
        nodes.push(
          href.startsWith('/') ? (
            <Link key={match.index} href={href} className="text-primary underline underline-offset-2">
              {label}
            </Link>
          ) : (
            <a
              key={match.index}
              href={href}
              className="text-primary underline underline-offset-2"
              rel="noreferrer noopener"
              target="_blank"
            >
              {label}
            </a>
          ),
        );
      } else {
        nodes.push(token);
      }
    }
    last = match.index + token.length;
  }

  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

/**
 * Public legal page rendered from the CMS content API (/content/:slug) with a
 * static fallback so the route never 404s.
 */
export default async function LegalPage({ slug }: { slug: string }) {
  const fallback = FALLBACKS[slug] ?? FALLBACKS.terms;
  let title = fallback.title;
  let markdown = fallback.body;

  try {
    // SERVER_API_BASE, not NEXT_PUBLIC_API_URL: the public variable is the
    // relative /api/proxy path, which fetch cannot resolve server-side — so this
    // page silently rendered its hardcoded fallback instead of the CMS page.
    const res = await fetch(SERVER_API_BASE + '/content/' + slug, { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      const page = json.data ?? json;
      if (page && page.title && page.content) {
        title = page.title;
        markdown = String(page.content);
      }
    }
  } catch {
    // Static fallback stays
  }

  const blocks = parse(markdown);
  const contents = blocks.filter((block): block is Extract<Block, { kind: 'h' }> => block.kind === 'h' && block.level === 2);
  const sibling = SIBLINGS[slug];
  // "Last updated" is authored as an italic line at the top of the document.
  const updated = blocks.find((block) => block.kind === 'p' && /^_Last updated/i.test(block.text));

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-3 text-3xl font-bold tracking-tight">{title}</h1>
      {updated && updated.kind === 'p' && (
        <p className="mb-6 text-sm text-muted-foreground">{inline(updated.text)}</p>
      )}

      {sibling && (
        <p className="mb-6 rounded-lg border border-border/60 bg-card px-4 py-3 text-sm">
          Related:{' '}
          <Link href={`/${sibling.slug}`} className="font-medium text-primary underline underline-offset-2">
            {sibling.label}
          </Link>
        </p>
      )}

      {/* Long policies need a table of contents, not just scrolling. */}
      {contents.length > 3 && (
        <nav className="mb-8 rounded-lg border border-border/60 bg-card p-4" aria-label="Contents">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            On this page
          </p>
          <ol className="grid gap-1 text-sm sm:grid-cols-2">
            {contents.map((heading, i) => (
              <li key={i}>
                <a href={`#section-${i + 1}`} className="text-muted-foreground hover:text-foreground">
                  {heading.text}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}

      <Card className="border border-border">
        <CardContent className="space-y-4 p-6 text-sm leading-relaxed text-muted-foreground md:p-8">
          {blocks.map((block, i) => {
            if (block.kind === 'h') {
              const sectionIndex = contents.indexOf(block);
              return block.level === 2 ? (
                <h2
                  key={i}
                  id={sectionIndex >= 0 ? `section-${sectionIndex + 1}` : undefined}
                  className="scroll-mt-24 pt-4 text-lg font-semibold text-foreground"
                >
                  {inline(block.text)}
                </h2>
              ) : (
                <h3 key={i} className="pt-2 text-base font-semibold text-foreground">
                  {inline(block.text)}
                </h3>
              );
            }
            if (block.kind === 'ul' || block.kind === 'ol') {
              const List = block.kind === 'ul' ? 'ul' : 'ol';
              return (
                <List
                  key={i}
                  className={`space-y-1.5 pl-5 ${block.kind === 'ul' ? 'list-disc' : 'list-decimal'}`}
                >
                  {block.items.map((item, j) => (
                    <li key={j}>{inline(item)}</li>
                  ))}
                </List>
              );
            }
            if (block.kind === 'table') {
              return (
                <div key={i} className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs sm:text-sm">
                    <thead>
                      <tr>
                        {block.head.map((cell, j) => (
                          <th key={j} className="border-b border-border px-2 py-2 font-semibold text-foreground">
                            {inline(cell)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {block.rows.map((row, j) => (
                        <tr key={j} className="align-top">
                          {row.map((cell, k) => (
                            <td key={k} className="border-b border-border/50 px-2 py-2">
                              {inline(cell)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            }
            return <p key={i}>{inline(block.text)}</p>;
          })}
        </CardContent>
      </Card>
    </div>
  );
}
