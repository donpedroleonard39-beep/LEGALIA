import React from 'react';

interface DocketStampProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const COLOR: Record<string, string> = {
  active: 'docket-stamp-active',
  adjourned: 'docket-stamp-adjourned',
  won: 'docket-stamp-won',
  lost: 'docket-stamp-lost',
  closed: 'docket-stamp-closed',
};

export const DocketStamp: React.FC<DocketStampProps> = ({ status, size = 'sm', className = '' }) => {
  const key = (status || '').toLowerCase();
  const colorClass = COLOR[key] || 'docket-stamp-closed';
  const sizeClass = size === 'lg' ? 'docket-stamp-lg' : size === 'md' ? 'docket-stamp-md' : 'docket-stamp-sm';
  return <span className={`docket-stamp ${sizeClass} ${colorClass} ${className}`}>{status}</span>;
};
