export function localDateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  return Number.isFinite(date.getTime()) && localDateKey(date) === value;
}

export function validAmount(value: string): boolean {
  return /^\d+(\.\d{1,2})?$/.test(value.trim()) && Number(value) > 0 && Number(value) < 10000000000;
}

export function billStatus(bill: { status: string; due_date: string; reminder_days: number }, now = new Date()): string {
  if (['paid', 'archived', 'draft'].includes(bill.status)) return bill.status;
  const today = localDateKey(now);
  if (bill.due_date < today) return 'overdue';
  const window = new Date(`${today}T12:00:00`);
  window.setDate(window.getDate() + (bill.reminder_days ?? 5));
  return bill.due_date <= localDateKey(window) ? 'due_soon' : 'upcoming';
}

export function householdSummary<T extends { status: string; due_date: string; reminder_days: number; amount: number; paid_at: string | null }>(bills: T[], now = new Date()) {
  const month = localDateKey(now).slice(0, 7);
  const unpaid = bills.filter(b => !['paid', 'draft', 'archived'].includes(b.status) && b.due_date.startsWith(month));
  const paid = bills.filter(b => b.status === 'paid' && b.paid_at && localDateKey(new Date(b.paid_at)).startsWith(month));
  return {
    unpaid, paid,
    unpaidAmount: unpaid.reduce((sum, b) => sum + Number(b.amount), 0),
    paidAmount: paid.reduce((sum, b) => sum + Number(b.amount), 0),
    dueSoonCount: bills.filter(b => billStatus(b, now) === 'due_soon').length,
  };
}
