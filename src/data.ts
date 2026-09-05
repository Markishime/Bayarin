export const images = {
  welcome: require('../assets/reference-house.png'),
  auth: require('../assets/reference-companion.png'),
  avatar: require('../assets/reference-companion.png'),
  homeHero: require('../assets/reference-bills.png'),
};

export const providers = [
  { name: 'Meralco', mark: 'M', tone: 'orange' },
  { name: 'Maynilad', mark: 'W', tone: 'blue' },
  { name: 'PLDT', mark: 'P', tone: 'red' },
  { name: 'Globe', mark: 'G', tone: 'indigo' },
];

export const serviceIds = [
  'electricity',
  'water',
  'internet',
  'cable',
  'load',
  'government',
  'insurance',
  'other',
] as const;

export type ServiceId = typeof serviceIds[number];

export type ServiceProvider = {
  id: string;
  name: string;
  mark: string;
  tone: string;
  detail: string;
};

export type BillService = {
  id: Exclude<ServiceId, 'government'>;
  name: string;
  detail: string;
  providers: ServiceProvider[];
};

const provider = (id: string, name: string, mark: string, tone: string, detail: string): ServiceProvider => ({ id, name, mark, tone, detail });

// A practical national directory with an Other option for local providers.
export const billServices: Record<Exclude<ServiceId, 'government'>, BillService> = {
  electricity: { id: 'electricity', name: 'Electricity', detail: 'Choose your electric utility', providers: [
    provider('meralco', 'Meralco', 'M', 'orange', 'Metro Manila and nearby areas'),
    provider('veco', 'VECO', 'V', 'indigo', 'Visayan Electric Company'),
    provider('davao-light', 'Davao Light', 'D', 'blue', 'Davao electric utility'),
    provider('batelec', 'BATELEC', 'B', 'green', 'Batangas electric cooperative'),
    provider('electricity-other', 'Other electricity provider', '+', 'slate', 'Add your local utility'),
  ] },
  water: { id: 'water', name: 'Water', detail: 'Choose your water utility', providers: [
    provider('lwua', 'LWUA / local water district', 'L', 'blue', 'Local Water Utilities Administration'),
    provider('maynilad', 'Maynilad', 'M', 'blue', 'West Zone water utility'),
    provider('manila-water', 'Manila Water', 'W', 'indigo', 'East Zone water utility'),
    provider('mcwd', 'Metro Cebu Water District', 'C', 'blue', 'Cebu water utility'),
    provider('primewater', 'PrimeWater', 'P', 'green', 'Local water utility'),
    provider('water-other', 'Other water provider', '+', 'slate', 'Add your local water utility'),
  ] },
  internet: { id: 'internet', name: 'Internet', detail: 'Choose your home internet provider', providers: [
    provider('pldt', 'PLDT Home', 'P', 'red', 'Fiber and broadband'),
    provider('globe', 'Globe At Home', 'G', 'indigo', 'Fiber and broadband'),
    provider('converge', 'Converge', 'C', 'orange', 'Fiber internet'),
    provider('sky', 'SKY Fiber', 'S', 'blue', 'Fiber and cable internet'),
    provider('internet-other', 'Other internet provider', '+', 'slate', 'Add your local provider'),
  ] },
  cable: { id: 'cable', name: 'Cable & streaming', detail: 'Choose your TV provider', providers: [
    provider('cignal', 'Cignal', 'C', 'blue', 'Satellite television'),
    provider('sky-cable', 'SKY Cable', 'S', 'orange', 'Cable television'),
    provider('gsat', 'GSAT', 'G', 'red', 'Satellite television'),
    provider('cable-other', 'Other TV provider', '+', 'slate', 'Add your provider'),
  ] },
  load: { id: 'load', name: 'Mobile load', detail: 'Choose your mobile network', providers: [
    provider('smart', 'Smart', 'S', 'green', 'Prepaid and postpaid'),
    provider('globe-mobile', 'Globe', 'G', 'indigo', 'Prepaid and postpaid'),
    provider('dito', 'DITO', 'D', 'red', 'Prepaid and postpaid'),
    provider('tm', 'TM', 'T', 'blue', 'Prepaid mobile'),
  ] },
  insurance: { id: 'insurance', name: 'Insurance', detail: 'Choose your insurance provider', providers: [
    provider('axa', 'AXA Philippines', 'A', 'indigo', 'Life and health insurance'),
    provider('sun-life', 'Sun Life', 'S', 'orange', 'Life insurance'),
    provider('pru-life', 'Pru Life UK', 'P', 'red', 'Life insurance'),
    provider('insurance-other', 'Other insurer', '+', 'slate', 'Add your insurer'),
  ] },
  other: { id: 'other', name: 'Other bill', detail: 'Choose or add a provider', providers: [
    provider('other-provider', 'Other provider', '+', 'slate', 'Add any household bill'),
  ] },
};

export type GovernmentService = {
  id: string;
  name: string;
  mark: string;
  detail: string;
};

export const governmentServices: GovernmentService[] = [
  { id: 'sss', name: 'SSS Contribution', mark: 'S', detail: 'Social Security System' },
  { id: 'philhealth', name: 'PhilHealth Contribution', mark: 'P', detail: 'Philippine Health Insurance' },
  { id: 'pagibig', name: 'Pag-IBIG Contribution', mark: 'H', detail: 'Home Development Mutual Fund' },
  { id: 'bir', name: 'BIR Tax Payment', mark: 'B', detail: 'Bureau of Internal Revenue' },
  { id: 'lto', name: 'LTO Registration', mark: 'L', detail: 'Land Transportation Office' },
];

export const loads = [
  { mark: 'S', tone: 'green', name: 'SMART', number: '0919 ••• 4821', date: 'Sep 7', amount: '₱299' },
  { mark: 'G', tone: 'indigo', name: 'GLOBE', number: '0917 ••• 2068', date: 'Sep 15', amount: '₱99' },
  { mark: 'D', tone: 'red', name: 'DITO', number: '0991 ••• 1830', date: 'Sep 20', amount: '₱199' },
];

export const defaultOnboarding = {
  services: ['electricity', 'water', 'internet', 'load'],
  dueSoon: true,
  weeklySummary: true,
  loadReminders: true,
  lingkodDeadlines: true,
};

export function langToStored(lang: 'en' | 'tl' | 'ceb') {
  return lang === 'tl' ? 'Filipino' : lang === 'ceb' ? 'Cebuano' : 'English';
}

export function storedToLang(value: string | null | undefined): 'en' | 'tl' | 'ceb' {
  if (value === 'Tagalog' || value === 'Filipino') return 'tl';
  if (value === 'Cebuano') return 'ceb';
  return 'en';
}
