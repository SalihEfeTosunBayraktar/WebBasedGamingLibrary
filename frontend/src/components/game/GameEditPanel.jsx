import React from 'react';
import { Check, Search, Image as ImageIcon, ImagePlus } from 'lucide-react';
import { useLocale } from '../../i18n/LocaleContext.jsx';

export default function GameEditPanel({ editName, setEditName, editGroupId, setEditGroupId, editPath, setEditPath, editExe, setEditExe, editSgdbQuery, setEditSgdbQuery, groups, onSave, onCancel, onSgdbOpen, onImageFileSelect }) {
    const { t } = useLocale();
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingRight: '32px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
                <input id="edit-name" value={editName} onChange={e => setEditName(e.target.value)}
                    style={{ flex: 1, fontSize: '20px', fontWeight: 'bold', padding: '8px 12px' }}
                    placeholder={t('gameEdit.gameName')} />
                <select id="edit-group" value={editGroupId} onChange={e => setEditGroupId(e.target.value)}
                    style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }}>
                    <option value="null">{t('gameEdit.noCategory')}</option>
                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '10px' }}>
                <FieldRow id="edit-path" label={t('gameEdit.gamePath')} value={editPath} onChange={e => setEditPath(e.target.value)} />
                <FieldRow id="edit-exe"  label={t('gameEdit.exeFile')}  value={editExe}  onChange={e => setEditExe(e.target.value)} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <ImageUploadCard icon={<ImageIcon size={22} color="var(--text-muted)" />}
                    title={t('gameEdit.coverVertical')} desc={t('gameEdit.coverVerticalDesc')}
                    btnClass="btn" btnLabel={t('gameEdit.localFile')} onChange={e => onImageFileSelect(e, 'cover')} />
                <ImageUploadCard icon={<ImagePlus size={22} color="var(--accent)" />}
                    title={t('gameEdit.heroBg')} desc={t('gameEdit.heroBgDesc')}
                    btnClass="btn btn-primary" btnLabel={t('gameEdit.localFile')} onChange={e => onImageFileSelect(e, 'hero')} />
            </div>

            <div style={{ display: 'flex', gap: '8px', background: 'rgba(107,76,255,0.08)', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(107,76,255,0.25)' }}>
                <input id="edit-sgdb-query" value={editSgdbQuery} onChange={e => setEditSgdbQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && onSgdbOpen()}
                    placeholder={editName || (editExe ? editExe.replace('.exe', '') : t('gameEdit.searchPlaceholder'))}
                    style={{ flex: 1, padding: '8px', fontSize: '13px' }} />
                <button className="btn btn-primary" onClick={onSgdbOpen} style={{ whiteSpace: 'nowrap' }}>
                    <Search size={15} /> {t('gameEdit.onlineCover')}
                </button>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button id="btn-save-edit" className="btn btn-primary" onClick={onSave} style={{ flex: 1 }}>
                    <Check size={17} /> {t('gameEdit.save')}
                </button>
                <button className="btn" onClick={onCancel}>{t('gameEdit.cancel')}</button>
            </div>
        </div>
    );
}

function FieldRow({ id, label, value, onChange }) {
    return (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <strong style={{ width: '76px', fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>{label}:</strong>
            <input id={id} value={value} onChange={onChange}
                style={{ flex: 1, padding: '7px 10px', fontFamily: 'monospace', fontSize: '12px', borderRadius: '6px', background: 'var(--bg-input)', border: 'none', color: 'var(--text-main)' }} />
        </div>
    );
}

function ImageUploadCard({ icon, title, desc, btnClass, btnLabel, onChange }) {
    return (
        <div style={{ background: 'var(--bg-input)', padding: '14px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', border: '1px solid var(--border-subtle)' }}>
            {icon}
            <h4 style={{ margin: 0, fontSize: '12px' }}>{title}</h4>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>{desc}</p>
            <label className={btnClass} style={{ marginTop: 'auto', cursor: 'pointer', width: '100%', textAlign: 'center', fontSize: '12px' }}>
                <span>{btnLabel}</span>
                <input type="file" accept="image/*" onChange={onChange} style={{ display: 'none' }} />
            </label>
        </div>
    );
}
