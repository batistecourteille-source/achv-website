'use client';
import { useEffect, useState, useCallback } from 'react';

const KEY = 'achv_bookmarks_v1';

export function useBookmarks() {
    const [ids, setIds] = useState<string[]>([]);

    // Load on mount
    useEffect(() => {
        try {
            const raw = localStorage.getItem(KEY);
            if (raw) setIds(JSON.parse(raw));
        } catch {}
        const onStorage = (e: StorageEvent) => {
            if (e.key === KEY) {
                try { setIds(e.newValue ? JSON.parse(e.newValue) : []); } catch {}
            }
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    const persist = (next: string[]) => {
        setIds(next);
        try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
    };

    const has = useCallback((id: string) => ids.includes(id), [ids]);
    const toggle = useCallback((id: string) => {
        const next = ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id];
        persist(next);
    }, [ids]);
    const clear = useCallback(() => persist([]), []);

    return { ids, has, toggle, clear, count: ids.length };
}
