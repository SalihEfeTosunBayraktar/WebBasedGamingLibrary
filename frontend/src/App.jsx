import React, { useState, useEffect, useRef } from 'react';
import { Gamepad2, FolderPlus, Play, Search, Edit3, Check, X, LayoutGrid, List, Maximize, Minimize, Settings, ChevronLeft, Folder, RefreshCw, File, MonitorPlay, Image as ImageIcon, ImagePlus } from 'lucide-react';
import axios from 'axios';
import { useGamepad } from './useGamepad';
import { ImageCropper } from './ImageCropper';

const API_BASE = 'http://localhost:3001/api';
const COVERS_BASE = 'http://localhost:3001/covers';

function App() {
  const [games, setGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  
  const [isScanning, setIsScanning] = useState(false);
  const [isRescanning, setIsRescanning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // View state
  const [layout, setLayout] = useState('grid'); // 'grid' | 'wide' | 'ps'
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Settings modal
  const [showSettings, setShowSettings] = useState(false);
  const [uiConfig, setUiConfig] = useState(null);
  const [scanFolders, setScanFolders] = useState([]);

  // Sidebar / Group State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [groups, setGroups] = useState([]);
  const [activeGroupId, setActiveGroupId] = useState(null); // null = All Games
  const [sidebarFocusIndex, setSidebarFocusIndex] = useState(0);

  // Folder/File Picker modal
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState('folder');
  const [drives, setDrives] = useState([]);
  const [currentPath, setCurrentPath] = useState('');
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);

  // Gamepad focus state
  const [focusedIndex, setFocusedIndex] = useState(0);

  // Edit Mode state
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editGroupId, setEditGroupId] = useState('null');
  const [editPath, setEditPath] = useState('');
  const [editExe, setEditExe] = useState('');
  const [editSgdbQuery, setEditSgdbQuery] = useState('');
  
  // Crop state
  const [cropTarget, setCropTarget] = useState(null); // { dataUrl, type: 'cover' | 'hero' }

  // SGDB State
  const [showSgdb, setShowSgdb] = useState(false);
  const [sgdbSearch, setSgdbSearch] = useState('');
  const [sgdbResults, setSgdbResults] = useState([]);
  const [sgdbImages, setSgdbImages] = useState(null); // { grids:[], heroes:[] }
  const [sgdbLoading, setSgdbLoading] = useState(false);

  const containerRef = useRef(null);
  const sidebarRef = useRef(null);

  const filteredGames = games.filter(g => 
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (activeGroupId === null ? true : (activeGroupId === 'uncategorized' ? !g.groupId : g.groupId === activeGroupId))
  );

  const applyUiConfig = (cfg) => {
      if(!cfg) return;
      const root = document.documentElement;
      if(cfg.bgDark) root.style.setProperty('--bg-dark', cfg.bgDark);
      if(cfg.bgCard) root.style.setProperty('--bg-card', cfg.bgCard);
      if(cfg.bgCardHover) root.style.setProperty('--bg-card-hover', cfg.bgCardHover);
      if(cfg.textMain) root.style.setProperty('--text-main', cfg.textMain);
      if(cfg.textMuted) root.style.setProperty('--text-muted', cfg.textMuted);
      if(cfg.accent) root.style.setProperty('--accent', cfg.accent);
      if(cfg.accentHover) root.style.setProperty('--accent-hover', cfg.accentHover);
      if(cfg.playBtnColor) root.style.setProperty('--play-btn', cfg.playBtnColor);
      if(cfg.playBtnOpacity !== undefined) root.style.setProperty('--play-btn-opacity', cfg.playBtnOpacity);
      if(cfg.fontFamily) document.body.style.fontFamily = `'${cfg.fontFamily}', -apple-system, BlinkMacSystemFont, sans-serif`;
      
      if(cfg.layout) {
          setLayout(cfg.layout);
      }
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [gamesRes, configRes, groupsRes] = await Promise.all([
         axios.get(`${API_BASE}/games`),
         axios.get(`${API_BASE}/config`),
         axios.get(`${API_BASE}/groups`)
      ]);
      setGames(gamesRes.data || []);
      setUiConfig(configRes.data);
      setGroups(groupsRes.data || []);
      applyUiConfig(configRes.data);
    } catch (e) {
      console.error(e);
      showToast("Sunucu kapalı.");
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
      try {
          showToast("Ayarlar kaydediliyor...");
          const res = await axios.put(`${API_BASE}/config`, uiConfig);
          applyUiConfig(res.data);
          setShowSettings(false);
          showToast("Kaydedildi!");
      } catch (e) {
          showToast("Hata!");
      }
  };

  const handleConfigChange = (key, value) => {
      setUiConfig(prev => ({...prev, [key]: value}));
  };

  useEffect(() => {
    loadInitialData();
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const openSettings = async () => {
      setShowSettings(true);
      try {
          const res = await axios.get(`${API_BASE}/scan-folders`);
          setScanFolders(res.data);
      } catch(e) {}
  };

  const removeScanFolder = async (folderPath) => {
      try {
          const res = await axios.delete(`${API_BASE}/scan-folders`, { data: { folderPath } });
          setScanFolders(res.data.folders);
          showToast("Klasör izlemeden çıkarıldı!");
      } catch(e) {}
  };

  const openFolderPicker = async (mode = 'folder') => {
      setPickerMode(mode);
      setShowFolderPicker(true);
      try {
          const res = await axios.get(`${API_BASE}/drives`);
          if (res.data.length > 0) {
              setDrives(res.data);
              const targetPath = (uiConfig && uiConfig.lastPickerPath) ? uiConfig.lastPickerPath : res.data[0];
              loadDirectory(targetPath, mode);
          }
      } catch (e) {
          showToast("Sürücüler alınamadı.");
      }
  };

  const loadDirectory = async (pathStr, modeOverride = pickerMode) => {
      setCurrentPath(pathStr);
      try {
          const res = await axios.get(`${API_BASE}/directory?path=${encodeURIComponent(pathStr)}&files=${modeOverride === 'file'}`);
          setFolders(res.data.folders || []);
          setFiles(res.data.files || []);
      } catch (e) {
          showToast("Erişim engellendi.");
          setFolders([]);
          setFiles([]);
      }
  };

  const navigateUp = () => {
      const parts = currentPath.split('\\').filter(Boolean);
      if (parts.length <= 1) {
          loadDirectory(parts[0] + '\\');
      } else {
          parts.pop();
          loadDirectory(parts.join('\\') + '\\');
      }
  };

  const handleConfirmFolder = async () => {
      if (pickerMode === 'file') {
          showToast("Lütfen klasör içindeki EXE dosyasına tıklayın!");
          return;
      }
      setShowFolderPicker(false);
      
      // Save last path globally
      if (uiConfig) {
          const newCfg = { ...uiConfig, lastPickerPath: currentPath };
          setUiConfig(newCfg);
          axios.put(`${API_BASE}/config`, newCfg).catch(()=>{});
      }
      
      handleScanPath(currentPath);
  };

  const handleFileSelect = async (fileName) => {
      setShowFolderPicker(false);
      
      // Save last path globally
      if (uiConfig) {
          const newCfg = { ...uiConfig, lastPickerPath: currentPath };
          setUiConfig(newCfg);
          axios.put(`${API_BASE}/config`, newCfg).catch(()=>{});
      }

      let cleanName = fileName.replace('.exe', '').replace(/[-_.]/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase();
      const gameName = prompt("Oyun ismi ne olsun?", cleanName);
      if (!gameName) return;

      try {
          showToast("Oyun ekleniyor...");
          await axios.post(`${API_BASE}/games`, { name: gameName, path: currentPath, exe: fileName });
          showToast("Oyun eklendi!");
          const gamesRes = await axios.get(`${API_BASE}/games`);
          setGames(gamesRes.data);
      } catch(e) {
          showToast("Eklerken hata oluştu!");
      }
  };

  const handleScanPath = async (folderPath) => {
    setIsScanning(true);
    try {
      showToast("Taranıyor: " + folderPath);
      const res = await axios.post(`${API_BASE}/scan`, { folderPath });
      showToast(`${res.data.added} oyun eklendi!`);
      const gamesRes = await axios.get(`${API_BASE}/games`);
      setGames(gamesRes.data);
    } catch (e) {
      showToast("Tarama hatası!");
    } finally {
      setIsScanning(false);
    }
  };

  const handleRescanAll = async () => {
    setIsRescanning(true);
    try {
      showToast("Tüm klasörler taranıyor...");
      const res = await axios.post(`${API_BASE}/rescan-all`);
      showToast(`${res.data.added} eksik oyunlar eklendi!`);
      const gamesRes = await axios.get(`${API_BASE}/games`);
      setGames(gamesRes.data);
    } catch (e) {
      showToast("Yeniden tarama hatası!");
    } finally {
      setIsRescanning(false);
    }
  };

  const playLocalGame = async (id) => {
    try {
      showToast("Oyun açılıyor...");
      await axios.post(`${API_BASE}/games/${id}/launch`);
    } catch (e) {
      showToast("Hata oluştu.");
    }
  };

  const deleteGame = async (id) => {
    if (!confirm("Kütüphaneden sil?")) return;
    try {
      await axios.delete(`${API_BASE}/games/${id}`);
      setSelectedGame(null);
      const res = await axios.get(`${API_BASE}/games`);
      setGames(res.data);
      showToast("Silindi.");
    } catch(e) {
       showToast("Hata.");
    }
  };

  const openGameModal = (game) => {
    setSelectedGame(game);
    setEditMode(false);
    setEditName(game.name);
    setEditGroupId(game.groupId || 'null');
    setEditPath(game.path || '');
    setEditExe(game.exe || '');
    setEditSgdbQuery(game.sgdbQuery || '');
  };

  const saveEdits = async () => {
    try {
      const gId = editGroupId === 'null' ? null : editGroupId;
      await axios.put(`${API_BASE}/games/${selectedGame.id}`, { name: editName, groupId: gId, path: editPath, exe: editExe, sgdbQuery: editSgdbQuery });
      showToast("Güncellendi!");
      setEditMode(false);
      const gamesRes = await axios.get(`${API_BASE}/games`);
      setGames(gamesRes.data);
      const updatedGame = gamesRes.data.find(g => g.id === selectedGame.id);
      if(updatedGame) setSelectedGame(updatedGame);
    } catch (e) {}
  };

  const addGroup = async () => {
      const name = prompt("Yeni Kategori/Grup İsmi:");
      if (!name) return;
      try {
          const res = await axios.post(`${API_BASE}/groups`, { name });
          setGroups([...groups, res.data]);
          showToast("Grup oluşturuldu!");
      } catch(e) {}
  };

  const deleteGroup = async (id) => {
      if(!confirm("Kategoriyi sil? İçerisindeki oyunlar Tüm Oyunlar'a düşecektir.")) return;
      try {
          await axios.delete(`${API_BASE}/groups/${id}`);
          if (activeGroupId === id) setActiveGroupId(null);
          setGroups(groups.filter(g => g.id !== id));
          const gamesRes = await axios.get(`${API_BASE}/games`);
          setGames(gamesRes.data);
      } catch(e){}
  };

  const handleImageFileSelect = (e, type) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
          setCropTarget({ dataUrl: reader.result, type });
      };
      reader.readAsDataURL(file);
      e.target.value = null; // reset input
  };

  const handleCropDone = async (blob) => {
      if (!cropTarget || !selectedGame) return;
      
      const formData = new FormData();
      formData.append(cropTarget.type, blob, 'upload.jpg');

      try {
          showToast("Yüklendi ve Kaydediliyor...");
          await axios.post(`${API_BASE}/games/${selectedGame.id}/${cropTarget.type}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
          showToast("Görsel değiştirildi!");
          const gamesRes = await axios.get(`${API_BASE}/games`);
          setGames(gamesRes.data);
          const updatedGame = gamesRes.data.find(g => g.id === selectedGame.id);
          if (updatedGame) setSelectedGame(updatedGame);
      } catch (err) {
          showToast("Resim yüklenemedi!");
      }
      setCropTarget(null);
  };

  const handleSgdbSearch = async (overrideQuery) => {
      const query = typeof overrideQuery === 'string' ? overrideQuery : sgdbSearch;
      if(!uiConfig?.steamGridApiKey) {
          showToast("Önce ayarlardan API Anahtarı girin!");
          return;
      }
      setSgdbLoading(true);
      try {
          const res = await axios.get(`${API_BASE}/steamgrid/search?q=${encodeURIComponent(query)}`);
          setSgdbResults(res.data);
          setSgdbImages(null);
      } catch (e) { showToast("Arama hatası."); }
      finally { setSgdbLoading(false); }
  };

  const handleSgdbSelectGame = async (gameId) => {
      setSgdbLoading(true);
      try {
          const res = await axios.get(`${API_BASE}/steamgrid/game/${gameId}`);
          setSgdbImages(res.data);
      } catch (e) { showToast("Görseller alınamadı."); }
      finally { setSgdbLoading(false); }
  };

  const handleSgdbApply = async (url, type) => {
      setSgdbLoading(true);
      showToast("İndiriliyor...");
      try {
          const res = await axios.post(`${API_BASE}/steamgrid/apply`, { gameId: selectedGame.id, type, url });
          showToast("Uygulandı!");
          const gamesRes = await axios.get(`${API_BASE}/games`);
          setGames(gamesRes.data);
          const updatedGame = gamesRes.data.find(g => g.id === selectedGame.id);
          if(updatedGame) setSelectedGame(updatedGame);
      } catch (e) { showToast("İndirme hatası."); }
      finally { setSgdbLoading(false); }
  };

  const hasOpenModal = () => selectedGame || showSettings || showFolderPicker || showSgdb || cropTarget;

  const handleModalDirection = (direction) => {
      const overlays = document.querySelectorAll('.modal-overlay');
      if (overlays.length === 0) return;
      const activeOverlay = overlays[overlays.length - 1]; // top overlay
      
      const elements = Array.from(activeOverlay.querySelectorAll('button, input, select, [tabindex="0"]'))
                          .filter(el => !el.disabled && el.offsetParent !== null && window.getComputedStyle(el).display !== 'none');
      if (elements.length === 0) return;
      
      let currentIndex = elements.indexOf(document.activeElement);
      if (currentIndex === -1) currentIndex = 0;
      else {
          currentIndex += direction;
          if (currentIndex >= elements.length) currentIndex = 0;
          if (currentIndex < 0) currentIndex = elements.length - 1;
      }
      elements[currentIndex].focus();
  };

  useGamepad({
    onUp: () => {
      if (hasOpenModal()) { handleModalDirection(-1); return; }
      if (isSidebarOpen) {
          setSidebarFocusIndex(prev => (prev > 0 ? prev - 1 : 0));
          return;
      }
      setFocusedIndex(prev => {
         if (layout === 'ps') return prev; // Up doesn't scroll horizontally
         const itemsPerRow = layout === 'grid' && containerRef.current ? Math.floor(containerRef.current.offsetWidth / 224) || 1 : 1;
         const next = prev - itemsPerRow;
         return next >= 0 ? next : prev;
      });
    },
    onDown: () => {
      if (hasOpenModal()) { handleModalDirection(1); return; }
      if (isSidebarOpen) {
          setSidebarFocusIndex(prev => (prev < groups.length + 1 ? prev + 1 : prev));
          return;
      }
      setFocusedIndex(prev => {
         if (layout === 'ps') return prev; 
         const itemsPerRow = layout === 'grid' && containerRef.current ? Math.floor(containerRef.current.offsetWidth / 224) || 1 : 1;
         const next = prev + itemsPerRow;
         return next < filteredGames.length ? next : prev;
      });
    },
    onLeft: () => {
      if (hasOpenModal()) { handleModalDirection(-1); return; }
      if (layout === 'wide' || isSidebarOpen) return;
      setFocusedIndex(prev => (prev > 0 ? prev - 1 : 0));
    },
    onRight: () => {
      if (hasOpenModal()) { handleModalDirection(1); return; }
      if (layout === 'wide' || isSidebarOpen) return;
      setFocusedIndex(prev => (prev < filteredGames.length - 1 ? prev + 1 : prev));
    },
    onLB: () => {
        if (hasOpenModal()) return;
        setIsSidebarOpen(!isSidebarOpen);
        setSidebarFocusIndex(0);
    },
    onSelect: () => { // 'A' button
      if (hasOpenModal()) {
          const el = document.activeElement;
          if (el && typeof el.click === 'function') {
              if (el.tagName === 'INPUT') return; // let them clear or type
              el.click(); 
          }
          return;
      }
      if (isSidebarOpen) {
          if (sidebarFocusIndex === 0) setActiveGroupId(null);
          else if (sidebarFocusIndex === 1) setActiveGroupId('uncategorized');
          else setActiveGroupId(groups[sidebarFocusIndex - 2].id);
          setIsSidebarOpen(false);
          setFocusedIndex(0);
          return;
      }
      if (selectedGame && !editMode) {
          playLocalGame(selectedGame.id);
      } else if (!selectedGame && focusedIndex >= 0 && focusedIndex < filteredGames.length) {
          playLocalGame(filteredGames[focusedIndex].id); // Quick play
      }
    },
    onOptions: () => { // 'Y' button
      if (hasOpenModal() || isSidebarOpen) return;
      if (focusedIndex >= 0 && focusedIndex < filteredGames.length) {
          openGameModal(filteredGames[focusedIndex]); // Open settings
      }
    },
    onBack: () => { // 'B' button
      if (cropTarget) setCropTarget(null);
      else if (showSgdb) setShowSgdb(false);
      else if (selectedGame) { if (editMode) setEditMode(false); else setSelectedGame(null); } 
      else if (showSettings) setShowSettings(false);
      else if (showFolderPicker) setShowFolderPicker(false);
      else if (isSidebarOpen) setIsSidebarOpen(false);
    }
  });

  useEffect(() => {
     if (focusedIndex >= 0 && containerRef.current) {
        const children = containerRef.current.children;
        if (children[focusedIndex]) {
            children[focusedIndex].scrollIntoView({ behavior: 'smooth', block: layout === 'ps' ? 'center' : 'nearest', inline: layout === 'ps' ? 'center' : 'nearest' });
        }
     }
  }, [focusedIndex, layout]);

  useEffect(() => {
     if (isSidebarOpen && sidebarFocusIndex >= 0 && sidebarRef.current) {
         const children = sidebarRef.current.children;
         if (children[sidebarFocusIndex]) {
             children[sidebarFocusIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
         }
     }
  }, [sidebarFocusIndex, isSidebarOpen]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(err => {});
    else if (document.exitFullscreen) document.exitFullscreen();
  };

  const getFocusedCover = () => {
      if (filteredGames.length > 0 && focusedIndex >= 0 && focusedIndex < filteredGames.length) {
          const game = filteredGames[focusedIndex];
          if (game && game.hero) return `url('${COVERS_BASE}/${game.hero}?t=${Date.now()}')`;
          if (game && game.cover) return `url('${COVERS_BASE}/${game.cover}?t=${Date.now()}')`;
      }
      return 'none';
  };

  return (
    <div className="app-container">
      
      {layout === 'ps' && (
          <div className="hero-background" style={{ backgroundImage: getFocusedCover() }}></div>
      )}

      {/* Collapsible Sidebar Overlay */}
      <div className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} onClick={() => setIsSidebarOpen(false)}></div>

      {/* Collapsible Sidebar */}
      <div className={`collapsible-sidebar glass ${isSidebarOpen ? 'open' : ''}`}>
         <div className="brand" style={{ marginBottom: '32px' }}>
            <Gamepad2 size={28} color="var(--accent)" fill="var(--accent)"/>
            <span>Kategoriler</span>
         </div>
         
         <div ref={sidebarRef} style={{ flex: 1, overflowY: 'auto' }}>
            <div 
               className={`sidebar-group-item ${activeGroupId === null ? 'active' : ''} ${sidebarFocusIndex === 0 && isSidebarOpen ? 'focused' : ''}`} 
               onClick={() => { setActiveGroupId(null); setIsSidebarOpen(false); }}
            >
               <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                   <Gamepad2 size={18} /> Tüm Oyunlar
               </div>
               <span style={{ fontSize:'12px', background:'rgba(255,255,255,0.1)', padding:'2px 8px', borderRadius:'12px' }}>{games.length}</span>
            </div>

            <div 
               className={`sidebar-group-item ${activeGroupId === 'uncategorized' ? 'active' : ''} ${sidebarFocusIndex === 1 && isSidebarOpen ? 'focused' : ''}`} 
               onClick={() => { setActiveGroupId('uncategorized'); setIsSidebarOpen(false); }}
            >
               <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                   <Folder size={18} style={{ opacity: 0.5 }} /> Sınıflandırılmamış
               </div>
               <span style={{ fontSize:'12px', background:'rgba(255,255,255,0.1)', padding:'2px 8px', borderRadius:'12px' }}>{games.filter(g => !g.groupId).length}</span>
            </div>

            <div style={{ padding: '0 12px', margin: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}></div>

            {groups.map((g, idx) => (
                <div 
                   key={g.id} 
                   className={`sidebar-group-item ${activeGroupId === g.id ? 'active' : ''} ${sidebarFocusIndex === idx + 2 && isSidebarOpen ? 'focused' : ''}`} 
                   onClick={() => { setActiveGroupId(g.id); setIsSidebarOpen(false); }}
                >
                   <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                       <Folder size={18} /> {g.name}
                   </div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize:'12px', background:'rgba(255,255,255,0.1)', padding:'2px 8px', borderRadius:'12px' }}>{games.filter(game => game.groupId === g.id).length}</span>
                      <button className="btn" style={{ padding: '4px', background: 'transparent', border:'none', visibility: activeGroupId === g.id ? 'visible' : 'hidden' }} onClick={(e) => { e.stopPropagation(); deleteGroup(g.id); }}><X size={14} color="#ff4757"/></button>
                   </div>
                </div>
            ))}
         </div>

         <button className="btn" style={{ marginTop: '16px', background: 'rgba(255,255,255,0.05)' }} onClick={addGroup}>
            + Yeni Kategori
         </button>
      </div>

      {/* Main Content */}
      <div className="main-content" style={{ display: layout === 'ps' ? 'flex' : 'block', flexDirection: 'column' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          background: 'rgba(0, 0, 0, 0.3)',
          padding: '16px 24px',
          margin: '-32px -32px 32px -32px',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          zIndex: 10
        }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button className="btn" onClick={() => setIsSidebarOpen(true)} style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px' }} title="Kategoriler (LB)">
                    <LayoutGrid size={18} />
                </button>
                <h2 style={{ margin:0, marginRight: '8px' }}>Kütüphanen</h2>
                
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '4px' }}>
                    <button className="btn" onClick={() => openFolderPicker('folder')} disabled={isScanning} style={{ padding: '6px 12px', background: 'transparent', border: 'none', fontSize: '13px' }}>
                        <FolderPlus size={16} /> {isScanning ? 'Taranıyor...' : 'Yol Seç'}
                    </button>
                    <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px' }}></div>
                    <button className="btn" onClick={() => openFolderPicker('file')} style={{ padding: '6px 12px', background: 'transparent', border: 'none', fontSize: '13px' }}>
                        <File size={16} /> Manuel Ekle
                    </button>
                </div>
            </div>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <button className="btn" style={{ padding: '8px', border: 'none' }} onClick={handleRescanAll} disabled={isRescanning} title="Klasörleri Yeniden Tara">
                    <RefreshCw size={18} className={isRescanning ? "spinning" : ""} />
                </button>
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '4px' }}>
                     <button className="btn" style={{ padding: '6px', background: layout === 'grid' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none' }} onClick={() => { setLayout('grid'); if(uiConfig){ const cfg = {...uiConfig, layout:'grid'}; setUiConfig(cfg); axios.put(`${API_BASE}/config`, cfg).catch(()=>{}); } }} title="Izgara"><LayoutGrid size={18} /></button>
                     <button className="btn" style={{ padding: '6px', background: layout === 'wide' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none' }} onClick={() => { setLayout('wide'); if(uiConfig){ const cfg = {...uiConfig, layout:'wide'}; setUiConfig(cfg); axios.put(`${API_BASE}/config`, cfg).catch(()=>{}); } }} title="Liste"><List size={18} /></button>
                     <button className="btn" style={{ padding: '6px', background: layout === 'ps' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none' }} onClick={() => { setLayout('ps'); if(uiConfig){ const cfg = {...uiConfig, layout:'ps'}; setUiConfig(cfg); axios.put(`${API_BASE}/config`, cfg).catch(()=>{}); } }} title="Konsol Görünümü"><MonitorPlay size={18} /></button>
                </div>
                
                <button className="btn" style={{ padding: '8px', border: 'none' }} onClick={toggleFullscreen} title="Tam Ekran">
                    {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                </button>
                
                <button className="btn" style={{ padding: '8px', border: 'none' }} onClick={openSettings} title="Ayarlar">
                    <Settings size={18} />
                </button>

                <div style={{ position:'relative' }}>
                    <Search size={18} style={{position:'absolute', left:'12px', top:'10px', color:'var(--text-muted)'}}/>
                    <input 
                      type="text" 
                      placeholder="Ara..." 
                      style={{ paddingLeft: '40px', width: '220px' }} 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
        </div>

        {filteredGames.length === 0 && !loading ? (
           <div className="empty-state">
              <Gamepad2 />
              <h3>Kütüphane Boş</h3>
              <p style={{ color: 'var(--text-muted)' }}>Sol taraftan bir klasör seçerek oyun ekleyin.</p>
           </div>
        ) : (
            <div className={`game-${layout === 'wide' ? 'layout-wide' : layout === 'ps' ? 'layout-ps' : 'grid'}`} ref={containerRef}>
               {filteredGames.map((game, index) => (
                   <div 
                      key={game.id}
                      className={`game-card ${focusedIndex === index ? 'focused' : ''}`} 
                      onMouseEnter={() => setFocusedIndex(index)}
                      onClick={() => openGameModal(game)} // Click Card -> Open Details/Gallery
                      onContextMenu={(e) => { e.preventDefault(); openGameModal(game); }}
                   >
                       {game.cover ? (
                           <img 
                              src={`${COVERS_BASE}/${game.cover}?t=${Date.now()}`} 
                              alt={game.name} 
                              className="game-card-cover" 
                           />
                       ) : (
                           <div className="fallback-cover">
                               {game.name.charAt(0).toUpperCase()}
                           </div>
                       )}
                       
                       <div className="quick-play-overlay" onClick={(e) => { e.stopPropagation(); playLocalGame(game.id); }}>
                           <Play fill="currentColor" size={48} />
                       </div>

                       <div className="game-card-overlay">
                           <div className="game-title">{game.name}</div>
                           <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop:'4px' }}>
                               {game.lastPlayed ? `Son: ${new Date(game.lastPlayed).toLocaleDateString()}` : 'Yeni Eklendi'}
                           </div>
                       </div>
                   </div>
               ))}
            </div>
        )}
        
        {/* Gamepad Hints */}
        {layout === 'ps' && filteredGames.length > 0 && (
           <div style={{ marginTop: 'auto', display: 'flex', gap: '24px', justifyContent: 'center', opacity: 0.7, padding: '16px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ background: 'white', color: 'black', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>A</div> Oyna</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ background: 'white', color: 'black', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>Y</div> Detaylar / Düzenle</span>
           </div>
        )}

      </div>

      {/* --- CUSTOM FOLDER/FILE PICKER MODAL --- */}
      {showFolderPicker && (
         <div className="modal-overlay" onClick={() => setShowFolderPicker(false)}>
              <div className="modal-content glass-panel" style={{ width: '600px', height: '65vh', padding: '0', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
                  
                  <div style={{ padding: '24px', background: 'rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0 }}>Gezgin: {pickerMode === 'folder' ? 'Hedef Klasörü Seçin' : 'Oyun (EXE) Dosyasını Seçin'}</h3>
                      <button className="modal-close" style={{ position: 'relative', top: 0, right: 0 }} onClick={() => setShowFolderPicker(false)}><X size={20} /></button>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.1)' }}>
                      <select 
                         value={currentPath.split('\\')[0] + '\\'} 
                         onChange={(e) => loadDirectory(e.target.value)} 
                         style={{ background: 'var(--bg-card)', color: '#fff', border:'none', padding: '8px', borderRadius: '4px', outline: 'none' }}
                      >
                          {drives.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      
                      <button className="btn" style={{ padding: '8px' }} onClick={navigateUp}>
                          <ChevronLeft size={16} /> Bir Üst
                      </button>

                      <div style={{ flex: 1, padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '13px', display: 'flex', alignItems: 'center' }}>
                          {currentPath}
                      </div>
                  </div>

                  <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {/* Sub Folders */}
                      {folders.map(f => (
                          <div 
                             key={'dir_'+f}
                             onClick={() => loadDirectory(currentPath + (currentPath.endsWith('\\') ? '' : '\\') + f)}
                             style={{ display: 'flex', gap: '12px', padding: '12px', borderRadius: '8px', cursor: 'pointer', alignItems: 'center', transition: 'background 0.2s' }}
                             onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                             onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                             <Folder size={18} color="var(--accent)" fill="var(--accent)" />
                             <span style={{ fontSize: '14px' }}>{f}</span>
                          </div>
                      ))}
                      
                      {/* Exe Files (if manual mode) */}
                      {pickerMode === 'file' && files.map(file => (
                          <div 
                             key={'file_'+file}
                             onClick={() => handleFileSelect(file)}
                             style={{ display: 'flex', gap: '12px', padding: '12px', borderRadius: '8px', cursor: 'pointer', alignItems: 'center', transition: 'background 0.2s', background: 'rgba(255,255,255,0.02)' }}
                             onMouseEnter={e => e.currentTarget.style.background = 'rgba(107, 76, 255, 0.15)'}
                             onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                          >
                             <File size={18} color="#a1a3af" />
                             <span style={{ fontSize: '14px', color: '#fff' }}>{file}</span>
                          </div>
                      ))}
                      
                      {(folders.length === 0 && files.length === 0) && (
                          <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '40px' }}>Bu klasör boş</div>
                      )}
                  </div>

                  {pickerMode === 'folder' && (
                      <div style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'flex-end', background: 'rgba(0,0,0,0.2)' }}>
                          <button className="btn btn-primary" onClick={handleConfirmFolder}>
                              <Check size={18} /> Bu Klasörü Seç
                          </button>
                      </div>
                  )}
              </div>
         </div>
      )}

      {/* Settings Modal */}
      {showSettings && uiConfig && (
          <div className="modal-overlay" onClick={() => setShowSettings(false)} style={{ zIndex: 100 }}>
              <div className="modal-content glass-panel" style={{ width: '600px', height: '80vh', padding: '32px', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems:'center', marginBottom: '24px' }}>
                       <h2>Ayarlar</h2>
                       <button className="modal-close" style={{ position:'static' }} onClick={() => setShowSettings(false)}><X size={20} /></button>
                   </div>
                   
                   <div style={{ flex: 1, overflowY: 'auto', paddingRight: '12px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                       
                       {/* SGDB API Key */}
                       <div>
                           <h4 style={{ color: 'var(--accent)', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>SteamGridDB Bağlantısı</h4>
                           <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>Oyun görsellerini internetten çekebilmek için API Anahtarı girin.</p>
                           <input 
                              type="text" 
                              placeholder="Bearer Token (API Key)..." 
                              value={uiConfig.steamGridApiKey || ''} 
                              onChange={e => handleConfigChange('steamGridApiKey', e.target.value)} 
                              style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', fontFamily:'monospace' }} 
                           />
                       </div>

                       {/* Themes Section */}
                       <div>
                           <h4 style={{ color: 'var(--accent)', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>Temalar ve Renkler</h4>
                           <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
                               {Object.keys(uiConfig).filter(k => k !== 'lastPickerPath' && k !== 'layout' && k !== 'steamGridApiKey' && k !== 'ignoredExes').map(key => (
                                   <div key={key} style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                                       <label style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                           {key === 'playBtnColor' ? 'Play Button Color' : key === 'playBtnOpacity' ? 'Opacity' : key}
                                       </label>
                                       <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                           {key.toLowerCase().includes('color') || key.startsWith('bg') || key.startsWith('accent') || key === 'danger' ? (
                                               <>
                                                   <input type="color" value={uiConfig[key].startsWith('rgba') ? '#6b4cff' : (uiConfig[key].length === 7 ? uiConfig[key] : '#ffffff')} onChange={e => handleConfigChange(key, e.target.value)} style={{ padding: '0', width: '32px', height: '32px', border: 'none', background: 'transparent', cursor: 'pointer' }} />
                                                   <input value={uiConfig[key]} onChange={e => handleConfigChange(key, e.target.value)} style={{ flex: 1, fontFamily: 'monospace', fontSize: '12px' }} placeholder="HEX veya RGBA..." />
                                               </>
                                           ) : key.toLowerCase().includes('opacity') ? (
                                               <>
                                                   <input type="range" min="0" max="1" step="0.05" value={uiConfig[key]} onChange={e => handleConfigChange(key, parseFloat(e.target.value))} style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', accentColor: 'var(--accent)' }} />
                                                   <span style={{ fontSize: '12px', minWidth: '40px', textAlign: 'right' }}>{Math.round(uiConfig[key] * 100)}%</span>
                                               </>
                                           ) : (
                                               <input value={uiConfig[key]} onChange={e => handleConfigChange(key, e.target.value)} style={{ flex: 1, fontFamily: 'monospace', fontSize: '12px' }} />
                                           )}
                                       </div>
                                   </div>
                               ))}
                           </div>
                       </div>
                       
                       {/* Excluded EXEs Section */}
                       <div>
                           <h4 style={{ color: 'var(--accent)', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>Yoksayılan EXE Dosyaları</h4>
                           <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>Oyun taranırken bu kelimeleri içinde barındıran çöplük EXE dosyaları dahil edilmez. Virgülle ayırın.</p>
                           <input 
                              type="text" 
                              placeholder="unins, crash, setup, crs-handler..." 
                              value={uiConfig.ignoredExes || 'unins, crash, redist, setup, dxwebsetup'} 
                              onChange={e => handleConfigChange('ignoredExes', e.target.value)} 
                              style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', fontFamily:'monospace' }} 
                           />
                       </div>

                       {/* Scan Paths */}
                       <div>
                           <h4 style={{ color: 'var(--accent)', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>Kayıtlı Tarama Yolları</h4>
                           <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>Aşağıdaki klasörler, 'Yeniden Tara' butonuna basıldığında baştan sona otomatik indekslenir.</p>
                           {scanFolders.length === 0 ? (
                               <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>İzlenen klasör yok.</div>
                           ) : (
                               <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                   {scanFolders.map(path => (
                                       <div key={path} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px' }}>
                                           <span style={{ fontSize: '13px', fontFamily: 'monospace' }}>{path}</span>
                                           <button className="btn" style={{ padding: '6px 12px', background: 'rgba(255,71,87,0.2)', color: '#ff4757', border: 'none' }} onClick={() => removeScanFolder(path)}><X size={14} /></button>
                                       </div>
                                   ))}
                               </div>
                           )}
                       </div>
                       
                   </div>

                   <button className="btn btn-primary" style={{ marginTop: '24px' }} onClick={saveConfig}><Check size={18} /> Ayarları Kaydet</button>
              </div>
          </div>
      )}

      {/* Game Modal */}
      {selectedGame && (
          <div className="modal-overlay" onClick={() => setSelectedGame(null)}>
              <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
                  <button className="modal-close" onClick={() => setSelectedGame(null)}><X size={20} /></button>
                  
                  {selectedGame.cover ? (
                      <img src={`${COVERS_BASE}/${selectedGame.cover}?t=${Date.now()}`} className="game-detail-cover" alt={selectedGame.name} style={{ objectFit: 'contain', background: '#000' }}/>
                  ) : (
                      <div className="fallback-cover" style={{ width: '35%', fontSize: '100px' }}>
                          {selectedGame.name.charAt(0).toUpperCase()}
                      </div>
                  )}

                  <div className="game-detail-info">
                       {editMode ? (
                           <div style={{ display: 'flex', flexDirection:'column', gap:'16px', paddingRight: '32px' }}>
                               <div style={{ display: 'flex', gap: '16px' }}>
                                   <input value={editName} onChange={e => setEditName(e.target.value)} style={{ flex: 1, fontSize: '24px', fontWeight: 'bold', padding: '8px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }} placeholder="Oyun Adı" />
                                   <select value={editGroupId} onChange={e => setEditGroupId(e.target.value)} style={{ padding: '8px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }}>
                                       <option value="null">Tüm Oyunlar (Kategori Yok)</option>
                                       {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                   </select>
                               </div>

                               {/* duplicate path inputs removed */}
                                

                                <div style={{ display: 'flex', flexDirection:'column', gap:'8px', marginTop: '16px', background: 'rgba(0,0,0,0.2)', padding:'12px', borderRadius:'8px' }}>
                                   <div style={{ display: 'flex', gap: '8px', alignItems:'center' }}>
                                       <strong style={{ width: '60px', fontSize:'12px', color:'var(--text-muted)' }}>Oyun Yolu:</strong>
                                       <input value={editPath} onChange={e => setEditPath(e.target.value)} style={{ flex: 1, padding: '8px', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', borderRadius: '4px', fontFamily:'monospace', fontSize:'12px' }} />
                                   </div>
                                   <div style={{ display: 'flex', gap: '8px', alignItems:'center' }}>
                                       <strong style={{ width: '60px', fontSize:'12px', color:'var(--text-muted)' }}>Exe Dosya:</strong>
                                       <input value={editExe} onChange={e => setEditExe(e.target.value)} style={{ flex: 1, padding: '8px', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', borderRadius: '4px', fontFamily:'monospace', fontSize:'12px' }} />
                                   </div>
                                </div>
                                
                                <div style={{ display: 'grid', gridTemplateColumns:'1fr 1fr', gap: '16px', marginTop: '16px' }}>
                                     {/* Dikey Kapak Yukleme */}
                                     <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', display:'flex', flexDirection:'column', alignItems:'center', gap:'8px' }}>
                                         <ImageIcon size={24} color="var(--text-muted)" />
                                         <h4 style={{ margin:0, fontSize:'13px' }}>Kapak Resmi (Dikey)</h4>
                                         <p style={{ fontSize:'11px', color:'var(--text-muted)', textAlign:'center', margin:0 }}>Kart ve Izgara Görünümü</p>
                                         <label className="btn" style={{ marginTop:'auto', cursor:'pointer', width:'100%' }}>
                                             <span>Manuel Seç (Yerel)</span>
                                             <input type="file" accept="image/*" onChange={(e) => handleImageFileSelect(e, 'cover')} style={{ display: 'none' }} />
                                         </label>
                                     </div>

                                     {/* Yatay Arka Plan Yukleme */}
                                     <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', display:'flex', flexDirection:'column', alignItems:'center', gap:'8px' }}>
                                         <ImagePlus size={24} color="var(--accent)" />
                                         <h4 style={{ margin:0, fontSize:'13px', color:'var(--accent)' }}>Arka Plan (Yatay)</h4>
                                         <p style={{ fontSize:'11px', color:'var(--text-muted)', textAlign:'center', margin:0 }}>Konsol Modu Duvar Kağıdı</p>
                                         <label className="btn btn-primary" style={{ marginTop:'auto', cursor:'pointer', width:'100%' }}>
                                             <span>Manuel Seç (Yerel)</span>
                                             <input type="file" accept="image/*" onChange={(e) => handleImageFileSelect(e, 'hero')} style={{ display: 'none' }} />
                                         </label>
                                     </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px', background: 'rgba(107, 76, 255, 0.1)', padding:'12px', borderRadius:'8px', border: '1px solid rgba(107, 76, 255, 0.3)' }}>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input 
                                           value={editSgdbQuery} 
                                           onChange={e => setEditSgdbQuery(e.target.value)} 
                                           onKeyDown={e => e.key === 'Enter' && (() => { const q = editSgdbQuery.trim() || editName || (editExe ? editExe.replace('.exe', '') : ''); setSgdbSearch(q); setShowSgdb(true); setSgdbResults([]); setSgdbImages(null); handleSgdbSearch(q); })()}
                                           placeholder={editName || (editExe ? editExe.replace('.exe', '') : '')}
                                           style={{ flex: 1, padding: '8px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', fontSize: '13px' }} 
                                        />
                                        <button className="btn" style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', whiteSpace: 'nowrap' }} onClick={() => { const q = editSgdbQuery.trim() || editName || (editExe ? editExe.replace('.exe', '') : ''); setSgdbSearch(q); setShowSgdb(true); setSgdbResults([]); setSgdbImages(null); handleSgdbSearch(q); }}>
                                            <Search size={16} style={{marginRight:'4px'}} /> Çevrimiçi Kapak Ara
                                        </button>
                                    </div>
                                </div>

                                <div style={{ display:'flex', gap:'12px', marginTop:'24px', flexShrink: 0 }}>
                                     <button className="btn btn-primary" onClick={saveEdits} style={{ flex: 1 }}><Check size={18} /> Değişiklikleri Kaydet</button>
                                     <button className="btn" onClick={() => setEditMode(false)}>İptal</button>
                                </div>
                           </div>
                       ) : (
                           <>
                               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems:'flex-start' }}>
                                   <h1 style={{ fontSize: '36px', marginBottom: '8px' }}>{selectedGame.name}</h1>
                                   <button className="btn" style={{ padding: '8px', marginRight: '32px' }} onClick={() => setEditMode(true)} title="Düzenle"><Edit3 size={18} /></button>
                               </div>
                               <div style={{ color: 'var(--text-muted)', fontSize:'14px', marginBottom: '40px', lineHeight:'1.5', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', marginTop: '16px' }}>
                                   <p><strong>Yol:</strong> {selectedGame.path}</p>
                                   <p><strong>Dosya:</strong> {selectedGame.exe}</p>
                                   <p><strong>Grup:</strong> {selectedGame.groupId ? (groups.find(g => g.id === selectedGame.groupId)?.name || 'Bilinmiyor') : 'Kategorisiz'}</p>
                                   <p><strong>Kayıt:</strong> {new Date(selectedGame.addedAt).toLocaleString()}</p>
                               </div>
                               <div style={{ marginTop: 'auto', display: 'flex', gap: '16px' }}>
                                    <button className="btn btn-play" style={{ flex: 1, fontSize: '18px', padding: '16px' }} onClick={() => playLocalGame(selectedGame.id)}>
                                        <Play fill="currentColor" size={24} /> OYNA
                                    </button>
                                    <button className="btn" style={{ background: 'rgba(107, 76, 255, 0.3)', color: '#fff', border: '1px solid rgba(107, 76, 255, 0.5)' }} onClick={() => { const q = selectedGame.sgdbQuery || selectedGame.name || (selectedGame.exe ? selectedGame.exe.replace('.exe', '') : ''); setSgdbSearch(q); setShowSgdb(true); setSgdbResults([]); setSgdbImages(null); handleSgdbSearch(q); }}><Search size={18} /> Web'den<br/>Kapak Seç</button>
                                    <button className="btn" onClick={() => deleteGame(selectedGame.id)}>Kaldır</button>
                               </div>
                           </>
                       )}
                  </div>
              </div>
          </div>
      )}

      {toast && <div className="toast">{toast}</div>}

      {/* CROP MODAL */}
      {cropTarget && (
        <ImageCropper 
           image={cropTarget.dataUrl} 
           aspect={cropTarget.type === 'cover' ? 2/3 : 16/9} 
           onCancel={() => setCropTarget(null)} 
           onCropDone={handleCropDone} 
        />
      )}
       {/* SGDB MODAL */}
      {showSgdb && selectedGame && (
         <div className="modal-overlay" onClick={() => setShowSgdb(false)} style={{ zIndex: 200 }}>
              <div className="modal-content glass-panel" style={{ width: '800px', height: '80vh', display:'flex', flexDirection:'column', padding:'24px' }} onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems:'center', marginBottom: '16px' }}>
                       <h2>SteamGridDB - {selectedGame.name}</h2>
                       <button className="modal-close" style={{ position:'static' }} onClick={() => setShowSgdb(false)}><X size={20} /></button>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                      <input 
                         value={sgdbSearch} 
                         onChange={e => setSgdbSearch(e.target.value)} 
                         onKeyDown={e => e.key === 'Enter' && handleSgdbSearch()}
                         style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#fff' }} 
                         placeholder="Oyun ara..." 
                      />
                      <button className="btn btn-primary" onClick={handleSgdbSearch} disabled={sgdbLoading}><Search size={18}/> Ara</button>
                  </div>

                  <div style={{ flex: 1, overflowY: 'auto' }}>
                      {sgdbLoading && <div style={{ textAlign: 'center', padding: '40px', color: 'var(--accent)' }}>Yükleniyor...</div>}
                      
                      {!sgdbImages && sgdbResults.map(game => (
                          <div 
                              key={game.id} 
                              onClick={() => handleSgdbSelectGame(game.id)}
                              tabIndex="0"
                              onKeyDown={e => e.key === 'Enter' && handleSgdbSelectGame(game.id)}
                              style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', marginBottom: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems:'center', gap:'12px' }}
                          >
                             {game.types && game.types[0] === 'game' ? <Gamepad2 size={16}/> : <Search size={16}/>}
                             <span>{game.name}</span>
                          </div>
                      ))}

                      {sgdbImages && (
                          <div>
                              <button className="btn" style={{ marginBottom: '16px' }} onClick={() => setSgdbImages(null)}><ChevronLeft size={16}/> Sonuçlara Dön</button>
                              
                              <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', marginBottom: '8px' }}>Dikey Kapaklar (Grid)</h3>
                              <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
                                 {sgdbImages.grids.map(img => (
                                     <div key={img.id} style={{ position: 'relative', cursor:'pointer', flex: '0 0 140px' }} onClick={() => handleSgdbApply(img.url, 'cover')} tabIndex="0" onKeyDown={e => e.key === 'Enter' && handleSgdbApply(img.url, 'cover')}>
                                         <img src={img.thumb} style={{ width: '140px', height: '210px', borderRadius: '8px', objectFit:'cover', background:'rgba(0,0,0,0.5)' }} />
                                         <div style={{ position:'absolute', bottom:0, background:'rgba(0,0,0,0.8)', width:'100%', padding:'4px', textAlign:'center', fontSize:'11px', borderBottomLeftRadius:'8px', borderBottomRightRadius:'8px', color: '#fff' }}>Dikey Kapak Yap</div>
                                     </div>
                                 ))}
                                 {sgdbImages.grids.length === 0 && <div style={{ color:'var(--text-muted)' }}>Kapak bulunamadı.</div>}
                              </div>

                              <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', marginBottom: '8px' }}>Arka Planlar (Hero)</h3>
                              <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
                                 {sgdbImages.heroes.map(img => (
                                     <div key={img.id} style={{ position: 'relative', cursor:'pointer', flex: '0 0 280px' }} onClick={() => handleSgdbApply(img.url, 'hero')} tabIndex="0" onKeyDown={e => e.key === 'Enter' && handleSgdbApply(img.url, 'hero')}>
                                         <img src={img.thumb} style={{ width: '280px', height: '157px', borderRadius: '8px', objectFit:'cover', background:'rgba(0,0,0,0.5)' }} />
                                         <div style={{ position:'absolute', bottom:0, background:'rgba(0,0,0,0.8)', width:'100%', padding:'4px', textAlign:'center', fontSize:'11px', borderBottomLeftRadius:'8px', borderBottomRightRadius:'8px', color: '#fff' }}>Arka Plan Yap</div>
                                     </div>
                                 ))}
                                 {sgdbImages.heroes.length === 0 && <div style={{ color:'var(--text-muted)' }}>Arka plan bulunamadı.</div>}
                              </div>
                          </div>
                      )}
                  </div>
              </div>
         </div>
      )}

    </div>
  );
}

export default App;
