import { billStatus } from './bill-rules';
import { supabase } from '../lib/supabase';

export type DbBill = {
  id: string;
  user_id: string;
  household_id: string | null;
  provider: string;
  category: string;
  account_number: string | null;
  alias: string | null;
  amount: number;
  due_date: string;
  billing_period: string | null;
  recurrence: string;
  reminder_days: number;
  status: string;
  paid_at: string | null;
  payment_method: string | null;
  reference_number: string | null;
  paid_by: string | null;
  receipt_path?: string | null;
  created_at: string;
  updated_at: string;
};

export type DbActivityEvent = {
  id: string;
  user_id: string;
  household_id: string | null;
  bill_id: string | null;
  event_type: string;
  title: string;
  amount: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export async function fetchHouseholdBills(householdId: string): Promise<DbBill[]> {
  if (!supabase || !householdId) return [];
  const { data, error } = await supabase
    .from('bills')
    .select('*')
    .eq('household_id', householdId)
    .neq('status', 'archived')
    .order('due_date');
  if (error) throw new Error(error.message);
  if (!data) return [];
  return data as DbBill[];
}

export async function fetchHouseholdActivityEvents(householdId: string): Promise<DbActivityEvent[]> {
  if (!supabase || !householdId) return [];
  const { data, error } = await supabase
    .from('activity_events')
    .select('*')
    .eq('household_id', householdId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  if (!data) return [];
  return data as DbActivityEvent[];
}

function safeDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const d = new Date(`${dateStr}T00:00:00`);
  return isNaN(d.getTime()) ? new Date() : d;
}

export function formatBillDisplay(bill: DbBill) {
  const provider = String(bill.provider).toUpperCase();
  const status = billStatus(bill)
    .split('_')
    .map((w, i) => i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w)
    .join(' ');
  const tone =
    provider === 'MERALCO'
      ? 'orange'
      : provider === 'MAYNILAD'
        ? 'blue'
        : provider.startsWith('PLDT')
          ? 'red'
          : 'indigo';
  const dueDate = safeDate(bill.due_date);

  return {
    provider,
    category: String(bill.category),
    account: String(bill.account_number || '').slice(-4),
    due: new Intl.DateTimeFormat('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(dueDate),
    dueDateShort: new Intl.DateTimeFormat('en-PH', {
      month: 'short',
      day: 'numeric',
    }).format(dueDate),
    amount: new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(Number(bill.amount)),
    status,
    tone,
    paidBy: bill.paid_by || null,
    paidAt: bill.paid_at || null,
    paymentMethod: bill.payment_method || null,
    referenceNumber: bill.reference_number || null,
    billingPeriod: bill.billing_period || null,
    id: bill.id,
    rawAmount: Number(bill.amount),
  };
}

export async function markBillPaid(
  billId: string,
  householdId: string,
  paymentMethod: string,
  referenceNumber: string,
  paidBy: string,
  receiptPath?: string,
) {
  if (!supabase) throw new Error('Supabase not configured');
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('bills')
    .update({
      status: 'paid',
      paid_at: now,
      payment_method: paymentMethod,
      reference_number: referenceNumber,
      paid_by: paidBy,
      receipt_path: receiptPath,
    })
    .eq('id', billId)
    .eq('household_id', householdId).not('status', 'in', '(paid,archived)')
    .select('id').single();
  if (error || !data) throw new Error(error?.message || 'This bill has already been paid or is no longer available.');
  return now;
}

export async function createBillActivityEvent(
  userId: string,
  householdId: string,
  billId: string | null,
  eventType: string,
  title: string,
  amount?: number,
  metadata?: Record<string, unknown>,
) {
  if (!supabase) return;
  await supabase.from('activity_events').insert({
    user_id: userId,
    household_id: householdId,
    bill_id: billId,
    event_type: eventType,
    title,
    amount: amount || null,
    metadata: metadata || {},
  });
}

export async function getBillById(billId: string, householdId: string): Promise<DbBill | null> {
  if (!supabase || !householdId) return null;
  const { data, error } = await supabase
    .from('bills')
    .select('*')
    .eq('id', billId)
    .eq('household_id', householdId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return data as DbBill;
}
