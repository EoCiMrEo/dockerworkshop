export const formatDueDate = (value: string | null): string => {
  if (!value) {
    return 'No due date';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Invalid due date';
  }

  return date.toLocaleString();
};

export const normalizeDueDateInput = (value: string): string | null => {
  if (!value.trim()) {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
};
