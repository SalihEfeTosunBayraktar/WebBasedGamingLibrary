/**
 * useAppActions.js — Game, group, settings, scan, image and SGDB action handlers for App.
 */
import { useState } from 'react';
import { useLocale } from '../i18n/LocaleContext.jsx';
import {
    fetchGames, addGame, updateGame, deleteGame as apiDeleteGame,
    launchGame as apiLaunchGame, uploadCover, uploadHero,
    saveConfig as apiSaveConfig,
    fetchGroups, createGroup as apiCreateGroup, deleteGroup as apiDeleteGroup,
    fetchScanFolders, removeScanFolder as apiRemoveScanFolder,
    scanFolder as apiScanFolder, rescanAll as apiRescanAll,
    fetchDrives, fetchDirectory,
    sgdbSearch, sgdbGetGame, sgdbApply,
} from '../api/api.js';

export function useAppActions({ state }) {
    const { t } = useLocale();
    const {
        showToast, applyUiConfig, uiConfig, setUiConfig,
        setGames, setGroups, setActiveGroupId, setSelectedGame,
        setShowSettings, setShowFolderPicker, setShowSgdb, setCropTarget,
        selectedGame, pickerMode, currentPath, setCurrentPath,
        setPickerMode, setDrives, setFolderList, setFileList,
        setPickerFocusIndex, setScanFolders, setIsScanning, setIsRescanning,
    } = state;

    const [sgdbLoading, setSgdbLoading] = useState(false);

    // ── Game CRUD ─────────────────────────────────────────────────────────────
    const refreshGames = async () => {
        const g = await fetchGames();
        setGames(g || []);
        return g || [];
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

    // ── Groups ────────────────────────────────────────────────────────────────
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
        setActiveGroupId(prev => prev === id ? null : prev);
        setGroups(prev => prev.filter(g => g.id !== id));
        await refreshGames();
    };

    // ── Settings ──────────────────────────────────────────────────────────────
    const openSettings = async () => {
        setShowSettings(true);
        try { setScanFolders(await fetchScanFolders()); } catch {}
    };

    const saveSettings = async () => {
        try {
            showToast(t('settings.saving'));
            const saved = await apiSaveConfig(uiConfig);
            applyUiConfig(saved);
            setShowSettings(false);
            showToast(t('settings.saved'));
        } catch { showToast(t('settings.saveError')); }
    };

    const handleRemoveScanFolder = async (path) => {
        const res = await apiRemoveScanFolder(path);
        setScanFolders(res.folders || []);
        showToast(t('scanning.folderRemoved'));
    };

    // ── Folder picker ─────────────────────────────────────────────────────────
    const loadDirectory = async (pathStr, modeOverride = pickerMode) => {
        setCurrentPath(pathStr);
        setPickerFocusIndex(-1);
        try {
            const res = await fetchDirectory(pathStr, modeOverride === 'file');
            setFolderList(res.folders || []);
            setFileList(res.files || []);
        } catch { showToast(t('picker.accessDenied')); setFolderList([]); setFileList([]); }
    };

    const openFolderPicker = async (mode = 'folder') => {
        setPickerMode(mode); setPickerFocusIndex(-1); setShowFolderPicker(true);
        try {
            const d = await fetchDrives();
            setDrives(d);
            await loadDirectory(uiConfig?.lastPickerPath || d[0], mode);
        } catch { showToast(t('picker.drivesError')); }
    };

    const navigateUp = () => {
        const parts = currentPath.split('\\').filter(Boolean);
        if (parts.length <= 1) loadDirectory(parts[0] + '\\');
        else { parts.pop(); loadDirectory(parts.join('\\') + '\\'); }
    };

    const handleConfirmFolder = async () => {
        setShowFolderPicker(false);
        if (uiConfig) { const c = { ...uiConfig, lastPickerPath: currentPath }; setUiConfig(c); apiSaveConfig(c).catch(() => {}); }
        handleScanPath(currentPath);
    };

    const handleFileSelect = async (fileName) => {
        setShowFolderPicker(false);
        if (uiConfig) { const c = { ...uiConfig, lastPickerPath: currentPath }; setUiConfig(c); apiSaveConfig(c).catch(() => {}); }
        const clean = fileName.replace('.exe','').replace(/[-_.]/g,' ').replace(/\s+/g,' ').trim().toUpperCase();
        const gameName = prompt(t('gameEdit.gameName') + ':', clean);
        if (!gameName) return;
        try {
            showToast(t('toast.addingGame'));
            await addGame({ name: gameName, path: currentPath, exe: fileName });
            showToast(t('toast.gameAdded'));
            await refreshGames();
        } catch { showToast(t('toast.addError')); }
    };

    // ── Scan ─────────────────────────────────────────────────────────────────
    const handleScanPath = async (folderPath) => {
        setIsScanning(true);
        try { const res = await apiScanFolder(folderPath); showToast(res.added + t('toast.scanned')); await refreshGames(); }
        catch { showToast(t('toast.scanError')); }
        finally { setIsScanning(false); }
    };

    const handleRescanAll = async () => {
        setIsRescanning(true);
        try { const res = await apiRescanAll(); showToast(res.added + t('toast.rescanned')); await refreshGames(); }
        catch { showToast(t('toast.rescanError')); }
        finally { setIsRescanning(false); }
    };

    // ── Image / Crop ──────────────────────────────────────────────────────────
    const handleImageFileSelect = (e, type) => {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setCropTarget({ dataUrl: reader.result, type });
        reader.readAsDataURL(file); e.target.value = null;
    };

    const handleCropDone = async (blob) => {
        if (!selectedGame) return;
        const formData = new FormData();
        const { cropTarget: ct } = state;
        formData.append(ct.type, blob, 'upload.jpg');
        try {
            showToast(t('toast.loading'));
            if (ct.type === 'cover') await uploadCover(selectedGame.id, formData);
            else await uploadHero(selectedGame.id, formData);
            showToast(t('toast.uploaded'));
            const g = await refreshGames();
            const updated = g.find(x => x.id === selectedGame.id);
            if (updated) setSelectedGame(updated);
        } catch { showToast(t('toast.uploadFail')); }
        setCropTarget(null);
    };

    // ── SGDB ──────────────────────────────────────────────────────────────────
    const handleSgdbSearch = async (query) => {
        if (!uiConfig?.steamGridApiKey) { showToast(t('sgdb.needApiKey')); return null; }
        setSgdbLoading(true);
        try { return await sgdbSearch(query); } catch { showToast(t('sgdb.searchError')); return null; }
        finally { setSgdbLoading(false); }
    };

    const handleSgdbAction = async (gameId, type, url) => {
        setSgdbLoading(true);
        try {
            if (gameId && !type && !url) return await sgdbGetGame(gameId);
            if (type && url && selectedGame) {
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

    return {
        sgdbLoading, refreshGames, playGame, removeGame, saveGameEdits,
        addGroup, removeGroup, openSettings, saveSettings, handleRemoveScanFolder,
        openFolderPicker, loadDirectory, navigateUp, handleConfirmFolder, handleFileSelect,
        handleScanPath, handleRescanAll, handleImageFileSelect, handleCropDone,
        handleSgdbSearch, handleSgdbAction, toggleFullscreen,
    };
}
