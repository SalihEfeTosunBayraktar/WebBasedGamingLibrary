import axios from 'axios';

export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';
export const COVERS_BASE = import.meta.env.VITE_COVERS_BASE || 'http://localhost:3001/covers';

// Games
export const fetchGames = () => axios.get(`${API_BASE}/games`).then(r => r.data);
export const addGame = (payload) => axios.post(`${API_BASE}/games`, payload).then(r => r.data);
export const updateGame = (id, payload) => axios.put(`${API_BASE}/games/${id}`, payload).then(r => r.data);
export const deleteGame = (id) => axios.delete(`${API_BASE}/games/${id}`).then(r => r.data);
export const launchGame = (id) => axios.post(`${API_BASE}/games/${id}/launch`).then(r => r.data);

// Cover / Hero upload
export const uploadCover = (id, formData) =>
    axios.post(`${API_BASE}/games/${id}/cover`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
export const uploadHero = (id, formData) =>
    axios.post(`${API_BASE}/games/${id}/hero`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);

// Config
export const fetchConfig = () => axios.get(`${API_BASE}/config`).then(r => r.data);
export const saveConfig = (cfg) => axios.put(`${API_BASE}/config`, cfg).then(r => r.data);

// Groups
export const fetchGroups = () => axios.get(`${API_BASE}/groups`).then(r => r.data);
export const createGroup = (name) => axios.post(`${API_BASE}/groups`, { name }).then(r => r.data);
export const deleteGroup = (id) => axios.delete(`${API_BASE}/groups/${id}`).then(r => r.data);

// Scan folders
export const fetchScanFolders = () => axios.get(`${API_BASE}/scan/folders`).then(r => r.data);
export const removeScanFolder = (folderPath) =>
    axios.delete(`${API_BASE}/scan/folders`, { data: { folderPath } }).then(r => r.data);

// Scan
export const scanFolder = (folderPath) => axios.post(`${API_BASE}/scan`, { folderPath }).then(r => r.data);
export const rescanAll = () => axios.post(`${API_BASE}/scan/rescan-all`).then(r => r.data);

// File system browser
export const fetchDrives = () => axios.get(`${API_BASE}/drives`).then(r => r.data);
export const fetchDirectory = (pathStr, includeFiles = false) =>
    axios.get(`${API_BASE}/directory?path=${encodeURIComponent(pathStr)}&files=${includeFiles}`).then(r => r.data);

// SteamGridDB
export const sgdbSearch = (q) => axios.get(`${API_BASE}/steamgrid/search?q=${encodeURIComponent(q)}`).then(r => r.data);
export const sgdbGetGame = (id) => axios.get(`${API_BASE}/steamgrid/game/${id}`).then(r => r.data);
export const sgdbApply = (gameId, type, url) =>
    axios.post(`${API_BASE}/steamgrid/apply`, { gameId, type, url }).then(r => r.data);
