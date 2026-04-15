import React, { useMemo } from 'react';
import { useLocale } from '../../i18n/LocaleContext.jsx';
import { COVERS_BASE } from '../../api/api.js';

import TopBar from './TopBar.jsx';
import Sidebar from './Sidebar.jsx';
import HeroBackground from './HeroBackground.jsx';
import GameGrid from '../game/GameGrid.jsx';
import GameModal from '../game/GameModal.jsx';
import SettingsModal from '../settings/SettingsModal.jsx';
import FolderPicker from '../pickers/FolderPicker.jsx';
import SgdbModal from '../sgdb/SgdbModal.jsx';
import { ImageCropper } from '../../ImageCropper.jsx';

export default function AppLayout({ state, actions }) {
    const { t } = useLocale();

    const {
        games, groups, uiConfig, setUiConfig, loading, toast,
        layout, setLayout, isFullscreen, searchQuery, setSearchQuery, sortKey, setSortKey,
        isSidebarOpen, setIsSidebarOpen, activeGroupId, setActiveGroupId,
        sidebarFocusIndex, sidebarRef,
        selectedGame, setSelectedGame, showSettings, setShowSettings,
        settingsTab, setSettingsTab, showFolderPicker, setShowFolderPicker,
        showSgdb, setShowSgdb, cropTarget, setCropTarget,
        pickerMode, drives, currentPath, setCurrentPath, folderList, fileList,
        pickerFocusIndex, scanFolders, isScanning, isRescanning,
        focusedIndex, containerRef, filteredGames
    } = state;

    const {
        sgdbLoading, playGame, removeGame, saveGameEdits,
        addGroup, removeGroup, openSettings, saveSettings, handleRemoveScanFolder,
        openFolderPicker, loadDirectory, navigateUp,
        handleConfirmFolder, handleFileSelect, handleRescanAll,
        handleImageFileSelect, handleCropDone,
        handleSgdbSearch, handleSgdbAction, toggleFullscreen, applyUiConfig
    } = actions;

    const focusedHero = useMemo(() => {
        const g = filteredGames[focusedIndex];
        if (!g) return 'none';
        if (g.hero) return `url('${COVERS_BASE}/${g.hero}')`;
        if (g.cover) return `url('${COVERS_BASE}/${g.cover}')`;
        return 'none';
    }, [filteredGames, focusedIndex]);

    return (
        <div className="app-container">
            {layout === 'ps' && <HeroBackground src={focusedHero} brightness={uiConfig?.heroBrightness} />}

            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)}
                groups={groups} games={games} activeGroupId={activeGroupId}
                setActiveGroupId={setActiveGroupId} focusIndex={sidebarFocusIndex}
                onAddGroup={addGroup} onDeleteGroup={removeGroup} sidebarRef={sidebarRef}
                uiConfig={uiConfig} />

            <div className="main-content" style={{ display: layout === 'ps' ? 'flex' : 'block', flexDirection: 'column' }}>
                <TopBar layout={layout} setLayout={setLayout} isScanning={isScanning}
                    isRescanning={isRescanning} isFullscreen={isFullscreen}
                    sortKey={sortKey} setSortKey={sk => { actions.resetRandomSeed?.(); setSortKey(sk); }}
                    searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                    onOpenSidebar={() => setIsSidebarOpen(true)} onOpenSettings={openSettings}
                    onOpenFolderPicker={openFolderPicker} onRescanAll={handleRescanAll}
                    onToggleFullscreen={toggleFullscreen} uiConfig={uiConfig} />

                <GameGrid games={filteredGames} layout={layout} focusedIndex={focusedIndex}
                    onOpen={setSelectedGame} onPlay={playGame} loading={loading} containerRef={containerRef} />

                {layout === 'ps' && filteredGames.length > 0 && (
                    <div className="ps-bottom-bar">
                        {(state.isGamepadConnected === 'ps'
                            ? [['✖', t('hints.details')], ['✖●', t('hints.play')], ['L1', t('hints.categories')], ['R1', t('hints.sorting')]]
                            : state.isGamepadConnected === 'xbox'
                            ? [['A', t('hints.details')], ['A●', t('hints.play')], ['LB', t('hints.categories')], ['RB', t('hints.sorting')]]
                            : [['Enter', t('hints.details')], ['Enter●', t('hints.play')], ['Q', t('hints.categories')], ['E', t('hints.sorting')]]
                        ).map(([btn, lbl]) => (
                            <span key={btn} className="ps-btn-hint">
                                <span className="ps-btn-icon">{btn}</span>
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
            {cropTarget && <ImageCropper image={cropTarget.dataUrl} aspect={cropTarget.type === 'cover' ? 2 / 3 : 16 / 9} onCancel={() => setCropTarget(null)} onCropDone={handleCropDone} />}
            {toast && <div className="toast">{toast}</div>}
        </div>
    );
}
