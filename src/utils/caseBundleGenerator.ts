import { Matter, TimelineEvent, MatterDocument } from '../types';

function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeJoin(values: string[], sep: string): string {
  return values.map(escapeHtml).join(sep);
}

export function generatePrintableBrief(
  matter: Matter, 
  timeline: TimelineEvent[] = [], 
  documents: MatterDocument[] = []
) {
  const printWindow = window.open('', '_blank', 'width=900,height=1000');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Case Brief - ${escapeHtml(matter.suitNumber)}</title>
        <style>
          body { font-family: 'Playfair Display', serif; line-height: 1.6; color: #1a1a1a; padding: 50px; background: #fff; }
          .header { text-align: center; border-bottom: 3px solid #1a365d; padding-bottom: 20px; margin-bottom: 30px; }
          .title { font-size: 26px; font-weight: bold; text-transform: uppercase; color: #1a365d; }
          .subtitle { font-size: 14px; color: #666; margin-top: 5px; text-transform: uppercase; letter-spacing: 1px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .box { border: 1px solid #e2e8f0; padding: 15px; background: #f8fafc; border-radius: 4px; }
          .box-title { font-weight: bold; font-size: 11px; text-transform: uppercase; color: #64748b; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
          .value { font-size: 14px; color: #1e293b; font-weight: 500; }
          .section-heading { font-size: 18px; font-weight: bold; text-transform: uppercase; color: #1a365d; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; margin-top: 30px; margin-bottom: 15px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; font-size: 12px; }
          th { background-color: #f1f5f9; color: #475569; font-weight: bold; text-transform: uppercase; }
          .footer { margin-top: 50px; font-size: 10px; text-align: center; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
          @media print { button { display: none; } body { padding: 0; } }
        </style>
      </head>
      <body>
        <div style="text-align: right; margin-bottom: 20px;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #1a365d; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
            Download as PDF / Print
          </button>
        </div>
        <div class="header">
          <div class="title">IN THE ${escapeHtml(matter.court.toUpperCase())}</div>
          <div class="subtitle">SUIT NO: ${escapeHtml(matter.suitNumber)}</div>
        </div>
        <div class="grid">
          <div class="box">
            <div class="box-title">Claimant / Plaintiff</div>
            <div class="value">${escapeJoin(matter.plaintiffs, '<br/>')}</div>
          </div>
          <div class="box">
            <div class="box-title">Respondent / Defendant</div>
            <div class="value">${escapeJoin(matter.defendants, '<br/>')}</div>
          </div>
          <div class="box">
            <div class="box-title">Presiding Judge</div>
            <div class="value">${escapeHtml(matter.judge) || 'Not Assigned'}</div>
          </div>
          <div class="box">
            <div class="box-title">Lead Counsel</div>
            <div class="value">${escapeHtml(matter.ownerName)}</div>
          </div>
        </div>
        <div class="section-heading">Brief Summary</div>
        <div class="value" style="padding: 15px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px;">
          ${escapeHtml(matter.summaryNotes) || 'No summary recorded.'}
        </div>
        <div class="footer">
          Generated via LEGALIA &bull; Confidential Legal Record &bull; ${new Date().toLocaleString()}
        </div>
      </body>
    </html>
  `;
  printWindow.document.write(html);
  printWindow.document.close();
}
