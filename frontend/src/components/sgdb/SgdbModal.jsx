import React, { useState } from 'react';
import { X, ChevronLeft, Gamepad2 } from 'lucide-react';
import { useLocale } from '../../i18n/LocaleContext.jsx';

export default function SgdbModal({ game, onClose, onSearch, onApply, loading }) {
    const { t } = useLocale();
    const [searchText, setSearchText] = useState(game?.sgdbQuery || game?.name || '');
    const [results, setResults] = useState([]);
    const [images, setImages] = useState(null);
    const [phase, setPhase] = useState('search');

    const handleSearch = async () => {
        if (!searchText.trim()) return;
        const res = await onSearch(searchText);
        if (res) setResults(res);
    };

    const handleSelectGame = async (gameId) => {
        const res = await onApply(gameId, null, null);
        if (res) { setImages(res); setPhase('images'); }
    };

    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 200 }}>
            <div className="glass-panel"
                style={{ width: '820px', height: '82vh', borderRadius: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 30px 80px var(--overlay-bg)' }}
                onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-panel)' }}>
                    <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--text-main)' }}>🎨 {t('sgdb.title')} — {game?.name}</h2>
                    <button className="modal-close" style={{ position: 'static' }} onClick={onClose}><X size={20} /></button>
                </div>

                {/* Search bar */}
                <div style={{ display: 'flex', gap: '8px', padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
                    {phase === 'images' && (
                        <button className="btn" style={{ border: 'none', padding: '8px 14px' }} onClick={() => { setPhase('search'); setImages(null); }}>
                            <ChevronLeft size={16} /> {t('sgdb.back')}
                        </button>
                    )}
                    <input id="sgdb-search-input" value={searchText} onChange={e => setSearchText(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        placeholder={t('sgdb.searchPlaceholder')} />
                    <button id="sgdb-btn-search" className="btn btn-primary" onClick={handleSearch} disabled={loading}>
                        {t('sgdb.search')}
                    </button>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
                    {loading && (
                        <div style={{ textAlign: 'center', padding: '50px', color: 'var(--accent)', opacity: 0.8 }}>
                            <div className="spinner" style={{ margin: '0 auto 12px' }} />
                            {t('sgdb.loading')}
                        </div>
                    )}

                    {!loading && phase === 'search' && results.map(r => (
                        <div key={r.id} tabIndex="0" onClick={() => handleSelectGame(r.id)} onKeyDown={e => e.key === 'Enter' && handleSelectGame(r.id)}
                            style={{ padding: '12px 16px', background: 'var(--bg-input)', marginBottom: '6px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', transition: 'background 0.15s', color: 'var(--text-main)', border: '1px solid var(--border-subtle)' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-input)'}>
                            <Gamepad2 size={16} color="var(--accent)" />
                            <span style={{ fontSize: '14px' }}>{r.name}</span>
                        </div>
                    ))}

                    {!loading && phase === 'images' && images && (
                        <div>
                            <h3 style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px', marginBottom: '14px', fontSize: '15px', color: 'var(--text-main)' }}>
                                {t('sgdb.grids')}
                            </h3>
                            <div style={{ display: 'flex', gap: '12px', marginBottom: '28px', overflowX: 'auto', paddingBottom: '8px' }}>
                                {images.grids.map(img => (
                                    <ImageThumb key={img.id} src={img.thumb} label={t('sgdb.applyGrid')} width={130} height={195} onClick={() => onApply(null, 'cover', img.url)} />
                                ))}
                                {images.grids.length === 0 && <EmptyMsg>{t('sgdb.noGrids')}</EmptyMsg>}
                            </div>

                            <h3 style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px', marginBottom: '14px', fontSize: '15px', color: 'var(--text-main)' }}>
                                {t('sgdb.heroes')}
                            </h3>
                            <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
                                {images.heroes.map(img => (
                                    <ImageThumb key={img.id} src={img.thumb} label={t('sgdb.applyHero')} width={270} height={152} onClick={() => onApply(null, 'hero', img.url)} />
                                ))}
                                {images.heroes.length === 0 && <EmptyMsg>{t('sgdb.noHeroes')}</EmptyMsg>}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function ImageThumb({ src, label, width, height, onClick }) {
    return (
        <div tabIndex="0" onClick={onClick} onKeyDown={e => e.key === 'Enter' && onClick()}
            style={{ position: 'relative', cursor: 'pointer', flex: `0 0 ${width}px`, borderRadius: '10px', overflow: 'hidden' }}
            onMouseEnter={e => e.currentTarget.querySelector('.img-label').style.opacity = '1'}
            onMouseLeave={e => e.currentTarget.querySelector('.img-label').style.opacity = '0'}>
            <img src={src} style={{ width, height, objectFit: 'cover', display: 'block' }} loading="lazy" alt="" />
            <div className="img-label" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.85)', padding: '6px', textAlign: 'center', fontSize: '11px', color: '#fff', opacity: 0, transition: 'opacity 0.2s' }}>
                {label}
            </div>
        </div>
    );
}

function EmptyMsg({ children }) {
    return <div style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '12px' }}>{children}</div>;
}
