import React from 'react';

interface DocketStampProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const DocketStamp: React.FC<DocketStampProps> = ({ status, size = 'sm', className = '' }) => {
  const normStatus = (status || '').toLowerCase();

  let colorClass = 'docket-stamp-active';
  if (normStatus.includes('won') || normStatus.includes('judgment') || normStatus.includes('granted') || normStatus.includes('active')) {
    colorClass = normStatus.includes('won') || normStatus.includes('judgment') || normStatus.includes('granted') ? 'docket-stamp-won' : 'docket-stamp-active';
  } else if (normStatus.includes('adjourned') || normStatus.includes('pending') || normStatus.includes('notice')) {
    colorClass = 'docket-stamp-adjourned';
  } else if (normStatus.includes('lost') || normStatus.includes('urgent') || normStatus.includes('overdue') || normStatus.includes('dismissed')) {
    colorClass = 'docket-stamp-lost';
  }

  const sizeClass = size === 'lg' ? 'docket-stamp-lg' : size === 'md' ? 'docket-stamp-md' : 'docket-stamp-sm';

  return (
    <span className={`docket-stamp ${sizeClass} ${colorClass} ${className}`}>
      {status}
    </span>
  );
};
