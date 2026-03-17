import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Theme, Panel, LangStrings, Lang } from '../../types';
import { mkSpk } from '../../constants/data';
import { Icon } from '../ui/Icon';
import { Spark } from '../ui/Spark';
import { PinMenu } from './PinMenu';

const EXPORT_FORMATS = ['Excel (.xlsx)', 'CSV (.csv)', 'PNG'];

interface KPICardProps {
  id: string;
  title: string;
  value: string;
  trendValue?: string;
  sparkTrend?: 'up' | 'down' | 'flat';
  color?: string;
  t: Theme;
  l: LangStrings;
  lang: Lang;
  showToggle?: boolean;
  toggleState?: string;
  onToggle?: (val: string) => void;
  altValue?: string;
  panels: Panel[];
  onAddPanel: (name: string) => void;
  onPinTo: (panelName: string, cardId: string) => void;
  unit?: string;
  info?: string;
  big?: boolean;
}

export const KPICard = ({
  id, title, value, trendValue, sparkTrend, color, t, l, lang,
  showToggle, toggleState, onToggle, altValue,
  panels, onAddPanel, onPinTo,
  unit = 'K ₺', info, big,
}: KPICardProps) => {
  const [hov, setHov] = useState(false);
  const [pin, setPin] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showEx, setShowEx] = useState(false);

  const isPositive = trendValue?.startsWith('+');
  const trendColor = isPositive ? t.gn : t.rd;
  const displayValue = showToggle && toggleState === '%' ? altValue : value;
  const clr = (t as Record<string, string>)[color ?? ''] || color || t.gn;

  const expData = mkSpk(sparkTrend ?? 'flat', unit, lang).map((d, i) => {
    const day = String(((i * 2 + 1) % 28) + 1).padStart(2, '0');
    const monNum = String(((i + 4) % 12) + 1).padStart(2, '0');
    return { ...d, date: `${day}.${monNum}`, fullDate: `${day}.${monNum}.2026` };
  });

  if (expanded) {
    return (
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}
        onClick={() => setExpanded(false)}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ background: t.cd, borderRadius: 16, padding: '28px 32px', minWidth: 560, maxWidth: 700, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', border: `1px solid ${t.bd}`, position: 'relative' }}
        >
          <div style={{ position: 'absolute', top: 16, right: 16 }}>
            <button
              onClick={() => setExpanded(false)}
              style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${t.bd}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.tx3 }}
            >
              <Icon name="minimize" size={15} />
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 14, color: t.tx2 }}>{title}</span>
            {trendValue && (
              <span style={{ fontSize: 13, color: trendColor, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                <Icon name="trendUp" size={14} color={trendColor} />{trendValue}
              </span>
            )}
          </div>
          <div style={{ fontSize: 40, fontWeight: 700, color: t.tx, marginBottom: 20, letterSpacing: -1 }}>{displayValue}</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={expData} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
              <defs>
                <linearGradient id={`exp-${clr.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={clr} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={clr} stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={t.bd} vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: t.tx2 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip
                content={({ active, payload }) =>
                  active && payload?.[0] ? (
                    <div style={{ background: t.tx, color: t.bg, borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 500 }}>
                      <div style={{ fontWeight: 600, marginBottom: 2 }}>{payload[0].payload.fullDate}</div>
                      <div>{payload[0].value?.toLocaleString('tr-TR')} {unit}</div>
                    </div>
                  ) : null
                }
              />
              <Area
                type="monotone"
                dataKey="v"
                stroke={clr}
                strokeWidth={2.5}
                fill={`url(#exp-${clr.replace('#', '')})`}
                dot={{ r: 4, fill: t.cd, stroke: clr, strokeWidth: 2 }}
                activeDot={{ r: 6, fill: clr, stroke: t.cd, strokeWidth: 2.5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setPin(false); setShowEx(false); }}
      style={{ background: t.cd, border: `1px solid ${hov ? t.bdH : t.bd}`, borderRadius: 10, padding: big ? '16px 18px' : '14px 16px', position: 'relative', flex: 1, minWidth: big ? 180 : 130, transition: 'border-color 0.15s' }}
    >
      <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 4, alignItems: 'center' }}>
        {hov && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); setPin(!pin); }}
              style={{ width: 26, height: 26, borderRadius: 7, border: `1px solid ${t.bd}`, background: t.bg2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.tx3 }}
            >
              <Icon name="plus" size={13} />
            </button>
            <button
              onClick={() => setExpanded(true)}
              style={{ width: 26, height: 26, borderRadius: 7, border: `1px solid ${t.bd}`, background: t.bg2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.tx3 }}
            >
              <Icon name="maximize" size={13} />
            </button>
            <div style={{ position: 'relative' }}>
              <button
                onClick={(e) => { e.stopPropagation(); setShowEx(!showEx); }}
                style={{ width: 26, height: 26, borderRadius: 7, border: `1px solid ${t.bd}`, background: t.bg2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.tx3 }}
              >
                <Icon name="download" size={13} />
              </button>
              {showEx && (
                <div style={{ position: 'absolute', top: 30, right: 0, background: t.cd, border: `1px solid ${t.bd}`, borderRadius: 8, padding: 4, zIndex: 20, minWidth: 130, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  {EXPORT_FORMATS.map((f) => (
                    <div
                      key={f}
                      onClick={() => setShowEx(false)}
                      style={{ padding: '6px 10px', fontSize: 11, cursor: 'pointer', borderRadius: 5, color: t.tx }}
                      onMouseOver={(e) => ((e.target as HTMLElement).style.background = t.bg2)}
                      onMouseOut={(e) => ((e.target as HTMLElement).style.background = 'transparent')}
                    >
                      {f}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
        {showToggle && (
          <div style={{ display: 'flex', borderRadius: 7, overflow: 'hidden', border: `1px solid ${t.bd}` }}>
            {['TL', '%'].map((x) => (
              <button
                key={x}
                onClick={() => onToggle?.(x)}
                style={{ padding: '3px 9px', fontSize: 10, fontWeight: 500, border: 'none', cursor: 'pointer', background: toggleState === x ? t.pr : 'transparent', color: toggleState === x ? '#fff' : t.tx2 }}
              >
                {x}
              </button>
            ))}
          </div>
        )}
      </div>

      {pin && <PinMenu t={t} l={l} onClose={() => setPin(false)} panels={panels} onAddPanel={onAddPanel} onPinTo={onPinTo} cardId={id} />}

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <div style={{ fontSize: 12, color: t.tx2 }}>{title}</div>
        {info && (
          <div style={{ position: 'relative' }} onMouseEnter={() => setShowInfo(true)} onMouseLeave={() => setShowInfo(false)}>
            <Icon name="info" size={13} color={t.tx3} />
            {showInfo && (
              <div style={{ position: 'absolute', bottom: 20, left: -80, width: 220, background: t.tx, color: t.bg, borderRadius: 8, padding: '8px 12px', fontSize: 11, lineHeight: 1.4, boxShadow: '0 4px 12px rgba(0,0,0,0.2)', zIndex: 50 }}>
                {info}
              </div>
            )}
          </div>
        )}
        {trendValue && (
          <div style={{ fontSize: 11, color: trendColor, display: 'flex', alignItems: 'center', gap: 2, fontWeight: 700 }}>
            <Icon name="trendUp" size={12} color={trendColor} />{trendValue}
          </div>
        )}
      </div>

      <div style={{ fontSize: big ? 26 : 22, fontWeight: 600, color: t.tx, marginBottom: 6, letterSpacing: -0.5 }}>
        {displayValue}
      </div>

      {sparkTrend && <Spark data={mkSpk(sparkTrend, unit, lang)} color={clr} t={t} />}
    </div>
  );
};
