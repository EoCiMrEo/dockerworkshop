import { format } from 'date-fns';

export const toLocalInputValue = (isoDate: string | null): string => {
  if (!isoDate) {
    return '';
  }

  const date = new Date(isoDate);
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
};

export const toUtcIso = (localDateValue: string): string => {
  if (!localDateValue) {
    return '';
  }

  return new Date(localDateValue).toISOString();
};

export const formatDueDate = (isoDate: string | null): string => {
  if (!isoDate) {
    return 'No due date';
  }

  return format(new Date(isoDate), 'MMM d, yyyy p');
};
