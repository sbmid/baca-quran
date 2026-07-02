import { useState, useEffect, useRef } from 'react';
import { BookOpen, Moon, Sun, Bookmark, Play, Pause, Search, Copy, CheckCircle, SkipBack, SkipForward, X, ZoomIn, ZoomOut } from 'lucide-react';
import { fetchSurahs, fetchSurahDetail, getBookmarks, addBookmark, removeBookmark, getTheme, saveTheme } from './api';
import './index.css';

const toArabicNumber = (num) => {
  const arabicNumbers = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
  return String(num).split('').map(digit => arabicNumbers[parseInt(digit, 10)] || digit).join('');
};

function App() {
  const [theme, setTheme] = useState('light');
  const [surahs, setSurahs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSurah, setSelectedSurah] = useState(null);
  const [surahDetail, setSurahDetail] = useState(null);
  const [bookmarks, setBookmarks] = useState({});
  const [loading, setLoading] = useState(true);
  const [arabicFontSize, setArabicFontSize] = useState(28); // Default 28px
  
  const [playingAyah, setPlayingAyah] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  // Biar gampang nampilin detail di Global Player
  const [playingAyahDetail, setPlayingAyahDetail] = useState(null);
  const [copiedAyah, setCopiedAyah] = useState(null);
  const [lastRead, setLastRead] = useState(() => {
    try { return JSON.parse(localStorage.getItem('lastRead')); } catch { return null; }
  });

  // Refs untuk Auto-Play dan Auto-Scroll
  const audioRefs = useRef({});
  const ayahRefs = useRef({});

  useEffect(() => {
    getTheme().then(t => {
      setTheme(t);
      document.documentElement.setAttribute('data-theme', t);
    });
  }, []);

  useEffect(() => {
    // SEO Dynamic Title
    if (selectedSurah) {
      document.title = `Surah ${selectedSurah.namaLatin} - Al-Quran Web`;
    } else {
      document.title = 'Al-Quran Web - Baca Offline';
    }
  }, [selectedSurah]);

  // Screen Wake Lock API
  useEffect(() => {
    let wakeLock = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator && selectedSurah) {
          wakeLock = await navigator.wakeLock.request('screen');
        }
      } catch (err) {
        console.log('Wake Lock error:', err);
      }
    };
    requestWakeLock();
    return () => {
      if (wakeLock) wakeLock.release();
    };
  }, [selectedSurah]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const data = await fetchSurahs();
      setSurahs(data);
      const bks = await getBookmarks();
      const bkMap = {};
      bks.forEach(b => { bkMap[b.id] = true });
      setBookmarks(bkMap);
      setLoading(false);
    };
    init();
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    saveTheme(nextTheme);
  };

  const openSurah = async (surah) => {
    if (!surah) return;
    setSelectedSurah(surah);
    setLoading(true);
    
    const lr = { nomor: surah.nomor, namaLatin: surah.namaLatin };
    localStorage.setItem('lastRead', JSON.stringify(lr));
    setLastRead(lr);

    // Reset refs saat ganti surah
    audioRefs.current = {};
    ayahRefs.current = {};
    setPlayingAyah(null);
    setIsPlaying(false);
    
    const detail = await fetchSurahDetail(surah.nomor);
    setSurahDetail(detail);
    setLoading(false);
  };

  const goBack = () => {
    setSelectedSurah(null);
    setSurahDetail(null);
    audioRefs.current = {};
    ayahRefs.current = {};
    setPlayingAyah(null);
    setIsPlaying(false);
  };

  const toggleBookmark = async (ayah) => {
    const id = `${selectedSurah.nomor}_${ayah.nomorAyat}`;
    const isBookmarked = !!bookmarks[id];
    
    if (isBookmarked) {
      const ok = await removeBookmark(selectedSurah.nomor, ayah.nomorAyat);
      if (ok) {
        setBookmarks(prev => {
          const next = {...prev};
          delete next[id];
          return next;
        });
      }
    } else {
      const ok = await addBookmark(selectedSurah.nomor, ayah.nomorAyat, ayah.teksArab);
      if (ok) {
        setBookmarks(prev => ({...prev, [id]: true}));
      }
    }
  };

  // Custom Play Logic
  const togglePlay = (ayahNumber) => {
    if (playingAyah === ayahNumber) {
      const audio = audioRefs.current[ayahNumber];
      if (audio) {
        if (audio.paused) audio.play();
        else audio.pause();
      }
      return;
    }
    
    // Stop previous
    if (playingAyah && audioRefs.current[playingAyah]) {
      const prevAudio = audioRefs.current[playingAyah];
      prevAudio.pause();
      prevAudio.currentTime = 0;
    }

    const currentAudio = audioRefs.current[ayahNumber];
    if (currentAudio) {
      currentAudio.play();
      const detail = surahDetail?.ayat.find(a => a.nomorAyat === ayahNumber);
      if (detail) setPlayingAyahDetail(detail);
    }
  };

  const playNext = () => {
    if (!surahDetail || !playingAyah) return;
    const currentIndex = surahDetail.ayat.findIndex(a => a.nomorAyat === playingAyah);
    if (currentIndex < surahDetail.ayat.length - 1) {
      handleAudioEnded(currentIndex);
    }
  };

  const playPrev = () => {
    if (!surahDetail || !playingAyah) return;
    const currentIndex = surahDetail.ayat.findIndex(a => a.nomorAyat === playingAyah);
    if (currentIndex > 0) {
      const prevAyah = surahDetail.ayat[currentIndex - 1].nomorAyat;
      togglePlay(prevAyah);
      const prevDiv = ayahRefs.current[prevAyah];
      if (prevDiv) prevDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Logic Auto-Play
  const handleAudioEnded = (currentIndex) => {
    if (!surahDetail) return;
    const nextIndex = currentIndex + 1;
    // Jika masih ada ayat selanjutnya
    if (nextIndex < surahDetail.ayat.length) {
      const nextAyahNumber = surahDetail.ayat[nextIndex].nomorAyat;
      togglePlay(nextAyahNumber);
      
      const nextDiv = ayahRefs.current[nextAyahNumber];
      if (nextDiv) {
        // Scroll layar biar ayatnya kelihatan (smooth scrolling)
        nextDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      setPlayingAyah(null);
      setIsPlaying(false);
    }
  };

  const handleCopy = (ayah) => {
    const text = `${ayah.teksArab}\n\nArtinya:\n${ayah.teksIndonesia}`;
    navigator.clipboard.writeText(text);
    setCopiedAyah(ayah.nomorAyat);
    setTimeout(() => setCopiedAyah(null), 2000);
  };

  // Kalkulasi Target Khatam (Total Ayat = 6236)
  const TOTAL_AYAH = 6236;
  const readCount = Object.keys(bookmarks).length;
  const progressPercent = Math.min((readCount / TOTAL_AYAH) * 100, 100).toFixed(2);

  const filteredSurahs = surahs.filter(surah => 
    surah.namaLatin.toLowerCase().includes(searchQuery.toLowerCase()) || 
    surah.arti.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`container ${playingAyah ? 'padding-bottom-player' : ''}`}>
      <header>
        <h1 onClick={goBack} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
          <img src="/favicon.png" alt="Logo" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
          Al-Quran Web
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {selectedSurah && (
            <div style={{ display: 'flex', gap: '5px' }}>
              <button className="theme-toggle" onClick={() => setArabicFontSize(p => Math.max(20, p - 4))} title="Perkecil Teks">
                <ZoomOut size={16} />
              </button>
              <button className="theme-toggle" onClick={() => setArabicFontSize(p => Math.min(60, p + 4))} title="Perbesar Teks">
                <ZoomIn size={16} />
              </button>
            </div>
          )}
          <button className="theme-toggle" onClick={toggleTheme} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </button>
        </div>
      </header>

      {loading ? (
        <div style={{ marginTop: '2rem' }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton skeleton-card" style={{ borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div className="skeleton skeleton-text"></div>
              <div className="skeleton skeleton-text short"></div>
            </div>
          ))}
        </div>
      ) : selectedSurah && surahDetail ? (
        <div>
          <div className="detail-header">
            <h2>{surahDetail.namaLatin}</h2>
            <p>{surahDetail.arti} • {surahDetail.jumlahAyat} Ayat</p>
          </div>
          <div className="ayah-list">
            {surahDetail.ayat.map((ayah, index) => {
              const bkId = `${surahDetail.nomor}_${ayah.nomorAyat}`;
              const isBk = bookmarks[bkId];
              return (
                <div 
                  key={ayah.nomorAyat} 
                  className="ayah-card"
                  ref={el => ayahRefs.current[ayah.nomorAyat] = el}
                >
                  <div className="ayah-header">
                    <span className="ayah-number">{toArabicNumber(ayah.nomorAyat)}</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className="btn-bookmark"
                        onClick={() => handleCopy(ayah)}
                        title="Copy Ayat"
                      >
                        {copiedAyah === ayah.nomorAyat ? <CheckCircle size={20} color="var(--accent)" /> : <Copy size={20} />}
                      </button>
                      <button 
                        className={`btn-bookmark ${isBk ? 'active' : ''}`}
                        onClick={() => toggleBookmark(ayah)}
                        title="Bookmark"
                      >
                        <Bookmark size={20} fill={isBk ? "currentColor" : "none"} />
                      </button>
                    </div>
                  </div>
                  <div className="ayah-arabic" style={{ fontSize: `${arabicFontSize}px`, transition: 'font-size 0.3s' }}>{ayah.teksArab}</div>
                  <div className="ayah-translation">{ayah.teksIndonesia}</div>
                  {ayah.audio && ayah.audio['05'] && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button 
                        className="btn-play"
                        onClick={() => togglePlay(ayah.nomorAyat)}
                        title={playingAyah === ayah.nomorAyat && isPlaying ? "Pause" : "Play"}
                      >
                        {playingAyah === ayah.nomorAyat && isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                      </button>
                      <audio 
                        style={{ display: 'none' }}
                        ref={el => audioRefs.current[ayah.nomorAyat] = el}
                        onEnded={() => handleAudioEnded(index)}
                        onPlay={() => { setPlayingAyah(ayah.nomorAyat); setIsPlaying(true); }}
                        onPause={() => setIsPlaying(false)}
                      >
                        <source src={ayah.audio['05']} type="audio/mpeg" />
                      </audio>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <>
          {/* Tracker Progress Bar Component */}
          <div className="tracker-container">
            <div className="tracker-header">
              <span>Progres Khatam (Berdasarkan Bookmark)</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="progress-bar-bg">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Telah membaca {readCount} dari {TOTAL_AYAH} ayat Al-Quran.
            </p>
          </div>

          <div className="search-container">
            <Search size={20} className="search-icon" />
            <input 
              type="text" 
              placeholder="Cari Surah (misal: Yasin, Al-Mulk...)" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          {lastRead && !searchQuery && (
            <div className="resume-banner" onClick={() => {
              const s = surahs.find(x => x.nomor === lastRead.nomor);
              if (s) openSurah(s);
            }}>
              <BookOpen size={20} color="var(--accent)" />
              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Lanjutkan Membaca</p>
                <p style={{ margin: 0, fontWeight: '600' }}>Surah {lastRead.namaLatin}</p>
              </div>
            </div>
          )}

          <div className="surah-list">
            {filteredSurahs.map((surah) => (
              <div 
                key={surah.nomor} 
                className="surah-card" 
                style={{
                  '--surah-bg': `url('/${surah.nomor}.jpg'), url('/${surah.tempatTurun === 'Madinah' ? 'madaniyah' : 'makkiyah'}.jpg')`
                }}
                onClick={() => openSurah(surah)}
              >
                <div className="info">
                  <h2>{surah.nomor}. {surah.namaLatin}</h2>
                  <p>{surah.arti}</p>
                </div>
                <div className="arabic">{surah.nama}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Global Audio Player (Spotify Style) */}
      <div className={`global-player ${playingAyah ? 'visible' : ''}`}>
        <div className="player-info">
          <h4>{selectedSurah?.namaLatin}</h4>
          <p>Ayat {playingAyah} {playingAyahDetail && `• ${playingAyahDetail.teksArab.substring(0, 15)}...`}</p>
        </div>
        <div className="player-controls">
          <button className="btn-player" onClick={playPrev}><SkipBack size={20} fill="currentColor" /></button>
          <button className="btn-player primary" onClick={() => togglePlay(playingAyah)}>
            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
          </button>
          <button className="btn-player" onClick={playNext}><SkipForward size={20} fill="currentColor" /></button>
          <button className="btn-player" style={{ marginLeft: '10px' }} onClick={() => {
            const currentAudio = audioRefs.current[playingAyah];
            if (currentAudio) {
              currentAudio.pause();
              currentAudio.currentTime = 0;
            }
            setPlayingAyah(null);
            setIsPlaying(false);
          }}>
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
