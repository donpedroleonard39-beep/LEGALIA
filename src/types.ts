export type MatterPermission = 'owner' | 'editor' | 'viewer';

export type MatterStatus = 'active' | 'adjourned' | 'closed' | 'won' | 'lost';

export type TimelineEventType = 'hearing' | 'filing' | 'ruling' | 'note' | 'status_change';

export type DocumentType = 'pleading' | 'motion' | 'exhibit' | 'judgment' | 'affidavit' | 'correspondence' | 'other';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  matterAccess: string[]; // List of matterIds the user is granted access to
  notifyPrefs: {
    email: boolean;
    inApp: boolean;
    dailyDigest: boolean;
  };
  theme: 'light' | 'dark' | 'system';
  title?: string;
  organization?: string;
  createdAt?: string;
}

export interface Matter {
  id: string;
  suitNumber: string; // Unique index (e.g. E/968/2022)
  title: string;
  court: string;
  judge?: string; // Presiding Judge (e.g., Hon. Justice Ajah)
  plot?: string; // Plot / Property subject matter (e.g., S/10 Plot 33)
  plaintiffs: string[];
  defendants: string[];
  ownerId: string; // uid of the person who created (and permanently owns) this matter
  ownerName?: string;
  members: Record<string, MatterPermission>; // uid -> permission, owner always present as 'owner'
  status: MatterStatus;
  filingDate: string; // YYYY-MM-DD
  nextHearingDate?: string; // YYYY-MM-DD
  purpose?: string; // e.g. P.T.C, Hearing, Mention, Further Mention
  appearances?: string; // Record of legal representation
  summaryNotes?: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
}

export interface MatterDocument {
  id: string;
  matterId: string;
  fileName: string;
  storagePath: string; // Path in Firebase Storage, e.g. matters/{matterId}/{uid}_{fileName}
  downloadURL: string; // Firebase Storage download URL
  fileSize?: number; // Bytes
  fileType?: string;
  docType: DocumentType;
  uploadedBy: string;
  uploadedByName?: string;
  uploadedAt: string;
  version: number;
  description?: string;
}

export interface TimelineEvent {
  id: string;
  matterId: string;
  date: string; // YYYY-MM-DD
  type: TimelineEventType;
  summary: string;
  judge?: string;
  purpose?: string;
  appearances?: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
}

export interface MatterInvite {
  id: string;
  matterId: string;
  matterSuitNumber?: string;
  matterTitle?: string;
  email: string;
  invitedBy: string;
  invitedByName?: string;
  status: 'pending' | 'accepted' | 'declined';
  permission: MatterPermission; // 'editor' | 'viewer' (an invite can never grant 'owner')
  token: string; // opaque token embedded in the invite link, checked by Firestore rules on accept
  createdAt: string;
}

export interface Reminder {
  id: string;
  userId: string;
  matterId: string;
  suitNumber: string;
  remindAt: string; // ISO string
  message: string;
  channel: ('email' | 'inApp')[];
  fired: boolean;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  matterId?: string;
  suitNumber?: string;
  type: 'hearing_upcoming' | 'status_change' | 'document_added' | 'reminder' | 'invite' | 'system';
  message: string;
  read: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  matterId: string;
  action: string;
  details: string;
  performedBy: string;
  performedByName: string;
  timestamp: string;
}

export interface DeadlineCalculation {
  courtType: string;
  filingDate: string;
  statementOfClaimDue: string;
  defenseDue: string;
  replyDue: string;
  preTrialConferenceMaxDate: string;
  statutoryNotes: string[];
}
