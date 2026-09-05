import { useId } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

export function RibbonMark({ size = 80 }: { size?: number }) {
  const id = useId();
  return <Svg width={size} height={size} viewBox="0 0 88 96">
    <Defs><LinearGradient id={id} x1="0" y1="0" x2="0.3" y2="1"><Stop offset="0" stopColor="#39C6FF" /><Stop offset=".32" stopColor="#3357FF" /><Stop offset=".59" stopColor="#7625FF" /><Stop offset="1" stopColor="#FF3F84" /></LinearGradient></Defs>
    <Path d="M12 26 Q13 8 32 8 H61 Q78 8 78 29 Q78 42 67 47 Q81 51 81 67 Q81 88 60 89 H13 V75 Q13 71 18 71 H56 Q63 71 63 64 Q63 57 55 57 H13 V42 H54 Q61 42 61 34 Q61 27 54 27 H12Z" fill="#081B80" transform="translate(1 3)" />
    <Path d="M12 26 Q13 8 32 8 H61 Q78 8 78 29 Q78 42 67 47 Q81 51 81 67 Q81 88 60 89 H13 V75 Q13 71 18 71 H56 Q63 71 63 64 Q63 57 55 57 H13 V42 H54 Q61 42 61 34 Q61 27 54 27 H12Z" fill={`url(#${id})`} stroke="#ACB7FF" strokeWidth=".8" />
    <Path d="M14 24 Q15 10 33 10 H61" fill="none" stroke="#C6EDFF" strokeWidth="1.2" />
  </Svg>;
}

export function ServiceArt({ kind, size = 38 }: { kind: string; size?: number }) {
  const id = useId();
  const gold = kind === 'electricity' || kind === 'bell';
  const green = kind === 'check';
  return <Svg width={size} height={size} viewBox="0 0 64 64">
    <Defs><LinearGradient id={id} x1="0" y1="0" x2=".85" y2="1"><Stop offset="0" stopColor={gold ? '#FFF1A5' : green ? '#A8F99F' : '#75DFFF'} /><Stop offset=".45" stopColor={gold ? '#FFBC25' : green ? '#50D575' : '#235AFF'} /><Stop offset="1" stopColor={gold ? '#F57900' : green ? '#159345' : '#3510E9'} /></LinearGradient></Defs>
    <Ellipse cx="32" cy="57" rx="17" ry="3" fill={gold ? '#F7B534' : '#7662F0'} opacity=".15" />
    <G fill={`url(#${id})`} stroke={gold ? '#FFD878' : '#A7B9FF'} strokeWidth="1">
      {kind === 'electricity' && <Path d="M35 4 15 33 Q14 36 18 36 H29 L25 57 Q25 61 29 56 L49 26 Q50 23 46 23 H35 L39 7 Q40 3 35 4Z" />}
      {kind === 'water' && <><Path d="M32 5C26 19 16 29 16 39a16 16 0 0 0 32 0C48 29 38 17 32 5Z" /><Path d="M23 35Q19 46 28 49" fill="none" stroke="#C9F1FF" strokeWidth="3" strokeLinecap="round" /></>}
      {kind === 'internet' && <G fill="none" stroke={`url(#${id})`} strokeWidth="7" strokeLinecap="round"><Path d="M8 22Q32 3 56 22M16 32Q32 18 48 32M25 42Q32 35 39 42" /><Circle cx="32" cy="51" r="3.5" fill={`url(#${id})`} stroke="none" /></G>}
      {kind === 'cable' && <><Rect x="7" y="11" width="50" height="36" rx="6" /><Rect x="12" y="16" width="40" height="26" rx="2" fill="#2D3CFF" /><Path d="M29 47v7H19v3h27v-3H35v-7" /></>}
      {kind === 'load' && <><Rect x="17" y="5" width="30" height="53" rx="6" /><Rect x="22" y="10" width="20" height="36" rx="2" fill="#DDF5FF" /><Circle cx="32" cy="52" r="2" fill="white" /></>}
      {kind === 'government' && <><Path d="M5 22 32 5 59 22Z" /><Rect x="8" y="24" width="48" height="5" rx="1" /><Path d="M13 30h7v20h-7zm15 0h7v20h-7zm15 0h7v20h-7z" /><Rect x="6" y="51" width="52" height="6" rx="2" /></>}
      {kind === 'insurance' && <><Path d="M32 4Q43 11 54 12L52 34Q49 48 32 59Q15 48 12 34L10 12Q22 11 32 4Z" /><Path d="M23 30l7 8 13-15" fill="none" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" /></>}
      {kind === 'other' && <>{[18,45].map(x => [18,44].map(y => <Circle key={`${x}-${y}`} cx={x} cy={y} r="11" />))}</>}
      {kind === 'check' && <><Rect x="10" y="9" width="44" height="46" rx="10" /><Path d="m20 31 9 9 17-20" stroke="white" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></>}
      {kind === 'bell' && <><Circle cx="32" cy="9" r="4" /><Circle cx="32" cy="53" r="6" /><Path d="M15 28Q15 12 32 12Q49 12 49 28L51 42Q58 49 50 50H14Q6 49 13 42Z" /><Path d="M21 28Q21 19 28 18" stroke="#FFF5BE" strokeWidth="3" fill="none" strokeLinecap="round" /></>}
    </G>
  </Svg>;
}

export function CalendarArt({ size = 150 }: { size?: number }) {
  const id = useId();
  return <Svg width={size} height={size} viewBox="0 0 160 150">
    <Defs><LinearGradient id={id} x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#BDAAFF" /><Stop offset=".5" stopColor="#6B51FF" /><Stop offset="1" stopColor="#2714D5" /></LinearGradient></Defs>
    <G transform="rotate(8 70 70)"><Rect x="19" y="20" width="106" height="115" rx="15" fill="#3620CB" /><Rect x="13" y="15" width="107" height="113" rx="13" fill="#ECEAFF" stroke="#C3BAFF" strokeWidth="2" /><Path d="M26 15h81q13 0 13 13v17H13V28q0-13 13-13Z" fill={`url(#${id})`} />{[34,65,97].map(x => <Rect key={x} x={x} y="7" width="9" height="23" rx="4.5" fill={`url(#${id})`} stroke="#D9D3FF" strokeWidth="2" />)}{[29,55,81].map(x => [56,79,102].map(y => <Rect key={`${x}-${y}`} x={x} y={y} width="15" height="14" rx="3" fill={`url(#${id})`} opacity=".8" />))}</G>
    <Circle cx="122" cy="112" r="31" fill={`url(#${id})`} stroke="#A891FF" strokeWidth="2" /><Circle cx="122" cy="111" r="25" fill="#F2EFFF" /><Path d="M122 92v20l11 7" stroke="#3D23D3" strokeWidth="4" strokeLinecap="round" fill="none" />{[0,90,180,270].map(r => <Circle key={r} cx="122" cy="90" r="2" fill="#6C5AEA" transform={`rotate(${r} 122 111)`} />)}
  </Svg>;
}

export function SuccessArt({ size = 150 }: { size?: number }) {
  const id = useId();
  return <View accessible accessibilityLabel="Payment recorded" style={{ width: size, height: size }}><Svg width={size} height={size} viewBox="0 0 160 160">
    <Defs><LinearGradient id={id} x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#A8EF9A" /><Stop offset=".42" stopColor="#31C76C" /><Stop offset="1" stopColor="#078640" /></LinearGradient></Defs>
    {[['#FFAD38',16,29],['#683CFF',139,37],['#35CDE0',20,113],['#F94E95',139,115],['#436CFF',45,15],['#B47EFF',110,13]].map(([color,x,y],i) => <Rect key={i} x={Number(x)} y={Number(y)} width="4" height="8" rx="1" fill={String(color)} transform={`rotate(${i*30} ${x} ${y})`} />)}
    <Ellipse cx="81" cy="137" rx="33" ry="6" fill="#618970" opacity=".12" /><Circle cx="82" cy="81" r="46" fill="#067437" /><Circle cx="79" cy="77" r="46" fill={`url(#${id})`} stroke="#96EFAA" strokeWidth="1.5" /><Path d="M57 78l15 16 29-32" stroke="#057232" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" fill="none" transform="translate(1 2)" /><Path d="M56 76l15 16 29-32" stroke="white" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </Svg></View>;
}
