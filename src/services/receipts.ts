import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '../lib/supabase';

export type Receipt = DocumentPicker.DocumentPickerAsset;
export async function chooseReceipt(): Promise<Receipt | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: ['image/jpeg', 'image/png', 'application/pdf'], copyToCacheDirectory: true, multiple: false });
  if (result.canceled) return null;
  const file = result.assets[0];
  if (!file.size || file.size > 10 * 1024 * 1024) throw new Error('Choose a JPG, PNG, or PDF receipt under 10 MB.');
  return file;
}
export async function uploadReceipt(file: Receipt, householdId: string, billId: string): Promise<string> {
  if (!supabase) throw new Error('Sign in to attach a receipt.');
  const ext = file.mimeType === 'application/pdf' ? 'pdf' : file.mimeType === 'image/png' ? 'png' : 'jpg';
  const path = `${householdId}/${billId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const response = await fetch(file.uri);
  const buffer = await response.arrayBuffer();
  if (!buffer.byteLength || buffer.byteLength > 10 * 1024 * 1024) throw new Error('Receipt must be under 10 MB.');
  const { error } = await supabase.storage.from('receipts').upload(path, buffer, { contentType: file.mimeType || 'image/jpeg', upsert: false });
  if (error) throw new Error(error.message);
  return path;
}
export async function receiptUrl(path: string): Promise<string> {
  if (!supabase) throw new Error('Sign in to view your receipt.');
  const { data, error } = await supabase.storage.from('receipts').createSignedUrl(path, 300);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}
