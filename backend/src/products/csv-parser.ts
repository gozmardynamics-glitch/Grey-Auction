/**
 * Minimal RFC-4180-style CSV parser (handles quoted fields, commas inside
 * quotes and escaped double-quotes). Returns rows as string arrays.
 */
export function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < input.length; i += 1) {
    const c = input[i];

    if (inQuotes) {
      if (c === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }

    if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && input[i + 1] === '\n') i += 1;
      row.push(field);
      field = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }

  if (field !== '' || row.length > 0) {
    row.push(field);
    if (row.length > 1 || row[0] !== '') rows.push(row);
  }

  return rows;
}

/**
 * Convert parsed CSV rows (first row = headers) into objects.
 * Returns { data, errors } where data has the lowercased header keys.
 */
export function csvToObjects(
  rows: string[][],
): { data: Record<string, string>[]; errors: string[] } {
  if (rows.length < 2) {
    return {
      data: [],
      errors: ['CSV must contain a header row and at least one data row'],
    };
  }
  const headers = rows[0].map((h) => h.trim().toLowerCase());
  const required = ['title', 'starting_bid'];
  const missing = required.filter((r) => !headers.includes(r));
  if (missing.length > 0) {
    return {
      data: [],
      errors: [
        'Missing required columns: ' + missing.join(', ') +
        '. Required: ' + required.join(', '),
      ],
    };
  }
  const data: Record<string, string>[] = [];
  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    if (row.length === 1 && row[0] === '') continue;
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = (row[idx] ?? '').trim();
    });
    data.push(obj);
  }
  return { data, errors: [] };
}
