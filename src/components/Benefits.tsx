import { LockKeyhole, ReceiptText, Users } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { ServiceArt } from './Artwork';
import type { Palette } from '../theme';

export function Benefits({ c }: { c: Palette }) {
  const benefits = [
    { title: 'Organize bills', body: 'Tingnan ang lahat ng bayarin sa isang lugar.', art: <ReceiptText size={37} color={c.primary} /> },
    { title: 'Get reminders', body: 'Paalala bago dumating ang due date.', art: <ServiceArt kind="bell" size={48} /> },
    { title: 'Track payments', body: 'Tala at balikan ang mga nabayaran.', art: <ServiceArt kind="insurance" size={48} /> },
    { title: 'Pay your way', body: 'Magbayad sa iyong paboritong app o website.', art: <ServiceArt kind="load" size={48} /> },
    { title: 'Your data stays safe', body: 'Your data stays on your device and in your account.', art: <LockKeyhole size={39} color={c.primary} /> },
    { title: 'For every household', body: 'Para sa pamilyang Pilipino.', art: <Users size={42} color={c.primary} /> },
  ];
  return <View style={{ backgroundColor: c.surface, borderColor: c.border, borderWidth: 1, borderRadius: 22, padding: 18 }}>
    <Text style={{ color: c.primary, fontSize: 22, fontWeight: '600' }}>Bakit Bayarin?</Text>
    <Text style={{ color: c.textMuted, fontSize: 11, marginTop: 5, marginBottom: 16 }}>Your everyday payment organizer.</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>{benefits.map(item => <View key={item.title} style={{ width: '45%', flexGrow: 1, alignItems: 'center', gap: 8, paddingVertical: 12 }}><View style={{ height: 50, justifyContent: 'center' }}>{item.art}</View><Text style={{ color: c.primary, fontSize: 12, fontWeight: '600', textAlign: 'center' }}>{item.title}</Text><Text style={{ color: c.textMuted, fontSize: 11, lineHeight: 17, textAlign: 'center' }}>{item.body}</Text></View>)}</View>
  </View>;
}
