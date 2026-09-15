import { Linking } from 'react-native';

const sites: Record<string, string> = {
  meralco: 'https://online.meralco.com.ph/', maynilad: 'https://mywaterbill.mayniladwater.com.ph/',
  pldt: 'https://my.pldthome.com/', globe: 'https://www.globe.com.ph/', smart: 'https://smart.com.ph/',
  dito: 'https://dito.ph/', sss: 'https://www.sss.gov.ph/', philhealth: 'https://www.philhealth.gov.ph/',
  'pag-ibig': 'https://www.pagibigfund.gov.ph/', bir: 'https://www.bir.gov.ph/', lto: 'https://portal.lto.gov.ph/',
};
export function providerUrl(provider: string): string | null {
  const name = provider.toLowerCase().trim();
  const match = Object.keys(sites).find(key => name.includes(key));
  return match ? sites[match] : null;
}
export async function openPaymentDestination(method: string, provider = '') {
  const website = method === 'GCash' ? 'https://gcash.com/' : method === 'Maya' ? 'https://www.maya.ph/' : method === 'BPI' ? 'https://online.bpi.com.ph/' : providerUrl(provider);
  if (!website) throw new Error('Copy your bill details and use your bank or your provider’s official app.');
  const scheme = method === 'GCash' ? 'gcash://' : method === 'Maya' ? 'paymaya://' : null;
  if (scheme) {
    try { await Linking.openURL(scheme); return; } catch { /* Open the official website when the app is unavailable. */ }
  }
  await Linking.openURL(website);
}
