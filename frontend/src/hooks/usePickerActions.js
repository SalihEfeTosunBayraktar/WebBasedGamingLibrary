/**
 * usePickerActions.js — Folder picker navigation and scan trigger handlers.
 */
import { useLocale } from '../i18n/LocaleContext.jsx';
import { useDialog } from '../context/DialogContext.jsx';
import {
    fetchDrives, fetchDirectory,
    scanFolder as apiScanFolder, rescanAll as apiRescanAll,
    saveConfig as apiSaveConfig, addGame,
} from '../api/api.js';

export function usePickerActions({ state, refreshGames }) {
    const { t } = useLocale();
    const { prompt } = useDialog();
    const {
        showToast, uiConfig, setUiConfig,
        pickerMode, currentPath, setCurrentPath,
        setPickerMode, setDrives, setFolderList, setFileList,
        setPickerFocusIndex, setShowFolderPicker,
        setIsScanning, setIsRescanning,
    } = state;

    const loadDirectory = async (pathStr, modeOverride = pickerMode, fallbackToDrive = false) => {
        setCurrentPath(pathStr);
        setPickerFocusIndex(-1);
        try {
            const res = await fetchDirectory(pathStr, modeOverride === 'file');
            setFolderList(res.folders || []);
            setFileList(res.files || []);
        } catch {
            if (fallbackToDrive) {
                // If initial load fails (e.g. folder deleted), fall back to drive root
                const drivePart = pathStr.split('\\')[0] + '\\';
                const d = await fetchDrives().catch(()=>[]);
                if (d.includes(drivePart)) {
                    await loadDirectory(drivePart, modeOverride, false);
                    return;
                }
            }
            showToast(t('picker.accessDenied'));
            setFolderList([]); setFileList([]);
        }
    };

    const openFolderPicker = async (mode = 'folder') => {
        setPickerMode(mode); setPickerFocusIndex(-1); setShowFolderPicker(true);
        try {
            const d = await fetchDrives();
            setDrives(d);
            let startPath = d[0];
            if (uiConfig?.lastPickerPath) {
                const drivePart = uiConfig.lastPickerPath.split('\\')[0] + '\\';
                if (d.includes(drivePart)) startPath = uiConfig.lastPickerPath;
            }
            await loadDirectory(startPath, mode, true);
        } catch { showToast(t('picker.drivesError')); }
    };

    const navigateUp = () => {
        const parts = currentPath.split('\\').filter(Boolean);
        if (parts.length <= 1) loadDirectory(parts[0] + '\\');
        else { parts.pop(); loadDirectory(parts.join('\\') + '\\'); }
    };

    const persistPickerPath = () => {
        if (!uiConfig) return;
        const c = { ...uiConfig, lastPickerPath: currentPath };
        setUiConfig(c);
        apiSaveConfig(c).catch(() => {});
    };

    const handleConfirmFolder = async () => {
        setShowFolderPicker(false);
        persistPickerPath();
        await handleScanPath(currentPath);
    };

    const handleFileSelect = async (fileName) => {
        setShowFolderPicker(false);
        persistPickerPath();
        const clean = fileName.replace('.exe', '').replace(/[-_.]/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase();
        const gameName = await prompt(t('gameEdit.gameName') + ':', clean);
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
            const res = await apiScanFolder(folderPath);
            showToast(res.added + t('toast.scanned'));
            await refreshGames();
        } catch { showToast(t('toast.scanError')); }
        finally { setIsScanning(false); }
    };

    const handleRescanAll = async () => {
        setIsRescanning(true);
        try {
            const res = await apiRescanAll();
            showToast(res.added + t('toast.rescanned'));
            await refreshGames();
        } catch { showToast(t('toast.rescanError')); }
        finally { setIsRescanning(false); }
    };

    return { loadDirectory, openFolderPicker, navigateUp, handleConfirmFolder, handleFileSelect, handleScanPath, handleRescanAll };
}
