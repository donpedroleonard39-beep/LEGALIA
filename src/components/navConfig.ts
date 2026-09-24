import { Bell, CalendarClock, FolderOpen, Home, Settings, Users } from 'lucide-react';

// One source of truth for page names, so the sidebar, top bar and mobile
// tabs never disagree about what a page is called.
export const PAGES = {
  dashboard: { label: 'Home', icon: Home, description: 'What needs your attention' },
  matters: { label: 'Matters', icon: FolderOpen, description: 'All your cases' },
  reminders: { label: 'Hearings', icon: CalendarClock, description: 'Upcoming court dates and reminders' },
  collaborators: { label: 'People', icon: Users, description: 'Who can see your matters' },
  notifications: { label: 'Notifications', icon: Bell, description: 'Updates and invitations' },
  settings: { label: 'Settings', icon: Settings, description: 'Profile, appearance and emails' },
} as const;

export type PageId = keyof typeof PAGES;
export const MAIN_NAV: PageId[] = ['dashboard', 'matters', 'reminders', 'collaborators'];

export function initials(name?: string) {
  return (name || 'You')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'Y';
}
