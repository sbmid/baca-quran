const GHOSTDB_URL = '/api';
const TOKEN = 'al_quran_secure_token_123';

const authHeaders = {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json'
};

export const fetchSurahs = async () => {
    try {
        // Cek Cache Lokal di GhostDB
        const localRes = await fetch(`${GHOSTDB_URL}/surahs/all_surahs`, { headers: authHeaders });
        if (localRes.ok) {
            const localData = await localRes.json();
            return localData.data;
        }

        // Kalau gaada, ambil dari equran
        const res = await fetch('https://equran.id/api/v2/surat');
        const json = await res.json();
        const data = json.data || [];

        // Simpan ke GhostDB biar besok offline bisa!
        if (data.length > 0) {
            await fetch(`${GHOSTDB_URL}/surahs`, {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({ id: 'all_surahs', data })
            });
        }
        return data;
    } catch (e) {
        console.error("Gagal fetch surah", e);
        return [];
    }
};

export const fetchSurahDetail = async (id) => {
    try {
        // Cek Cache Lokal
        const localRes = await fetch(`${GHOSTDB_URL}/surah_details/detail_${id}`, { headers: authHeaders });
        if (localRes.ok) {
            const localData = await localRes.json();
            return localData.data;
        }

        const res = await fetch(`https://equran.id/api/v2/surat/${id}`);
        const json = await res.json();
        const data = json.data || null;

        // Simpan ke GhostDB
        if (data) {
            await fetch(`${GHOSTDB_URL}/surah_details`, {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({ id: `detail_${id}`, data })
            });
        }
        return data;
    } catch (e) {
        console.error("Gagal fetch detail surah", e);
        return null;
    }
};

export const getBookmarks = async () => {
    try {
        const res = await fetch(`${GHOSTDB_URL}/bookmarks`, { headers: authHeaders });
        if (!res.ok) return [];
        return await res.json();
    } catch (e) {
        console.error("GhostDB belum nyala atau error", e);
        return [];
    }
};

export const addBookmark = async (surahId, ayahNumber, text) => {
    try {
        const id = `${surahId}_${ayahNumber}`;
        await fetch(`${GHOSTDB_URL}/bookmarks`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ id, surahId, ayahNumber, text })
        });
        return true;
    } catch (e) {
        console.error("Gagal simpan bookmark", e);
        return false;
    }
};

export const removeBookmark = async (surahId, ayahNumber) => {
    try {
        const id = `${surahId}_${ayahNumber}`;
        await fetch(`${GHOSTDB_URL}/bookmarks/${id}`, {
            method: 'DELETE',
            headers: authHeaders
        });
        return true;
    } catch (e) {
        console.error("Gagal hapus bookmark", e);
        return false;
    }
};

// --- SETTINGS (Theme) ---
export const getTheme = async () => {
    try {
        const res = await fetch(`${GHOSTDB_URL}/settings/theme`, { headers: authHeaders });
        if (res.ok) {
            const json = await res.json();
            return json.value || 'light';
        }
        return 'light';
    } catch (e) {
        return 'light';
    }
};

export const saveTheme = async (theme) => {
    try {
        await fetch(`${GHOSTDB_URL}/settings`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ id: 'theme', value: theme })
        });
    } catch (e) {
        console.error("Gagal save theme", e);
    }
};
