import React from 'react';
import { Trash2, FolderPlus } from 'lucide-react';
import Section from '../components/Section.jsx';
import { useLocale } from '../../../i18n/LocaleContext.jsx';

export default function ScanningTab({ uiConfig, onConfigChange, scanFolders, onRemoveFolder, onOpenFolderPicker }) {
    const { t } = useLocale();
    return (
        <>
            <Section title={t('scanning.foldersTitle')} desc={t('scanning.foldersDesc')}>
                {scanFolders.length === 0 ? (
                    <div style={{ padding: '16px', background: 'var(--bg-input)', borderRadius: '10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', border: '1px solid var(--border-subtle)' }}>
                        {t('scanning.noFolders')}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {scanFolders.map(p => (
                            <FolderRow key={p} path={p} onRemove={() => onRemoveFolder(p)} />
                        ))}
                    </div>
                )}
                <button className="btn" style={{ marginTop: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }} onClick={() => onOpenFolderPicker('folder')}>
                    <FolderPlus size={15} /> {t('scanning.addFolder')}
                </button>
            </Section>

            <Section title={t('scanning.ignoredTitle')} desc={t('scanning.ignoredDesc')}>
                <input
                    type="text"
                    value={uiConfig.ignoredExes || ''}
                    onChange={e => onConfigChange('ignoredExes', e.target.value)}
                    placeholder={t('scanning.ignoredPlaceholder')}
                    style={{ width: '100%', fontFamily: 'monospace', fontSize: '13px', padding: '11px 14px' }}
                />
            </Section>
        </>
    );
}

function FolderRow({ path, onRemove }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-input)', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{path}</span>
            <button className="btn" style={{ padding: '5px 10px', background: 'rgba(255,71,87,0.15)', color: '#ff4757', border: 'none', fontSize: '12px' }} onClick={onRemove}>
                <Trash2 size={13} />
            </button>
        </div>
    );
}
