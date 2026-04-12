/**
 * useAppState.js — Core application state + lifecycle effects.
 * Sorting logic: see hooks/sorting.js
 * Action handlers: see hooks/useAppActions.js
 */
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocale } from '../i18n/LocaleContext.jsx';
import { fetchGames, fetchConfig, fetchGroups } from '../api/api.js';
import { applySorting } from './sorting.js';

export { SORT_OPTIONS_MAPPING, resetRandomSeed, applySorting } from './sorting.js';

export function useAppState() {
    const { t } = useLocale();

    // ── State declarations ────────────────────────────────────────────────────
    const [games, setGames]             = useState([]);
    const [groups, setGroups]           = useState([]);
    const [uiConfig, setUiConfig]       = useState(null);
    const [loading, setLoading]         = useState(true);
    const [toast, setToast]             = useState('');

    const [layout, setLayout]           = useState('grid');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortKey, setSortKey]         = useState('name_asc');

    const [isSidebarOpen, setIsSidebarOpen]       = useState(false);
    const [activeGroupId, setActiveGroupId]         = useState(null);
    const [sidebarFocusIndex, setSidebarFocusIndex] = useState(0);
    const sidebarRef = useRef(null);

    const [selectedGame, setSelectedGame]         = useState(null);
    const [showSettings, setShowSettings]         = useState(false);
    const [settingsTab, setSettingsTab]           = useState('appearance');
    const [showFolderPicker, setShowFolderPicker] = useState(false);
    const [showSgdb, setShowSgdb]                 = useState(false);
    const [cropTarget, setCropTarget]             = useState(null);

    const [pickerMode, setPickerMode]               = useState('folder');
    const [drives, setDrives]                       = useState([]);
    const [currentPath, setCurrentPath]             = useState('');
    const [folderList, setFolderList]               = useState([]);
    const [fileList, setFileList]                   = useState([]);
    const [pickerFocusIndex, setPickerFocusIndex]   = useState(-1);

    const [scanFolders, setScanFolders]   = useState([]);
    const [isScanning, setIsScanning]     = useState(false);
    const [isRescanning, setIsRescanning] = useState(false);

    const [focusedIndex, setFocusedIndex] = useState(0);
    const containerRef   = useRef(null);
    const edgeScrollRef  = useRef(null);
    const layoutRef      = useRef('grid');
    const gameCountRef   = useRef(0);
    const hasModalRef    = useRef(false);
    const sidebarOpenRef = useRef(false);

    // ── Derived state ─────────────────────────────────────────────────────────
    const filteredGames = useMemo(() => {
        const filtered = games.filter(g =>
            g.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
            (activeGroupId === null ? true
                : activeGroupId === 'uncategorized' ? !g.groupId
                : g.groupId === activeGroupId)
        );
        return applySorting(filtered, sortKey, groups);
    }, [games, searchQuery, activeGroupId, sortKey, groups]);

    // Sync refs
    useEffect(() => { layoutRef.current = layout; }, [layout]);
    useEffect(() => { gameCountRef.current = filteredGames.length; }, [filteredGames.length]);

    // ── Helpers ───────────────────────────────────────────────────────────────
    const showToast = useCallback((msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3000);
    }, []);

    const hasModal = useCallback(
        () => !!(selectedGame || showSettings || showFolderPicker || showSgdb || cropTarget),
        [selectedGame, showSettings, showFolderPicker, showSgdb, cropTarget]
    );
    useEffect(() => { hasModalRef.current = hasModal(); }, [hasModal]);
    useEffect(() => { sidebarOpenRef.current = isSidebarOpen; }, [isSidebarOpen]);

    // ── CSS variable application ──────────────────────────────────────────────
    const applyUiConfig = useCallback((cfg) => {
        if (!cfg) return;
        const root = document.documentElement;
        const set = (k, v) => { if (v !== undefined) root.style.setProperty(k, v); };
        const hexToRgb = (hex) => {
            if (!hex?.startsWith('#')) return null;
            return `${parseInt(hex.slice(1,3),16)}, ${parseInt(hex.slice(3,5),16)}, ${parseInt(hex.slice(5,7),16)}`;
        };
        set('--bg-dark', cfg.bgDark);
        const rgb = hexToRgb(cfg.bgDark); if (rgb) set('--bg-dark-rgb', rgb);
        set('--bg-card', cfg.bgCard); set('--bg-card-hover', cfg.bgCardHover);
        set('--text-main', cfg.textMain); set('--text-muted', cfg.textMuted);
        set('--accent', cfg.accent); set('--accent-hover', cfg.accentHover);
        set('--play-btn', cfg.playBtnColor); set('--danger', cfg.danger);
        if (cfg.playBtnOpacity !== undefined) set('--play-btn-opacity', cfg.playBtnOpacity);
        set('--bg-panel', cfg.bgPanel); set('--bg-surface', cfg.bgSurface);
        set('--bg-input', cfg.bgInput); set('--border-subtle', cfg.borderSubtle);
        set('--border-base', cfg.borderBase); set('--overlay-bg', cfg.overlayBg);
        set('--scrollbar-thumb', cfg.scrollbarThumb);
        if (cfg.fontFamily) document.body.style.fontFamily = `'${cfg.fontFamily}', -apple-system, sans-serif`;
        if (cfg.layout) setLayout(cfg.layout);
    }, []);

    // ── Initial data load ─────────────────────────────────────────────────────
    useEffect(() => {
        let isMounted = true;
        (async () => {
            try {
                const [g, cfg, gr] = await Promise.all([fetchGames(), fetchConfig(), fetchGroups()]);
                if (!isMounted) return;
                setGames(g || []); setUiConfig(cfg); setGroups(gr || []);
                applyUiConfig(cfg);
                if (cfg.layout) setLayout(cfg.layout);
            } catch { showToast(t('toast.serverDown')); }
            finally { if (isMounted) setLoading(false); }
        })();
        return () => { isMounted = false; };
    }, [applyUiConfig, showToast, t]);

    // ── Global event listeners (mount-once, use refs) ─────────────────────────
    useEffect(() => {
        const onFSChange  = () => setIsFullscreen(!!document.fullscreenElement);
        const onGameHover = (e) => { if (layoutRef.current !== 'ps') setFocusedIndex(e.detail.index); };
        const onMouseMove = (e) => {
            if (layoutRef.current !== 'ps' || hasModalRef.current || sidebarOpenRef.current) {
                if (edgeScrollRef.current) { clearInterval(edgeScrollRef.current); edgeScrollRef.current = null; }
                return;
            }
            
            // Sadece dikey olarak ortadayken ( %25 - %75 arası ) çalışsın
            const isMiddleY = e.clientY > window.innerHeight * 0.25 && e.clientY < window.innerHeight * 0.75;
            const thr = window.innerWidth * 0.15;
            
            let dir = 0;
            if (isMiddleY) {
                if (e.clientX < thr) dir = -1;
                else if (e.clientX > window.innerWidth - thr) dir = 1;
            }

            if (dir !== 0 && !edgeScrollRef.current) {
                edgeScrollRef.current = setInterval(() =>
                    setFocusedIndex(p => { const n = p + dir; return n >= 0 && n < gameCountRef.current ? n : p; }), 250);
            } else if (dir === 0 && edgeScrollRef.current) {
                clearInterval(edgeScrollRef.current); edgeScrollRef.current = null;
            }
        };
        document.addEventListener('fullscreenchange', onFSChange);
        document.addEventListener('gamehover', onGameHover);
        document.addEventListener('mousemove', onMouseMove);
        return () => {
            document.removeEventListener('fullscreenchange', onFSChange);
            document.removeEventListener('gamehover', onGameHover);
            document.removeEventListener('mousemove', onMouseMove);
            if (edgeScrollRef.current) clearInterval(edgeScrollRef.current);
        };
    }, []);

    // ── Return all state & helpers ────────────────────────────────────────────
    return {
        games, setGames, groups, setGroups, uiConfig, setUiConfig, loading, toast,
        layout, setLayout, isFullscreen, searchQuery, setSearchQuery, sortKey, setSortKey,
        isSidebarOpen, setIsSidebarOpen, activeGroupId, setActiveGroupId,
        sidebarFocusIndex, setSidebarFocusIndex, sidebarRef,
        selectedGame, setSelectedGame, showSettings, setShowSettings,
        settingsTab, setSettingsTab, showFolderPicker, setShowFolderPicker,
        showSgdb, setShowSgdb, cropTarget, setCropTarget,
        pickerMode, setPickerMode, drives, setDrives, currentPath, setCurrentPath,
        folderList, setFolderList, fileList, setFileList, pickerFocusIndex, setPickerFocusIndex,
        scanFolders, setScanFolders, isScanning, setIsScanning, isRescanning, setIsRescanning,
        focusedIndex, setFocusedIndex, containerRef,
        filteredGames, showToast, hasModal, applyUiConfig,
    };
}
