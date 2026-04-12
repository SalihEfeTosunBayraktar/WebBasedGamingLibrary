import React from 'react';
import { X, ChevronLeft } from 'lucide-react';
import { useLocale } from '../../i18n/LocaleContext.jsx';

export default function FolderPicker({ pickerMode, drives, currentPath, setCurrentPath, folders, files, onClose, onConfirmFolder, onFileSelect, onLoadDirectory, onNavigateUp, gpFocusIndex }) {
    const { t } = useLocale();

    React.useEffect(() => {
        if (gpFocusIndex >= 0) {
            const el = document.getElementById(`picker-item-${gpFocusIndex}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [gpFocusIndex]);

    const title = pickerMode === 'folder' ? t('picker.titleFolder') : t('picker.titleFile');

    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 150 }}>
            <div className="glass-panel"
                style={{ width: '620px', height: '68vh', borderRadius: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 30px 80px var(--overlay-bg)' }}
                onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div style={{ padding: '20px 24px', background: 'var(--bg-panel)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--text-main)' }}>{title}</h3>
                    <button className="modal-close" style={{ position: 'static' }} onClick={onClose}><X size={20} /></button>
                </div>

                {/* Toolbar */}
                <div style={{ display: 'flex', gap: '8px', padding: '12px 24px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)', alignItems: 'center' }}>
                    <select id="picker-drive-select" value={currentPath.split('\\')[0] + '\\'}
                        onChange={e => onLoadDirectory(e.target.value)}
                        style={{ background: 'var(--bg-input)', color: 'var(--text-main)', border: '1px solid var(--border-base)', padding: '6px 10px', borderRadius: '8px', fontSize: '13px' }}>
                        {drives.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <button id="picker-btn-up" className="btn" style={{ padding: '6px 12px', fontSize: '13px', border: 'none' }} onClick={onNavigateUp}>
                        <ChevronLeft size={15} /> {t('picker.up')}
                    </button>
                    <div style={{ flex: 1, padding: '6px 12px', background: 'var(--bg-input)', borderRadius: '8px', fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {currentPath}
                    </div>
                </div>

                {/* File list */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {folders.map((f, idx) => (
                        <PickerRow key={'dir_' + f} id={`picker-item-${idx}`} icon="📁" label={f}
                            isFocused={gpFocusIndex === idx}
                            onClick={() => onLoadDirectory(currentPath + (currentPath.endsWith('\\') ? '' : '\\') + f)} />
                    ))}
                    {pickerMode === 'file' && files.map((file, idx) => (
                        <PickerRow key={'file_' + file} id={`picker-item-${folders.length + idx}`} icon="📄" label={file}
                            isFile isFocused={gpFocusIndex === folders.length + idx}
                            onClick={() => onFileSelect(file)} />
                    ))}
                    {folders.length === 0 && files.length === 0 && (
                        <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '50px', opacity: 0.7 }}>
                            {t('picker.empty')}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {pickerMode === 'folder' && (
                    <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', background: 'var(--bg-panel)' }}>
                        <button id="picker-btn-confirm" className="btn btn-primary" onClick={onConfirmFolder}>
                            ✓ {t('picker.confirm')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function PickerRow({ id, icon, label, isFile, isFocused, onClick }) {
    return (
        <div id={id} onClick={onClick}
            style={{ display: 'flex', gap: '12px', padding: '10px 14px', borderRadius: '9px', cursor: 'pointer', alignItems: 'center', transition: 'background 0.15s', background: isFocused ? 'rgba(var(--accent-rgb, 107,76,255), 0.18)' : (isFile ? 'var(--bg-input)' : 'transparent'), outline: isFocused ? '2px solid var(--accent)' : 'none', color: 'var(--text-main)' }}
            onMouseEnter={e => { if (!isFocused) e.currentTarget.style.background = 'var(--bg-input)'; }}
            onMouseLeave={e => { if (!isFocused) e.currentTarget.style.background = isFile ? 'var(--bg-input)' : 'transparent'; }}>
            <span style={{ fontSize: '15px' }}>{icon}</span>
            <span style={{ fontSize: '13px' }}>{label}</span>
        </div>
    );
}
