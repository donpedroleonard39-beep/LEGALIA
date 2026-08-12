import { Matter } from '../types';

/**
 * Escapes CSV field value properly according to RFC 4180
 */
export function escapeCsvField(value: string | number | boolean | undefined | null): string {
  if (value === null || value === undefined) return '""';
  const str = String(value);
  // Replace double quotes with escaped double quotes
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

/**
 * Generates CSV string and triggers browser download
 */
export function exportMattersToCsv(matters: Matter[], filenamePrefix: string = 'matters_export'): void {
  if (!matters || matters.length === 0) return;

  const headers = [
    'Suit Number',
    'Title',
    'Court',
    'Presiding Judge',
    'Plot / Property',
    'Plaintiff(s)',
    'Defendant(s)',
    'Lead Lawyer',
    'Filing Date',
    'Next Hearing Date',
    'Purpose',
    'Appearances',
    'Status',
    'Created At',
    'Summary Notes'
  ];

  const rows = matters.map(m => [
    escapeCsvField(m.suitNumber),
    escapeCsvField(m.title),
    escapeCsvField(m.court),
    escapeCsvField(m.judge || ''),
    escapeCsvField(m.plot || ''),
    escapeCsvField(m.plaintiffs ? m.plaintiffs.join('; ') : ''),
    escapeCsvField(m.defendants ? m.defendants.join('; ') : ''),
    escapeCsvField(m.ownerName || m.ownerId),
    escapeCsvField(m.filingDate),
    escapeCsvField(m.nextHearingDate || ''),
    escapeCsvField(m.purpose || ''),
    escapeCsvField(m.appearances || ''),
    escapeCsvField(m.status.toUpperCase()),
    escapeCsvField(new Date(m.createdAt).toLocaleDateString()),
    escapeCsvField(m.summaryNotes || '')
  ]);

  const csvContent = [
    headers.map(h => `"${h}"`).join(','),
    ...rows.map(r => r.join(','))
  ].join('\n');

  const today = new Date().toISOString().split('T')[0];
  const filename = `${filenamePrefix}_${today}.csv`;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
