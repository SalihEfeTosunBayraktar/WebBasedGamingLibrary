import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGamepad } from './hooks/useGamepad.js';
import { ImageCropper } from './ImageCropper.jsx';
import { useLocale } from './i18n/LocaleContext.jsx';

import TopBar, { SORT_KEY_LIST } from './components/layout/TopBar.jsx';
import Sidebar from './components/layout/Sidebar.jsx';
import GameGrid from './components/game/GameGrid.jsx';
import GameModal from './components/game/GameModal.jsx';
import SettingsModal from './components/settings/SettingsModal.jsx';
import FolderPicker from './components/pickers/FolderPicker.jsx';
import SgdbModal from './components/sgdb/SgdbModal.jsx';

import {
    fetchGames, addGame, updateGame, deleteGame as apiDeleteGame, launchGame as apiLaunchGame,
    uploadCover, uploadHero,
    fetchConfig, saveConfig as apiSaveConfig,
    fetchGroups, createGroup as apiCreateGroup, deleteGroup as apiDeleteGroup,
    fetchScanFolders, removeScanFolder as apiRemoveScanFolder,
    scanFolder as apiScanFolder, rescanAll as apiRescanAll,
    fetchDrives, fetchDirectory,
    sgdbSearch, sgdbGetGame, sgdbApply,
    COVERS_BASE,
} from './api/api.js';

// ─── Sorting helper ───────────────────────────────────────────────────────────
let _randomSeed = Math.random();
function applySorting(games, sortKey, groups) {
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
            // Seeded shuffle so it doesn't change every render
            const seeded = copy.map((v, i) => ({ v, r: Math.abs(Math.sin(_randomSeed + i)) }));
            return seeded.sort((a, b) => a.r - b.r).map(x => x.v);
        }
        default: return copy.sort((a, b) => a.name.localeCompare(b.name));
    }
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
    const { t } = useLocale();

    // Core data
    const [games, setGames] = useState([]);
    const [groups, setGroups] = useState([]);
    const [uiConfig, setUiConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState('');

    // UI state
    const [layout, setLayout] = useState('grid');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortKey, setSortKey] = useState('name_asc');

    // Sidebar
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeGroupId, setActiveGroupId] = useState(null);
    const [sidebarFocusIndex, setSidebarFocusIndex] = useState(0);
    const sidebarRef = useRef(null);

    // Modals
    const [selectedGame, setSelectedGame] = useState(null);
    const [showSettings, setShowSettings] = useState(false);
    const [settingsTab, setSettingsTab] = useState('appearance');
    const [showFolderPicker, setShowFolderPicker] = useState(false);
    const [showSgdb, setShowSgdb] = useState(false);
    const [cropTarget, setCropTarget] = useState(null);

    // Folder picker state
    const [pickerMode, setPickerMode] = useState('folder');
    const [drives, setDrives] = useState([]);
    const [currentPath, setCurrentPath] = useState('');
    const [folderList, setFolderList] = useState([]);
    const [fileList, setFileList] = useState([]);
    const [pickerFocusIndex, setPickerFocusIndex] = useState(-1);

    // Settings
    const [scanFolders, setScanFolders] = useState([]);

    // Scan state
    const [isScanning, setIsScanning] = useState(false);
    const [isRescanning, setIsRescanning] = useState(false);

    // Gamepad focus
    const [focusedIndex, setFocusedIndex] = useState(0);
    const containerRef = useRef(null);

    // ── Derived: filtered + sorted game list ─────────────────────────────────
    const filteredGames = React.useMemo(() => {
        const filtered = games.filter(g =>
            g.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
            (activeGroupId === null ? true : (activeGroupId === 'uncategorized' ? !g.groupId : g.groupId === activeGroupId))
        );
        return applySorting(filtered, sortKey, groups);
    }, [games, searchQuery, activeGroupId, sortKey, groups]);

    // ── Toast ────────────────────────────────────────────────────────────────
    const showToast = useCallback((msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3000);
    }, []);

    // ── CSS variable application ──────────────────────────────────────────────
    const applyUiConfig = useCallback((cfg) => {
        if (!cfg) return;
        const root = document.documentElement;
        const set = (k, v) => { if (v !== undefined) root.style.setProperty(k, v); };

        const hexToRgb = (hex) => {
            if (!hex || !hex.startsWith('#')) return null;
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `${r}, ${g}, ${b}`;
        };

        // Core color tokens
        set('--bg-dark',      cfg.bgDark);
        const rgb = hexToRgb(cfg.bgDark);
        if (rgb) set('--bg-dark-rgb', rgb);

        set('--bg-card',      cfg.bgCard);
        set('--bg-card-hover',cfg.bgCardHover);
        set('--text-main',    cfg.textMain);
        set('--text-muted',   cfg.textMuted);
        set('--accent',       cfg.accent);
        set('--accent-hover', cfg.accentHover);
        set('--play-btn',     cfg.playBtnColor);
        set('--danger',       cfg.danger);
        if (cfg.playBtnOpacity !== undefined) set('--play-btn-opacity', cfg.playBtnOpacity);

        // Surface/panel tokens (light vs dark themes)
        set('--bg-panel',        cfg.bgPanel);
        set('--bg-surface',      cfg.bgSurface);
        set('--bg-input',        cfg.bgInput);
        set('--border-subtle',   cfg.borderSubtle);
        set('--border-base',     cfg.borderBase);
        set('--overlay-bg',      cfg.overlayBg);
        set('--scrollbar-thumb', cfg.scrollbarThumb);

        if (cfg.fontFamily) document.body.style.fontFamily = `'${cfg.fontFamily}', -apple-system, sans-serif`;
        if (cfg.layout) setLayout(cfg.layout);
    }, []);

    // ── Initial load ──────────────────────────────────────────────────────────
    useEffect(() => {
        (async () => {
            try {
                const [g, cfg, gr] = await Promise.all([fetchGames(), fetchConfig(), fetchGroups()]);
                setGames(g || []);
                setUiConfig(cfg);
                setGroups(gr || []);
                applyUiConfig(cfg);
                if (cfg.layout) setLayout(cfg.layout);
            } catch {
                showToast(t('toast.serverDown'));
            } finally {
                setLoading(false);
            }
        })();

        const onFSChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', onFSChange);

        // GameCard hover events
        const onGameHover = (e) => setFocusedIndex(e.detail.index);
        document.addEventListener('gamehover', onGameHover);

        return () => {
            document.removeEventListener('fullscreenchange', onFSChange);
            document.removeEventListener('gamehover', onGameHover);
        };
    }, []);

    // ── Game actions ──────────────────────────────────────────────────────────
    const refreshGames = async () => {
        const g = await fetchGames();
        setGames(g || []);
        return g;
    };

    const playGame = async (id) => {
        showToast(t('toast.launching'));
        try { await apiLaunchGame(id); } catch { showToast(t('toast.launchFail')); }
    };

    const removeGame = async (id) => {
        if (!confirm(t('gameView.confirmRemove'))) return;
        await apiDeleteGame(id);
        setSelectedGame(null);
        await refreshGames();
        showToast(t('toast.removed'));
    };

    const saveGameEdits = async (gameId, payload) => {
        await updateGame(gameId, payload);
        showToast(t('toast.updated'));
        const g = await refreshGames();
        const updated = g.find(x => x.id === gameId);
        if (updated) setSelectedGame(updated);
    };

    // ── Group actions ─────────────────────────────────────────────────────────
    const addGroup = async () => {
        const name = prompt(t('sidebar.newCategoryPrompt'));
        if (!name) return;
        const newGroup = await apiCreateGroup(name);
        setGroups(prev => [...prev, newGroup]);
        showToast(t('sidebar.categoryCreated'));
    };

    const removeGroup = async (id) => {
        if (!confirm(t('sidebar.confirmDelete'))) return;
        await apiDeleteGroup(id);
        if (activeGroupId === id) setActiveGroupId(null);
        setGroups(prev => prev.filter(g => g.id !== id));
        await refreshGames();
    };

    // ── Settings actions ──────────────────────────────────────────────────────
    const openSettings = async () => {
        setShowSettings(true);
        try {
            const folders = await fetchScanFolders();
            setScanFolders(folders);
        } catch {}
    };

    const saveSettings = async () => {
        try {
            showToast(t('settings.saving'));
            const saved = await apiSaveConfig(uiConfig);
            applyUiConfig(saved);
            setShowSettings(false);
            showToast(t('settings.saved'));
        } catch {
            showToast(t('settings.saveError'));
        }
    };

    const handleRemoveScanFolder = async (path) => {
        const res = await apiRemoveScanFolder(path);
        setScanFolders(res.folders || []);
        showToast(t('scanning.folderRemoved'));
    };

    // ── Folder picker ─────────────────────────────────────────────────────────
    const openFolderPicker = async (mode = 'folder') => {
        setPickerMode(mode);
        setPickerFocusIndex(-1);
        setShowFolderPicker(true);
        try {
            const d = await fetchDrives();
            setDrives(d);
            const base = (uiConfig?.lastPickerPath) || d[0];
            await loadDirectory(base, mode);
        } catch {
            showToast(t('picker.drivesError'));
        }
    };

    const loadDirectory = async (pathStr, modeOverride = pickerMode) => {
        setCurrentPath(pathStr);
        setPickerFocusIndex(-1);
        try {
            const res = await fetchDirectory(pathStr, modeOverride === 'file');
            setFolderList(res.folders || []);
            setFileList(res.files || []);
        } catch {
            showToast(t('picker.accessDenied'));
            setFolderList([]);
            setFileList([]);
        }
    };

    const navigateUp = () => {
        const parts = currentPath.split('\\').filter(Boolean);
        if (parts.length <= 1) loadDirectory(parts[0] + '\\');
        else { parts.pop(); loadDirectory(parts.join('\\') + '\\'); }
    };

    const handleConfirmFolder = async () => {
        setShowFolderPicker(false);
        if (uiConfig) {
            const newCfg = { ...uiConfig, lastPickerPath: currentPath };
            setUiConfig(newCfg);
            apiSaveConfig(newCfg).catch(() => {});
        }
        handleScanPath(currentPath);
    };

    const handleFileSelect = async (fileName) => {
        setShowFolderPicker(false);
        if (uiConfig) {
            const newCfg = { ...uiConfig, lastPickerPath: currentPath };
            setUiConfig(newCfg);
            apiSaveConfig(newCfg).catch(() => {});
        }
        let cleanName = fileName.replace('.exe', '').replace(/[-_.]/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase();
        const gameName = prompt(t('gameEdit.gameName') + ':', cleanName);
        if (!gameName) return;
        try {
            showToast(t('toast.addingGame'));
            await addGame({ name: gameName, path: currentPath, exe: fileName });
            showToast(t('toast.gameAdded'));
            await refreshGames();
        } catch { showToast(t('toast.addError')); }
    };

    const handleScanPath = async (folderPath) => {
        setIsScanning(true);
        try {
            showToast(t('toast.scanning') + folderPath);
            const res = await apiScanFolder(folderPath);
            showToast(res.added + t('toast.scanned'));
            await refreshGames();
        } catch { showToast(t('toast.scanError')); } finally { setIsScanning(false); }
    };

    const handleRescanAll = async () => {
        setIsRescanning(true);
        try {
            showToast(t('toast.rescanning'));
            const res = await apiRescanAll();
            showToast(res.added + t('toast.rescanned'));
            await refreshGames();
        } catch { showToast(t('toast.rescanError')); } finally { setIsRescanning(false); }
    };

    // ── Image / Crop ──────────────────────────────────────────────────────────
    const handleImageFileSelect = (e, type) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setCropTarget({ dataUrl: reader.result, type });
        reader.readAsDataURL(file);
        e.target.value = null;
    };

    const handleCropDone = async (blob) => {
        if (!cropTarget || !selectedGame) return;
        const formData = new FormData();
        formData.append(cropTarget.type, blob, 'upload.jpg');
        try {
            showToast(t('toast.loading'));
            if (cropTarget.type === 'cover') await uploadCover(selectedGame.id, formData);
            else await uploadHero(selectedGame.id, formData);
            showToast(t('toast.uploaded'));
            const g = await refreshGames();
            const updated = g.find(x => x.id === selectedGame.id);
            if (updated) setSelectedGame(updated);
        } catch { showToast(t('toast.uploadFail')); }
        setCropTarget(null);
    };

    // ── SGDB ─────────────────────────────────────────────────────────────────
    const [sgdbLoading, setSgdbLoading] = useState(false);

    const handleSgdbSearch = async (query) => {
        if (!uiConfig?.steamGridApiKey) { showToast(t('sgdb.needApiKey')); return null; }
        setSgdbLoading(true);
        try { return await sgdbSearch(query); } catch { showToast(t('sgdb.searchError')); return null; } finally { setSgdbLoading(false); }
    };

    // Called by SgdbModal with two different signatures:
    // (gameId, null, null)         → fetch images for game
    // (null, 'cover'|'hero', url) → apply image
    const handleSgdbAction = async (gameId, type, url) => {
        setSgdbLoading(true);
        try {
            if (gameId && !type && !url) {
                return await sgdbGetGame(gameId);
            } else if (type && url && selectedGame) {
                await sgdbApply(selectedGame.id, type, url);
                showToast(t('toast.applied'));
                const g = await refreshGames();
                const updated = g.find(x => x.id === selectedGame.id);
                if (updated) setSelectedGame(updated);
            }
        } catch { showToast(t('sgdb.applyError')); }
        finally { setSgdbLoading(false); }
    };

    // ── Fullscreen ────────────────────────────────────────────────────────────
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
        else document.exitFullscreen?.();
    };

    // ── Modal detection helpers ───────────────────────────────────────────────
    const hasModal = () => selectedGame || showSettings || showFolderPicker || showSgdb || cropTarget;

    // ── Gamepad navigation ────────────────────────────────────────────────────
    const SETTINGS_TABS = ['appearance', 'scanning', 'api', 'general'];

    const navigateModal = (dir) => {
        const overlays = document.querySelectorAll('.modal-overlay');
        if (!overlays.length) return;
        const top = overlays[overlays.length - 1];
        const els = Array.from(top.querySelectorAll('button, input, select, [tabindex="0"]'))
            .filter(el => !el.disabled && el.offsetParent !== null && getComputedStyle(el).display !== 'none');
        if (!els.length) return;
        let idx = els.indexOf(document.activeElement);
        if (idx === -1) idx = 0;
        else { idx = (idx + dir + els.length) % els.length; }
        els[idx]?.focus();
    };

    // Picker items count
    const pickerItemCount = folderList.length + (pickerMode === 'file' ? fileList.length : 0);

    useGamepad({
        onUp: () => {
            if (hasModal()) {
                if (showFolderPicker) { setPickerFocusIndex(p => Math.max(-1, p - 1)); return; }
                navigateModal(-1); return;
            }
            if (isSidebarOpen) { setSidebarFocusIndex(p => Math.max(0, p - 1)); return; }
            setFocusedIndex(p => {
                if (layout === 'ps') return p;
                const cols = layout === 'grid' && containerRef.current ? Math.floor(containerRef.current.offsetWidth / 224) || 1 : 1;
                const next = p - cols;
                return next >= 0 ? next : p;
            });
        },
        onDown: () => {
            if (hasModal()) {
                if (showFolderPicker) { setPickerFocusIndex(p => Math.min(pickerItemCount - 1, p + 1)); return; }
                navigateModal(1); return;
            }
            if (isSidebarOpen) { setSidebarFocusIndex(p => Math.min(groups.length + 1, p + 1)); return; }
            setFocusedIndex(p => {
                if (layout === 'ps') return p;
                const cols = layout === 'grid' && containerRef.current ? Math.floor(containerRef.current.offsetWidth / 224) || 1 : 1;
                const next = p + cols;
                return next < filteredGames.length ? next : p;
            });
        },
        onLeft: () => {
            if (hasModal()) { navigateModal(-1); return; }
            if (layout === 'wide' || isSidebarOpen) return;
            if (layout === 'ps') setFocusedIndex(p => Math.max(0, p - 1));
            else setFocusedIndex(p => Math.max(0, p - 1));
        },
        onRight: () => {
            if (hasModal()) { navigateModal(1); return; }
            if (layout === 'wide' || isSidebarOpen) return;
            setFocusedIndex(p => Math.min(filteredGames.length - 1, p + 1));
        },
        onLB: () => {
            if (hasModal()) return;
            setIsSidebarOpen(v => !v);
            setSidebarFocusIndex(0);
        },
        onRB: () => {
            // Cycle sort options from main view
            if (!hasModal() && !isSidebarOpen) {
                const idx = SORT_OPTIONS.findIndex(s => s.key === sortKey);
                const next = SORT_OPTIONS[(idx + 1) % SORT_OPTIONS.length];
                setSortKey(next.key);
                showToast(`Sıralama: ${next.label}`);
                return;
            }
            // Cycle settings tabs
            if (showSettings) {
                setSettingsTab(tab => {
                    const i = SETTINGS_TABS.indexOf(tab);
                    return SETTINGS_TABS[(i + 1) % SETTINGS_TABS.length];
                });
            }
        },
        onSelect: () => { // A
            if (showFolderPicker) {
                if (pickerFocusIndex >= 0 && pickerFocusIndex < folderList.length) {
                    loadDirectory(currentPath + (currentPath.endsWith('\\') ? '' : '\\') + folderList[pickerFocusIndex]);
                    return;
                }
                if (pickerFocusIndex >= folderList.length) {
                    const fileIdx = pickerFocusIndex - folderList.length;
                    if (fileList[fileIdx]) { handleFileSelect(fileList[fileIdx]); return; }
                }
                if (pickerMode === 'folder' && pickerFocusIndex === -1) { handleConfirmFolder(); return; }
                return;
            }
            if (hasModal()) {
                const el = document.activeElement;
                if (el && typeof el.click === 'function') {
                    if (el.tagName === 'INPUT') return;
                    el.click();
                }
                return;
            }
            if (isSidebarOpen) {
                if (sidebarFocusIndex === 0) setActiveGroupId(null);
                else if (sidebarFocusIndex === 1) setActiveGroupId('uncategorized');
                else setActiveGroupId(groups[sidebarFocusIndex - 2]?.id);
                setIsSidebarOpen(false);
                setFocusedIndex(0);
                return;
            }
            // Quick play from main view
            if (filteredGames[focusedIndex]) playGame(filteredGames[focusedIndex].id);
        },
        onOptions: () => { // Y
            if (hasModal() || isSidebarOpen) return;
            const game = filteredGames[focusedIndex];
            if (game) setSelectedGame(game);
        },
        onBack: () => { // B
            if (cropTarget) { setCropTarget(null); return; }
            if (showSgdb) { setShowSgdb(false); return; }
            if (selectedGame) { setSelectedGame(null); return; }
            if (showSettings) { setShowSettings(false); return; }
            if (showFolderPicker) {
                if (pickerFocusIndex >= 0) { setPickerFocusIndex(-1); return; }
                navigateUp(); return;
            }
            if (isSidebarOpen) { setIsSidebarOpen(false); return; }
        },
    });

    // ── Hero background for PS layout ─────────────────────────────────────────
    const focusedHero = (() => {
        const g = filteredGames[focusedIndex];
        if (!g) return 'none';
        if (g.hero) return `url('${COVERS_BASE}/${g.hero}?t=${Date.now()}')`;
        if (g.cover) return `url('${COVERS_BASE}/${g.cover}?t=${Date.now()}')`;
        return 'none';
    })();

    // ── Sidebar scroll sync ───────────────────────────────────────────────────
    useEffect(() => {
        if (isSidebarOpen && sidebarRef.current) {
            const children = sidebarRef.current.children;
            children[sidebarFocusIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [sidebarFocusIndex, isSidebarOpen]);

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="app-container">
            {/* PS mode background */}
            {layout === 'ps' && (
                <div className="hero-background" style={{ backgroundImage: focusedHero }} />
            )}

            {/* Sidebar */}
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                groups={groups}
                games={games}
                activeGroupId={activeGroupId}
                setActiveGroupId={setActiveGroupId}
                focusIndex={sidebarFocusIndex}
                onAddGroup={addGroup}
                onDeleteGroup={removeGroup}
                sidebarRef={sidebarRef}
            />

            {/* Main content */}
            <div className="main-content" style={{ display: layout === 'ps' ? 'flex' : 'block', flexDirection: 'column' }}>
                <TopBar
                    layout={layout} setLayout={setLayout}
                    isScanning={isScanning} isRescanning={isRescanning}
                    isFullscreen={isFullscreen}
                    sortKey={sortKey} setSortKey={sk => { _randomSeed = Math.random(); setSortKey(sk); }}
                    searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                    onOpenSidebar={() => setIsSidebarOpen(true)}
                    onOpenSettings={openSettings}
                    onOpenFolderPicker={openFolderPicker}
                    onRescanAll={handleRescanAll}
                    onToggleFullscreen={toggleFullscreen}
                    uiConfig={uiConfig}
                    saveConfigFn={apiSaveConfig}
                />

                <GameGrid
                    games={filteredGames}
                    layout={layout}
                    focusedIndex={focusedIndex}
                    onOpen={setSelectedGame}
                    onPlay={playGame}
                    loading={loading}
                    containerRef={containerRef}
                />

                {/* PS mode gamepad hints */}
                {layout === 'ps' && filteredGames.length > 0 && (
                    <div style={{ marginTop: 'auto', display: 'flex', gap: '24px', justifyContent: 'center', opacity: 0.8, padding: '20px', background: 'var(--bg-panel)', borderTop: '1px solid var(--border-subtle)', backdropFilter: 'blur(10px)' }}>
                        {[['A', t('hints.play')], ['Y', t('hints.details')], ['LB', t('hints.categories')], ['RB', t('hints.sorting')]].map(([btn, lbl]) => (
                            <span key={btn} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 500, color: 'var(--text-main)' }}>
                                <span style={{ background: 'var(--accent)', color: '#fff', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>{btn}</span>
                                {lbl}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Modals ── */}

            {showFolderPicker && (
                <FolderPicker
                    pickerMode={pickerMode}
                    drives={drives}
                    currentPath={currentPath} setCurrentPath={setCurrentPath}
                    folders={folderList} files={fileList}
                    onClose={() => setShowFolderPicker(false)}
                    onConfirmFolder={handleConfirmFolder}
                    onFileSelect={handleFileSelect}
                    onLoadDirectory={loadDirectory}
                    onNavigateUp={navigateUp}
                    gpFocusIndex={pickerFocusIndex}
                />
            )}

            {showSettings && uiConfig && (
                <SettingsModal
                    uiConfig={uiConfig} setUiConfig={setUiConfig}
                    scanFolders={scanFolders}
                    onSave={saveSettings}
                    onClose={() => setShowSettings(false)}
                    onRemoveScanFolder={handleRemoveScanFolder}
                    onOpenFolderPicker={openFolderPicker}
                    applyUiConfig={applyUiConfig}
                    activeTab={settingsTab}
                    setActiveTab={setSettingsTab}
                />
            )}

            {selectedGame && !showSgdb && !cropTarget && (
                <GameModal
                    game={selectedGame}
                    groups={groups}
                    onClose={() => setSelectedGame(null)}
                    onPlay={playGame}
                    onDelete={removeGame}
                    onSave={(payload) => saveGameEdits(selectedGame.id, payload)}
                    onOpenSgdb={(q) => { setShowSgdb(true); }}
                    onImageFileSelect={handleImageFileSelect}
                />
            )}

            {showSgdb && selectedGame && (
                <SgdbModal
                    game={selectedGame}
                    onClose={() => setShowSgdb(false)}
                    onSearch={handleSgdbSearch}
                    onApply={handleSgdbAction}
                    loading={sgdbLoading}
                />
            )}

            {cropTarget && (
                <ImageCropper
                    image={cropTarget.dataUrl}
                    aspect={cropTarget.type === 'cover' ? 2 / 3 : 16 / 9}
                    onCancel={() => setCropTarget(null)}
                    onCropDone={handleCropDone}
                />
            )}

            {/* Toast */}
            {toast && <div className="toast">{toast}</div>}
        </div>
    );
}
