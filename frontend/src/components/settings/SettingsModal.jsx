/**
 * SettingsModal — shell + tab coordination only.
 */
import React, { useState } from 'react';
import { X, Check, Palette, FolderOpen, Key, Settings2 } from 'lucide-react';
import { useLocale } from '../../i18n/LocaleContext.jsx';

import AppearanceTab from './tabs/AppearanceTab.jsx';
import ScanningTab   from './tabs/ScanningTab.jsx';
import ApiTab        from './tabs/ApiTab.jsx';
import GeneralTab    from './tabs/GeneralTab.jsx';

export default function SettingsModal({
    uiConfig, setUiConfig,
    scanFolders,
    onSave, onClose,
    onRemoveScanFolder,
    onOpenFolderPicker,
    applyUiConfig,
    activeTab: externalTab,
    setActiveTab: setExternalTab,
}) {
    const { t } = useLocale();
    const [activeTab, setLocalTab] = useState(externalTab || 'appearance');
    const [activeThemeKey, setActiveThemeKey] = useState(uiConfig?._theme || null);

    const TABS = [
        { key: 'appearance', label: t('settings.tabs.appearance'), icon: <Palette size={15} /> },
        { key: 'scanning',   label: t('settings.tabs.scanning'),   icon: <FolderOpen size={15} /> },
        { key: 'api',        label: t('settings.tabs.api'),        icon: <Key size={15} /> },
        { key: 'general',    label: t('settings.tabs.general'),    icon: <Settings2 size={15} /> },
    ];

    const setTab = (key) => { setLocalTab(key); setExternalTab?.(key); };

    const handleConfigChange = (key, value) =>
        setUiConfig(prev => ({ ...prev, [key]: value }));

    const handleThemeSelect = (theme) => {
        const colorValues = theme.values ?? theme;
        const merged = { ...uiConfig, ...colorValues, _theme: theme.key, light: !!theme.light };
        setUiConfig(merged);
        applyUiConfig(merged);
        setActiveThemeKey(theme.key);
    };

    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 100 }}>
            <div
                className="glass-panel"
                onClick={e => e.stopPropagation()}
                style={{
                    width: 'min(760px, 95vw)', maxHeight: '88vh', borderRadius: '20px',
                    display: 'flex', flexDirection: 'column', overflow: 'hidden',
                    boxShadow: '0 30px 80px var(--overlay-bg)',
                }}
            >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 28px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <h2 style={{ margin: 0, fontSize: '20px' }}>{t('settings.title')}</h2>
                    <button className="modal-close" style={{ position: 'static' }} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* Tab bar */}
                <div style={{ display: 'flex', padding: '0 28px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-panel)' }}>
                    {TABS.map(tab => (
                        <TabButton
                            key={tab.key}
                            tab={tab}
                            isActive={activeTab === tab.key}
                            onClick={() => setTab(tab.key)}
                        />
                    ))}
                </div>

                {/* Tab body */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
                    {activeTab === 'appearance' && (
                        <AppearanceTab
                            uiConfig={uiConfig}
                            onConfigChange={handleConfigChange}
                            applyUiConfig={applyUiConfig}
                            onThemeSelect={handleThemeSelect}
                            activeThemeKey={activeThemeKey}
                        />
                    )}
                    {activeTab === 'scanning' && (
                        <ScanningTab
                            uiConfig={uiConfig}
                            onConfigChange={handleConfigChange}
                            scanFolders={scanFolders}
                            onRemoveFolder={onRemoveScanFolder}
                            onOpenFolderPicker={onOpenFolderPicker}
                        />
                    )}
                    {activeTab === 'api' && (
                        <ApiTab uiConfig={uiConfig} onConfigChange={handleConfigChange} />
                    )}
                    {activeTab === 'general' && (
                        <GeneralTab />
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: '16px 28px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-panel)' }}>
                    <button id="btn-save-settings" className="btn btn-primary" style={{ width: '100%' }} onClick={onSave}>
                        <Check size={17} /> {t('settings.saveBtn')}
                    </button>
                </div>
            </div>
        </div>
    );
}

function TabButton({ tab, isActive, onClick }) {
    return (
        <button
            id={`settings-tab-${tab.key}`}
            onClick={onClick}
            style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                padding: '13px 16px', background: 'none', border: 'none',
                borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                fontWeight: isActive ? 700 : 400,
                fontSize: '13px', cursor: 'pointer',
                transition: 'color 0.2s, border-color 0.2s',
                marginBottom: '-1px',
            }}
        >
            {tab.icon} {tab.label}
        </button>
    );
}
