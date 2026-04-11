import React, { useState, useRef } from 'react';
import { Download, Upload, Save, RefreshCw } from 'lucide-react';
import { THEME_COLOR_FIELDS } from '../themePresets.js';
import Section from './Section.jsx';
import { useLocale } from '../../../i18n/LocaleContext.jsx';

const DEFAULT_CUSTOM = {
    bgDark: '#0f1118', bgCard: 'rgba(25, 28, 38, 0.6)', bgCardHover: 'rgba(35, 38, 50, 0.8)',
    accent: '#6b4cff', accentHover: '#8266ff',
    textMain: '#f5f5f7', textMuted: '#a1a3af',
    playBtnColor: '#6b4cff', danger: '#ff4757',
    playBtnOpacity: 0.75, fontFamily: 'Inter',
};

export default function CustomThemeBuilder({ currentConfig, onApply }) {
    const { t } = useLocale();
    const [themeName, setThemeName] = useState(t('themeBuilder.namePlaceholder').replace('…', ''));
    const [draft, setDraft] = useState({ ...DEFAULT_CUSTOM, ...currentConfig });
    const importRef = useRef(null);

    const updateField = (key, value) => setDraft(prev => ({ ...prev, [key]: value }));

    const previewField = (key, value) => {
        const varMap = {
            bgDark: '--bg-dark', bgCard: '--bg-card', bgCardHover: '--bg-card-hover',
            accent: '--accent', accentHover: '--accent-hover',
            textMain: '--text-main', textMuted: '--text-muted',
            playBtnColor: '--play-btn', danger: '--danger',
        };
        if (varMap[key]) document.documentElement.style.setProperty(varMap[key], value);
    };

    const handleApply = () => onApply({ key: 'custom_' + Date.now(), name: themeName || 'Custom', ...draft });

    const handleExport = () => {
        const blob = new Blob([JSON.stringify({ name: themeName, ...draft }, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = Object.assign(document.createElement('a'), { href: url, download: `${(themeName || 'custom').toLowerCase().replace(/\s+/g, '_')}_theme.json` });
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target.result);
                if (data.name) setThemeName(data.name);
                setDraft(prev => ({ ...prev, ...data }));
                onApply({ key: 'imported_' + Date.now(), ...data });
            } catch { alert(t('themeBuilder.invalidFile')); }
        };
        reader.readAsText(file);
        e.target.value = null;
    };

    return (
        <Section title={t('appearance.customTheme')}>
            {/* Name + buttons */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                <input
                    value={themeName}
                    onChange={e => setThemeName(e.target.value)}
                    placeholder={t('themeBuilder.namePlaceholder')}
                    style={{ flex: 1, minWidth: '140px', fontSize: '13px', padding: '8px 12px' }}
                />
                <button className="btn" onClick={handleApply} style={{ border: 'none', background: 'rgba(107,76,255,0.2)', color: 'var(--accent)' }}>
                    <Save size={15} /> {t('themeBuilder.apply')}
                </button>
                <button className="btn" onClick={handleExport} style={{ border: 'none' }}>
                    <Download size={15} /> {t('themeBuilder.export')}
                </button>
                <label className="btn" style={{ cursor: 'pointer', border: 'none' }}>
                    <Upload size={15} /> {t('themeBuilder.import')}
                    <input type="file" accept=".json,application/json" onChange={handleImport} ref={importRef} style={{ display: 'none' }} />
                </label>
                <button className="btn" onClick={() => setDraft({ ...DEFAULT_CUSTOM })} style={{ border: 'none', padding: '8px' }} title={t('themeBuilder.reset')}>
                    <RefreshCw size={15} />
                </button>
            </div>

            {/* Color grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                {THEME_COLOR_FIELDS.map(({ key }) => (
                    <ColorField
                        key={key}
                        label={t(`themeBuilder.fields.${key}`)}
                        value={draft[key] || '#000000'}
                        onChange={v => { updateField(key, v); previewField(key, v); }}
                    />
                ))}
            </div>
        </Section>
    );
}

function ColorField({ label, value, onChange }) {
    const hexValue = value?.startsWith('#') ? value : '#6b4cff';
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <input type="color" value={hexValue} onChange={e => onChange(e.target.value)}
                    style={{ width: '34px', height: '34px', border: 'none', background: 'none', cursor: 'pointer', borderRadius: '6px', flexShrink: 0, padding: 0 }} />
                <input value={value || ''} onChange={e => onChange(e.target.value)}
                    style={{ flex: 1, fontFamily: 'monospace', fontSize: '11px', padding: '6px 8px', minWidth: 0 }}
                    placeholder="#hex or rgba(…)" />
            </div>
        </div>
    );
}
