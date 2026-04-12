import React from 'react';
import { Gamepad2, Folder, X } from 'lucide-react';
import { useLocale } from '../../i18n/LocaleContext.jsx';

export default function Sidebar({ isOpen, onClose, groups, games, activeGroupId, setActiveGroupId, focusIndex, onAddGroup, onDeleteGroup, sidebarRef }) {
    const { t } = useLocale();
    return (
        <>
            <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />
            <div className={`collapsible-sidebar glass ${isOpen ? 'open' : ''}`}>
                <div className="brand" style={{ marginBottom: '24px' }}>
                    <Gamepad2 size={26} color="var(--accent)" fill="var(--accent)" />
                    <span>{t('sidebar.title')}</span>
                </div>

                <div ref={sidebarRef} style={{ flex: 1, overflowY: 'auto' }}>
                    <SidebarItem icon={<Gamepad2 size={17} />} label={t('sidebar.allGames')} count={games.length}
                        isActive={activeGroupId === null} isFocused={focusIndex === 0 && isOpen}
                        onClick={() => { setActiveGroupId(null); onClose(); }} />

                    <SidebarItem icon={<Folder size={17} style={{ opacity: 0.5 }} />} label={t('sidebar.uncategorized')}
                        count={games.filter(g => !g.groupId).length}
                        isActive={activeGroupId === 'uncategorized'} isFocused={focusIndex === 1 && isOpen}
                        onClick={() => { setActiveGroupId('uncategorized'); onClose(); }} />

                    <div style={{ margin: '10px 12px', borderBottom: '1px solid var(--border-subtle)' }} />

                    {groups.map((g, idx) => (
                        <SidebarItem key={g.id} icon={<Folder size={17} />} label={g.name}
                            count={games.filter(game => game.groupId === g.id).length}
                            isActive={activeGroupId === g.id} isFocused={focusIndex === idx + 2 && isOpen}
                            onClick={() => { setActiveGroupId(g.id); onClose(); }}
                            onDelete={() => onDeleteGroup(g.id)} showDelete={activeGroupId === g.id} />
                    ))}
                </div>

                <button className="btn" style={{ marginTop: '16px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', width: '100%' }} onClick={onAddGroup}>
                    {t('sidebar.addCategory')}
                </button>
            </div>
        </>
    );
}

function SidebarItem({ icon, label, count, isActive, isFocused, onClick, onDelete, showDelete }) {
    return (
        <div className={`sidebar-group-item ${isActive ? 'active' : ''} ${isFocused ? 'focused' : ''}`} onClick={onClick}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>{icon} {label}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', background: 'var(--bg-input)', padding: '2px 8px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>{count}</span>
                {onDelete && showDelete && (
                    <button className="btn" style={{ padding: '3px', background: 'transparent', border: 'none' }}
                        onClick={e => { e.stopPropagation(); onDelete(); }}>
                        <X size={13} color="#ff4757" />
                    </button>
                )}
            </div>
        </div>
    );
}
