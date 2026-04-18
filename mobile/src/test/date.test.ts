import { formatDueDate, normalizeDueDateInput } from '../utils/date';

describe('date utils', () => {
  it('normalizes valid date input to ISO string', () => {
    const output = normalizeDueDateInput('2026-04-20T13:30');

    expect(output).toContain('2026-04-20');
  });

  it('returns fallback text for empty due date', () => {
    expect(formatDueDate(null)).toBe('No due date');
  });
});
