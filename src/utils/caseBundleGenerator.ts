import { Matter, TimelineEvent, MatterDocument } from '../types';

export function printCaseBundle(matter: Matter, timeline: TimelineEvent[], documents: MatterDocument[]) {
  const printWindow = window.open('', '_blank', 'width=900,height=1000');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Case Brief & Cause List Bundle - ${matter.suitNumber}</title>
        <style>
          body { font-family: 'Times New Roman', Times, serif; line-height: 1.5; color: #111; padding: 40px; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 25px; }
          .title { font-size: 22px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
          .subtitle { font-size: 16px; margin-top: 5px; font-style: italic; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px; }
          .box { border: 1px solid #333; padding: 12px; background: #fdfdfd; }
          .box-title { font-weight: bold; font-size: 13px; text-transform: uppercase; color: #444; margin-bottom: 6px; border-bottom: 1px solid #ddd; padding-bottom: 3px; }
          .value { font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 25px; }
          th, td { border: 1px solid #333; padding: 8px 12px; text-align: left; font-size: 13px; }
          th { background-color: #f0f0f0; font-weight: bold; text-transform: uppercase; }
          .section-heading { font-size: 16px; font-weight: bold; text-transform: uppercase; border-bottom: 1px dashed #333; padding-bottom: 4px; margin-top: 25px; margin-bottom: 10px; }
          .footer { margin-top: 40px; font-size: 11px; text-align: center; color: #666; border-top: 1px solid #ccc; padding-top: 10px; }
          @media print {
            body { padding: 20px; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div style="text-align: right; margin-bottom: 10px;">
          <button onclick="window.print()" style="padding: 8px 16px; font-size: 14px; cursor: pointer; background: #1a365d; color: white; border: none; border-radius: 4px;">Print / Save PDF</button>
        </div>

        <div class="header">
          <div class="title">IN THE ${matter.court.toUpperCase()}</div>
          <div class="subtitle">SUIT NO: ${matter.suitNumber}</div>
        </div>

        <div class="grid">
          <div class="box">
            <div class="box-title">CLAIMANT(S) / PLAINTIFF(S)</div>
            <div class="value">${matter.plaintiffs.join('<br>') || 'N/A'}</div>
          </div>
          <div class="box">
            <div class="box-title">DEFENDANT(S) / RESPONDENT(S)</div>
            <div class="value">${matter.defendants.join('<br>') || 'N/A'}</div>
          </div>
        </div>

        <div class="grid">
          <div class="box">
            <div class="box-title">PRESIDING JUDGE</div>
            <div class="value">${matter.judge || 'Not Assigned'}</div>
          </div>
          <div class="box">
            <div class="box-title">SUBJECT MATTER / PLOT NO.</div>
            <div class="value">${matter.plot || 'N/A'}</div>
          </div>
          <div class="box">
            <div class="box-title">LEAD LAWYER IN CHARGE</div>
            <div class="value">${matter.leadLawyerName || matter.leadLawyer}</div>
          </div>
          <div class="box">
            <div class="box-title">CURRENT STATUS</div>
            <div class="value"><strong>${matter.status.toUpperCase()}</strong></div>
          </div>
          <div class="box">
            <div class="box-title">FILING DATE</div>
            <div class="value">${matter.filingDate}</div>
          </div>
          <div class="box">
            <div class="box-title">NEXT HEARING DATE & PURPOSE</div>
            <div class="value"><strong>${matter.nextHearingDate || 'Unscheduled'}</strong> (${matter.purpose || 'N/A'})</div>
          </div>
        </div>

        <div class="section-heading">Case Overview & Summary</div>
        <p class="value" style="background: #fafafa; padding: 12px; border: 1px solid #ddd;">${matter.summaryNotes || 'No summary notes provided.'}</p>

        <div class="section-heading">Court Appearances & Timeline History</div>
        ${
          timeline && timeline.length > 0
            ? `
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Judge</th>
                <th>Purpose</th>
                <th>Appearances</th>
                <th>Summary / Ruling</th>
              </tr>
            </thead>
            <tbody>
              ${timeline
                .map(
                  t => `
                <tr>
                  <td>${t.date}</td>
                  <td>${t.type.toUpperCase()}</td>
                  <td>${t.judge || '-'}</td>
                  <td>${t.purpose || '-'}</td>
                  <td>${t.appearances || '-'}</td>
                  <td>${t.summary}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        `
            : '<p class="value" style="font-style: italic;">No recorded timeline events.</p>'
        }

        <div class="section-heading">Document Registry & Exhibits Index</div>
        ${
          documents && documents.length > 0
            ? `
          <table>
            <thead>
              <tr>
                <th>Doc Name</th>
                <th>Category</th>
                <th>Version</th>
                <th>Uploaded By</th>
                <th>Date Uploaded</th>
              </tr>
            </thead>
            <tbody>
              ${documents
                .map(
                  d => `
                <tr>
                  <td>${d.fileName}</td>
                  <td>${d.docType.toUpperCase()}</td>
                  <td>v${d.version}</td>
                  <td>${d.uploadedByName || d.uploadedBy}</td>
                  <td>${new Date(d.uploadedAt).toLocaleDateString()}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        `
            : '<p class="value" style="font-style: italic;">No uploaded documents in registry.</p>'
        }

        <div class="footer">
          Legal Proceedings Manager &bull; Confidential Case Brief &bull; Generated on ${new Date().toLocaleString()}
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
