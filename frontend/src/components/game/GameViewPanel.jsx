import React from 'react';
import { Play, Edit3, Search } from 'lucide-react';
import { useLocale } from '../../i18n/LocaleContext.jsx';

export default function GameViewPanel({ game, groups, onEdit, onPlay, onDelete, onSgdbOpen }) {
    const { t } = useLocale();
    const groupName = game.groupId
        ? (groups.find(g => g.id === game.groupId)?.name || t('gameView.unknown'))
        : t('gameView.uncategorized');

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h1 style={{ fontSize: '30px', marginBottom: '8px', lineHeight: 1.2 }}>{game.name}</h1>
                <button className="btn" style={{ padding: '8px', marginRight: '32px', flexShrink: 0 }} onClick={onEdit} title={t('gameView.edit')}>
                    <Edit3 size={17} />
                </button>
            </div>

            <div style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.9', background: 'var(--bg-panel)', padding: '14px 16px', borderRadius: '12px', marginTop: '12px', marginBottom: '28px', border: '1px solid var(--border-subtle)' }}>
                <InfoRow label={t('gameView.path')}      value={game.path} />
                <InfoRow label={t('gameView.file')}      value={game.exe} />
                <InfoRow label={t('gameView.group')}     value={groupName} />
                <InfoRow label={t('gameView.added')}     value={new Date(game.addedAt).toLocaleString()} />
                {game.lastPlayed && <InfoRow label={t('gameView.lastPlayed')} value={new Date(game.lastPlayed).toLocaleString()} />}
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', gap: '12px' }}>
                <button id="btn-play-game" className="btn btn-play" style={{ flex: 1, fontSize: '16px', padding: '14px' }} onClick={() => onPlay(game.id)}>
                    <Play fill="currentColor" size={22} /> {t('gameView.play')}
                </button>
                <button className="btn" style={{ background: 'var(--bg-input)', color: 'var(--accent)', border: '1px solid var(--border-subtle)' }} onClick={onSgdbOpen}>
                    <Search size={16} /> {t('gameView.webCover')}
                </button>
                <button className="btn" style={{ background: 'rgba(255,71,87,0.10)', color: 'var(--danger)', border: '1px solid rgba(255,71,87,0.3)' }} onClick={onDelete}>
                    {t('gameView.remove')}
                </button>
            </div>
        </>
    );
}

function InfoRow({ label, value }) {
    return (
        <p style={{ margin: 0 }}>
            <strong style={{ color: 'var(--text-main)' }}>{label}:</strong>{' '}
            <span style={{ wordBreak: 'break-all' }}>{value}</span>
        </p>
    );
}
