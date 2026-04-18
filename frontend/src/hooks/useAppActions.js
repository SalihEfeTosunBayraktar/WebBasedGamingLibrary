/**
 * useAppActions.js — Composes domain-specific action hooks.
 * Sub-hooks: usePickerActions, useMediaActions.
 * Remaining: game CRUD, groups, settings, fullscreen.
 */
import { useLocale } from '../i18n/LocaleContext.jsx';
import { useDialog } from '../context/DialogContext.jsx';
import {
    fetchGames, updateGame, deleteGame as apiDeleteGame,
    launchGame as apiLaunchGame,
    saveConfig as apiSaveConfig,
    createGroup as apiCreateGroup, deleteGroup as apiDeleteGroup,
    fetchScanFolders, removeScanFolder as apiRemoveScanFolder,
} from '../api/api.js';
import { usePickerActions } from './usePickerActions.js';
import { useMediaActions } from './useMediaActions.js';

export function useAppActions({ state }) {
    const { t } = useLocale();
    const { confirm, prompt } = useDialog();
    const {
        showToast, applyUiConfig, uiConfig,
        setGames, setGroups, setActiveGroupId,
        setSelectedGame, setShowSettings, setScanFolders,
        selectedGame,
    } = state;

    // ── Core: refresh games ───────────────────────────────────────────────────
    const refreshGames = async () => {
        const g = await fetchGames();
        setGames(g || []);
        return g || [];
    };

    // ── Sub-hooks ─────────────────────────────────────────────────────────────
    const picker = usePickerActions({ state, refreshGames });
    const media  = useMediaActions({ state, refreshGames });

    // ── Game CRUD ─────────────────────────────────────────────────────────────
    const playGame = async (id) => {
        showToast(t('toast.launching'));
        try { await apiLaunchGame(id); }
        catch (err) {
            const data = err?.response?.data;
            if (data?.error === 'drive_not_found' && data?.drive) {
                showToast(t('toast.driveNotFound').replace('{drive}', data.drive));
            } else {
                showToast(t('toast.launchFail'));
            }
        }
    };

    const removeGame = async (id) => {
        if (!await confirm(t('gameView.confirmRemove'))) return;
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
        const name = await prompt(t('sidebar.newCategoryPrompt'));
        if (!name) return;
        const newGroup = await apiCreateGroup(name);
        setGroups(prev => [...prev, newGroup]);
        showToast(t('sidebar.categoryCreated'));
    };

    const removeGroup = async (id) => {
        if (!await confirm(t('sidebar.confirmDelete'))) return;
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

    // ── Fullscreen ────────────────────────────────────────────────────────────
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
        else document.exitFullscreen?.();
    };

    return {
        refreshGames, playGame, removeGame, saveGameEdits,
        addGroup, removeGroup,
        openSettings, saveSettings, handleRemoveScanFolder,
        toggleFullscreen,
        ...picker,
        ...media,
    };
}
