import React from 'react';
import { Gamepad2, FolderPlus, File, RefreshCw, LayoutGrid, List, Maximize, Minimize, Settings, Search, MonitorPlay, ChevronDown } from 'lucide-react';
import { useLocale } from '../../i18n/LocaleContext.jsx';

export const SORT_KEY_LIST = ['name_asc', 'name_desc', 'last_played', 'added_new', 'added_old', 'group', 'random'];

export default function TopBar({
    layout, setLayout,
    isScanning, isRescanning,
    isFullscreen,
    sortKey, setSortKey,
    searchQuery, setSearchQuery,
    onOpenSidebar, onOpenSettings,
    onOpenFolderPicker, onRescanAll,
    onToggleFullscreen,
    uiConfig, saveConfigFn,
}) {
    const { t, locale } = useLocale();
    const [showSortMenu, setShowSortMenu] = React.useState(false);
    const sortRef = React.useRef(null);

    const SORT_OPTIONS = SORT_KEY_LIST.map(key => ({ key, label: t(`sort.${key}`) }));

    React.useEffect(() => {
        const handler = (e) => { if (sortRef.current && !sortRef.current.contains(e.target)) setShowSortMenu(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const changeLayout = (l) => {
        setLayout(l);
        if (uiConfig && saveConfigFn) saveConfigFn({ ...uiConfig, layout: l }).catch(() => {});
    };

    const currentSortLabel = SORT_OPTIONS.find(s => s.key === sortKey)?.label || t('topbar.sort');

    return (
        <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'var(--bg-panel)', padding: '14px 24px',
            margin: '0 -32px 32px -32px',
            backdropFilter: 'blur(14px)',
            borderBottom: '1px solid var(--border-subtle)',
            zIndex: 10, position: 'sticky', top: 0,
        }}>
            {/* Left */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button id="btn-open-sidebar" className="btn" onClick={onOpenSidebar}
                    style={{ padding: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '10px' }}
                    title={t('topbar.categories')}>
                    <LayoutGrid size={18} />
                </button>

                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, letterSpacing: '-0.5px' }}>
                    {t('topbar.title')}
                </h2>

                <div style={{ width: '1px', height: '24px', background: 'var(--border-base)' }} />

                <div style={{ display: 'flex', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '3px' }}>
                    <button id="btn-scan-folder" className="btn" onClick={() => onOpenFolderPicker('folder')} disabled={isScanning}
                        style={{ padding: '6px 12px', background: 'transparent', border: 'none', fontSize: '13px', borderRadius: '8px' }}>
                        <FolderPlus size={15} /> {isScanning ? t('topbar.scanning') : t('topbar.addFolder')}
                    </button>
                    <div style={{ width: '1px', background: 'var(--border-subtle)', margin: '4px 2px' }} />
                    <button id="btn-add-manual" className="btn" onClick={() => onOpenFolderPicker('file')}
                        style={{ padding: '6px 12px', background: 'transparent', border: 'none', fontSize: '13px', borderRadius: '8px' }}>
                        <File size={15} /> {t('topbar.addManual')}
                    </button>
                </div>
            </div>

            {/* Right */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button id="btn-rescan" className="btn" style={{ padding: '8px', border: 'none', borderRadius: '10px' }}
                    onClick={onRescanAll} disabled={isRescanning} title={t('topbar.rescan')}>
                    <RefreshCw size={17} className={isRescanning ? 'spinning' : ''} />
                </button>

                {/* Sort dropdown */}
                <div style={{ position: 'relative' }} ref={sortRef}>
                    <button id="btn-sort" className="btn" onClick={() => setShowSortMenu(v => !v)}
                        style={{ padding: '7px 12px', border: 'none', borderRadius: '10px', fontSize: '13px', gap: '6px' }}>
                        {currentSortLabel} <ChevronDown size={14} style={{ opacity: 0.6 }} />
                    </button>
                    {showSortMenu && (
                        <div style={{
                            position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                            background: 'var(--bg-surface)', backdropFilter: 'blur(12px)',
                            border: '1px solid var(--border-base)', borderRadius: '12px',
                            padding: '6px', minWidth: '186px', zIndex: 500,
                            boxShadow: '0 16px 40px var(--overlay-bg)',
                        }}>
                            {SORT_OPTIONS.map(opt => (
                                <div key={opt.key} onClick={() => { setSortKey(opt.key); setShowSortMenu(false); }}
                                    style={{
                                        padding: '9px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
                                        fontWeight: sortKey === opt.key ? 700 : 400,
                                        color: sortKey === opt.key ? 'var(--accent)' : 'var(--text-main)',
                                        background: sortKey === opt.key ? 'rgba(107,76,255,0.12)' : 'transparent',
                                    }}
                                    onMouseEnter={e => { if (sortKey !== opt.key) e.currentTarget.style.background = 'var(--bg-input)'; }}
                                    onMouseLeave={e => { if (sortKey !== opt.key) e.currentTarget.style.background = 'transparent'; }}>
                                    {opt.label}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Layout switcher */}
                <div style={{ display: 'flex', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '3px' }}>
                    {[
                        { key: 'grid', icon: <LayoutGrid size={17} />, title: t('topbar.layoutGrid') },
                        { key: 'wide', icon: <List size={17} />,       title: t('topbar.layoutList') },
                        { key: 'ps',   icon: <MonitorPlay size={17} />, title: t('topbar.layoutConsole') },
                    ].map(({ key, icon, title }) => (
                        <button key={key} id={`btn-layout-${key}`} className="btn" title={title}
                            style={{ padding: '6px', border: 'none', borderRadius: '8px', background: layout === key ? 'var(--accent)' : 'transparent', color: layout === key ? '#fff' : 'var(--text-muted)' }}
                            onClick={() => changeLayout(key)}>
                            {icon}
                        </button>
                    ))}
                </div>

                <button id="btn-fullscreen" className="btn" style={{ padding: '8px', border: 'none', borderRadius: '10px' }}
                    onClick={onToggleFullscreen} title={t('topbar.fullscreen')}>
                    {isFullscreen ? <Minimize size={17} /> : <Maximize size={17} />}
                </button>

                <button id="btn-settings" className="btn" style={{ padding: '8px', border: 'none', borderRadius: '10px' }}
                    onClick={onOpenSettings} title={t('topbar.settings')}>
                    <Settings size={17} />
                </button>

                {/* Language toggle in topbar */}
                <LangToggle />

                <div style={{ position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    <input id="input-search" type="text" placeholder={t('topbar.search')}
                        style={{ paddingLeft: '38px', width: '200px', fontSize: '14px' }}
                        value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
            </div>
        </div>
    );
}

function LangToggle() {
    const { locale, setLocale } = useLocale();
    return (
        <button
            id="btn-lang-toggle"
            className="btn"
            style={{ padding: '6px 10px', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700 }}
            onClick={() => setLocale(locale === 'tr' ? 'en' : 'tr')}
            title="TR / EN"
        >
            {locale === 'tr' ? '🇹🇷' : '🇬🇧'}
        </button>
    );
}

export { SORT_KEY_LIST as SORT_OPTIONS };
