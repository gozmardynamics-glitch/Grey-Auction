import { parseCsv, csvToObjects } from './csv-parser';

describe('csv-parser', () => {
  it('parses simple rows', () => {
    const rows = parseCsv('a,b\nc,d\n');
    expect(rows).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
  });

  it('handles quoted fields with commas and escaped quotes', () => {
    const rows = parseCsv('title,desc\n"MacBook, Pro","a ""great"" laptop"\n');
    expect(rows[1][0]).toBe('MacBook, Pro');
    expect(rows[1][1]).toBe('a "great" laptop');
  });

  it('handles CRLF line endings', () => {
    const rows = parseCsv('a,b\r\nc,d\r\n');
    expect(rows).toHaveLength(2);
    expect(rows[1]).toEqual(['c', 'd']);
  });

  it('converts rows to objects with lowercased headers', () => {
    const { data, errors } = csvToObjects([
      ['Title', 'Starting_Bid', 'Category'],
      ['Laptop', '5000', 'Electronics'],
      ['Chair', '2000', 'Furniture'],
    ]);
    expect(errors).toEqual([]);
    expect(data).toHaveLength(2);
    expect(data[0]).toEqual({
      title: 'Laptop',
      starting_bid: '5000',
      category: 'Electronics',
    });
  });

  it('reports missing required columns', () => {
    const { errors } = csvToObjects([
      ['Title'],
      ['Laptop'],
    ]);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('starting_bid');
  });

  it('rejects a header-only file', () => {
    const { data, errors } = csvToObjects([['title', 'starting_bid']]);
    expect(data).toEqual([]);
    expect(errors.length).toBeGreaterThan(0);
  });
});
