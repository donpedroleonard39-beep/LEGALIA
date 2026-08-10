import { DeadlineCalculation } from '../types';

export function calculateStatutoryDeadlines(courtType: string, filingDateStr: string): DeadlineCalculation {
  const filingDate = new Date(filingDateStr);
  
  if (isNaN(filingDate.getTime())) {
    const today = new Date().toISOString().split('T')[0];
    return calculateStatutoryDeadlines(courtType, today);
  }

  // Helper to add calendar days
  const addDays = (date: Date, days: number): string => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  if (courtType.toLowerCase().includes('federal')) {
    return {
      courtType: 'Federal High Court (Civil Procedure)',
      filingDate: filingDateStr,
      statementOfClaimDue: addDays(filingDate, 14),
      defenseDue: addDays(filingDate, 30),
      replyDue: addDays(filingDate, 44),
      preTrialConferenceMaxDate: addDays(filingDate, 60),
      statutoryNotes: [
        'Order 13 Rule 1: Defendant must file Memorandum of Appearance within 14 days of service.',
        'Order 13 Rule 4: Statement of Defense & Counterclaim due within 30 days of service.',
        'Order 18 Rule 2: Plaintiff Reply due within 14 days after service of Defense.',
        'Pre-Trial Conference notice must be issued within 14 days after close of pleadings.'
      ]
    };
  } else if (courtType.toLowerCase().includes('appeal')) {
    return {
      courtType: 'Court of Appeal Rules',
      filingDate: filingDateStr,
      statementOfClaimDue: addDays(filingDate, 60),
      defenseDue: addDays(filingDate, 105),
      replyDue: addDays(filingDate, 120),
      preTrialConferenceMaxDate: addDays(filingDate, 180),
      statutoryNotes: [
        'Order 6 Rule 2: Appellant’s Brief of Argument due within 60 days of record transmission.',
        'Order 6 Rule 4: Respondent’s Brief due within 45 days of Appellant Brief service.',
        'Order 6 Rule 5: Appellant Reply Brief due within 14 days of Respondent Brief service.',
        'Interlocutory appeal notice must be filed within 14 days of ruling.'
      ]
    };
  } else {
    // Default High Court Rules
    return {
      courtType: 'High Court Civil Procedure Rules',
      filingDate: filingDateStr,
      statementOfClaimDue: addDays(filingDate, 14),
      defenseDue: addDays(filingDate, 42),
      replyDue: addDays(filingDate, 56),
      preTrialConferenceMaxDate: addDays(filingDate, 90),
      statutoryNotes: [
        'Appearance to be entered within 14 days of service of Writ.',
        'Statement of Defense with Witness Statements due within 42 days.',
        'Claimant Reply due within 14 days of receipt of Defense.',
        'Pre-Trial Information Form (Form 17) to be issued within 14 days of close of pleadings.'
      ]
    };
  }
}
