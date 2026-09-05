import { useId } from 'react';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Stop } from 'react-native-svg';

export function ProviderArt({ provider, size }: { provider: string; size: number }) {
  const id = useId();
  return <Svg width={size} height={size} viewBox="0 0 64 64">
    <Defs><LinearGradient id={id} x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor={provider === 'meralco' ? '#FFA84A' : provider === 'pldt' ? '#F66669' : '#47C9FF'} /><Stop offset="1" stopColor={provider === 'meralco' ? '#FF5D16' : provider === 'pldt' ? '#B60923' : '#0723CF'} /></LinearGradient></Defs>
    {provider === 'meralco' && <><Circle cx="32" cy="32" r="28" fill={`url(#${id})`} /><Path d="M10 48 31 8h12L23 46h7l9-17 7 1-8 17h8l10-22 1 19-8 11H31l5-10h-8l-6 10H10Z" fill="white" /><Path d="m26 32 8-7-2 8h-5" fill="white" /></>}
    {provider === 'maynilad' && <><Circle cx="32" cy="32" r="27" fill={`url(#${id})`} stroke="#B3D3F5" /><Path d="m9 42 11-24h10l-2 24 17-25h10l-8 29h-8l5-16-13 20h-9l1-20-8 16Z" fill="white" /><Path d="M8 46Q24 63 51 38Q41 58 25 58Q14 57 8 46" fill="#22BC81" /></>}
    {provider === 'pldt' && <><Path d="M27 7Q33 3 39 11L58 43Q62 51 53 54H17Q5 54 10 43Z" fill="#D9DDE5" /><Path d="M27 7Q32 3 38 10l8 15Q34 24 22 41L10 49Q7 46 12 37Z" fill={`url(#${id})`} /><Path d="m38 10 20 34q3 7-3 10L39 48q12-9 7-23Z" fill="#930D22" /><Path d="M10 48q17-10 33-2l12 8H17q-8 0-7-6" fill="#B7BDC9" /></>}
    {provider === 'globe' && <><Circle cx="32" cy="32" r="28" fill="#071DC7" /><G stroke="#F4F7FF" fill="none" strokeWidth="2.7"><Ellipse cx="32" cy="32" rx="13" ry="25" transform="rotate(-30 32 32)" /><Ellipse cx="32" cy="32" rx="24" ry="11" transform="rotate(35 32 32)" /></G>{[[18,14],[42,18],[12,32],[29,24],[47,40],[30,50],[25,39]].map(([x,y], i) => <Circle key={i} cx={x} cy={y} r="3.3" fill="white" />)}</>}
  </Svg>;
}
