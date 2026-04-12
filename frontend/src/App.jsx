/**
 * App.jsx — Root application component.
 * Orchestrates state (useAppState) + actions (useAppActions) + gamepad nav.
 * Max ~150 lines; all logic lives in hooks.
 */
import React, { useEffect, useMemo } from 'react';
import { useLocale } from './i18n/LocaleContext.jsx';
import { useGamepad } from './hooks/useGamepad.js';
import { useKeyboard } from './hooks/useKeyboard.js';
import { useAppState, SORT_OPTIONS_MAPPING, resetRandomSeed } from './hooks/useAppState.js';
import { useAppActions } from './hooks/useAppActions.js';

import { ImageCropper } from './ImageCropper.jsx';
import { COVERS_BASE } from './api/api.js';

import TopBar from './components/layout/TopBar.jsx';
import Sidebar from './components/layout/Sidebar.jsx';
import HeroBackground from './components/layout/HeroBackground.jsx';
import GameGrid from './components/game/GameGrid.jsx';
import GameModal from './components/game/GameModal.jsx';
import SettingsModal from './components/settings/SettingsModal.jsx';
import FolderPicker from './components/pickers/FolderPicker.jsx';
import SgdbModal from './components/sgdb/SgdbModal.jsx';

const SETTINGS_TABS = ['appearance', 'scanning', 'api', 'general'];

export default function App() {
    const { t }  = useLocale();
    const state  = useAppState();
    const actions = useAppActions({ state });

    const {
        games, groups, uiConfig, setUiConfig, loading, toast,
        layout, setLayout, isFullscreen, searchQuery, setSearchQuery, sortKey, setSortKey,
        isSidebarOpen, setIsSidebarOpen, activeGroupId, setActiveGroupId,
        sidebarFocusIndex, setSidebarFocusIndex, sidebarRef,
        selectedGame, setSelectedGame, showSettings, setShowSettings,
        settingsTab, setSettingsTab, showFolderPicker, setShowFolderPicker,
        showSgdb, setShowSgdb, cropTarget, setCropTarget,
        pickerMode, drives, currentPath, setCurrentPath, folderList, fileList,
        pickerFocusIndex, setPickerFocusIndex,
        scanFolders, setScanFolders, isScanning, isRescanning,
        focusedIndex, setFocusedIndex, containerRef,
        filteredGames, hasModal, applyUiConfig,
    } = state;

    const {
        sgdbLoading, playGame, removeGame, saveGameEdits,
        addGroup, removeGroup, openSettings, saveSettings, handleRemoveScanFolder,
        openFolderPicker, loadDirectory, navigateUp,
        handleConfirmFolder, handleFileSelect, handleRescanAll,
        handleImageFileSelect, handleCropDone,
        handleSgdbSearch, handleSgdbAction, toggleFullscreen,
    } = actions;

    // Sidebar scroll sync
    // Scroll focused card into view (grid / wide layouts)
    useEffect(() => {
        if (layout === 'ps' || hasModal()) return;
        const el = document.querySelector(`[data-game-index="${focusedIndex}"]`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }, [focusedIndex, layout]);

    useEffect(() => {
        if (isSidebarOpen && sidebarRef.current) {
            sidebarRef.current.children[sidebarFocusIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [sidebarFocusIndex, isSidebarOpen, sidebarRef]);

    // Modal navigator (gamepad)
    const navigateModal = (dir) => {
        const overlays = document.querySelectorAll('.modal-overlay');
        if (!overlays.length) return;
        const top = overlays[overlays.length - 1];
        const els = Array.from(top.querySelectorAll('button, input, select, [tabindex="0"]'))
            .filter(el => !el.disabled && el.offsetParent !== null && getComputedStyle(el).display !== 'none');
        if (!els.length) return;
        let idx = els.indexOf(document.activeElement);
        idx = idx === -1 ? 0 : (idx + dir + els.length) % els.length;
        els[idx]?.focus();
    };

    const pickerItemCount = folderList.length + (pickerMode === 'file' ? fileList.length : 0);

    /**
     * Compute actual column count using offsetTop of game cards.
     * containerRef.current IS the game-grid div; its children are cards in DOM order.
     * offsetTop is not affected by scroll position – same-row cards have identical values.
     */
    const getColCount = () => {
        if (layout === 'wide') return 1;
        if (layout === 'ps') return 0;
        if (!containerRef.current) return 1;
        const children = Array.from(containerRef.current.children);
        if (children.length < 2) return 1;
        const firstTop = children[0].offsetTop;
        let cols = 0;
        for (const child of children) {
            if (child.offsetTop === firstTop) cols++;
            else break;
        }
        return Math.max(1, cols);
    };

    useGamepad({
        onUp: () => {
            if (hasModal()) { showFolderPicker ? setPickerFocusIndex(p => Math.max(-1, p-1)) : navigateModal(-1); return; }
            if (isSidebarOpen) { setSidebarFocusIndex(p => Math.max(0, p-1)); return; }
            if (layout === 'ps') return;
            const cols = getColCount();
            setFocusedIndex(p => { const n = p - cols; return n >= 0 ? n : p; });
        },
        onDown: () => {
            if (hasModal()) { showFolderPicker ? setPickerFocusIndex(p => Math.min(pickerItemCount-1, p+1)) : navigateModal(1); return; }
            if (isSidebarOpen) { setSidebarFocusIndex(p => Math.min(groups.length+1, p+1)); return; }
            if (layout === 'ps') return;
            const cols = getColCount();
            setFocusedIndex(p => { const n = p + cols; return n < filteredGames.length ? n : p; });
        },
        onLeft:  () => { if (hasModal()) { navigateModal(-1); return; } if (layout==='wide'||isSidebarOpen) return; setFocusedIndex(p=>Math.max(0,p-1)); },
        onRight: () => { if (hasModal()) { navigateModal(1);  return; } if (layout==='wide'||isSidebarOpen) return; setFocusedIndex(p=>Math.min(filteredGames.length-1,p+1)); },
        onLB: () => { if (hasModal()) return; setIsSidebarOpen(v=>!v); setSidebarFocusIndex(0); },
        onRB: () => {
            if (!hasModal() && !isSidebarOpen) { const opts=SORT_OPTIONS_MAPPING(t); const i=opts.findIndex(s=>s.key===sortKey); const n=opts[(i+1)%opts.length]; resetRandomSeed(); setSortKey(n.key); return; }
            if (showSettings) setSettingsTab(tab => { const i=SETTINGS_TABS.indexOf(tab); return SETTINGS_TABS[(i+1)%SETTINGS_TABS.length]; });
        },
        onSelect: () => {
            if (showFolderPicker) {
                if (pickerFocusIndex>=0 && pickerFocusIndex<folderList.length) { loadDirectory(currentPath+(currentPath.endsWith('\\')?'':'\\')+folderList[pickerFocusIndex]); return; }
                if (pickerFocusIndex>=folderList.length) { const fi=pickerFocusIndex-folderList.length; if (fileList[fi]) { handleFileSelect(fileList[fi]); return; } }
                if (pickerMode==='folder' && pickerFocusIndex===-1) { handleConfirmFolder(); return; }
                return;
            }
            if (hasModal()) { const el=document.activeElement; if (el?.tagName!=='INPUT') el?.click(); return; }
            if (isSidebarOpen) {
                if (sidebarFocusIndex===0) setActiveGroupId(null);
                else if (sidebarFocusIndex===1) setActiveGroupId('uncategorized');
                else setActiveGroupId(groups[sidebarFocusIndex-2]?.id);
                setIsSidebarOpen(false); setFocusedIndex(0); return;
            }
            if (filteredGames[focusedIndex]) setSelectedGame(filteredGames[focusedIndex]);
        },
        onHoldA: () => {
            if (hasModal() || isSidebarOpen) return;
            if (filteredGames[focusedIndex]) playGame(filteredGames[focusedIndex].id);
        },
        onOptions: () => { if (!hasModal()&&!isSidebarOpen) { const g=filteredGames[focusedIndex]; if (g) setSelectedGame(g); } },
        onBack: () => {
            if (cropTarget) { setCropTarget(null); return; } if (showSgdb) { setShowSgdb(false); return; }
            if (selectedGame) { setSelectedGame(null); return; } if (showSettings) { setShowSettings(false); return; }
            if (showFolderPicker) { if (pickerFocusIndex>=0) { setPickerFocusIndex(-1); return; } navigateUp(); return; }
            if (isSidebarOpen) { setIsSidebarOpen(false); return; }
        },
    });

    // Keyboard navigation — identical callbacks, no duplication
    useKeyboard({
        onUp:    () => { if (hasModal()) { navigateModal(-1); return; } if (isSidebarOpen) { setSidebarFocusIndex(p => Math.max(0, p-1)); return; } if (layout === 'ps') return; const cols = getColCount(); setFocusedIndex(p => { const n = p - cols; return n >= 0 ? n : p; }); },
        onDown:  () => { if (hasModal()) { navigateModal(1);  return; } if (isSidebarOpen) { setSidebarFocusIndex(p => Math.min(groups.length+1, p+1)); return; } if (layout === 'ps') return; const cols = getColCount(); setFocusedIndex(p => { const n = p + cols; return n < filteredGames.length ? n : p; }); },
        onLeft:  () => { if (hasModal()) { navigateModal(-1); return; } if (layout==='wide'||isSidebarOpen) return; setFocusedIndex(p=>Math.max(0,p-1)); },
        onRight: () => { if (hasModal()) { navigateModal(1);  return; } if (layout==='wide'||isSidebarOpen) return; setFocusedIndex(p=>Math.min(filteredGames.length-1,p+1)); },
        onLB:    () => { if (hasModal()) return; setIsSidebarOpen(v=>!v); setSidebarFocusIndex(0); },
        onRB:    () => { if (!hasModal() && !isSidebarOpen) { const opts=SORT_OPTIONS_MAPPING(t); const i=opts.findIndex(s=>s.key===sortKey); const n=opts[(i+1)%opts.length]; resetRandomSeed(); setSortKey(n.key); } },
        onSelect: () => {
            if (showFolderPicker) { if (pickerMode==='folder' && pickerFocusIndex===-1) { handleConfirmFolder(); return; } return; }
            if (hasModal()) { const el=document.activeElement; if (el?.tagName!=='INPUT') el?.click(); return; }
            if (isSidebarOpen) { if (sidebarFocusIndex===0) setActiveGroupId(null); else if (sidebarFocusIndex===1) setActiveGroupId('uncategorized'); else setActiveGroupId(groups[sidebarFocusIndex-2]?.id); setIsSidebarOpen(false); setFocusedIndex(0); return; }
            if (filteredGames[focusedIndex]) setSelectedGame(filteredGames[focusedIndex]);
        },
        onHoldA: () => { if (hasModal() || isSidebarOpen) return; if (filteredGames[focusedIndex]) playGame(filteredGames[focusedIndex].id); },
        onBack:  () => { if (cropTarget) { setCropTarget(null); return; } if (showSgdb) { setShowSgdb(false); return; } if (selectedGame) { setSelectedGame(null); return; } if (showSettings) { setShowSettings(false); return; } if (showFolderPicker) { navigateUp(); return; } if (isSidebarOpen) { setIsSidebarOpen(false); return; } },
    });

    const focusedHero = useMemo(() => {
        const g = filteredGames[focusedIndex];
        if (!g) return 'none';
        if (g.hero)  return `url('${COVERS_BASE}/${g.hero}')`;
        if (g.cover) return `url('${COVERS_BASE}/${g.cover}')`;
        return 'none';
    }, [filteredGames, focusedIndex]);

    return (
        <div className="app-container">
            {layout === 'ps' && <HeroBackground src={focusedHero} />}

            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)}
                groups={groups} games={games} activeGroupId={activeGroupId}
                setActiveGroupId={setActiveGroupId} focusIndex={sidebarFocusIndex}
                onAddGroup={addGroup} onDeleteGroup={removeGroup} sidebarRef={sidebarRef} />

            <div className="main-content" style={{ display: layout==='ps'?'flex':'block', flexDirection:'column' }}>
                <TopBar layout={layout} setLayout={setLayout} isScanning={isScanning}
                    isRescanning={isRescanning} isFullscreen={isFullscreen}
                    sortKey={sortKey} setSortKey={sk => { resetRandomSeed(); setSortKey(sk); }}
                    searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                    onOpenSidebar={() => setIsSidebarOpen(true)} onOpenSettings={openSettings}
                    onOpenFolderPicker={openFolderPicker} onRescanAll={handleRescanAll}
                    onToggleFullscreen={toggleFullscreen} uiConfig={uiConfig} />

                <GameGrid games={filteredGames} layout={layout} focusedIndex={focusedIndex}
                    onOpen={setSelectedGame} onPlay={playGame} loading={loading} containerRef={containerRef} />

                {layout === 'ps' && filteredGames.length > 0 && (
                    <div style={{ margin: 'auto -24px -24px -24px', display:'flex', gap:'24px', justifyContent:'center', padding:'20px', background:'var(--bg-panel)', borderTop:'1px solid var(--border-subtle)', backdropFilter:'blur(10px)' }}>
                        {[['A',t('hints.details')],['A●',t('hints.play')],['LB',t('hints.categories')],['RB',t('hints.sorting')]].map(([btn,lbl]) => (
                            <span key={btn} style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'13px', fontWeight:500, color:'var(--text-main)' }}>
                                <span style={{ background:'var(--accent)', color:'#fff', borderRadius:'50%', width:'24px', height:'24px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:800 }}>{btn}</span>
                                {lbl}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {showFolderPicker && <FolderPicker pickerMode={pickerMode} drives={drives} currentPath={currentPath} setCurrentPath={setCurrentPath} folders={folderList} files={fileList} onClose={() => setShowFolderPicker(false)} onConfirmFolder={handleConfirmFolder} onFileSelect={handleFileSelect} onLoadDirectory={loadDirectory} onNavigateUp={navigateUp} gpFocusIndex={pickerFocusIndex} />}
            {showSettings && uiConfig && <SettingsModal uiConfig={uiConfig} setUiConfig={setUiConfig} scanFolders={scanFolders} onSave={saveSettings} onClose={() => setShowSettings(false)} onRemoveScanFolder={handleRemoveScanFolder} onOpenFolderPicker={openFolderPicker} applyUiConfig={applyUiConfig} activeTab={settingsTab} setActiveTab={setSettingsTab} />}
            {selectedGame && !showSgdb && !cropTarget && <GameModal game={selectedGame} groups={groups} onClose={() => setSelectedGame(null)} onPlay={playGame} onDelete={removeGame} onSave={p => saveGameEdits(selectedGame.id, p)} onOpenSgdb={() => setShowSgdb(true)} onImageFileSelect={handleImageFileSelect} />}
            {showSgdb && selectedGame && <SgdbModal game={selectedGame} onClose={() => setShowSgdb(false)} onSearch={handleSgdbSearch} onApply={handleSgdbAction} loading={sgdbLoading} />}
            {cropTarget && <ImageCropper image={cropTarget.dataUrl} aspect={cropTarget.type==='cover'?2/3:16/9} onCancel={() => setCropTarget(null)} onCropDone={handleCropDone} />}
            {toast && <div className="toast">{toast}</div>}
        </div>
    );
}
