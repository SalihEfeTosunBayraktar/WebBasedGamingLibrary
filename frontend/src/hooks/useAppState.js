/**
 * useAppState.js — Core state, initial data load, CSS variable application,
 * edge-scroll & hover event listeners for App.
 */
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocale } from '../i18n/LocaleContext.jsx';

import {
    fetchGames, fetchConfig, fetchGroups,
} from '../api/api.js';

import { SORT_KEY_LIST } from '../components/layout/TopBar.jsx';

// ── Sorting ───────────────────────────────────────────────────────────────────
export const SORT_OPTIONS_MAPPING = (t) =>
    SORT_KEY_LIST.map(key => ({ key, label: t(`sort.${key}`) }));

let _randomSeed = Math.random();
export function applySorting(games, sortKey, groups) {
    const copy = [...games];
    switch (sortKey) {
        case 'name_asc':    return copy.sort((a, b) => a.name.localeCompare(b.name));
        case 'name_desc':   return copy.sort((a, b) => b.name.localeCompare(a.name));
        case 'last_played': return copy.sort((a, b) => {
            if (!a.lastPlayed && !b.lastPlayed) return 0;
            if (!a.lastPlayed) return 1;
            if (!b.lastPlayed) return -1;
            return new Date(b.lastPlayed) - new Date(a.lastPlayed);
        });
        case 'added_new': return copy.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
        case 'added_old': return copy.sort((a, b) => new Date(a.addedAt) - new Date(b.addedAt));
        case 'group': return copy.sort((a, b) => {
            const ga = groups.find(g => g.id === a.groupId)?.name || 'zzz';
            const gb = groups.find(g => g.id === b.groupId)?.name || 'zzz';
            return ga.localeCompare(gb);
        });
        case 'random': {
            const seeded = copy.map((v, i) => ({ v, r: Math.abs(Math.sin(_randomSeed + i)) }));
            return seeded.sort((a, b) => a.r - b.r).map(x => x.v);
        }
        default: return copy.sort((a, b) => a.name.localeCompare(b.name));
    }
}
export function resetRandomSeed() { _randomSeed = Math.random(); }

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useAppState() {
    const { t } = useLocale();

    // Data
    const [games, setGames]       = useState([]);
    const [groups, setGroups]     = useState([]);
    const [uiConfig, setUiConfig] = useState(null);
    const [loading, setLoading]   = useState(true);
    const [toast, setToast]       = useState('');

    // UI
    const [layout, setLayout]           = useState('grid');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [searchQuery, setSearchQuery]   = useState('');
    const [sortKey, setSortKey]           = useState('name_asc');

    // Sidebar
    const [isSidebarOpen, setIsSidebarOpen]       = useState(false);
    const [activeGroupId, setActiveGroupId]         = useState(null);
    const [sidebarFocusIndex, setSidebarFocusIndex] = useState(0);
    const sidebarRef = useRef(null);

    // Modals
    const [selectedGame, setSelectedGame]   = useState(null);
    const [showSettings, setShowSettings]   = useState(false);
    const [settingsTab, setSettingsTab]     = useState('appearance');
    const [showFolderPicker, setShowFolderPicker] = useState(false);
    const [showSgdb, setShowSgdb]           = useState(false);
    const [cropTarget, setCropTarget]       = useState(null);

    // Folder picker
    const [pickerMode, setPickerMode]         = useState('folder');
    const [drives, setDrives]                 = useState([]);
    const [currentPath, setCurrentPath]       = useState('');
    const [folderList, setFolderList]         = useState([]);
    const [fileList, setFileList]             = useState([]);
    const [pickerFocusIndex, setPickerFocusIndex] = useState(-1);

    // Scan / misc
    const [scanFolders, setScanFolders]   = useState([]);
    const [isScanning, setIsScanning]     = useState(false);
    const [isRescanning, setIsRescanning] = useState(false);

    // Focus / edge-scroll refs
    const [focusedIndex, setFocusedIndex] = useState(0);
    const containerRef  = useRef(null);
    const edgeScrollRef = useRef(null);
    const layoutRef     = useRef('grid');
    const gameCountRef  = useRef(0);
    const hasModalRef   = useRef(false);
    const sidebarOpenRef = useRef(false);

    // ── Derived ──────────────────────────────────────────────────────────────
    const filteredGames = useMemo(() => {
        const filtered = games.filter(g =>
            g.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
            (activeGroupId === null
                ? true
                : activeGroupId === 'uncategorized' ? !g.groupId : g.groupId === activeGroupId)
        );
        return applySorting(filtered, sortKey, groups);
    }, [games, searchQuery, activeGroupId, sortKey, groups]);

    // Keep refs in sync
    useEffect(() => { layoutRef.current = layout; }, [layout]);
    useEffect(() => { gameCountRef.current = filteredGames.length; }, [filteredGames.length]);

    // ── Toast ─────────────────────────────────────────────────────────────────
    const showToast = useCallback((msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3000);
    }, []);

    // ── Modal flag ────────────────────────────────────────────────────────────
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
        set('--bg-dark', cfg.bgDark); const rgb = hexToRgb(cfg.bgDark); if (rgb) set('--bg-dark-rgb', rgb);
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

    // ── Initial load ──────────────────────────────────────────────────────────
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

    // ── Global events ─────────────────────────────────────────────────────────
    useEffect(() => {
        const onFSChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', onFSChange);

        const onGameHover = (e) => { if (layoutRef.current !== 'ps') setFocusedIndex(e.detail.index); };
        document.addEventListener('gamehover', onGameHover);

        const onMouseMove = (e) => {
            if (layoutRef.current !== 'ps' || hasModalRef.current || sidebarOpenRef.current) {
                if (edgeScrollRef.current) { clearInterval(edgeScrollRef.current); edgeScrollRef.current = null; }
                return;
            }
            const threshold = window.innerWidth * 0.15;
            let dir = 0;
            if (e.clientX < threshold) dir = -1;
            else if (e.clientX > window.innerWidth - threshold) dir = 1;

            if (dir !== 0 && !edgeScrollRef.current) {
                edgeScrollRef.current = setInterval(() => {
                    setFocusedIndex(prev => {
                        const next = prev + dir;
                        return (next >= 0 && next < gameCountRef.current) ? next : prev;
                    });
                }, 250);
            } else if (dir === 0 && edgeScrollRef.current) {
                clearInterval(edgeScrollRef.current);
                edgeScrollRef.current = null;
            }
        };
        document.addEventListener('mousemove', onMouseMove);

        return () => {
            document.removeEventListener('fullscreenchange', onFSChange);
            document.removeEventListener('gamehover', onGameHover);
            document.removeEventListener('mousemove', onMouseMove);
            if (edgeScrollRef.current) clearInterval(edgeScrollRef.current);
        };
    }, []);

    return {
        // data
        games, setGames, groups, setGroups, uiConfig, setUiConfig, loading, toast,
        // ui
        layout, setLayout, isFullscreen, searchQuery, setSearchQuery, sortKey, setSortKey,
        // sidebar
        isSidebarOpen, setIsSidebarOpen, activeGroupId, setActiveGroupId,
        sidebarFocusIndex, setSidebarFocusIndex, sidebarRef,
        // modals
        selectedGame, setSelectedGame, showSettings, setShowSettings,
        settingsTab, setSettingsTab, showFolderPicker, setShowFolderPicker,
        showSgdb, setShowSgdb, cropTarget, setCropTarget,
        // picker
        pickerMode, setPickerMode, drives, setDrives, currentPath, setCurrentPath,
        folderList, setFolderList, fileList, setFileList,
        pickerFocusIndex, setPickerFocusIndex,
        // scan
        scanFolders, setScanFolders, isScanning, setIsScanning,
        isRescanning, setIsRescanning,
        // focus
        focusedIndex, setFocusedIndex, containerRef,
        // helpers
        filteredGames, showToast, hasModal, applyUiConfig,
    };
}
