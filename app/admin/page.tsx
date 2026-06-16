'use client';
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useData, Article, Event as Ev, TeamMember, Activity, Partner, CustomPage, Result, ResultAthlete, ClubRecord, ScheduleItem, PricingItem, AdminUser } from '@/lib/DataContext';
import { useAuth } from '@/lib/AuthContext';
import '@/app/admin.css';
import SocialPostEmbed from '@/components/SocialPostEmbed';

/* =============================================
   IMAGE UPLOAD — drag & drop + click
   ============================================= */
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/* =============================================
   IMAGE UPLOAD — Firebase Storage
   ============================================= */
/* =============================================
   IMAGE UPLOAD — Firebase Storage
   ============================================= */
function useImageUpload() {
    const upload = async (file: File, path: string = 'uploads'): Promise<string> => {
        console.log("Starting upload...", file.name);

        if (!storage) {
            console.error("Storage object is missing!");
            alert("Erreur critique : Le service de stockage n'est pas configuré. Vérifiez votre fichier .env.local (NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET).");
            throw new Error("Configuration manquante : Storage non initialisé.");
        }

        try {
            // Test permissions with a small file or specific path if needed, but here we just try upload
            const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
            console.log("Target Ref:", storageRef.fullPath);

            const snapshot = await uploadBytes(storageRef, file);
            console.log("Upload done, getting URL...");

            const url = await getDownloadURL(snapshot.ref);
            console.log("URL obtained:", url);
            return url;
        } catch (error: any) {
            console.error("Upload Error Detailed:", error);

            let message = "Erreur inconnue lors de l'upload.";
            if (error.code === 'storage/unauthorized') {
                message = "Permission refusée : Vous n'avez pas l'autorisation d'envoyer des fichiers. Vérifiez les règles de sécurité Firebase Storage.";
            } else if (error.code === 'storage/retry-limit-exceeded') {
                message = "Erreur de connexion : Délai d'attente dépassé. Vérifiez votre connexion internet.";
            } else if (error.code === 'storage/invalid-argument') {
                message = "Fichier invalide : Le format ou le nom du fichier pose problème.";
            } else if (error.code === 'storage/canceled') {
                message = "Envoi annulé par l'utilisateur.";
            } else if (error.message) {
                message = `Erreur technique : ${error.message}`;
            }

            alert(message);
            throw new Error(message);
        }
    };

    return { upload };
}

function ImageUpload({ value, onChange, label, hint, folder = 'images' }: { value?: string; onChange: (v: string) => void; label: string; hint?: string; folder?: string }) {
    const { upload } = useImageUpload();
    const refInput = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [dragging, setDragging] = useState(false);

    const compressImage = async (file: File): Promise<File> => {
        // Skip compression for GIFs and SVGs (animations / vector)
        if (file.type === 'image/gif' || file.type === 'image/svg+xml') return file;

        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);
            img.onload = () => {
                URL.revokeObjectURL(url);
                const MAX_W = 1920;
                const MAX_H = 1920;
                let { width, height } = img;
                if (width > MAX_W || height > MAX_H) {
                    const ratio = Math.min(MAX_W / width, MAX_H / height);
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) { resolve(file); return; }
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob(blob => {
                    if (!blob) { resolve(file); return; }
                    // Keep original if compression made it bigger
                    if (blob.size >= file.size) { resolve(file); return; }
                    const compressed = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
                    resolve(compressed);
                }, 'image/jpeg', 0.85);
            };
            img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Erreur de lecture image')); };
            img.src = url;
        });
    };

    const handleFile = async (file: File) => {
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert("Ce fichier n'est pas une image.");
            return;
        }

        // Limit file size to 10MB client-side check (avant compression)
        if (file.size > 10 * 1024 * 1024) {
            alert("L'image est trop volumineuse (Max 10 Mo).");
            return;
        }

        setUploading(true);
        try {
            const originalSize = file.size;
            const compressed = await compressImage(file).catch(() => file);
            if (compressed.size < originalSize) {
                console.log(`Image compressée : ${(originalSize/1024).toFixed(0)} Ko → ${(compressed.size/1024).toFixed(0)} Ko (-${Math.round((1 - compressed.size/originalSize) * 100)}%)`);
            }
            const url = await upload(compressed, folder);
            onChange(url);
        } catch (error) {
            // Error is already alerted in upload function
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    const onDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault(); setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) await handleFile(file);
    }, []);

    return (
        <div className="form-group">
            <label>{label}</label>
            {hint && <p className="form-hint">{hint}</p>}

            {uploading ? (
                <div className="wp-dropzone">
                    <div className="wp-spinner"></div>
                    <p>Envoi de l'image en cours...</p>
                </div>
            ) : value ? (
                <div className="wp-image-preview">
                    <img src={value} alt="Preview" />
                    <div className="wp-image-actions">
                        <button type="button" onClick={() => refInput.current?.click()} className="wp-btn-sm">📷 Remplacer</button>
                        <button type="button" onClick={() => onChange('')} className="wp-btn-sm wp-btn-danger">✕ Retirer</button>
                    </div>
                </div>
            ) : (
                <div
                    className={`wp-dropzone ${dragging ? 'dragging' : ''}`}
                    onDragOver={e => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={onDrop}
                    onClick={() => refInput.current?.click()}
                >
                    <div className="wp-dropzone-icon">📁</div>
                    <p>Glissez une image ici ou <span>cliquez pour parcourir</span></p>
                    <small>JPG, PNG, WebP • Max 5 Mo</small>
                </div>
            )}
            <input type="file" ref={refInput} accept="image/*" onChange={async e => { const f = e.target.files?.[0]; if (f) await handleFile(f); }} style={{ display: 'none' }} />
        </div>
    );
}

/* =============================================
   RICH TEXT TOOLBAR
   ============================================= */
function RichTextArea({ value, onChange, rows = 8, placeholder }: { value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
    const editorRef = useRef<HTMLDivElement>(null);
    const [isEmpty, setIsEmpty] = useState(!value);

    // Sync external value into editor only on first mount or when value changes externally
    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value || '';
            setIsEmpty(!value);
        }
    }, []); // Only on mount

    const exec = (cmd: string, val?: string) => {
        document.execCommand(cmd, false, val);
        editorRef.current?.focus();
        // Sync content back
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
            setIsEmpty(!editorRef.current.textContent?.trim());
        }
    };

    const handleInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
            setIsEmpty(!editorRef.current.textContent?.trim());
        }
    };

    const handleLink = () => {
        const url = prompt('Entrez l\'adresse du lien (URL) :');
        if (url) exec('createLink', url);
    };

    const handleImage = () => {
        const url = prompt('URL de l\'image :');
        if (url) exec('insertImage', url);
    };

    return (
        <div className="wp-richtext">
            <div className="wp-toolbar">
                <button type="button" title="Gras" onClick={() => exec('bold')} style={{ fontWeight: 'bold' }}>G</button>
                <button type="button" title="Italique" onClick={() => exec('italic')} style={{ fontStyle: 'italic' }}>I</button>
                <button type="button" title="Souligné" onClick={() => exec('underline')} style={{ textDecoration: 'underline' }}>S</button>
                <span className="wp-toolbar-sep" />
                <button type="button" title="Titre principal" onClick={() => exec('formatBlock', 'h2')}>H2</button>
                <button type="button" title="Sous-titre" onClick={() => exec('formatBlock', 'h3')}>H3</button>
                <button type="button" title="Paragraphe" onClick={() => exec('formatBlock', 'p')}>¶</button>
                <button type="button" title="Citation" onClick={() => exec('formatBlock', 'blockquote')}>❝</button>
                <span className="wp-toolbar-sep" />
                <button type="button" title="Liste à puces" onClick={() => exec('insertUnorderedList')}>• Liste</button>
                <button type="button" title="Liste numérotée" onClick={() => exec('insertOrderedList')}>1. Liste</button>
                <span className="wp-toolbar-sep" />
                <button type="button" title="Aligner à gauche" onClick={() => exec('justifyLeft')}>⬅</button>
                <button type="button" title="Centrer" onClick={() => exec('justifyCenter')}>↔</button>
                <button type="button" title="Aligner à droite" onClick={() => exec('justifyRight')}>➡</button>
                <span className="wp-toolbar-sep" />
                <button type="button" title="Insérer un lien" onClick={handleLink}>🔗 Lien</button>
                <button type="button" title="Insérer une image" onClick={handleImage}>🖼️ Image</button>
                <span className="wp-toolbar-sep" />
                <button type="button" title="Effacer le formatage" onClick={() => exec('removeFormat')}>✕ Format</button>
            </div>
            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleInput}
                onBlur={handleInput}
                className="wp-richtext-editor"
                style={{
                    minHeight: rows * 24,
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderTop: 'none',
                    borderRadius: '0 0 8px 8px',
                    fontSize: '1rem',
                    lineHeight: 1.7,
                    outline: 'none',
                    background: 'white',
                    color: '#1f2937',
                    overflow: 'auto',
                }}
            />
            {isEmpty && (
                <div style={{
                    position: 'absolute',
                    top: 52, left: 16,
                    color: '#9ca3af',
                    pointerEvents: 'none',
                    fontSize: '1rem',
                }}>
                    {placeholder}
                </div>
            )}
        </div>
    );
}

/* =============================================
   SHARED UI
   ============================================= */
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
    React.useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
    return <div className="toast success">{message}</div>;
}

function Modal({ title, children, onClose, wide }: { title: string; children: React.ReactNode; onClose: () => void; wide?: boolean }) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className={`modal ${wide ? 'modal-wide' : ''}`} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{title}</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="modal-body">{children}</div>
            </div>
        </div>
    );
}

function ConfirmDialog({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal modal-confirm" onClick={e => e.stopPropagation()}>
                <div className="confirm-icon">⚠️</div>
                <p>{message}</p>
                <div className="modal-actions">
                    <button className="wp-btn wp-btn-cancel" onClick={onCancel}>Annuler</button>
                    <button className="wp-btn wp-btn-danger" onClick={onConfirm}>Supprimer</button>
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ active, labelOn = 'Publié', labelOff = 'Brouillon' }: { active: boolean; labelOn?: string; labelOff?: string }) {
    return <span className={`wp-badge ${active ? 'wp-badge-success' : 'wp-badge-draft'}`}>{active ? `✓ ${labelOn}` : `✗ ${labelOff}`}</span>;
}

/* =============================================
   SIDEBAR
   ============================================= */
function AdminSidebar({ active, onNav }: { active: string; onNav: (s: string) => void }) {
    const { logout } = useAuth();
    const router = useRouter();
    const items = [
        { id: 'dashboard', icon: '📊', label: 'Tableau de bord' },
        { id: 'articles', icon: '📰', label: 'Articles' },
        { id: 'events', icon: '📅', label: 'Événements' },
        { id: 'team', icon: '👥', label: 'Équipe' },
        { id: 'activities', icon: '🏃', label: 'Activités' },
        { id: 'partners', icon: '🤝', label: 'Partenaires' },
        { id: 'results', icon: '🏆', label: 'Résultats' },
        { id: 'pages', icon: '📄', label: 'Pages' },
        { id: 'planning', icon: '🗓️', label: 'Planning' },
        { id: 'pricing', icon: '💰', label: 'Tarifs' },
        { id: 'settings', icon: '⚙️', label: 'Réglages' },
        { id: 'maintenance', icon: '🛠️', label: 'Maintenance' },
        { id: 'admins', icon: '👤', label: 'Administrateurs' },
    ];

    return (
        <aside className="admin-sidebar">
            <div className="admin-sidebar-logo">
                <img src="/logo.png" alt="ACHV" />
                <span>Admin ACHV</span>
            </div>
            <ul className="admin-nav">
                {items.map(item => (
                    <li key={item.id}>
                        <a className={active === item.id ? 'active' : ''} onClick={() => onNav(item.id)}>
                            <span className="admin-nav-icon">{item.icon}</span>
                            {item.label}
                        </a>
                    </li>
                ))}
            </ul>
            <div className="admin-sidebar-footer">
                <a href="/" target="_blank" rel="noopener">🌐 Voir le site</a>
                <a onClick={() => { logout(); router.push('/admin/login'); }} style={{ cursor: 'pointer' }}>🚪 Déconnexion</a>
            </div>
        </aside>
    );
}

/* =============================================
   DASHBOARD — WordPress-like
   ============================================= */
function DashboardView({ onNav }: { onNav: (s: string) => void }) {
    const { articles, events, team, partners, activities, customPages, settings } = useData();
    const recentArticles = articles.filter(a => a.published).slice(0, 3);

    return (
        <>
            <div className="admin-header">
                <div>
                    <h1>Tableau de bord</h1>
                    <p className="admin-subtitle">Bienvenue sur l&apos;administration de {settings.clubName}</p>
                </div>
            </div>

            {/* Quick actions */}
            <div className="wp-quick-actions">
                <h3>Actions rapides</h3>
                <div className="wp-quick-grid">
                    <button onClick={() => onNav('articles')} className="wp-quick-btn">📝 <span>Nouvel article</span></button>
                    <button onClick={() => onNav('events')} className="wp-quick-btn">📅 <span>Nouvel événement</span></button>
                    <button onClick={() => onNav('pages')} className="wp-quick-btn">📄 <span>Nouvelle page</span></button>
                    <button onClick={() => onNav('settings')} className="wp-quick-btn">⚙️ <span>Réglages</span></button>
                </div>
            </div>

            {/* Stats */}
            <div className="admin-stats-grid">
                {[
                    { label: 'Articles', value: articles.length, icon: '📰', section: 'articles' },
                    { label: 'Événements', value: events.length, icon: '📅', section: 'events' },
                    { label: 'Membres', value: team.length, icon: '👥', section: 'team' },
                    { label: 'Activités', value: activities.length, icon: '🏃', section: 'activities' },
                    { label: 'Partenaires', value: partners.length, icon: '🤝', section: 'partners' },
                    { label: 'Pages', value: customPages.length, icon: '📄', section: 'pages' },
                ].map(s => (
                    <div key={s.label} className="admin-stat-card" onClick={() => onNav(s.section)} style={{ cursor: 'pointer' }}>
                        <div className="admin-stat-icon">{s.icon}</div>
                        <div className="admin-stat-number">{s.value}</div>
                        <div className="admin-stat-label">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Recent articles */}
            <div className="wp-dashboard-row">
                <div className="admin-card wp-dashboard-card">
                    <h3>📰 Derniers articles publiés</h3>
                    {recentArticles.length > 0 ? (
                        <ul className="wp-recent-list">
                            {recentArticles.map(a => (
                                <li key={a.id}>
                                    <span className="wp-recent-title">{a.title}</span>
                                    <span className="wp-recent-date">{new Date(a.date).toLocaleDateString('fr-FR')}</span>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="wp-empty">Aucun article publié</p>}
                    <button className="wp-link-btn" onClick={() => onNav('articles')}>Gérer les articles →</button>
                </div>
                <div className="admin-card wp-dashboard-card">
                    <h3>📅 Prochains événements</h3>
                    {events.slice(0, 3).length > 0 ? (
                        <ul className="wp-recent-list">
                            {events.slice(0, 3).map(e => (
                                <li key={e.id}>
                                    <span className="wp-recent-title">{e.title}</span>
                                    <span className="wp-recent-date">{e.location}</span>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="wp-empty">Aucun événement</p>}
                    <button className="wp-link-btn" onClick={() => onNav('events')}>Gérer l&apos;agenda →</button>
                </div>
            </div>
        </>
    );
}

/* =============================================
   ARTICLES VIEW — WordPress-like
   ============================================= */
function ArticlesView() {
    const { articles, addArticle, updateArticle, deleteArticle } = useData();
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Article | null>(null);
    const [form, setForm] = useState({ title: '', content: '', excerpt: '', date: '', category: '', image: '', images: [] as string[], published: true, city: 'Les deux', isFeatured: false, author: '', tags: [] as string[] });
    const [tagInput, setTagInput] = useState('');
    const [toast, setToast] = useState('');
    const [confirmId, setConfirmId] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showPreview, setShowPreview] = useState(false);

    // All existing tags for autocomplete
    const allExistingTags = useMemo(() => {
        const set = new Set<string>();
        articles.forEach(a => (a.tags || []).forEach(t => set.add(t)));
        return Array.from(set).sort();
    }, [articles]);

    // Word count + reading time for current edit
    const stats = useMemo(() => {
        const text = (form.content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        const words = text ? text.split(' ').length : 0;
        const minutes = Math.max(1, Math.round(words / 200));
        const chars = text.length;
        return { words, minutes, chars };
    }, [form.content]);

    // Auto-save draft to localStorage
    useEffect(() => {
        if (!showModal) return;
        const key = editing ? `draft_article_${editing.id}` : 'draft_article_new';
        const t = setTimeout(() => {
            try { localStorage.setItem(key, JSON.stringify(form)); } catch {}
        }, 1000);
        return () => clearTimeout(t);
    }, [form, showModal, editing]);

    // Tag suggestions while typing
    const tagSuggestions = useMemo(() => {
        const q = tagInput.trim().toLowerCase();
        if (!q) return [];
        return allExistingTags
            .filter(t => t.toLowerCase().includes(q) && !form.tags.includes(t))
            .slice(0, 6);
    }, [tagInput, allExistingTags, form.tags]);

    const openNew = () => { setEditing(null); setForm({ title: '', content: '', excerpt: '', date: new Date().toISOString().split('T')[0], category: 'Vie du club', image: '', images: [], published: true, city: 'Les deux', isFeatured: false, author: '', tags: [] }); setTagInput(''); setShowModal(true); };
    const openEdit = (a: Article) => { setEditing(a); setForm({ title: a.title, content: a.content, excerpt: a.excerpt, date: a.date, category: a.category, image: a.image || '', images: a.images || [], published: a.published, city: a.city || 'Les deux', isFeatured: !!a.isFeatured, author: a.author || '', tags: a.tags || [] }); setTagInput(''); setShowModal(true); };

    const addTag = () => {
        const tag = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
        if (tag && !form.tags.includes(tag)) {
            setForm({ ...form, tags: [...form.tags, tag] });
        }
        setTagInput('');
    };

    const removeTag = (tag: string) => setForm({ ...form, tags: form.tags.filter(t => t !== tag) });

    const save = () => {
        if (!form.title.trim()) return;
        const data = { ...form, city: form.city as 'Noyal' | 'Nouvoitou' | 'Les deux' };
        if (editing) { updateArticle(editing.id, data); setToast('✓ Article modifié avec succès'); }
        else { addArticle({ ...data, id: Date.now().toString() }); setToast('✓ Article créé avec succès'); }
        setShowModal(false);
    };

    const filtered = articles
        .filter(a => filter === 'all' || (filter === 'published' ? a.published : !a.published))
        .filter(a => {
            const q = searchQuery.trim().toLowerCase();
            if (!q) return true;
            return a.title.toLowerCase().includes(q)
                || (a.excerpt || '').toLowerCase().includes(q)
                || (a.author || '').toLowerCase().includes(q)
                || (a.category || '').toLowerCase().includes(q)
                || (a.tags || []).some(t => t.toLowerCase().includes(q));
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <>
            <div className="admin-header">
                <div>
                    <h1>Articles</h1>
                    <p className="admin-subtitle">Gérez les actualités de votre club</p>
                </div>
                <button className="wp-btn wp-btn-primary" onClick={openNew}>+ Nouvel article</button>
            </div>

            <div className="wp-filters" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button className={`wp-filter ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Tous ({articles.length})</button>
                    <button className={`wp-filter ${filter === 'published' ? 'active' : ''}`} onClick={() => setFilter('published')}>Publiés ({articles.filter(a => a.published).length})</button>
                    <button className={`wp-filter ${filter === 'draft' ? 'active' : ''}`} onClick={() => setFilter('draft')}>Brouillons ({articles.filter(a => !a.published).length})</button>
                </div>
                <div style={{ position: 'relative', minWidth: 240, flex: '1 1 220px', maxWidth: 400 }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: '0.95rem', pointerEvents: 'none' }}>🔍</span>
                    <input
                        type="search"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Rechercher (titre, auteur, tag, catégorie)…"
                        style={{ width: '100%', padding: '8px 12px 8px 36px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.9rem', boxSizing: 'border-box' }}
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 }}>✕</button>
                    )}
                </div>
            </div>

            <div className="admin-card">
                <table className="admin-table">
                    <thead><tr><th>Titre</th><th>Catégorie</th><th>Date</th><th>Statut</th><th>Actions</th></tr></thead>
                    <tbody>
                        {filtered.map(a => (
                            <tr key={a.id}>
                                <td><strong className="wp-title-link" onClick={() => openEdit(a)}>{a.title}</strong></td>
                                <td><span className="wp-category-tag">{a.category}</span></td>
                                <td>{new Date(a.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <StatusBadge active={a.published} />
                                        {a.isFeatured && <span title="À la une" style={{ fontSize: '1.2rem' }}>⭐️</span>}
                                    </div>
                                </td>
                                <td>
                                    <div className="wp-action-btns">
                                        <button className="wp-btn-icon" title="Modifier" onClick={() => openEdit(a)}>✏️</button>
                                        <button className="wp-btn-icon wp-btn-icon-danger" title="Supprimer" onClick={() => setConfirmId(a.id)}>🗑️</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && <tr><td colSpan={5} className="wp-empty-row">Aucun article trouvé</td></tr>}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <Modal title={editing ? 'Modifier l\'article' : 'Nouvel article'} onClose={() => setShowModal(false)} wide>
                    <div className="wp-editor-layout">
                        <div className="wp-editor-main">
                            <div className="form-group"><label>Titre</label><input className="wp-input-lg" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Donnez un titre à votre article..." /></div>
                            <div className="form-group"><label>Auteur</label><p className="form-hint">Laissez vide pour afficher "Par La Rédaction"</p><input value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} placeholder="Ex: Jean Dupont" /></div>
                            <div className="form-group">
                                <label>Contenu</label>
                                <RichTextArea value={form.content} onChange={v => setForm({ ...form, content: v })} placeholder="Rédigez le contenu de l'article ici..." />
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: '0.8rem', color: '#64748b' }}>
                                    <span>📝 <strong>{stats.words}</strong> mots · <strong>{stats.chars}</strong> caractères</span>
                                    <span>⏱️ ~{stats.minutes} min de lecture</span>
                                </div>
                            </div>
                            <div className="form-group"><label>Extrait</label><p className="form-hint">Un résumé court affiché dans les aperçus</p><textarea value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })} rows={2} placeholder="Résumé de l'article en une ou deux phrases..." /></div>
                        </div>
                        <div className="wp-editor-sidebar">
                            <div className="wp-sidebar-box">
                                <h4>Publication</h4>
                                <label className="wp-toggle-label"><input type="checkbox" checked={form.published} onChange={e => setForm({ ...form, published: e.target.checked })} /> Publié</label>
                                <label className="wp-toggle-label" style={{ marginTop: 8 }}><input type="checkbox" checked={form.isFeatured} onChange={e => setForm({ ...form, isFeatured: e.target.checked })} /> ⭐️ À la une</label>
                                <div className="form-group" style={{ marginTop: 12 }}><label>Date</label><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
                            </div>
                            <div className="wp-sidebar-box">
                                <h4>Catégorie</h4>
                                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                    <option value="">Choisir...</option>
                                    <option value="Compétitions">Compétitions</option>
                                    <option value="Vie du club">Vie du club</option>
                                    <option value="Événements">Événements</option>
                                    <option value="Sorties">Sorties</option>
                                </select>
                            </div>
                            <div className="wp-sidebar-box">
                                <h4>Ville concernée</h4>
                                <select value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}>
                                    <option value="Les deux">Les deux</option>
                                    <option value="Noyal">Noyal-sur-Vilaine</option>
                                    <option value="Nouvoitou">Nouvoitou</option>
                                </select>
                            </div>
                            <div className="wp-sidebar-box">
                                <h4>🏷️ Hashtags</h4>
                                <p className="form-hint">Ajoutez des tags pour classer l&apos;article</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                                    {form.tags.map(tag => (
                                        <span key={tag} style={{ background: '#e0f2fe', color: '#0369a1', borderRadius: 20, padding: '3px 10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                            #{tag}
                                            <button type="button" onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0369a1', fontWeight: 700, lineHeight: 1, padding: 0 }}>×</button>
                                        </span>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: 6, position: 'relative' }}>
                                    <input
                                        value={tagInput}
                                        onChange={e => setTagInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                                        placeholder="Nouveau tag..."
                                        style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                                    />
                                    <button type="button" onClick={addTag} className="wp-btn" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>+</button>
                                </div>
                                {tagSuggestions.length > 0 && (
                                    <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                        {tagSuggestions.map(t => (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => { setForm({ ...form, tags: [...form.tags, t] }); setTagInput(''); }}
                                                style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#475569', borderRadius: 14, padding: '2px 10px', fontSize: '0.75rem', cursor: 'pointer' }}
                                            >
                                                + #{t}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="wp-sidebar-box">
                                <h4>Image à la une</h4>
                                <ImageUpload value={form.image} onChange={v => setForm({ ...form, image: v })} label="" hint="Apparaît en aperçu sur la liste des actualités" />
                            </div>
                            <div className="wp-sidebar-box">
                                <h4>📸 Galerie photos</h4>
                                <p className="form-hint" style={{ marginBottom: 8 }}>Ajoutez plusieurs photos à votre article (galerie en bas de l&apos;article).</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                                    {form.images.map((img, idx) => (
                                        <div key={idx} style={{ position: 'relative', width: 80, height: 80, borderRadius: 8, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                                            <img src={img} alt={`Photo ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newImages = form.images.filter((_, i) => i !== idx);
                                                    setForm({ ...form, images: newImages });
                                                }}
                                                style={{
                                                    position: 'absolute', top: 2, right: 2,
                                                    background: 'rgba(220,38,38,0.85)', color: 'white',
                                                    border: 'none', borderRadius: '50%', width: 20, height: 20,
                                                    fontSize: 12, cursor: 'pointer', display: 'flex',
                                                    alignItems: 'center', justifyContent: 'center', lineHeight: 1
                                                }}
                                            >✕</button>
                                        </div>
                                    ))}
                                </div>
                                <ImageUpload
                                    value=""
                                    onChange={v => {
                                        if (v) setForm({ ...form, images: [...form.images, v] });
                                    }}
                                    label=""
                                    hint="Ajouter une photo à la galerie"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="modal-actions">
                        <button className="wp-btn wp-btn-cancel" onClick={() => setShowModal(false)}>Annuler</button>
                        <button className="wp-btn" onClick={() => setShowPreview(true)}>👁️ Aperçu</button>
                        <button className="wp-btn" onClick={() => { setForm({ ...form, published: false }); setTimeout(save, 10); }} title="Enregistrer comme brouillon">📋 Brouillon</button>
                        <button className="wp-btn wp-btn-primary" onClick={save}>💾 {editing ? 'Mettre à jour' : 'Publier'}</button>
                    </div>
                </Modal>
            )}
            {showPreview && (
                <Modal title="Aperçu de l'article" onClose={() => setShowPreview(false)} wide>
                    <div style={{ padding: '8px 0 24px', maxWidth: 760, margin: '0 auto' }}>
                        {form.image && (
                            <img src={form.image} alt={form.title} style={{ width: '100%', maxHeight: 400, objectFit: 'cover', borderRadius: 12, marginBottom: 24 }} />
                        )}
                        <div style={{ color: 'var(--primary, #e63946)', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                            {form.category || 'Catégorie'} {form.city && form.city !== 'Les deux' && `• ${form.city}`}
                        </div>
                        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', lineHeight: 1.2, marginBottom: 12 }}>
                            {form.title || '(sans titre)'}
                        </h1>
                        <div style={{ display: 'flex', gap: 14, fontSize: '0.85rem', color: '#64748b', marginBottom: 18, flexWrap: 'wrap' }}>
                            <span>✍️ {form.author || 'La Rédaction'}</span>
                            <span>📅 {form.date && new Date(form.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                            <span>⏱️ {stats.minutes} min</span>
                        </div>
                        {form.excerpt && (
                            <p style={{ fontStyle: 'italic', color: '#475569', borderLeft: '3px solid #e63946', paddingLeft: 14, fontSize: '1.05rem', marginBottom: 24 }}>
                                {form.excerpt}
                            </p>
                        )}
                        <div style={{ fontSize: '1rem', lineHeight: 1.8, color: '#374151' }} dangerouslySetInnerHTML={{ __html: form.content || '<em style="color:#94a3b8">(aucun contenu)</em>' }} />
                        {form.tags.length > 0 && (
                            <div style={{ marginTop: 28, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {form.tags.map(tag => <span key={tag} style={{ background: '#eff6ff', color: '#1d4ed8', borderRadius: 20, padding: '4px 12px', fontSize: '0.85rem' }}>#{tag}</span>)}
                            </div>
                        )}
                    </div>
                    <div className="modal-actions">
                        <button className="wp-btn wp-btn-cancel" onClick={() => setShowPreview(false)}>Fermer</button>
                    </div>
                </Modal>
            )}
            {confirmId && <ConfirmDialog message="Supprimer cet article ? Cette action est irréversible." onConfirm={() => { deleteArticle(confirmId); setConfirmId(null); setToast('Article supprimé'); }} onCancel={() => setConfirmId(null)} />}
            {toast && <Toast message={toast} onClose={() => setToast('')} />}
        </>
    );
}

/* =============================================
   EVENTS VIEW
   ============================================= */
function EventsView() {
    const { events, addEvent, updateEvent, deleteEvent } = useData();
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Ev | null>(null);
    const [form, setForm] = useState({ title: '', date: '', dateEnd: '', location: '', description: '', registrationUrl: '', presentationUrl: '', audience: 'both' as 'licensed' | 'public' | 'both' });
    const [toast, setToast] = useState('');
    const [confirmId, setConfirmId] = useState<string | null>(null);

    const openNew = () => { setEditing(null); setForm({ title: '', date: new Date().toISOString().split('T')[0], dateEnd: '', location: '', description: '', registrationUrl: '', presentationUrl: '', audience: 'both' }); setShowModal(true); };
    const openEdit = (e: Ev) => { setEditing(e); setForm({ title: e.title, date: e.date, dateEnd: e.dateEnd || '', location: e.location, description: e.description, registrationUrl: e.registrationUrl || '', presentationUrl: e.presentationUrl || '', audience: e.audience || 'both' }); setShowModal(true); };

    const save = () => {
        if (!form.title.trim()) return;
        const eventData: any = { ...form };
        if (!eventData.dateEnd) delete eventData.dateEnd;
        if (!eventData.registrationUrl) delete eventData.registrationUrl;
        if (!eventData.presentationUrl) delete eventData.presentationUrl;
        if (editing) { updateEvent(editing.id, eventData); setToast('✓ Événement modifié'); }
        else { addEvent({ ...eventData, id: Date.now().toString() }); setToast('✓ Événement créé'); }
        setShowModal(false);
    };

    const audienceLabel = (a?: string) => a === 'licensed' ? '🔒 Licenciés' : a === 'public' ? '🌍 Ouvert à tous' : '👥 Tous';

    const sortedEvents = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
        <>
            <div className="admin-header">
                <div><h1>Événements</h1><p className="admin-subtitle">Gérez l&apos;agenda de votre club</p></div>
                <button className="wp-btn wp-btn-primary" onClick={openNew}>+ Nouvel événement</button>
            </div>
            <div className="admin-card">
                <table className="admin-table">
                    <thead><tr><th>Titre</th><th>Date</th><th>Lieu</th><th>Public</th><th>Actions</th></tr></thead>
                    <tbody>
                        {sortedEvents.map(e => (
                            <tr key={e.id}>
                                <td><strong className="wp-title-link" onClick={() => openEdit(e)}>{e.title}</strong></td>
                                <td>
                                    {new Date(e.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    {e.dateEnd && ` — ${new Date(e.dateEnd).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                                </td>
                                <td>📍 {e.location}</td>
                                <td><span className="wp-badge" style={{ background: e.audience === 'licensed' ? '#fef3c7' : e.audience === 'public' ? '#dcfce7' : '#f3f4f6', color: e.audience === 'licensed' ? '#92400e' : e.audience === 'public' ? '#166534' : '#374151' }}>{audienceLabel(e.audience)}</span></td>
                                <td><div className="wp-action-btns"><button className="wp-btn-icon" onClick={() => openEdit(e)}>✏️</button><button className="wp-btn-icon wp-btn-icon-danger" onClick={() => setConfirmId(e.id)}>🗑️</button></div></td>
                            </tr>
                        ))}
                        {sortedEvents.length === 0 && <tr><td colSpan={4} className="wp-empty-row">Aucun événement</td></tr>}
                    </tbody>
                </table>
            </div>
            {showModal && (
                <Modal title={editing ? 'Modifier l\'événement' : 'Nouvel événement'} onClose={() => setShowModal(false)}>
                    <div className="form-group"><label>Titre</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Nom de l'événement..." /></div>
                    <div className="wp-form-row">
                        <div className="form-group"><label>Date de début</label><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
                        <div className="form-group"><label>Date de fin (optionnel)</label><input type="date" value={form.dateEnd} onChange={e => setForm({ ...form, dateEnd: e.target.value })} /></div>
                    </div>
                    <div className="form-group"><label>Lieu</label><input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Ville, lieu..." /></div>

                    <div className="wp-form-row">
                        <div className="form-group">
                            <label>Lien d&apos;inscription (URL)</label>
                            <input value={form.registrationUrl} onChange={e => setForm({ ...form, registrationUrl: e.target.value })} placeholder="https://..." />
                        </div>
                        <div className="form-group">
                            <label>Lien de présentation (URL)</label>
                            <input value={form.presentationUrl} onChange={e => setForm({ ...form, presentationUrl: e.target.value })} placeholder="https://..." />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Public concerné</label>
                        <select value={form.audience} onChange={e => setForm({ ...form, audience: e.target.value as typeof form.audience })} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: '0.9rem' }}>
                            <option value="both">👥 Tous (licenciés + public)</option>
                            <option value="licensed">🔒 Licenciés uniquement</option>
                            <option value="public">🌍 Ouvert à tous (course publique...)</option>
                        </select>
                    </div>
                    <div className="form-group"><label>Description</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Détails de l'événement..." /></div>
                    <div className="modal-actions"><button className="wp-btn wp-btn-cancel" onClick={() => setShowModal(false)}>Annuler</button><button className="wp-btn wp-btn-primary" onClick={save}>💾 Enregistrer</button></div>
                </Modal>
            )}
            {confirmId && <ConfirmDialog message="Supprimer cet événement ?" onConfirm={() => { deleteEvent(confirmId); setConfirmId(null); setToast('Supprimé'); }} onCancel={() => setConfirmId(null)} />}
            {toast && <Toast message={toast} onClose={() => setToast('')} />}
        </>
    );
}

/* =============================================
   TEAM VIEW
   ============================================= */
function TeamView() {
    const { team, addTeamMember, updateTeamMember, deleteTeamMember } = useData();
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<TeamMember | null>(null);
    const [form, setForm] = useState({ name: '', role: '', category: 'bureau' as 'bureau' | 'coach', photo: '', subBureau: '' as '' | 'noyal' | 'nouvoitou' });
    const [toast, setToast] = useState('');
    const [tab, setTab] = useState<'bureau' | 'coach'>('bureau');
    const [confirmId, setConfirmId] = useState<string | null>(null);

    const openNew = (cat: 'bureau' | 'coach') => { setEditing(null); setForm({ name: '', role: '', category: cat, photo: '', subBureau: '' }); setShowModal(true); };
    const openEdit = (m: TeamMember) => { setEditing(m); setForm({ name: m.name, role: m.role, category: m.category, photo: m.photo || '', subBureau: (m.subBureau as '' | 'noyal' | 'nouvoitou') || '' }); setShowModal(true); };

    const save = () => {
        if (!form.name.trim()) return;
        if (editing) { updateTeamMember(editing.id, form); setToast('✓ Membre modifié'); }
        else { addTeamMember({ ...form, id: Date.now().toString() }); setToast('✓ Membre ajouté'); }
        setShowModal(false);
    };

    const filtered = team.filter(t => t.category === tab);

    return (
        <>
            <div className="admin-header">
                <div><h1>Équipe</h1><p className="admin-subtitle">Gérez le bureau et les entraîneurs</p></div>
                <button className="wp-btn wp-btn-primary" onClick={() => openNew(tab)}>+ Ajouter un membre</button>
            </div>
            <div className="wp-filters">
                <button className={`wp-filter ${tab === 'bureau' ? 'active' : ''}`} onClick={() => setTab('bureau')}>Bureau ({team.filter(t => t.category === 'bureau').length})</button>
                <button className={`wp-filter ${tab === 'coach' ? 'active' : ''}`} onClick={() => setTab('coach')}>Entraîneurs ({team.filter(t => t.category === 'coach').length})</button>
            </div>
            <div className="wp-team-grid">
                {filtered.map(m => (
                    <div key={m.id} className="wp-team-card">
                        {m.photo ? <img src={m.photo} alt={m.name} className="wp-team-photo" /> :
                            <div className="wp-team-avatar">{m.name.charAt(0)}</div>}
                        <h4>{m.name}</h4>
                        <p>{m.role}</p>
                        <div className="wp-action-btns" style={{ marginTop: 8 }}>
                            <button className="wp-btn-icon" onClick={() => openEdit(m)}>✏️</button>
                            <button className="wp-btn-icon wp-btn-icon-danger" onClick={() => setConfirmId(m.id)}>🗑️</button>
                        </div>
                    </div>
                ))}
                {filtered.length === 0 && <p className="wp-empty">Aucun membre dans cette catégorie</p>}
            </div>
            {showModal && (
                <Modal title={editing ? 'Modifier le membre' : 'Ajouter un membre'} onClose={() => setShowModal(false)}>
                    <div className="form-group"><label>Nom complet</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Prénom Nom" /></div>
                    <div className="form-group"><label>Rôle / Fonction</label><input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="Ex: Président, Coach Piste..." /></div>
                    {form.category === 'bureau' && (
                        <div className="form-group">
                            <label>Sous-bureau (optionnel)</label>
                            <select value={form.subBureau} onChange={e => setForm({ ...form, subBureau: e.target.value as '' | 'noyal' | 'nouvoitou' })} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: '0.9rem' }}>
                                <option value="">— Bureau principal (tous) —</option>
                                <option value="noyal">📍 Bureau Noyal-sur-Vilaine</option>
                                <option value="nouvoitou">📍 Bureau Nouvoitou</option>
                            </select>
                        </div>
                    )}
                    <ImageUpload value={form.photo} onChange={v => setForm({ ...form, photo: v })} label="Photo" hint="Format portrait recommandé" />
                    <div className="modal-actions"><button className="wp-btn wp-btn-cancel" onClick={() => setShowModal(false)}>Annuler</button><button className="wp-btn wp-btn-primary" onClick={save}>💾 Enregistrer</button></div>
                </Modal>
            )}
            {confirmId && <ConfirmDialog message="Supprimer ce membre ?" onConfirm={() => { deleteTeamMember(confirmId); setConfirmId(null); setToast('Supprimé'); }} onCancel={() => setConfirmId(null)} />}
            {toast && <Toast message={toast} onClose={() => setToast('')} />}
        </>
    );
}

/* =============================================
   ACTIVITIES VIEW
   ============================================= */
function ActivitiesView() {
    const { activities, setActivities } = useData();
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Activity | null>(null);
    const [form, setForm] = useState({ title: '', description: '', schedule: '', image: '' });
    const [toast, setToast] = useState('');
    const [confirmId, setConfirmId] = useState<string | null>(null);

    const openNew = () => { setEditing(null); setForm({ title: '', description: '', schedule: '', image: '' }); setShowModal(true); };
    const openEdit = (a: Activity) => { setEditing(a); setForm({ title: a.title, description: a.description, schedule: a.schedule, image: a.image || '' }); setShowModal(true); };

    const save = () => {
        if (!form.title.trim()) return;
        if (editing) { setActivities(activities.map(a => a.id === editing.id ? { ...a, ...form } : a)); setToast('✓ Activité modifiée'); }
        else { setActivities([...activities, { ...form, id: Date.now().toString() }]); setToast('✓ Activité créée'); }
        setShowModal(false);
    };

    return (
        <>
            <div className="admin-header">
                <div><h1>Activités</h1><p className="admin-subtitle">Les disciplines proposées par le club</p></div>
                <button className="wp-btn wp-btn-primary" onClick={openNew}>+ Nouvelle activité</button>
            </div>
            <div className="wp-activities-grid">
                {activities.map(a => (
                    <div key={a.id} className="wp-activity-card">
                        {a.image && <img src={a.image} alt={a.title} className="wp-activity-img" />}
                        <div className="wp-activity-info">
                            <h4>{a.title}</h4>
                            <p className="wp-schedule">🕐 {a.schedule}</p>
                            <div className="wp-action-btns">
                                <button className="wp-btn-icon" onClick={() => openEdit(a)}>✏️</button>
                                <button className="wp-btn-icon wp-btn-icon-danger" onClick={() => setConfirmId(a.id)}>🗑️</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {showModal && (
                <Modal title={editing ? 'Modifier l\'activité' : 'Nouvelle activité'} onClose={() => setShowModal(false)}>
                    <div className="form-group"><label>Titre</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ex: Piste & Stade, Trail..." /></div>
                    <div className="form-group"><label>Horaires</label><input value={form.schedule} onChange={e => setForm({ ...form, schedule: e.target.value })} placeholder="Ex: Mardi et Jeudi 18h30-20h" /></div>
                    <div className="form-group"><label>Description</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={4} placeholder="Décrivez cette activité..." /></div>
                    <ImageUpload value={form.image} onChange={v => setForm({ ...form, image: v })} label="Photo de l'activité" hint="Image au format paysage recommandé" />
                    <div className="modal-actions"><button className="wp-btn wp-btn-cancel" onClick={() => setShowModal(false)}>Annuler</button><button className="wp-btn wp-btn-primary" onClick={save}>💾 Enregistrer</button></div>
                </Modal>
            )}
            {confirmId && <ConfirmDialog message="Supprimer cette activité ?" onConfirm={() => { setActivities(activities.filter(a => a.id !== confirmId)); setConfirmId(null); setToast('Supprimée'); }} onCancel={() => setConfirmId(null)} />}
            {toast && <Toast message={toast} onClose={() => setToast('')} />}
        </>
    );
}

/* =============================================
   PARTNERS VIEW
   ============================================= */
function PartnersView() {
    const { partners, addPartner, updatePartner, deletePartner } = useData();
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Partner | null>(null);
    const [form, setForm] = useState({ name: '', url: '', logo: '', tier: 'silver' as 'gold' | 'silver' | 'bronze', description: '' });
    const [toast, setToast] = useState('');
    const [confirmId, setConfirmId] = useState<string | null>(null);

    const openNew = () => { setEditing(null); setForm({ name: '', url: '', logo: '', tier: 'silver', description: '' }); setShowModal(true); };
    const openEdit = (p: Partner) => { setEditing(p); setForm({ name: p.name, url: p.url, logo: p.logo || '', tier: p.tier, description: p.description || '' }); setShowModal(true); };

    const save = () => {
        if (!form.name.trim()) return;
        if (editing) { updatePartner(editing.id, form); setToast('✓ Partenaire modifié'); }
        else { addPartner({ ...form, id: Date.now().toString() }); setToast('✓ Partenaire ajouté'); }
        setShowModal(false);
    };

    const tierLabel = (t: string) => t === 'gold' ? '⭐ Principal' : t === 'silver' ? '🤝 Partenaire' : '👍 Soutien';
    const tierColor = (t: string) => t === 'gold' ? '#FFD700' : t === 'silver' ? '#94A3B8' : '#CD7F32';

    return (
        <>
            <div className="admin-header">
                <div><h1>Partenaires & Sponsors</h1><p className="admin-subtitle">Les soutiens du club</p></div>
                <button className="wp-btn wp-btn-primary" onClick={openNew}>+ Ajouter</button>
            </div>
            <div className="admin-card">
                <table className="admin-table">
                    <thead><tr><th>Logo</th><th>Nom</th><th>Niveau</th><th>Site web</th><th>Actions</th></tr></thead>
                    <tbody>
                        {partners.map(p => (
                            <tr key={p.id}>
                                <td>{p.logo ? <img src={p.logo} alt="" style={{ width: 60, height: 40, objectFit: 'contain' }} /> : <span className="wp-no-logo">—</span>}</td>
                                <td><strong>{p.name}</strong></td>
                                <td><span style={{ fontWeight: 600, color: tierColor(p.tier) }}>{tierLabel(p.tier)}</span></td>
                                <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.url !== '#' ? <a href={p.url} target="_blank" rel="noopener">{p.url}</a> : '—'}</td>
                                <td><div className="wp-action-btns"><button className="wp-btn-icon" onClick={() => openEdit(p)}>✏️</button><button className="wp-btn-icon wp-btn-icon-danger" onClick={() => setConfirmId(p.id)}>🗑️</button></div></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {showModal && (
                <Modal title={editing ? 'Modifier' : 'Ajouter un partenaire'} onClose={() => setShowModal(false)}>
                    <div className="form-group"><label>Nom</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                    <div className="form-group"><label>Site web</label><input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="https://..." /></div>
                    <div className="form-group"><label>Description courte (optionnel)</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Ex: Équipementier officiel..." /></div>
                    <div className="form-group">
                        <label>Niveau de partenariat</label>
                        <select value={form.tier} onChange={e => setForm({ ...form, tier: e.target.value as 'gold' | 'silver' | 'bronze' })}>
                            <option value="gold">⭐ Partenaire principal</option>
                            <option value="silver">🤝 Partenaire</option>
                            <option value="bronze">👍 Soutien</option>
                        </select>
                    </div>
                    <ImageUpload value={form.logo} onChange={v => setForm({ ...form, logo: v })} label="Logo" hint="Fond transparent recommandé (PNG)" />
                    <div className="modal-actions"><button className="wp-btn wp-btn-cancel" onClick={() => setShowModal(false)}>Annuler</button><button className="wp-btn wp-btn-primary" onClick={save}>💾 Enregistrer</button></div>
                </Modal>
            )}
            {confirmId && <ConfirmDialog message="Supprimer ce partenaire ?" onConfirm={() => { deletePartner(confirmId); setConfirmId(null); setToast('Supprimé'); }} onCancel={() => setConfirmId(null)} />}
            {toast && <Toast message={toast} onClose={() => setToast('')} />}
        </>
    );
}

/* =============================================
   PAGES VIEW
   ============================================= */
function PagesView() {
    const { customPages, addCustomPage, updateCustomPage, deleteCustomPage } = useData();
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<CustomPage | null>(null);
    const [form, setForm] = useState({ title: '', slug: '', content: '', image: '', published: true, showInNav: true, order: 0 });
    const [toast, setToast] = useState('');
    const [confirmId, setConfirmId] = useState<string | null>(null);

    const openNew = () => { setEditing(null); setForm({ title: '', slug: '', content: '', image: '', published: true, showInNav: true, order: customPages.length }); setShowModal(true); };
    const openEdit = (p: CustomPage) => { setEditing(p); setForm({ title: p.title, slug: p.slug, content: p.content, image: p.image || '', published: p.published, showInNav: p.showInNav, order: p.order }); setShowModal(true); };

    const save = () => {
        if (!form.title.trim()) return;
        const slug = form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        if (editing) { updateCustomPage(editing.id, { ...form, slug }); setToast('✓ Page modifiée'); }
        else { addCustomPage({ ...form, slug, id: Date.now().toString() }); setToast('✓ Page créée — visible dans la navigation'); }
        setShowModal(false);
    };

    return (
        <>
            <div className="admin-header">
                <div><h1>Pages personnalisées</h1><p className="admin-subtitle">Créez des pages additionnelles pour le site (Résultats, Galerie, Saison...)</p></div>
                <button className="wp-btn wp-btn-primary" onClick={openNew}>+ Nouvelle page</button>
            </div>
            <div className="wp-info-box">💡 Les pages créées ici peuvent apparaître automatiquement dans la barre de navigation du site. Vous pouvez contrôler l&apos;ordre et la visibilité de chaque page.</div>
            <div className="admin-card">
                <table className="admin-table">
                    <thead><tr><th>Titre</th><th>URL</th><th>Navigation</th><th>Statut</th><th>Actions</th></tr></thead>
                    <tbody>
                        {customPages.map(p => (
                            <tr key={p.id}>
                                <td><strong className="wp-title-link" onClick={() => openEdit(p)}>{p.title}</strong></td>
                                <td className="wp-url-cell">/p/{p.slug}</td>
                                <td>{p.showInNav ? <span className="wp-badge wp-badge-success">✓ Menu</span> : <span className="wp-badge wp-badge-draft">Masqué</span>}</td>
                                <td><StatusBadge active={p.published} labelOn="Publiée" labelOff="Brouillon" /></td>
                                <td><div className="wp-action-btns"><button className="wp-btn-icon" onClick={() => openEdit(p)}>✏️</button><button className="wp-btn-icon wp-btn-icon-danger" onClick={() => setConfirmId(p.id)}>🗑️</button></div></td>
                            </tr>
                        ))}
                        {customPages.length === 0 && <tr><td colSpan={5} className="wp-empty-row">Aucune page créée. Cliquez sur &quot;+ Nouvelle page&quot; pour commencer.</td></tr>}
                    </tbody>
                </table>
            </div>
            {showModal && (
                <Modal title={editing ? 'Modifier la page' : 'Nouvelle page'} onClose={() => setShowModal(false)} wide>
                    <div className="wp-editor-layout">
                        <div className="wp-editor-main">
                            <div className="form-group"><label>Titre de la page</label><input className="wp-input-lg" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ex: Galerie, Résultats..." /></div>
                            <div className="form-group"><label>Contenu</label><p className="form-hint">Vous pouvez utiliser du HTML pour la mise en forme</p><RichTextArea value={form.content} onChange={v => setForm({ ...form, content: v })} rows={12} placeholder="Contenu de la page..." /></div>
                        </div>
                        <div className="wp-editor-sidebar">
                            <div className="wp-sidebar-box">
                                <h4>Publication</h4>
                                <label className="wp-toggle-label"><input type="checkbox" checked={form.published} onChange={e => setForm({ ...form, published: e.target.checked })} /> Publiée</label>
                            </div>
                            <div className="wp-sidebar-box">
                                <h4>Navigation</h4>
                                <label className="wp-toggle-label"><input type="checkbox" checked={form.showInNav} onChange={e => setForm({ ...form, showInNav: e.target.checked })} /> Afficher dans le menu</label>
                                <div className="form-group"><label>Ordre</label><input type="number" value={form.order} onChange={e => setForm({ ...form, order: parseInt(e.target.value) || 0 })} /></div>
                            </div>
                            <div className="wp-sidebar-box">
                                <h4>URL</h4>
                                <div className="form-group"><label>Slug</label><input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="Auto-généré" /><p className="form-hint">Laissez vide pour auto-générer</p></div>
                            </div>
                            <div className="wp-sidebar-box"><h4>Image</h4><ImageUpload value={form.image} onChange={v => setForm({ ...form, image: v })} label="" /></div>
                        </div>
                    </div>
                    <div className="modal-actions"><button className="wp-btn wp-btn-cancel" onClick={() => setShowModal(false)}>Annuler</button><button className="wp-btn wp-btn-primary" onClick={save}>💾 {editing ? 'Mettre à jour' : 'Créer la page'}</button></div>
                </Modal>
            )}
            {confirmId && <ConfirmDialog message="Supprimer cette page ?" onConfirm={() => { deleteCustomPage(confirmId); setConfirmId(null); setToast('Page supprimée'); }} onCancel={() => setConfirmId(null)} />}
            {toast && <Toast message={toast} onClose={() => setToast('')} />}
        </>
    );
}

/* =============================================
   RESULTS VIEW
   ============================================= */
const EMPTY_ATHLETE: ResultAthlete = { name: '', performance: '', category: '', rank: '', timeCourse: '', timePuce: '', classementScratch: '', classementCategorie: '', classementFeminine: '' };
const EMPTY_SHOW_FIELDS = { timeCourse: false, timePuce: false, classementScratch: true, classementCategorie: true, classementFeminine: false };

function ResultsView() {
    const { results, addResult, updateResult, deleteResult } = useData();
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Result | null>(null);
    const [form, setForm] = useState({
        competition: '', date: '', discipline: 'piste' as Result['discipline'],
        location: '', url: '',
        athletes: [{ ...EMPTY_ATHLETE }],
        showFields: { ...EMPTY_SHOW_FIELDS },
    });
    const [confirmId, setConfirmId] = useState('');
    const [toast, setToast] = useState('');

    const openNew = () => {
        setEditing(null);
        setForm({ competition: '', date: new Date().toISOString().split('T')[0], discipline: 'piste', location: '', url: '', athletes: [{ ...EMPTY_ATHLETE }], showFields: { ...EMPTY_SHOW_FIELDS } });
        setShowModal(true);
    };
    const openEdit = (r: Result) => {
        setEditing(r);
        setForm({
            competition: r.competition, date: r.date, discipline: r.discipline,
            location: r.location, url: r.url || '',
            athletes: r.athletes.map(a => ({ ...EMPTY_ATHLETE, ...a })),
            showFields: { ...EMPTY_SHOW_FIELDS, ...(r.showFields || {}) },
        });
        setShowModal(true);
    };

    const addAthlete = () => setForm({ ...form, athletes: [...form.athletes, { ...EMPTY_ATHLETE }] });
    const removeAthlete = (i: number) => setForm({ ...form, athletes: form.athletes.filter((_, idx) => idx !== i) });
    const updateAthlete = (i: number, field: string, val: string) => {
        const updated = [...form.athletes];
        (updated[i] as Record<string, string>)[field] = val;
        setForm({ ...form, athletes: updated });
    };

    const save = () => {
        if (!form.competition || !form.date) return;
        const validAthletes = form.athletes.filter(a => a.name);
        if (validAthletes.length === 0) return;
        const data = { ...form, athletes: validAthletes, url: form.url || undefined };
        if (editing) { updateResult(editing.id, data); setToast('✓ Résultat mis à jour'); }
        else { addResult({ ...data, id: Date.now().toString() }); setToast('✓ Résultat ajouté'); }
        setShowModal(false);
    };

    const disciplineLabels: Record<string, string> = { piste: 'Piste & Stade', cross: 'Cross', route: 'Route', trail: 'Trail', 'marche-nordique': 'Marche Nordique' };
    const sorted = [...results].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <>
            <div className="admin-header">
                <div><h1>Résultats</h1><p className="admin-subtitle">Gérez les résultats de compétitions</p></div>
                <button className="wp-btn wp-btn-primary" onClick={openNew}>+ Nouveau résultat</button>
            </div>

            <div className="admin-card">
                <table className="wp-table">
                    <thead><tr><th>Date</th><th>Compétition</th><th>Discipline</th><th>Athlètes</th><th>Actions</th></tr></thead>
                    <tbody>
                        {sorted.map(r => (
                            <tr key={r.id}>
                                <td>{new Date(r.date).toLocaleDateString('fr-FR')}</td>
                                <td><strong>{r.competition}</strong><br /><small style={{ color: '#888' }}>📍 {r.location}</small></td>
                                <td><span className="wp-badge">{disciplineLabels[r.discipline] || r.discipline}</span></td>
                                <td>{r.athletes.length} athlète{r.athletes.length > 1 ? 's' : ''}</td>
                                <td>
                                    <button className="wp-btn-icon" onClick={() => openEdit(r)}>✏️</button>
                                    <button className="wp-btn-icon wp-btn-icon-danger" onClick={() => setConfirmId(r.id)}>🗑️</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <Modal title={editing ? 'Modifier le résultat' : 'Nouveau résultat'} onClose={() => setShowModal(false)} wide>
                    <div className="wp-form-row">
                        <div className="form-group"><label>Compétition</label><input value={form.competition} onChange={e => setForm({ ...form, competition: e.target.value })} placeholder="Nom de la compétition" /></div>
                        <div className="form-group"><label>Date</label><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
                    </div>
                    <div className="wp-form-row">
                        <div className="form-group">
                            <label>Discipline</label>
                            <select value={form.discipline} onChange={e => setForm({ ...form, discipline: e.target.value as Result['discipline'] })} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: '0.9rem' }}>
                                <option value="piste">Piste & Stade</option>
                                <option value="cross">Cross</option>
                                <option value="route">Route</option>
                                <option value="trail">Trail</option>
                                <option value="marche-nordique">Marche Nordique</option>
                            </select>
                        </div>
                        <div className="form-group"><label>Lieu</label><input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Ville" /></div>
                    </div>
                    <div className="form-group"><label>Lien résultats (optionnel)</label><input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="https://..." /></div>

                    <div style={{ margin: '20px 0 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ fontSize: '0.95rem', margin: 0 }}>Athlètes</h4>
                    </div>

                    <div style={{ background: '#f8fafc', borderRadius: 8, padding: 12, marginBottom: 16 }}>
                        <p style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 8, color: '#374151' }}>Colonnes à afficher :</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                            {([
                                { key: 'timeCourse', label: 'Temps course' },
                                { key: 'timePuce', label: 'Temps puce' },
                                { key: 'classementScratch', label: 'Cl. scratch' },
                                { key: 'classementCategorie', label: 'Cl. catégorie' },
                                { key: 'classementFeminine', label: 'Cl. féminin' },
                            ] as { key: keyof typeof form.showFields; label: string }[]).map(({ key, label }) => (
                                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={!!form.showFields[key]}
                                        onChange={e => setForm({ ...form, showFields: { ...form.showFields, [key]: e.target.checked } })}
                                    />
                                    {label}
                                </label>
                            ))}
                        </div>
                    </div>

                    {form.athletes.map((a, i) => (
                        <div key={i} style={{ background: '#f9fafb', borderRadius: 8, padding: 12, marginBottom: 8, border: '1px solid #e5e7eb' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <strong style={{ fontSize: '0.85rem', color: '#374151' }}>Athlète {i + 1}</strong>
                                <button className="wp-btn-icon wp-btn-icon-danger" onClick={() => removeAthlete(i)}>✕</button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 0.8fr', gap: 8, marginBottom: 8 }}>
                                <div className="form-group" style={{ marginBottom: 0 }}><label style={{ fontSize: '0.75rem' }}>Nom *</label><input value={a.name} onChange={e => updateAthlete(i, 'name', e.target.value)} placeholder="Prénom Nom" /></div>
                                <div className="form-group" style={{ marginBottom: 0 }}><label style={{ fontSize: '0.75rem' }}>Catégorie</label><input value={a.category} onChange={e => updateAthlete(i, 'category', e.target.value)} placeholder="Senior, V1..." /></div>
                                <div className="form-group" style={{ marginBottom: 0 }}><label style={{ fontSize: '0.75rem' }}>Performance</label><input value={a.performance} onChange={e => updateAthlete(i, 'performance', e.target.value)} placeholder="1h23'45" /></div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
                                {form.showFields.timeCourse && <div className="form-group" style={{ marginBottom: 0 }}><label style={{ fontSize: '0.75rem' }}>Temps course</label><input value={a.timeCourse || ''} onChange={e => updateAthlete(i, 'timeCourse', e.target.value)} placeholder="1h23'45" /></div>}
                                {form.showFields.timePuce && <div className="form-group" style={{ marginBottom: 0 }}><label style={{ fontSize: '0.75rem' }}>Temps puce</label><input value={a.timePuce || ''} onChange={e => updateAthlete(i, 'timePuce', e.target.value)} placeholder="1h23'45" /></div>}
                                {form.showFields.classementScratch && <div className="form-group" style={{ marginBottom: 0 }}><label style={{ fontSize: '0.75rem' }}>Cl. scratch</label><input value={a.classementScratch || ''} onChange={e => updateAthlete(i, 'classementScratch', e.target.value)} placeholder="12e/150" /></div>}
                                {form.showFields.classementCategorie && <div className="form-group" style={{ marginBottom: 0 }}><label style={{ fontSize: '0.75rem' }}>Cl. catégorie</label><input value={a.classementCategorie || ''} onChange={e => updateAthlete(i, 'classementCategorie', e.target.value)} placeholder="2e/18" /></div>}
                                {form.showFields.classementFeminine && <div className="form-group" style={{ marginBottom: 0 }}><label style={{ fontSize: '0.75rem' }}>Cl. féminin</label><input value={a.classementFeminine || ''} onChange={e => updateAthlete(i, 'classementFeminine', e.target.value)} placeholder="3e/42" /></div>}
                            </div>
                        </div>
                    ))}
                    <button className="wp-btn" onClick={addAthlete} style={{ marginTop: 8 }}>+ Ajouter un athlète</button>

                    <div style={{ textAlign: 'right', marginTop: 20 }}>
                        <button className="wp-btn wp-btn-primary" onClick={save}>💾 Sauvegarder</button>
                    </div>
                </Modal>
            )}

            {confirmId && <ConfirmDialog message="Supprimer ce résultat ?" onConfirm={() => { deleteResult(confirmId); setConfirmId(''); setToast('✓ Résultat supprimé'); }} onCancel={() => setConfirmId('')} />}
            {toast && <Toast message={toast} onClose={() => setToast('')} />}
        </>
    );
}

/* =============================================
   RECORDS VIEW
   ============================================= */
function RecordsView() {
    const { records, addRecord, updateRecord, deleteRecord } = useData();
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<ClubRecord | null>(null);
    const [form, setForm] = useState({ type: 'outdoor' as ClubRecord['type'], event: '', category: 'Senior', gender: 'M' as ClubRecord['gender'], athlete: '', performance: '', date: '', location: '' });
    const [confirmId, setConfirmId] = useState('');
    const [toast, setToast] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'outdoor' | 'indoor' | 'hors-stade' | 'stade'>('all');

    const openNew = () => { setEditing(null); setForm({ type: 'outdoor', event: '', category: 'Senior', gender: 'M', athlete: '', performance: '', date: new Date().toISOString().split('T')[0], location: '' }); setShowModal(true); };
    const openEdit = (r: ClubRecord) => { setEditing(r); setForm({ type: r.type, event: r.event, category: r.category, gender: r.gender, athlete: r.athlete, performance: r.performance, date: r.date, location: r.location || '' }); setShowModal(true); };

    const save = () => {
        if (!form.event || !form.athlete || !form.performance || !form.date) return;
        const data = { ...form, location: form.location || undefined };
        if (editing) { updateRecord(editing.id, data); setToast('✓ Record mis à jour'); }
        else { addRecord({ ...data, id: Date.now().toString() }); setToast('✓ Record ajouté'); }
        setShowModal(false);
    };

    const filtered = filterType === 'all' ? records : records.filter(r => r.type === filterType || (filterType === 'outdoor' && r.type === 'stade'));
    const sorted = [...filtered].sort((a, b) => { if (a.type !== b.type) return a.type === 'outdoor' ? -1 : 1; if (a.event !== b.event) return a.event.localeCompare(b.event); return a.gender.localeCompare(b.gender); });

    return (
        <>
            <div className="admin-header">
                <div><h1>Records du club</h1><p className="admin-subtitle">Gérez les records</p></div>
                <button className="wp-btn wp-btn-primary" onClick={openNew}>+ Nouveau record</button>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {[{ id: 'all', label: 'Tous' }, { id: 'outdoor', label: '🏟️ Outdoor' }, { id: 'indoor', label: '🏛️ Indoor' }, { id: 'hors-stade', label: '🌍 Hors Stade' }].map(t => (
                    <button key={t.id} className={`wp-btn ${filterType === t.id ? 'wp-btn-primary' : ''}`} onClick={() => setFilterType(t.id as typeof filterType)}>{t.label}</button>
                ))}
            </div>

            <div className="admin-card">
                <table className="wp-table">
                    <thead><tr><th>Type</th><th>Épreuve</th><th>Genre</th><th>Catégorie</th><th>Athlète</th><th>Performance</th><th>Date</th><th>Actions</th></tr></thead>
                    <tbody>
                        {sorted.map(r => (
                            <tr key={r.id}>
                                <td>
                                    <span className="wp-badge" style={{
                                        background: r.type === 'hors-stade' ? '#e3f2fd' : (r.type === 'indoor' ? '#f3e5f5' : '#e8f5e9'),
                                        color: r.type === 'hors-stade' ? '#1565c0' : (r.type === 'indoor' ? '#7b1fa2' : '#2e7d32')
                                    }}>
                                        {r.type === 'hors-stade' ? '🌍 Hors stade' : (r.type === 'indoor' ? '🏛️ Indoor' : '🏟️ Outdoor')}
                                    </span>
                                </td>
                                <td><strong>{r.event}</strong></td>
                                <td>{r.gender === 'M' ? '👨' : '👩'}</td>
                                <td>{r.category}</td>
                                <td>{r.athlete}</td>
                                <td style={{ fontFamily: "'Space Grotesk', monospace", fontWeight: 700, color: '#e63946' }}>{r.performance}</td>
                                <td>{new Date(r.date).toLocaleDateString('fr-FR')}</td>
                                <td>
                                    <button className="wp-btn-icon" onClick={() => openEdit(r)}>✏️</button>
                                    <button className="wp-btn-icon wp-btn-icon-danger" onClick={() => setConfirmId(r.id)}>🗑️</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <Modal title={editing ? 'Modifier le record' : 'Nouveau record'} onClose={() => setShowModal(false)}>
                    <div className="wp-form-row">
                        <div className="form-group">
                            <label>Type</label>
                            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as ClubRecord['type'] })} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: '0.9rem' }}>
                                <option value="outdoor">Outdoor (Stade)</option>
                                <option value="indoor">Indoor (Salle)</option>
                                <option value="hors-stade">Hors Stade</option>
                            </select>
                        </div>
                        <div className="form-group"><label>Épreuve</label><input value={form.event} onChange={e => setForm({ ...form, event: e.target.value })} placeholder="ex: 100m, Semi-marathon..." /></div>
                    </div>
                    <div className="wp-form-row">
                        <div className="form-group">
                            <label>Genre</label>
                            <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value as ClubRecord['gender'] })} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: '0.9rem' }}>
                                <option value="M">Homme</option>
                                <option value="F">Femme</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Catégorie</label>
                            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: '0.9rem' }}>
                                {['Eveil Athlé', 'Poussin', 'Benjamin', 'Minime', 'Cadet', 'Junior', 'Espoir', 'Senior', 'Master'].map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="wp-form-row">
                        <div className="form-group"><label>Athlète</label><input value={form.athlete} onChange={e => setForm({ ...form, athlete: e.target.value })} placeholder="Nom complet" /></div>
                        <div className="form-group"><label>Performance</label><input value={form.performance} onChange={e => setForm({ ...form, performance: e.target.value })} placeholder={'ex: 11"25, 1h22\'45"'} /></div>
                    </div>
                    <div className="wp-form-row">
                        <div className="form-group"><label>Date</label><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
                        <div className="form-group"><label>Lieu (optionnel)</label><input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Ville" /></div>
                    </div>
                    <div style={{ textAlign: 'right', marginTop: 20 }}>
                        <button className="wp-btn wp-btn-primary" onClick={save}>💾 Sauvegarder</button>
                    </div>
                </Modal>
            )}

            {confirmId && <ConfirmDialog message="Supprimer ce record ?" onConfirm={() => { deleteRecord(confirmId); setConfirmId(''); setToast('✓ Record supprimé'); }} onCancel={() => setConfirmId('')} />}
            {toast && <Toast message={toast} onClose={() => setToast('')} />}
        </>
    );
}

/* =============================================
   SETTINGS VIEW
   ============================================= */
/* =============================================
   PLANNING VIEW
   ============================================= */
function PlanningView() {
    const { schedules, addSchedule, updateSchedule, deleteSchedule } = useData();
    const [newItem, setNewItem] = useState<Partial<ScheduleItem>>({ category: 'Jeunes', discipline: '', ageGroup: '', dayTime: '', location: '', city: 'Noyal' });
    const [customCat, setCustomCat] = useState('');

    const handleAdd = () => {
        if (!newItem.discipline || !newItem.dayTime) return;
        const finalCat = (newItem.category === 'Autre' ? customCat : newItem.category) || 'Jeunes';
        addSchedule({
            id: Date.now().toString(),
            category: finalCat,
            discipline: newItem.discipline,
            ageGroup: newItem.ageGroup || '',
            dayTime: newItem.dayTime,
            location: newItem.location || '',
            city: newItem.city || 'Noyal',
            notes: newItem.notes || ''
        } as ScheduleItem);
        setNewItem({ category: 'Jeunes', discipline: '', ageGroup: '', dayTime: '', location: '', city: 'Noyal' });
        setCustomCat('');
    };

    const grouped = (schedules || []).reduce((acc: any, s) => {
        (acc[s.category] = acc[s.category] || []).push(s);
        return acc;
    }, {});

    const sortSchedules = (a: any, b: any) => {
        const days = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
        const getDay = (s: string) => {
            const idx = days.findIndex(d => (s || '').toLowerCase().trim().startsWith(d));
            return idx === -1 ? 99 : idx;
        };
        const da = getDay(a.dayTime);
        const db = getDay(b.dayTime);
        if (da !== db) return da - db;
        return (a.dayTime || '').localeCompare(b.dayTime || '');
    };

    const categories = ['Jeunes', 'Adultes Piste', 'Adultes Hors-Stade', 'Marche Nordique', 'Forme & Santé', 'Autre'];

    // Collect all existing categories to allow moving items to ANY existing category
    const allCats = Array.from(new Set(schedules.map(s => s.category))).sort();

    return (
        <div className="admin-view">
            <div className="admin-header">
                <h2>Planning des entraînements</h2>
            </div>

            <div className="admin-card">
                <h3>Ajouter un créneau</h3>
                <div className="wp-form-row">
                    <div className="form-group">
                        <label>Catégorie</label>
                        <select value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })}>
                            {categories.filter(c => c !== 'Autre').map(c => <option key={c} value={c}>{c}</option>)}
                            <option value="Autre">Autre (personnalisé)</option>
                        </select>
                        {newItem.category === 'Autre' && (
                            <input
                                style={{ marginTop: 8 }}
                                value={customCat}
                                onChange={e => setCustomCat(e.target.value)}
                                placeholder="Nom de la catégorie..."
                            />
                        )}
                    </div>
                    <div className="form-group"><label>Discipline</label><input value={newItem.discipline} onChange={e => setNewItem({ ...newItem, discipline: e.target.value })} placeholder="Ex: Eveil Athlé" /></div>
                    <div className="form-group"><label>Age / Groupe</label><input value={newItem.ageGroup} onChange={e => setNewItem({ ...newItem, ageGroup: e.target.value })} placeholder="Ex: 6-9 ans" /></div>
                    <div className="form-group"><label>Ville</label><select value={newItem.city} onChange={e => setNewItem({ ...newItem, city: e.target.value })}><option value="Noyal">Noyal</option><option value="Nouvoitou">Nouvoitou</option></select></div>
                </div>
                <div className="wp-form-row">
                    <div className="form-group"><label>Jour & Heure</label><input value={newItem.dayTime} onChange={e => setNewItem({ ...newItem, dayTime: e.target.value })} placeholder="Ex: Samedi 10h-12h" /></div>
                    <div className="form-group"><label>Lieu</label><input value={newItem.location} onChange={e => setNewItem({ ...newItem, location: e.target.value })} placeholder="Ex: Stade Nominoë" /></div>
                </div>
                <button className="wp-btn wp-btn-primary" onClick={handleAdd}>+ Ajouter</button>
            </div>

            {Object.entries(grouped).map(([cat, items]: [string, any]) => (
                <div key={cat} className="admin-card">
                    <h3>{cat}</h3>
                    <div className="admin-table-container">
                        <table className="wp-table">
                            <thead><tr><th>Discipline</th><th>Age</th><th>Jour/Heure</th><th>Lieu / Ville</th><th>Catégorie</th><th>Actions</th></tr></thead>
                            <tbody>
                                {items.sort(sortSchedules).map((s: any) => (
                                    <tr key={s.id}>
                                        <td><input className="wp-input-inline" value={s.discipline} onChange={e => updateSchedule(s.id, { discipline: e.target.value })} /></td>
                                        <td><input className="wp-input-inline" value={s.ageGroup} onChange={e => updateSchedule(s.id, { ageGroup: e.target.value })} /></td>
                                        <td><input className="wp-input-inline" value={s.dayTime} onChange={e => updateSchedule(s.id, { dayTime: e.target.value })} /></td>
                                        <td>
                                            <input className="wp-input-inline" value={s.location} onChange={e => updateSchedule(s.id, { location: e.target.value })} style={{ marginBottom: 4 }} />
                                            <select className="wp-input-inline" value={s.city} onChange={e => updateSchedule(s.id, { city: e.target.value })}>
                                                <option value="Noyal">Noyal</option>
                                                <option value="Nouvoitou">Nouvoitou</option>
                                            </select>
                                        </td>
                                        <td>
                                            <select className="wp-input-inline" value={s.category} onChange={e => updateSchedule(s.id, { category: e.target.value })}>
                                                {categories.filter(c => c !== 'Autre').map(c => <option key={c} value={c}>{c}</option>)}
                                                {/* Ensure current category is option even if custom */}
                                                {!categories.includes(s.category) && <option value={s.category}>{s.category}</option>}
                                            </select>
                                        </td>
                                        <td><button className="wp-btn-icon wp-btn-icon-danger" onClick={() => deleteSchedule(s.id)}>🗑️</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
        </div>
    );
}

/* =============================================
   SETTINGS VIEW
   ============================================= */
/* =============================================
   PRICING VIEW
   ============================================= */
function PricingView() {
    const { pricing, addPricing, updatePricing, deletePricing } = useData();
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<PricingItem | null>(null);
    const [form, setForm] = useState<Omit<PricingItem, 'id'>>({ category: 'Competition', activity: '', licenseType: '', birthYears: '', price: '', monClubCode: '', comment: '', order: 0 });
    const [toast, setToast] = useState('');
    const [confirmId, setConfirmId] = useState<string | null>(null);

    const openNew = () => {
        setEditing(null);
        setForm({ category: 'Competition', activity: '', licenseType: '', birthYears: '', price: '', monClubCode: '', comment: '', order: pricing.length + 1 });
        setShowModal(true);
    };

    const openEdit = (p: PricingItem) => {
        setEditing(p);
        setForm({ ...p });
        setShowModal(true);
    };

    const save = () => {
        if (!form.activity) return;
        if (editing) {
            updatePricing(editing.id, form);
            setToast('✓ Tarif modifié');
        } else {
            addPricing({ ...form, id: Date.now().toString() } as PricingItem);
            setToast('✓ Tarif ajouté');
        }
        setShowModal(false);
    };

    const { settings, setSettings } = useData();
    const [pageForm, setPageForm] = useState(settings.pricingPage);
    const [activeTab, setActiveTab] = useState<'grid' | 'content'>('grid');

    const savePageContent = () => {
        setSettings({ ...settings, pricingPage: pageForm });
        setToast('✓ Contenu mis à jour');
    };

    const categories = {
        'Competition': '🏆 Compétition',
        'RunningSante': '🏃 Running / Santé',
        'Autre': '➕ Options / Autre'
    };

    return (
        <>
            <div className="admin-header">
                <div><h1>Tarifs & Adhésions</h1><p className="admin-subtitle">Gérez la grille tarifaire et le contenu de la page</p></div>
                {activeTab === 'grid' ? (
                    <button className="wp-btn wp-btn-primary" onClick={openNew}>+ Nouveau tarif</button>
                ) : (
                    <button className="wp-btn wp-btn-primary" onClick={savePageContent}>💾 Sauvegarder le contenu</button>
                )}
            </div>

            <div className="wp-settings-tabs">
                <button className={`wp-settings-tab ${activeTab === 'grid' ? 'active' : ''}`} onClick={() => setActiveTab('grid')}>Grille tarifaire</button>
                <button className={`wp-settings-tab ${activeTab === 'content' ? 'active' : ''}`} onClick={() => setActiveTab('content')}>Contenu de la page</button>
            </div>

            {activeTab === 'grid' && (
                <>
                    {Object.keys(categories).map(catKey => {
                        const items = pricing.filter(p => p.category === catKey).sort((a, b) => a.order - b.order);
                        if (items.length === 0) return null;
                        return (
                            <div className="admin-card" key={catKey}>
                                <h3>{categories[catKey as keyof typeof categories]}</h3>
                                <table className="wp-table">
                                    <thead><tr><th>Ordre</th><th>Activité</th><th>Licence</th><th>Année</th><th>Prix</th><th>Actions</th></tr></thead>
                                    <tbody>
                                        {items.map(p => (
                                            <tr key={p.id}>
                                                <td>{p.order}</td>
                                                <td><strong>{p.activity}</strong><br /><small>{p.monClubCode}</small></td>
                                                <td>{p.licenseType}</td>
                                                <td>{p.birthYears}</td>
                                                <td>{p.price}</td>
                                                <td>
                                                    <button className="wp-btn-icon" onClick={() => openEdit(p)}>✏️</button>
                                                    <button className="wp-btn-icon wp-btn-icon-danger" onClick={() => setConfirmId(p.id)}>🗑️</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        );
                    })}
                </>
            )}

            {activeTab === 'content' && (
                <div className="admin-card">
                    <h3>En-tête & Introduction</h3>
                    <div className="form-group"><label>Titre de la page</label><input value={pageForm.heroTitle} onChange={e => setPageForm({ ...pageForm, heroTitle: e.target.value })} /></div>
                    <div className="form-group"><label>Sous-titre de la page</label><input value={pageForm.heroSubtitle} onChange={e => setPageForm({ ...pageForm, heroSubtitle: e.target.value })} /></div>

                    <h3 style={{ marginTop: '24px' }}>Titres de section</h3>
                    <div className="wp-form-row">
                        <div className="form-group"><label>Label Section</label><input value={pageForm.sectionLabel} onChange={e => setPageForm({ ...pageForm, sectionLabel: e.target.value })} /></div>
                        <div className="form-group"><label>Titre Section</label><input value={pageForm.sectionTitle} onChange={e => setPageForm({ ...pageForm, sectionTitle: e.target.value })} /></div>
                    </div>
                    <div className="form-group"><label>Sous-titre Section</label><textarea value={pageForm.sectionSubtitle} onChange={e => setPageForm({ ...pageForm, sectionSubtitle: e.target.value })} rows={2} /></div>

                    <h3 style={{ marginTop: '24px' }}>Descriptions des catégories</h3>
                    <div className="form-group"><label>Titre Compétition</label><input value={pageForm.competitionTitle} onChange={e => setPageForm({ ...pageForm, competitionTitle: e.target.value })} /></div>
                    <div className="form-group"><label>Description Compétition</label><textarea value={pageForm.competitionDesc} onChange={e => setPageForm({ ...pageForm, competitionDesc: e.target.value })} rows={2} /></div>

                    <div className="form-group"><label>Titre Running/Santé</label><input value={pageForm.runningTitle} onChange={e => setPageForm({ ...pageForm, runningTitle: e.target.value })} /></div>
                    <div className="form-group"><label>Description Running/Santé</label><textarea value={pageForm.runningDesc} onChange={e => setPageForm({ ...pageForm, runningDesc: e.target.value })} rows={2} /></div>

                    <div className="form-group"><label>Titre Options</label><input value={pageForm.optionsTitle} onChange={e => setPageForm({ ...pageForm, optionsTitle: e.target.value })} /></div>

                    <h3 style={{ marginTop: '24px' }}>Notes de bas de page</h3>
                    {pageForm.notes.map((note, i) => (
                        <div className="form-group" key={i}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input value={note} onChange={e => {
                                    const newNotes = [...pageForm.notes];
                                    newNotes[i] = e.target.value;
                                    setPageForm({ ...pageForm, notes: newNotes });
                                }} style={{ flex: 1 }} />
                                <button className="wp-btn-icon wp-btn-icon-danger" onClick={() => setPageForm({ ...pageForm, notes: pageForm.notes.filter((_, idx) => idx !== i) })}>✕</button>
                            </div>
                        </div>
                    ))}
                    <button className="wp-btn wp-btn-sm" onClick={() => setPageForm({ ...pageForm, notes: [...pageForm.notes, '(N) Nouvelle note'] })}>+ Ajouter une note</button>

                    <h3 style={{ marginTop: '24px' }}>Bouton d'action</h3>
                    <div className="form-group"><label>Texte du bouton</label><input value={pageForm.ctaButton} onChange={e => setPageForm({ ...pageForm, ctaButton: e.target.value })} /></div>
                    <div className="form-group"><label>Texte sous le bouton</label><input value={pageForm.ctaSubtext} onChange={e => setPageForm({ ...pageForm, ctaSubtext: e.target.value })} /></div>
                </div>
            )}

            {showModal && (
                <Modal title={editing ? "Modifier tarif" : "Nouveau tarif"} onClose={() => setShowModal(false)}>
                    <div className="form-group"><label>Catégorie</label><select value={form.category} onChange={e => setForm({ ...form, category: e.target.value as any })}><option value="Competition">Compétition</option><option value="RunningSante">Running / Santé</option><option value="Autre">Autre</option></select></div>
                    <div className="wp-form-row">
                        <div className="form-group"><label>Activité</label><input value={form.activity} onChange={e => setForm({ ...form, activity: e.target.value })} /></div>
                        <div className="form-group"><label>Code MonClub</label><input value={form.monClubCode} onChange={e => setForm({ ...form, monClubCode: e.target.value })} /></div>
                    </div>
                    <div className="wp-form-row">
                        <div className="form-group"><label>Type Licence</label><input value={form.licenseType} onChange={e => setForm({ ...form, licenseType: e.target.value })} /></div>
                        <div className="form-group"><label>Années naissance</label><input value={form.birthYears} onChange={e => setForm({ ...form, birthYears: e.target.value })} /></div>
                    </div>
                    <div className="wp-form-row">
                        <div className="form-group"><label>Prix</label><input value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></div>
                        <div className="form-group"><label>Ordre d'affichage</label><input type="number" value={form.order} onChange={e => setForm({ ...form, order: parseInt(e.target.value) || 0 })} /></div>
                    </div>
                    <div className="form-group"><label>Commentaire (optionnel)</label><input value={form.comment || ''} onChange={e => setForm({ ...form, comment: e.target.value })} /></div>
                    <div className="modal-actions"><button className="wp-btn wp-btn-primary" onClick={save}>Enregistrer</button></div>
                </Modal>
            )}

            {confirmId && <ConfirmDialog message="Supprimer ce tarif ?" onConfirm={() => { deletePricing(confirmId); setConfirmId(null); setToast('✓ Supprimé'); }} onCancel={() => setConfirmId(null)} />}
            {toast && <Toast message={toast} onClose={() => setToast('')} />}
        </>
    );
}

function SettingsView() {
    const { settings, setSettings, socialPosts, addSocialPost, updateSocialPost, deleteSocialPost } = useData();
    const [form, setForm] = useState(settings);
    useEffect(() => setForm(settings), [settings]);
    const [toast, setToast] = useState('');
    const [tickerInput, setTickerInput] = useState('');
    const [activeTab, setActiveTab] = useState('general');
    const [instaSync, setInstaSync] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
    const [instaSyncMsg, setInstaSyncMsg] = useState('');

    const handleInstagramSync = async () => {
        setInstaSync('loading');
        setInstaSyncMsg('');
        try {
            const res = await fetch('/api/instagram/sync', { method: 'POST' });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Erreur inconnue');
            setInstaSync('ok');
            setInstaSyncMsg(`✓ ${json.count} posts importés`);
        } catch (e: any) {
            setInstaSync('error');
            setInstaSyncMsg(e.message);
        }
    };

    // New state for adding social post
    const [newPost, setNewPost] = useState({ platform: 'facebook', content: '', imageUrl: '', postUrl: '', date: new Date().toISOString().split('T')[0] });

    const handleAddPost = () => {
        if (!newPost.content) return;
        addSocialPost({
            id: Date.now().toString(),
            platform: newPost.platform as 'facebook' | 'instagram' | 'linkedin' | 'youtube',
            content: newPost.content,
            imageUrl: newPost.imageUrl,
            postUrl: newPost.postUrl,
            date: newPost.date || new Date().toISOString().split('T')[0]
        });
        setNewPost({ platform: 'facebook', content: '', imageUrl: '', postUrl: '', date: new Date().toISOString().split('T')[0] });
        setToast('Checking... Post ajouté !');
        setTimeout(() => setToast(''), 3000);
    };

    const save = () => { setSettings(form); setToast('✓ Paramètres sauvegardés avec succès'); };
    const addTicker = () => { if (tickerInput.trim()) { setForm({ ...form, tickerMessages: [...form.tickerMessages, tickerInput.trim()] }); setTickerInput(''); } };
    const removeTicker = (i: number) => { setForm({ ...form, tickerMessages: form.tickerMessages.filter((_, idx) => idx !== i) }); };

    return (
        <>
            <div className="admin-header">
                <div><h1>Réglages</h1><p className="admin-subtitle">Configuration générale du site</p></div>
                <button className="wp-btn wp-btn-primary" onClick={save}>💾 Sauvegarder tout</button>
            </div>

            <div className="wp-settings-tabs">
                {[
                    { id: 'general', label: '🏠 Général' },
                    { id: 'hero', label: '🎯 Accueil' },
                    { id: 'club', label: '🏃 Club' },
                    { id: 'activities', label: '🏅 Activités' },
                    { id: 'articles', label: '📰 Actualités' },
                    { id: 'agenda', label: '📅 Agenda' },
                    { id: 'results', label: '🏆 Résultats' },
                    { id: 'rejoindre', label: '🏃 Rejoindre' },
                    { id: 'partners', label: '🤝 Partenaires' },
                    { id: 'contact', label: '📧 Contact' },
                    { id: 'links', label: '🔗 Liens' },
                    { id: 'social', label: '📱 Réseaux' },
                    { id: 'ticker', label: '📢 Ticker' },
                ].map(t => (
                    <button key={t.id} className={`wp-settings-tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>{t.label}</button>
                ))}
            </div>

            {activeTab === 'general' && (
                <div className="admin-card">
                    <h3>Informations du club</h3>
                    <div className="wp-form-row">
                        <div className="form-group"><label>Nom du club</label><input value={form.clubName} onChange={e => setForm({ ...form, clubName: e.target.value })} /></div>
                        <div className="form-group"><label>Sous-titre (Header/Footer)</label><input value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })} /></div>
                    </div>
                    <div className="form-group"><label>Texte Bouton Header (CTA)</label><input value={form.headerCtaText} onChange={e => setForm({ ...form, headerCtaText: e.target.value })} /></div>
                    <div className="form-group"><label>Adresse</label><input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
                    <div className="wp-form-row">
                        <ImageUpload value={form.logo || ''} onChange={v => setForm({ ...form, logo: v })} label="Logo du club (ACHV)" hint="Apparaît dans le header et le footer" />
                        <ImageUpload value={form.hbaLogo || ''} onChange={v => setForm({ ...form, hbaLogo: v })} label="Logo du club parent (HBA)" hint="Apparaît à côté du logo ACHV" />
                    </div>
                </div>
            )}

            {activeTab === 'hero' && (
                <>
                    <div className="admin-card">
                        <h3>Section Hero (bannière d&apos;accueil)</h3>
                        <div className="form-group"><label>Badge (haut de page)</label><input value={form.heroBadge} onChange={e => setForm({ ...form, heroBadge: e.target.value })} /></div>
                        <div className="form-group"><label>Sous-titre du Hero</label><textarea value={form.heroSubtitle} onChange={e => setForm({ ...form, heroSubtitle: e.target.value })} rows={3} /></div>
                        <div className="wp-form-row">
                            <div className="form-group"><label>Bouton 1</label><input value={form.heroCta1Text} onChange={e => setForm({ ...form, heroCta1Text: e.target.value })} /></div>
                            <div className="form-group"><label>Bouton 2</label><input value={form.heroCta2Text} onChange={e => setForm({ ...form, heroCta2Text: e.target.value })} /></div>
                        </div>
                        
                        <div className="wp-form-row">
                            <div className="form-group"><label>Nombre de licenciés (+)</label><input type="number" value={form.licencies} onChange={e => setForm({ ...form, licencies: parseInt(e.target.value) || 0 })} /></div>
                        </div>
                        <ImageUpload value={form.heroImage || ''} onChange={v => setForm({ ...form, heroImage: v })} label="Image de fond du Hero" hint="Si vide, la photo d'équipe par défaut sera utilisée" />
                    </div>
                    <div className="admin-card">
                        <h3>Section « Qui sommes-nous »</h3>
                        <div className="form-group"><label>Texte de présentation</label><textarea value={form.aboutText} onChange={e => setForm({ ...form, aboutText: e.target.value })} rows={5} /></div>
                        <div className="form-group"><label>Texte Bouton</label><input value={form.aboutCtaText} onChange={e => setForm({ ...form, aboutCtaText: e.target.value })} /></div>
                        <ImageUpload value={form.aboutImage || ''} onChange={v => setForm({ ...form, aboutImage: v })} label="Photo de la section" hint="Si vide, la photo d'équipe par défaut sera utilisée" />
                    </div>
                    <div className="admin-card">
                        <h3>Section &quot;Rejoignez-nous&quot; (bandeau en bas de la page d&apos;accueil)</h3>
                        <div className="form-group"><label>Titre</label><input value={form.ctaTitle} onChange={e => setForm({ ...form, ctaTitle: e.target.value })} /></div>
                        <div className="form-group"><label>Texte</label><textarea value={form.ctaText} onChange={e => setForm({ ...form, ctaText: e.target.value })} rows={2} /></div>
                    </div>
                </>
            )}

            {activeTab === 'club' && (
                <div className="admin-card">
                    <h3>Page Club</h3>
                    <div className="form-group"><label>Titre de la page</label><input value={form.clubPage.heroTitle} onChange={e => setForm({ ...form, clubPage: { ...form.clubPage, heroTitle: e.target.value } })} /></div>
                    <div className="form-group"><label>Sous-titre de la page</label><input value={form.clubPage.heroSubtitle} onChange={e => setForm({ ...form, clubPage: { ...form.clubPage, heroSubtitle: e.target.value } })} /></div>
                    <div className="form-group"><label>Titre Intro (Histoire)</label><input value={form.clubPage.introTitle} onChange={e => setForm({ ...form, clubPage: { ...form.clubPage, introTitle: e.target.value } })} /></div>

                    <div className="form-group"><label>Texte de présentation (Histoire)</label><textarea value={form.clubPage.description || ''} onChange={e => setForm({ ...form, clubPage: { ...form.clubPage, description: e.target.value } })} rows={5} /></div>

                    <ImageUpload value={form.clubPage.image || ''} onChange={v => setForm({ ...form, clubPage: { ...form.clubPage, image: v } })} label="Photo de présentation" hint="Image illustrant la section Histoire" />

                    <div style={{ marginTop: 24, padding: 16, background: '#f0f9ff', borderRadius: 8, border: '1px solid #bae6fd' }}>
                        <h4 style={{ margin: '0 0 12px 0', color: '#0284c7' }}>Bloc Affiliation</h4>
                        <div className="form-group"><label>Titre Affiliation</label><input value={form.clubPage.affiliationTitle || ''} onChange={e => setForm({ ...form, clubPage: { ...form.clubPage, affiliationTitle: e.target.value } })} /></div>
                        <div className="form-group"><label>Texte Affiliation</label><textarea value={form.clubPage.affiliationText || ''} onChange={e => setForm({ ...form, clubPage: { ...form.clubPage, affiliationText: e.target.value } })} rows={3} /></div>
                    </div>

                    <div className="form-group" style={{ marginTop: 24 }}><label>Titre Valeurs</label><input value={form.clubPage.valuesTitle} onChange={e => setForm({ ...form, clubPage: { ...form.clubPage, valuesTitle: e.target.value } })} /></div>
                    <div className="form-group"><label>Titre Installations</label><input value={form.clubPage.facilitiesTitle} onChange={e => setForm({ ...form, clubPage: { ...form.clubPage, facilitiesTitle: e.target.value } })} /></div>

                    <h4 style={{ marginTop: 16, marginBottom: 8 }}>Liste des installations</h4>
                    {(form.clubPage.facilities || []).map((fac, i) => (
                        <div key={i} style={{ position: 'relative', padding: '16px', background: '#f8fafc', borderRadius: '8px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
                            <button className="wp-btn-icon wp-btn-icon-danger" style={{ position: 'absolute', top: 8, right: 8 }} onClick={() => {
                                const newFacs = (form.clubPage.facilities || []).filter((_, idx) => idx !== i);
                                setForm({ ...form, clubPage: { ...form.clubPage, facilities: newFacs } });
                            }}>✕</button>

                            <ImageUpload value={fac.image || ''} onChange={v => {
                                const newFacs = [...(form.clubPage.facilities || [])];
                                newFacs[i].image = v;
                                setForm({ ...form, clubPage: { ...form.clubPage, facilities: newFacs } });
                            }} label="Photo de l'installation" />

                            <div className="form-group"><label>Nom du lieu</label><input value={fac.title || ''} onChange={e => {
                                const newFacs = [...(form.clubPage.facilities || [])];
                                newFacs[i].title = e.target.value;
                                setForm({ ...form, clubPage: { ...form.clubPage, facilities: newFacs } });
                            }} placeholder="Ex: Stade Nominoë" /></div>

                            <div className="form-group"><label>Description</label><textarea value={fac.description || ''} onChange={e => {
                                const newFacs = [...(form.clubPage.facilities || [])];
                                newFacs[i].description = e.target.value;
                                setForm({ ...form, clubPage: { ...form.clubPage, facilities: newFacs } });
                            }} rows={2} /></div>
                        </div>
                    ))}
                    <button className="wp-btn wp-btn-sm" onClick={() => setForm({
                        ...form,
                        clubPage: {
                            ...form.clubPage,
                            facilities: [...(form.clubPage.facilities || []), { title: 'Nouveau lieu', image: '', description: 'Description du lieu' }]
                        }
                    })}>+ Ajouter une installation</button>

                    <div className="form-group"><label>Titre Équipe</label><input value={form.clubPage.teamTitle} onChange={e => setForm({ ...form, clubPage: { ...form.clubPage, teamTitle: e.target.value } })} /></div>
                    <div className="form-group"><label>Sous-titre Équipe</label><input value={form.clubPage.teamSubtitle} onChange={e => setForm({ ...form, clubPage: { ...form.clubPage, teamSubtitle: e.target.value } })} /></div>
                    <div className="form-group"><label>Titre du bandeau d&apos;action</label><input value={form.clubPage.ctaTitle} onChange={e => setForm({ ...form, clubPage: { ...form.clubPage, ctaTitle: e.target.value } })} /></div>
                    <div className="form-group"><label>Texte du bouton d&apos;action</label><input value={form.clubPage.ctaText} onChange={e => setForm({ ...form, clubPage: { ...form.clubPage, ctaText: e.target.value } })} /></div>

                    <h3 style={{ marginTop: 24 }}>Nos Valeurs (affichées sur page Club)</h3>
                    {(form.clubValues || []).map((val, i) => (
                        <div key={i} style={{ position: 'relative', padding: '16px', background: '#f8fafc', borderRadius: '8px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
                            <button className="wp-btn-icon wp-btn-icon-danger" style={{ position: 'absolute', top: 8, right: 8 }} onClick={() => { const newVals = (form.clubValues || []).filter((_, idx) => idx !== i); setForm({ ...form, clubValues: newVals }); }}>✕</button>
                            <div className="wp-form-row">
                                <div className="form-group" style={{ flex: '0 0 60px' }}><label>Icône</label><input value={val.icon || ''} onChange={e => { const newVals = [...(form.clubValues || [])]; newVals[i].icon = e.target.value; setForm({ ...form, clubValues: newVals }); }} /></div>
                                <div className="form-group"><label>Titre</label><input value={val.title || ''} onChange={e => { const newVals = [...(form.clubValues || [])]; newVals[i].title = e.target.value; setForm({ ...form, clubValues: newVals }); }} /></div>
                            </div>
                            <div className="form-group"><label>Description</label><textarea value={val.desc || ''} onChange={e => { const newVals = [...(form.clubValues || [])]; newVals[i].desc = e.target.value; setForm({ ...form, clubValues: newVals }); }} rows={2} /></div>
                        </div>
                    ))}
                    <button className="wp-btn wp-btn-sm" onClick={() => setForm({ ...form, clubValues: [...form.clubValues, { icon: '★', title: 'Nouvelle valeur', desc: 'Description' }] })}>+ Ajouter une valeur</button>
                </div>
            )}

            {activeTab === 'activities' && (
                <div className="admin-card">
                    <h3>Page Activités</h3>
                    <div className="form-group"><label>Titre de la page</label><input value={form.activitesPage.heroTitle} onChange={e => setForm({ ...form, activitesPage: { ...form.activitesPage, heroTitle: e.target.value } })} /></div>
                    <div className="form-group"><label>Sous-titre de la page</label><input value={form.activitesPage.heroSubtitle} onChange={e => setForm({ ...form, activitesPage: { ...form.activitesPage, heroSubtitle: e.target.value } })} /></div>
                    <div className="form-group"><label>Titre Planning</label><input value={form.activitesPage.planningTitle} onChange={e => setForm({ ...form, activitesPage: { ...form.activitesPage, planningTitle: e.target.value } })} /></div>
                    <div className="form-group"><label>Sous-titre Planning</label><textarea value={form.activitesPage.planningSubtitle} onChange={e => setForm({ ...form, activitesPage: { ...form.activitesPage, planningSubtitle: e.target.value } })} rows={2} /></div>
                    <div className="form-group"><label>Info Lieux Planning</label><input value={form.activitesPage.planningLocation} onChange={e => setForm({ ...form, activitesPage: { ...form.activitesPage, planningLocation: e.target.value } })} /></div>
                </div>
            )}

            {activeTab === 'articles' && (
                <div className="admin-card">
                    <h3>Page Actualités</h3>
                    <div className="form-group"><label>Titre de la page</label><input value={form.actualitesPage.heroTitle} onChange={e => setForm({ ...form, actualitesPage: { ...form.actualitesPage, heroTitle: e.target.value } })} /></div>
                    <div className="form-group"><label>Sous-titre de la page</label><input value={form.actualitesPage.heroSubtitle} onChange={e => setForm({ ...form, actualitesPage: { ...form.actualitesPage, heroSubtitle: e.target.value } })} /></div>
                    
                    <h3 style={{ marginTop: 24 }}>Homepage - Section Actualités</h3>
                    <div className="wp-form-row">
                        <div className="form-group"><label>Étiquette (Sur-titre)</label><input value={form.newsLabel} onChange={e => setForm({ ...form, newsLabel: e.target.value })} /></div>
                        <div className="form-group"><label>Titre de la section</label><input value={form.newsTitle} onChange={e => setForm({ ...form, newsTitle: e.target.value })} /></div>
                    </div>
                    <div className="wp-form-row">
                        <div className="form-group"><label>Texte Bouton</label><input value={form.newsCtaText} onChange={e => setForm({ ...form, newsCtaText: e.target.value })} /></div>
                        <div className="form-group"><label>Lien 'Lire la suite'</label><input value={form.newsReadMoreText} onChange={e => setForm({ ...form, newsReadMoreText: e.target.value })} /></div>
                    </div>
                </div>
            )}

            {activeTab === 'agenda' && (
                <div className="admin-card">
                    <h3>Page Agenda</h3>
                    <div className="form-group"><label>Titre de la page</label><input value={form.agendaPage.heroTitle} onChange={e => setForm({ ...form, agendaPage: { ...form.agendaPage, heroTitle: e.target.value } })} /></div>
                    <div className="form-group"><label>Sous-titre de la page</label><input value={form.agendaPage.heroSubtitle} onChange={e => setForm({ ...form, agendaPage: { ...form.agendaPage, heroSubtitle: e.target.value } })} /></div>
                    
                    <h3 style={{ marginTop: 24 }}>Homepage - Section Agenda</h3>
                    <div className="wp-form-row">
                        <div className="form-group"><label>Étiquette (Sur-titre)</label><input value={form.eventsLabel} onChange={e => setForm({ ...form, eventsLabel: e.target.value })} /></div>
                        <div className="form-group"><label>Titre de la section</label><input value={form.eventsTitle} onChange={e => setForm({ ...form, eventsTitle: e.target.value })} /></div>
                    </div>
                    <div className="form-group"><label>Texte Bouton</label><input value={form.eventsCtaText} onChange={e => setForm({ ...form, eventsCtaText: e.target.value })} /></div>
                </div>
            )}

            {activeTab === 'results' && (
                <div className="admin-card">
                    <h3>Page Résultats</h3>
                    <div className="form-group"><label>Titre de la page</label><input value={form.resultatsPage.heroTitle} onChange={e => setForm({ ...form, resultatsPage: { ...form.resultatsPage, heroTitle: e.target.value } })} /></div>
                    <div className="form-group"><label>Sous-titre de la page</label><input value={form.resultatsPage.heroSubtitle} onChange={e => setForm({ ...form, resultatsPage: { ...form.resultatsPage, heroSubtitle: e.target.value } })} /></div>
                    <div className="form-group"><label>Titre 'Derniers résultats'</label><input value={form.resultatsPage.latestTitle} onChange={e => setForm({ ...form, resultatsPage: { ...form.resultatsPage, latestTitle: e.target.value } })} /></div>
                </div>
            )}

            {activeTab === 'records' && (
                <div className="admin-card">
                    <h3>Page Records</h3>
                    <div className="form-group"><label>Titre de la page</label><input value={form.recordsPage.heroTitle} onChange={e => setForm({ ...form, recordsPage: { ...form.recordsPage, heroTitle: e.target.value } })} /></div>
                    <div className="form-group"><label>Sous-titre de la page</label><input value={form.recordsPage.heroSubtitle} onChange={e => setForm({ ...form, recordsPage: { ...form.recordsPage, heroSubtitle: e.target.value } })} /></div>
                </div>
            )}

            {activeTab === 'partners' && (
                <>
                    <div className="admin-card">
                        <h3>En-tête de page</h3>
                        <div className="form-group"><label>Titre de la page</label><input value={form.partnersPage.heroTitle} onChange={e => setForm({ ...form, partnersPage: { ...form.partnersPage, heroTitle: e.target.value } })} /></div>
                        <div className="form-group"><label>Sous-titre</label><textarea value={form.partnersPage.heroSubtitle} onChange={e => setForm({ ...form, partnersPage: { ...form.partnersPage, heroSubtitle: e.target.value } })} rows={3} /></div>

                        <h3 style={{ marginTop: 24 }}>Homepage - Section Partenaires</h3>
                        <div className="wp-form-row">
                            <div className="form-group"><label>Étiquette (Sur-titre)</label><input value={form.partnersLabel} onChange={e => setForm({ ...form, partnersLabel: e.target.value })} /></div>
                            <div className="form-group"><label>Titre de la section</label><input value={form.partnersTitle} onChange={e => setForm({ ...form, partnersTitle: e.target.value })} /></div>
                        </div>
                        <div className="form-group"><label>Sous-titre</label><textarea value={form.partnersSubtitle} onChange={e => setForm({ ...form, partnersSubtitle: e.target.value })} rows={2} /></div>
                    </div>
                    <div className="admin-card">
                        <h3>Chiffres clés</h3>
                        <div className="wp-form-row" style={{ flexWrap: 'wrap' }}>
                            {(form.partnersPage?.stats || []).map((stat, i) => (
                                <div key={i} style={{ position: 'relative', flex: '1 0 45%', padding: '12px', background: '#f8fafc', borderRadius: '8px', marginBottom: '12px', border: '1px solid #e2e8f0' }}>
                                    <button className="wp-btn-icon wp-btn-icon-danger" style={{ position: 'absolute', top: 4, right: 4 }} onClick={() => { const newStats = (form.partnersPage?.stats || []).filter((_, idx) => idx !== i); setForm({ ...form, partnersPage: { ...form.partnersPage, stats: newStats } }); }}>✕</button>
                                    <div className="form-group"><label>Chiffre</label><input value={stat.value || ''} onChange={e => { const newStats = [...(form.partnersPage?.stats || [])]; newStats[i].value = e.target.value; setForm({ ...form, partnersPage: { ...form.partnersPage, stats: newStats } }); }} /></div>
                                    <div className="form-group"><label>Libellé</label><input value={stat.label || ''} onChange={e => { const newStats = [...(form.partnersPage?.stats || [])]; newStats[i].label = e.target.value; setForm({ ...form, partnersPage: { ...form.partnersPage, stats: newStats } }); }} /></div>
                                    <div className="form-group"><label>Icône</label><input value={stat.icon || ''} onChange={e => { const newStats = [...(form.partnersPage?.stats || [])]; newStats[i].icon = e.target.value; setForm({ ...form, partnersPage: { ...form.partnersPage, stats: newStats } }); }} style={{ width: '50px' }} /></div>
                                </div>
                            ))}
                        </div>
                        <button className="wp-btn wp-btn-sm" onClick={() => setForm({ ...form, partnersPage: { ...form.partnersPage, stats: [...form.partnersPage.stats, { value: '0', label: 'Label', icon: '★' }] } })}>+ Ajouter un chiffre</button>
                    </div>
                    <div className="admin-card">
                        <h3>Pourquoi devenir partenaire ?</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                            {(form.partnersPage?.benefits || []).map((b, i) => (
                                <div key={i} style={{ position: 'relative', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <button className="wp-btn-icon wp-btn-icon-danger" style={{ position: 'absolute', top: 8, right: 8 }} onClick={() => { const newB = (form.partnersPage?.benefits || []).filter((_, idx) => idx !== i); setForm({ ...form, partnersPage: { ...form.partnersPage, benefits: newB } }); }}>✕</button>
                                    <div className="wp-form-row">
                                        <div className="form-group" style={{ flex: '0 0 50px' }}><label>Icône</label><input value={b.icon || ''} onChange={e => { const newB = [...(form.partnersPage?.benefits || [])]; newB[i].icon = e.target.value; setForm({ ...form, partnersPage: { ...form.partnersPage, benefits: newB } }); }} /></div>
                                        <div className="form-group"><label>Titre</label><input value={b.title || ''} onChange={e => { const newB = [...(form.partnersPage?.benefits || [])]; newB[i].title = e.target.value; setForm({ ...form, partnersPage: { ...form.partnersPage, benefits: newB } }); }} /></div>
                                    </div>
                                    <div className="form-group"><label>Description</label><textarea value={b.desc || ''} onChange={e => { const newB = [...(form.partnersPage?.benefits || [])]; newB[i].desc = e.target.value; setForm({ ...form, partnersPage: { ...form.partnersPage, benefits: newB } }); }} rows={3} /></div>
                                </div>
                            ))}
                        </div>
                        <button className="wp-btn wp-btn-sm" style={{ marginTop: 12 }} onClick={() => setForm({ ...form, partnersPage: { ...form.partnersPage, benefits: [...form.partnersPage.benefits, { icon: '★', title: 'Nouvel avantage', desc: 'Description' }] } })}>+ Ajouter un avantage</button>
                    </div>
                    <div className="admin-card">
                        <h3>Offres de Partenariat</h3>
                        {['bronze', 'silver', 'gold'].map((tier) => (
                            <div key={tier} style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
                                <h4 style={{ textTransform: 'capitalize', marginBottom: '12px' }}>Pack {tier}</h4>
                                <div className="form-group"><label>Prix</label><input value={form.partnersPage.pricing[tier as 'bronze' | 'silver' | 'gold'].price} onChange={e => {
                                    const newPricing = { ...form.partnersPage.pricing };
                                    newPricing[tier as 'bronze' | 'silver' | 'gold'].price = e.target.value;
                                    setForm({ ...form, partnersPage: { ...form.partnersPage, pricing: newPricing } });
                                }} /></div>
                                <div className="form-group"><label>Caractéristiques (une par ligne)</label><textarea rows={5} value={form.partnersPage.pricing[tier as 'bronze' | 'silver' | 'gold'].features.join('\n')} onChange={e => {
                                    const newPricing = { ...form.partnersPage.pricing };
                                    newPricing[tier as 'bronze' | 'silver' | 'gold'].features = e.target.value.split('\n');
                                    setForm({ ...form, partnersPage: { ...form.partnersPage, pricing: newPricing } });
                                }} /></div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {activeTab === 'contact' && (
                <div className="admin-card">
                    <h3>Page Contact</h3>
                    <div className="form-group"><label>Titre de la page</label><input value={form.contactPage.heroTitle} onChange={e => setForm({ ...form, contactPage: { ...form.contactPage, heroTitle: e.target.value } })} /></div>
                    <div className="form-group"><label>Sous-titre de la page</label><input value={form.contactPage.heroSubtitle} onChange={e => setForm({ ...form, contactPage: { ...form.contactPage, heroSubtitle: e.target.value } })} /></div>
                    <div className="form-group"><label>Titre Adresse</label><input value={form.contactPage.addressTitle} onChange={e => setForm({ ...form, contactPage: { ...form.contactPage, addressTitle: e.target.value } })} /></div>
                    <div className="form-group"><label>Titre Réseaux</label><input value={form.contactPage.socialTitle} onChange={e => setForm({ ...form, contactPage: { ...form.contactPage, socialTitle: e.target.value } })} /></div>
                    <div className="form-group"><label>Titre Liens</label><input value={form.contactPage.linksTitle} onChange={e => setForm({ ...form, contactPage: { ...form.contactPage, linksTitle: e.target.value } })} /></div>

                    <h3 style={{ marginTop: 24 }}>Adresses email de contact</h3>
                    <p className="form-hint" style={{ marginBottom: 16 }}>Ces adresses apparaissent sur la page Contact. En cliquant dessus, le visiteur pourra envoyer un email directement.</p>
                    <div className="form-group"><label>Email bureau</label><input value={form.contactEmail} onChange={e => setForm({ ...form, contactEmail: e.target.value })} /></div>
                    <div className="form-group"><label>Email inscriptions</label><input value={form.contactEmailInscription} onChange={e => setForm({ ...form, contactEmailInscription: e.target.value })} /></div>
                    <div className="form-group"><label>Email président</label><input value={form.contactEmailPresident} onChange={e => setForm({ ...form, contactEmailPresident: e.target.value })} /></div>
                    <div className="form-group"><label>Email partenariats (réception du formulaire)</label><input value={form.contactEmailPartenariat} onChange={e => setForm({ ...form, contactEmailPartenariat: e.target.value })} /></div>
                </div>
            )}

            {activeTab === 'links' && (
                <div className="admin-card">
                    <h3>Liens externes</h3>
                    <div className="form-group"><label>Lien Inscription</label><input value={form.inscriptionUrl} onChange={e => setForm({ ...form, inscriptionUrl: e.target.value })} /></div>
                    <div className="form-group"><label>Lien Réinscription</label><input value={form.reinscriptionUrl} onChange={e => setForm({ ...form, reinscriptionUrl: e.target.value })} /></div>
                    <div className="form-group"><label>Lien Plaquette / Tarifs</label><input value={form.plaquetteUrl} onChange={e => setForm({ ...form, plaquetteUrl: e.target.value })} /></div>
                    <div className="form-group"><label>Lien HBA (Haute Bretagne Athlétisme)</label><input value={form.hbaUrl} onChange={e => setForm({ ...form, hbaUrl: e.target.value })} /></div>
                    <div className="form-group"><label>Lien Boutique (Intersport)</label><input value={form.boutiqueUrl} onChange={e => setForm({ ...form, boutiqueUrl: e.target.value })} /></div>
                </div>
            )}

            {activeTab === 'rejoindre' && (() => {
                const rp = form.rejoindrePage || {};
                const profiles = rp.profiles || [];
                const inscriptionSteps = rp.inscriptionSteps || [];
                const reinscriptionSteps = rp.reinscriptionSteps || [];

                const setRp = (patch: any) => setForm({ ...form, rejoindrePage: { ...rp, ...patch } });

                const updateProfile = (i: number, patch: any) => {
                    const newProfiles = [...profiles];
                    newProfiles[i] = { ...newProfiles[i], ...patch };
                    setRp({ profiles: newProfiles });
                };
                const deleteProfile = (i: number) => setRp({ profiles: profiles.filter((_: any, idx: number) => idx !== i) });
                const addProfile = () => setRp({ profiles: [...profiles, { id: `profil${Date.now()}`, emoji: '⭐', title: 'Nouveau profil', subtitle: 'Description courte', age: 'Tous âges', color: '#6366f1', categories: [], description: 'Description du profil...', highlights: ['Point fort 1', 'Point fort 2'], icon: '🏅' }] });

                const updateStep = (kind: 'inscriptionSteps' | 'reinscriptionSteps', i: number, patch: any) => {
                    const arr = kind === 'inscriptionSteps' ? [...inscriptionSteps] : [...reinscriptionSteps];
                    arr[i] = { ...arr[i], ...patch };
                    setRp({ [kind]: arr });
                };
                const deleteStep = (kind: 'inscriptionSteps' | 'reinscriptionSteps', i: number) => {
                    const arr = (kind === 'inscriptionSteps' ? inscriptionSteps : reinscriptionSteps).filter((_: any, idx: number) => idx !== i);
                    setRp({ [kind]: arr });
                };
                const addStep = (kind: 'inscriptionSteps' | 'reinscriptionSteps') => {
                    const arr = [...(kind === 'inscriptionSteps' ? inscriptionSteps : reinscriptionSteps), { title: 'Nouvelle étape', text: 'Décrivez cette étape...', note: '' }];
                    setRp({ [kind]: arr });
                };

                return (
                    <>
                        {/* En-tête */}
                        <div className="admin-card">
                            <h3>🎯 En-tête de la page</h3>
                            <div className="form-group"><label>Titre (Héro)</label><input value={rp.heroTitle || ''} onChange={e => setRp({ heroTitle: e.target.value })} placeholder="Rejoindre le club" /></div>
                            <div className="form-group"><label>Sous-titre (Héro)</label><input value={rp.heroSubtitle || ''} onChange={e => setRp({ heroSubtitle: e.target.value })} placeholder="Trouvez l'activité qui vous correspond en quelques clics" /></div>
                            <div className="wp-form-row">
                                <div className="form-group"><label>Titre section profils</label><input value={rp.stepIntroTitle || ''} onChange={e => setRp({ stepIntroTitle: e.target.value })} placeholder="Quel sportif êtes-vous ?" /></div>
                                <div className="form-group"><label>Sous-texte section profils</label><input value={rp.stepIntroText || ''} onChange={e => setRp({ stepIntroText: e.target.value })} placeholder="Sélectionnez votre profil..." /></div>
                            </div>
                            <div className="wp-form-row">
                                <div className="form-group"><label>Titre CTA (après sélection profil)</label><input value={rp.ctaTitle || ''} onChange={e => setRp({ ctaTitle: e.target.value })} placeholder="Prêt à rejoindre l'aventure ?" /></div>
                                <div className="form-group"><label>Texte CTA</label><input value={rp.ctaText || ''} onChange={e => setRp({ ctaText: e.target.value })} placeholder="Inscrivez-vous en ligne..." /></div>
                            </div>
                        </div>

                        {/* PROFILS */}
                        <div className="admin-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <h3 style={{ margin: 0 }}>👤 Profils (cartes de sélection)</h3>
                                <button className="wp-btn wp-btn-primary wp-btn-sm" onClick={addProfile}>+ Ajouter un profil</button>
                            </div>
                            <p className="form-hint" style={{ marginBottom: 20 }}>Le champ <strong>Catégories</strong> doit correspondre exactement aux catégories du planning (séparées par des virgules) pour afficher les horaires.</p>

                            {profiles.map((p: any, i: number) => (
                                <div key={i} style={{ border: '2px solid #e2e8f0', borderRadius: 12, padding: 20, marginBottom: 20, position: 'relative', background: '#fafafa' }}>
                                    <button className="wp-btn-icon wp-btn-icon-danger" style={{ position: 'absolute', top: 12, right: 12 }} onClick={() => deleteProfile(i)}>🗑️</button>
                                    <div className="wp-form-row">
                                        <div className="form-group" style={{ flex: '0 0 80px' }}>
                                            <label>Emoji</label>
                                            <input value={p.emoji || ''} onChange={e => updateProfile(i, { emoji: e.target.value })} style={{ fontSize: '1.5rem', textAlign: 'center' }} />
                                        </div>
                                        <div className="form-group" style={{ flex: '0 0 80px' }}>
                                            <label>Icône R.</label>
                                            <input value={p.icon || ''} onChange={e => updateProfile(i, { icon: e.target.value })} style={{ fontSize: '1.2rem', textAlign: 'center' }} placeholder="🏅" />
                                        </div>
                                        <div className="form-group">
                                            <label>Titre</label>
                                            <input value={p.title || ''} onChange={e => updateProfile(i, { title: e.target.value })} placeholder="Ex: Coureur Adulte" />
                                        </div>
                                        <div className="form-group">
                                            <label>Sous-titre</label>
                                            <input value={p.subtitle || ''} onChange={e => updateProfile(i, { subtitle: e.target.value })} placeholder="Running, trail & route..." />
                                        </div>
                                    </div>
                                    <div className="wp-form-row">
                                        <div className="form-group">
                                            <label>Tranche d&apos;âge</label>
                                            <input value={p.age || ''} onChange={e => updateProfile(i, { age: e.target.value })} placeholder="16 ans et +" />
                                        </div>
                                        <div className="form-group">
                                            <label>Couleur (hex)</label>
                                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                <input type="color" value={p.color || '#3b82f6'} onChange={e => updateProfile(i, { color: e.target.value })} style={{ width: 44, height: 38, borderRadius: 6, border: '1px solid #cbd5e1', cursor: 'pointer', padding: 0 }} />
                                                <input value={p.color || ''} onChange={e => updateProfile(i, { color: e.target.value })} placeholder="#3b82f6" style={{ flex: 1 }} />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label>Catégories planning</label>
                                            <input value={(p.categories || []).join(', ')} onChange={e => updateProfile(i, { categories: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) })} placeholder="Ex: Adultes Hors-Stade, Jeunes" />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Image de fond (Optionnel)</label>
                                        <input value={p.imageBg || ''} onChange={e => updateProfile(i, { imageBg: e.target.value })} placeholder="URL de l'image (ex: /images/kid-bg.png)" />
                                    </div>
                                    <div className="form-group">
                                        <label>Description (affichée après sélection du profil)</label>
                                        <textarea value={p.description || ''} onChange={e => updateProfile(i, { description: e.target.value })} rows={3} placeholder="Décrivez ce profil..." />
                                    </div>
                                    <div className="form-group">
                                        <label>Points forts — un par ligne</label>
                                        <textarea value={(p.highlights || []).join('\n')} onChange={e => updateProfile(i, { highlights: e.target.value.split('\n').filter(Boolean) })} rows={4} placeholder={"Encadrement diplômé FFA\nToutes les disciplines\nAmbiance conviviale"} />
                                    </div>
                                </div>
                            ))}
                            {profiles.length === 0 && <p className="wp-empty">Aucun profil. Ajoutez-en un avec le bouton ci-dessus.</p>}
                        </div >

                        {/* GUIDE — TITRES GLOBAUX */}
                        < div className="admin-card" >
                            <h3>📋 Guide d&apos;inscription — Textes généraux</h3>
                            <div className="wp-form-row">
                                <div className="form-group"><label>Titre du guide</label><input value={rp.guideTitle || ''} onChange={e => setRp({ guideTitle: e.target.value })} placeholder="Comment s'inscrire ?" /></div>
                                <div className="form-group"><label>Sous-titre du guide</label><input value={rp.guideSubtitle || ''} onChange={e => setRp({ guideSubtitle: e.target.value })} placeholder="Suivez les étapes..." /></div>
                            </div>
                            <div className="form-group">
                                <label>Texte encadré « Essai gratuit »</label>
                                <textarea value={rp.trialText || ''} onChange={e => setRp({ trialText: e.target.value })} rows={3} placeholder="Bonne nouvelle ! Vous pouvez faire 2 séances d'essai gratuites..." />
                            </div>
                        </div >

                        {/* ÉTAPES — PREMIÈRE INSCRIPTION */}
                        < div className="admin-card" >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <h3 style={{ margin: 0 }}>🎉 Étapes — Première inscription</h3>
                                <button className="wp-btn wp-btn-primary wp-btn-sm" onClick={() => addStep('inscriptionSteps')}>+ Ajouter une étape</button>
                            </div>
                            {
                                inscriptionSteps.map((step: any, i: number) => (
                                    <div key={i} style={{ border: '2px solid #dbeafe', borderRadius: 12, padding: 20, marginBottom: 16, background: '#f8fafc', position: 'relative' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>{i + 1}</div>
                                            <strong style={{ color: '#1e40af' }}>Étape {i + 1}</strong>
                                            <button className="wp-btn-icon wp-btn-icon-danger" style={{ marginLeft: 'auto' }} onClick={() => deleteStep('inscriptionSteps', i)}>🗑️</button>
                                        </div>
                                        <div className="form-group"><label>Titre</label><input value={step.title || ''} onChange={e => updateStep('inscriptionSteps', i, { title: e.target.value })} placeholder="Titre de l'étape..." /></div>
                                        <div className="form-group"><label>Texte</label><textarea value={step.text || ''} onChange={e => updateStep('inscriptionSteps', i, { text: e.target.value })} rows={4} placeholder="Décrivez cette étape..." /></div>
                                        <div className="form-group"><label>Note (optionnel — encadré jaune)</label><textarea value={step.note || ''} onChange={e => updateStep('inscriptionSteps', i, { note: e.target.value })} rows={2} placeholder="Info complémentaire..." /></div>
                                    </div>
                                ))
                            }
                            {inscriptionSteps.length === 0 && <p className="wp-empty">Aucune étape. Ajoutez-en une.</p>}
                        </div >

                        {/* ÉTAPES — RÉINSCRIPTION */}
                        < div className="admin-card" >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <h3 style={{ margin: 0 }}>🔄 Étapes — Réinscription</h3>
                                <button className="wp-btn wp-btn-primary wp-btn-sm" onClick={() => addStep('reinscriptionSteps')}>+ Ajouter une étape</button>
                            </div>
                            {
                                reinscriptionSteps.map((step: any, i: number) => (
                                    <div key={i} style={{ border: '2px solid #d1fae5', borderRadius: 12, padding: 20, marginBottom: 16, background: '#f8fafc', position: 'relative' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#10b981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>{i + 1}</div>
                                            <strong style={{ color: '#065f46' }}>Étape {i + 1}</strong>
                                            <button className="wp-btn-icon wp-btn-icon-danger" style={{ marginLeft: 'auto' }} onClick={() => deleteStep('reinscriptionSteps', i)}>🗑️</button>
                                        </div>
                                        <div className="form-group"><label>Titre</label><input value={step.title || ''} onChange={e => updateStep('reinscriptionSteps', i, { title: e.target.value })} placeholder="Titre de l'étape..." /></div>
                                        <div className="form-group"><label>Texte</label><textarea value={step.text || ''} onChange={e => updateStep('reinscriptionSteps', i, { text: e.target.value })} rows={4} placeholder="Décrivez cette étape..." /></div>
                                        <div className="form-group"><label>Note (optionnel — encadré jaune)</label><textarea value={step.note || ''} onChange={e => updateStep('reinscriptionSteps', i, { note: e.target.value })} rows={2} placeholder="Info complémentaire..." /></div>
                                    </div>
                                ))
                            }
                            {reinscriptionSteps.length === 0 && <p className="wp-empty">Aucune étape. Ajoutez-en une.</p>}
                        </div >

                        {/* Liens rapides */}
                        < div className="admin-card" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }
                        }>
                            <h3 style={{ color: '#166534' }}>💡 Liens utilisés automatiquement sur la page</h3>
                            <p className="form-hint">Ces liens sont configurés dans l&apos;onglet <strong>🔗 Liens</strong>.</p>
                            <ul style={{ margin: 0, paddingLeft: 20, color: '#374151', lineHeight: 1.8 }}>
                                <li><strong>Inscription</strong> → Bouton &quot;✅ M&apos;inscrire en ligne&quot; (visible si renseigné)</li>
                                <li><strong>Réinscription</strong> → Bouton &quot;🏅 Accéder à MonClub&quot; (visible si renseigné)</li>
                                <li><strong>Plaquette</strong> → Bouton &quot;📄 Plaquette du club&quot; (étape 1 du guide)</li>
                            </ul>
                            <button className="wp-btn wp-btn-sm" style={{ marginTop: 12 }} onClick={() => setActiveTab('links')}>→ Configurer les liens</button>
                        </div >
                    </>
                );
            })()}

            {
                activeTab === 'social' && (
                    <>
                        <div className="admin-card">
                            <h3>Titres de la section</h3>
                            <div className="wp-form-row">
                                <div className="form-group"><label>Étiquette (Sur-titre)</label><input value={form.socialLabel} onChange={e => setForm({ ...form, socialLabel: e.target.value })} /></div>
                                <div className="form-group"><label>Titre de la section</label><input value={form.socialTitle} onChange={e => setForm({ ...form, socialTitle: e.target.value })} /></div>
                            </div>
                            <div className="form-group"><label>Sous-titre</label><textarea value={form.socialSubtitle} onChange={e => setForm({ ...form, socialSubtitle: e.target.value })} rows={2} /></div>
                            <div className="form-group"><label>Texte Bouton</label><input value={form.socialCtaText} onChange={e => setForm({ ...form, socialCtaText: e.target.value })} /></div>
                        </div>

                        <div className="admin-card">
                            <h3>Publications mises en avant (Page d&apos;accueil)</h3>
                            <p className="form-hint" style={{ marginBottom: 16 }}>
                                Ajoutez ci-dessous les <strong>liens</strong> vers vos publications sur les réseaux sociaux
                                (Instagram, Facebook, YouTube, TikTok, LinkedIn). Elles défileront automatiquement sur la page d&apos;accueil.
                            </p>

                            {(form.featuredPostUrls || []).map((url, i) => (
                                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                                    <span style={{ color: '#9ca3af', fontSize: '0.85rem', minWidth: 20 }}>{i + 1}.</span>
                                    <input
                                        value={url}
                                        onChange={e => {
                                            const newUrls = [...(form.featuredPostUrls || [])];
                                            newUrls[i] = e.target.value;
                                            setForm({ ...form, featuredPostUrls: newUrls });
                                        }}
                                        placeholder="Collez le lien de la publication ici (ex: https://www.instagram.com/p/...)"
                                        style={{ flex: 1, fontSize: '0.9rem' }}
                                    />
                                    <button
                                        className="wp-btn-icon wp-btn-icon-danger"
                                        title="Supprimer"
                                        onClick={() => {
                                            const newUrls = (form.featuredPostUrls || []).filter((_, idx) => idx !== i);
                                            setForm({ ...form, featuredPostUrls: newUrls });
                                        }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                            <button
                                className="wp-btn wp-btn-sm"
                                style={{ marginTop: 8 }}
                                onClick={() => setForm({ ...form, featuredPostUrls: [...(form.featuredPostUrls || []), ''] })}
                            >
                                + Ajouter une publication
                            </button>

                            {/* Section Avancé — Import API */}
                            <details style={{ marginTop: 24, borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>
                                <summary style={{ cursor: 'pointer', fontWeight: 600, color: '#6b7280', fontSize: '0.9rem', marginBottom: 12 }}>
                                    ⚙️ Import automatique (avancé — nécessite des clés API)
                                </summary>
                                <p className="form-hint" style={{ marginBottom: 16 }}>
                                    Ces outils permettent d&apos;importer automatiquement vos dernières publications depuis les réseaux sociaux.
                                    Ils nécessitent des clés API techniques. Contactez votre webmaster si vous avez besoin d&apos;aide.
                                </p>

                                {/* Auto Sync Section Instagram */}
                                <div style={{ background: '#f0f9ff', padding: 16, borderRadius: 8, marginBottom: 20, border: '1px solid #bae6fd' }}>
                                    <h4 style={{ margin: '0 0 4px 0', color: '#0284c7', display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontSize: '1.2em' }}>📸</span> Synchronisation automatique Instagram
                                    </h4>
                                    <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: 12 }}>
                                        Les posts s&apos;actualisent toutes les 2h automatiquement. Le token est renouvelé chaque 1er du mois.
                                    </p>
                                    <div className="form-group">
                                        <label style={{ fontSize: '0.9rem' }}>Token d&apos;accès Instagram (long-lived)</label>
                                        <input
                                            value={form.instagramAccessToken || ''}
                                            onChange={e => setForm({ ...form, instagramAccessToken: e.target.value })}
                                            placeholder="IGAAB... (collez votre token ici)"
                                            style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
                                        />
                                        <span className="form-hint">
                                            Obtenez-le depuis <a href="https://developers.facebook.com" target="_blank" rel="noopener" style={{ color: '#0284c7' }}>Meta for Developers</a> → votre app Instagram → Token d&apos;accès utilisateur.
                                        </span>
                                    </div>
                                    {form.instagramLastSync && (
                                        <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 8 }}>
                                            Dernier sync : {new Date(form.instagramLastSync).toLocaleString('fr-FR')}
                                        </p>
                                    )}
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button
                                            className="wp-btn"
                                            style={{ background: '#0ea5e9', color: 'white', flex: 1, opacity: instaSync === 'loading' ? 0.6 : 1 }}
                                            disabled={instaSync === 'loading' || !form.instagramAccessToken}
                                            onClick={async () => {
                                                await new Promise<void>(r => { setSettings({ ...settings, instagramAccessToken: form.instagramAccessToken }); setTimeout(r, 500); });
                                                handleInstagramSync();
                                            }}
                                        >
                                            {instaSync === 'loading' ? '⏳ Synchronisation...' : '🔄 Sync maintenant'}
                                        </button>
                                    </div>
                                    {instaSyncMsg && (
                                        <p style={{ marginTop: 8, fontSize: '0.85rem', color: instaSync === 'ok' ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                                            {instaSyncMsg}
                                        </p>
                                    )}
                                </div>

                                {/* Auto Import Section Facebook */}
                                <div style={{ background: '#eff6ff', padding: 16, borderRadius: 8, marginBottom: 20, border: '1px solid #dbeafe' }}>
                                    <h4 style={{ margin: '0 0 12px 0', color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontSize: '1.2em' }}>📘</span> Import Automatique Facebook
                                    </h4>
                                    <div className="form-group">
                                        <label style={{ fontSize: '0.9rem' }}>ID de la Page Facebook</label>
                                        <input
                                            value={form.facebookPageId || ''}
                                            onChange={e => setForm({ ...form, facebookPageId: e.target.value })}
                                            placeholder="Ex: 1029384756..."
                                            style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label style={{ fontSize: '0.9rem' }}>Token d&apos;accès Page Facebook</label>
                                        <input
                                            value={form.facebookAccessToken || ''}
                                            onChange={e => setForm({ ...form, facebookAccessToken: e.target.value })}
                                            placeholder="Collez le token ici..."
                                            style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
                                        />
                                    </div>
                                    <button
                                        className="wp-btn"
                                        style={{ background: '#2563eb', color: 'white', width: '100%' }}
                                        disabled={!form.facebookAccessToken || !form.facebookPageId}
                                        onClick={async () => {
                                            if (!form.facebookAccessToken || !form.facebookPageId) return;
                                            const btn = document.getElementById('btn-fb-sync');
                                            if (btn) btn.textContent = 'Chargement...';

                                            try {
                                                const res = await fetch(`https://graph.facebook.com/v19.0/${form.facebookPageId}/posts?fields=permalink_url,message,full_picture&access_token=${form.facebookAccessToken}&limit=5`);
                                                const data = await res.json();

                                                if (data.error) throw new Error(data.error.message);

                                                if (data.data && Array.isArray(data.data)) {
                                                    const newUrls = data.data.map((post: any) => post.permalink_url);
                                                    if (confirm(`Trouvé ${newUrls.length} posts Facebook. Voulez-vous les AJOUTER à la liste actuelle ?`)) {
                                                        setForm({ ...form, featuredPostUrls: [...(form.featuredPostUrls || []), ...newUrls] });
                                                        setToast(`✓ ${newUrls.length} posts ajoutés !`);
                                                    }
                                                } else {
                                                    alert("Aucun post trouvé ou format inattendu.");
                                                }
                                            } catch (e: any) {
                                                console.error(e);
                                                alert(`Erreur : ${e.message}`);
                                            } finally {
                                                if (btn) btn.textContent = '🔄 Importer les 5 derniers posts';
                                            }
                                        }}
                                    >
                                        <span id="btn-fb-sync">🔄 Importer les 5 derniers posts</span>
                                    </button>
                                </div>

                                {/* Auto Import Section YouTube */}
                                <div style={{ background: '#fef2f2', padding: 16, borderRadius: 8, marginBottom: 20, border: '1px solid #fee2e2' }}>
                                    <h4 style={{ margin: '0 0 12px 0', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontSize: '1.2em' }}>📺</span> Import Automatique YouTube
                                    </h4>
                                    <div className="form-group">
                                        <label style={{ fontSize: '0.9rem' }}>ID de la Chaîne YouTube</label>
                                        <input
                                            value={form.youtubeChannelId || ''}
                                            onChange={e => setForm({ ...form, youtubeChannelId: e.target.value })}
                                            placeholder="UC-..."
                                            style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label style={{ fontSize: '0.9rem' }}>Clé API YouTube</label>
                                        <input
                                            value={form.youtubeApiKey || ''}
                                            onChange={e => setForm({ ...form, youtubeApiKey: e.target.value })}
                                            placeholder="Collez la clé ici..."
                                            style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
                                        />
                                    </div>
                                    <button
                                        className="wp-btn"
                                        style={{ background: '#dc2626', color: 'white', width: '100%' }}
                                        disabled={!form.youtubeApiKey || !form.youtubeChannelId}
                                        onClick={async () => {
                                            if (!form.youtubeApiKey || !form.youtubeChannelId) return;
                                            const btn = document.getElementById('btn-yt-sync');
                                            if (btn) btn.textContent = 'Chargement...';

                                            try {
                                                const res = await fetch(`https://www.googleapis.com/youtube/v3/search?key=${form.youtubeApiKey}&channelId=${form.youtubeChannelId}&part=snippet,id&order=date&maxResults=5&type=video`);
                                                const data = await res.json();

                                                if (data.error) throw new Error(data.error.message);

                                                if (data.items && Array.isArray(data.items)) {
                                                    const newUrls = data.items.map((item: any) => `https://www.youtube.com/watch?v=${item.id.videoId}`);
                                                    if (confirm(`Trouvé ${newUrls.length} vidéos. Voulez-vous les AJOUTER à la liste actuelle ?`)) {
                                                        setForm({ ...form, featuredPostUrls: [...(form.featuredPostUrls || []), ...newUrls] });
                                                        setToast(`✓ ${newUrls.length} vidéos ajoutées !`);
                                                    }
                                                } else {
                                                    alert("Aucune vidéo trouvée.");
                                                }
                                            } catch (e: any) {
                                                console.error(e);
                                                alert(`Erreur : ${e.message}`);
                                            } finally {
                                                if (btn) btn.textContent = '🔄 Importer les 5 dernières vidéos';
                                            }
                                        }}
                                    >
                                        <span id="btn-yt-sync">🔄 Importer les 5 dernières vidéos</span>
                                    </button>
                                </div>

                                {/* TikTok Hint */}
                                <div style={{ background: '#f0fff4', padding: 16, borderRadius: 8, marginBottom: 8, border: '1px solid #bbf7d0' }}>
                                    <h4 style={{ margin: '0 0 8px 0', color: '#166534', display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontSize: '1.2em' }}>🎵</span> TikTok
                                    </h4>
                                    <p className="form-hint" style={{ color: '#14532d', margin: 0 }}>
                                        Pour ajouter un TikTok, copiez simplement le <strong>lien</strong> de la vidéo dans la liste des publications ci-dessus. Pas besoin de clé API !
                                    </p>
                                </div>
                            </details>
                        </div>

                        <div className="admin-card">
                            <h3>Liens Profils (Pied de page)</h3>
                            <div className="form-group">
                                <label>Facebook</label>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <input value={form.facebookUrl} onChange={e => setForm({ ...form, facebookUrl: e.target.value })} placeholder="https://facebook.com/..." />
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                                        <input type="checkbox" checked={form.socialVisibility?.facebook} onChange={e => setForm({ ...form, socialVisibility: { ...form.socialVisibility, facebook: e.target.checked } })} />
                                        Actif
                                    </label>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Instagram</label>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <input value={form.instagramUrl} onChange={e => setForm({ ...form, instagramUrl: e.target.value })} placeholder="https://instagram.com/..." />
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                                        <input type="checkbox" checked={form.socialVisibility?.instagram} onChange={e => setForm({ ...form, socialVisibility: { ...form.socialVisibility, instagram: e.target.checked } })} />
                                        Actif
                                    </label>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>LinkedIn</label>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <input value={form.linkedinUrl} onChange={e => setForm({ ...form, linkedinUrl: e.target.value })} placeholder="https://linkedin.com/..." />
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                                        <input type="checkbox" checked={form.socialVisibility?.linkedin} onChange={e => setForm({ ...form, socialVisibility: { ...form.socialVisibility, linkedin: e.target.checked } })} />
                                        Actif
                                    </label>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>YouTube</label>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <input value={form.youtubeUrl} onChange={e => setForm({ ...form, youtubeUrl: e.target.value })} placeholder="https://youtube.com/..." />
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                                        <input type="checkbox" checked={form.socialVisibility?.youtube} onChange={e => setForm({ ...form, socialVisibility: { ...form.socialVisibility, youtube: e.target.checked } })} />
                                        Actif
                                    </label>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>TikTok</label>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <input value={form.tiktokUrl} onChange={e => setForm({ ...form, tiktokUrl: e.target.value })} placeholder="https://tiktok.com/@..." />
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                                        <input type="checkbox" checked={form.socialVisibility?.tiktok} onChange={e => setForm({ ...form, socialVisibility: { ...form.socialVisibility, tiktok: e.target.checked } })} />
                                        Actif
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="admin-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <h3>Fil d&apos;Actualité (Scroll manuel)</h3>
                                <button
                                    className="wp-btn wp-btn-sm"
                                    style={{ background: '#f1f5f9', color: '#64748b' }}
                                    onClick={() => {
                                        if (confirm("Réinitialiser le fil d'actualité avec les vrais derniers posts ? Cela supprimera vos modifications manuelles.")) {
                                            localStorage.removeItem('social-posts');
                                            window.location.reload();
                                        }
                                    }}
                                >
                                    🔄 Réinitialiser par défaut
                                </button>
                            </div>
                            <p className="form-hint">Ajoutez ici les posts qui défileront sur la page d&apos;accueil.</p>

                            <div className="wp-form-row" style={{ alignItems: 'flex-start', marginBottom: 24, background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0', flexDirection: 'column' }}>
                                <div style={{ width: '100%', display: 'flex', gap: '16px', alignItems: 'flex-end', marginBottom: '16px' }}>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label>Lien du Post (URL) <span style={{ color: '#ef4444' }}>*</span></label>
                                        <input
                                            value={newPost.postUrl}
                                            onChange={e => setNewPost({ ...newPost, postUrl: e.target.value })}
                                            placeholder="https://..."
                                            onBlur={async () => {
                                                if (!newPost.postUrl) return;
                                                try {
                                                    const res = await fetch(`/api/fetch-metadata?url=${encodeURIComponent(newPost.postUrl)}`);
                                                    const data = await res.json();
                                                    if (data.error) throw new Error(data.error);

                                                    let platform = newPost.platform;
                                                    if (newPost.postUrl.includes('facebook')) platform = 'facebook';
                                                    else if (newPost.postUrl.includes('instagram')) platform = 'instagram';
                                                    else if (newPost.postUrl.includes('linkedin')) platform = 'linkedin';
                                                    else if (newPost.postUrl.includes('youtube') || newPost.postUrl.includes('youtu.be')) platform = 'youtube';

                                                    setNewPost(prev => ({
                                                        ...prev,
                                                        platform,
                                                        content: data.description || data.title || prev.content,
                                                        imageUrl: data.image || prev.imageUrl || '',
                                                        date: data.date || prev.date
                                                    }));
                                                    setToast('✓ Informations récupérées !');
                                                } catch (e) {
                                                    console.error(e);
                                                    // Don't alert aggressively on blur, just log
                                                }
                                            }}
                                        />
                                        <p className="form-hint">Collez le lien et cliquez à côté, nous tenterons de récupérer les infos automatiquement.</p>
                                    </div>
                                    <button
                                        className="wp-btn wp-btn-secondary"
                                        onClick={async () => {
                                            if (!newPost.postUrl) return alert('Veuillez entrer une URL');
                                            try {
                                                setToast('⏳ Récupération...');
                                                const res = await fetch(`/api/fetch-metadata?url=${encodeURIComponent(newPost.postUrl)}`);
                                                const data = await res.json();
                                                if (data.error) throw new Error(data.error);

                                                let platform = newPost.platform;
                                                if (newPost.postUrl.includes('facebook')) platform = 'facebook';
                                                else if (newPost.postUrl.includes('instagram')) platform = 'instagram';
                                                else if (newPost.postUrl.includes('linkedin')) platform = 'linkedin';
                                                else if (newPost.postUrl.includes('youtube') || newPost.postUrl.includes('youtu.be')) platform = 'youtube';

                                                setNewPost(prev => ({
                                                    ...prev,
                                                    platform,
                                                    content: data.description || data.title || '',
                                                    imageUrl: data.image || '/img/placeholder-social.jpg',
                                                    date: data.date || prev.date
                                                }));
                                                setToast('✓ Informations récupérées !');
                                            } catch (e) {
                                                alert("Impossible de récupérer les infos automatiquement. Merci de remplir les champs manuellement.");
                                            }
                                        }}
                                        style={{ height: '42px', marginBottom: '24px' }}
                                    >
                                        🪄 Remplir auto
                                    </button>
                                </div>

                                <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <div className="form-group">
                                            <label>Plateforme</label>
                                            <select value={newPost.platform} onChange={e => setNewPost({ ...newPost, platform: e.target.value as any })}>
                                                <option value="facebook">Facebook</option>
                                                <option value="instagram">Instagram</option>
                                                <option value="linkedin">LinkedIn</option>
                                                <option value="youtube">YouTube</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Date de publication <span style={{ color: '#ef4444' }}>*</span></label>
                                            <input type="date" value={newPost.date} onChange={e => setNewPost({ ...newPost, date: e.target.value })} required />
                                            <p className="form-hint">Sert à trier les posts du plus récent au plus ancien.</p>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Image du post</label>
                                        <ImageUpload
                                            value={newPost.imageUrl}
                                            onChange={v => setNewPost({ ...newPost, imageUrl: v })}
                                            label=""
                                            hint="Uploadez l'image ou collez une URL ci-dessous"
                                            folder="social"
                                        />
                                        <input
                                            value={newPost.imageUrl}
                                            onChange={e => setNewPost({ ...newPost, imageUrl: e.target.value })}
                                            placeholder="Ou collez une URL d'image..."
                                            style={{ marginTop: 4, fontSize: '0.8rem' }}
                                        />
                                    </div>
                                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                        <label>Contenu du post</label>
                                        <textarea value={newPost.content} onChange={e => setNewPost({ ...newPost, content: e.target.value })} rows={3} placeholder="Texte du post..." />
                                    </div>
                                </div>

                                <button className="wp-btn wp-btn-primary" onClick={handleAddPost} disabled={!newPost.content || !newPost.postUrl} style={{ marginTop: '16px', alignSelf: 'flex-end' }}>+ Ajouter au flux</button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                                {socialPosts.map(post => (
                                    <div key={post.id} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, background: '#fff' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                            <span className={`wp-badge ${post.platform === 'linkedin' ? 'wp-badge-info' :
                                                post.platform === 'instagram' ? 'wp-badge-warning' :
                                                    post.platform === 'youtube' ? 'wp-badge-danger' :
                                                        'wp-badge-primary'
                                                }`} style={{ textTransform: 'capitalize' }}>
                                                {post.platform}
                                            </span>
                                            <div className="wp-action-btns">
                                                <button
                                                    className="wp-btn-icon"
                                                    title="Mettre à jour"
                                                    onClick={async () => {
                                                        try {
                                                            const btn = document.getElementById(`refresh-${post.id}`);
                                                            if (btn) btn.classList.add('spin');
                                                            const res = await fetch(`/api/fetch-metadata?url=${encodeURIComponent(post.postUrl)}`);
                                                            const data = await res.json();
                                                            if (data.error) throw new Error(data.error);

                                                            updateSocialPost(post.id, {
                                                                content: data.description || data.title || post.content,
                                                                imageUrl: data.image || post.imageUrl
                                                            });
                                                            setToast('✓ Post mis à jour !');
                                                        } catch (e) {
                                                            console.error(e);
                                                            setToast('❌ Erreur mise à jour');
                                                        } finally {
                                                            const btn = document.getElementById(`refresh-${post.id}`);
                                                            if (btn) btn.classList.remove('spin');
                                                        }
                                                    }}
                                                >
                                                    <span id={`refresh-${post.id}`}>🔄</span>
                                                </button>
                                                <button className="wp-btn-icon wp-btn-icon-danger" onClick={() => deleteSocialPost(post.id)}>✕</button>
                                            </div>
                                        </div>
                                        <p style={{ fontSize: '0.9rem', marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.content}</p>
                                        {post.platform === 'instagram' && post.postUrl ? (
                                            <div style={{ pointerEvents: 'none', height: 200, overflow: 'hidden' }}>
                                                <SocialPostEmbed url={post.postUrl} slim={true} />
                                            </div>
                                        ) : (
                                            post.imageUrl && <img src={post.imageUrl} alt="preview" style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 4 }} />
                                        )}
                                        <input type="date" value={post.date || ''} onChange={e => updateSocialPost(post.id, { date: e.target.value })} style={{ marginTop: 8, padding: '4px', border: '1px solid #e2e8f0', borderRadius: '4px', color: '#64748b', fontSize: '0.8rem', outline: 'none', background: 'transparent' }} title="Modifier la date" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )
            }

            {
                activeTab === 'ticker' && (
                    <div className="admin-card">
                        <h3>Bandeau défilant (Ticker)</h3>
                        <p className="form-hint" style={{ marginBottom: 16 }}>Messages affichés dans le bandeau en haut de la page d&apos;accueil</p>
                        {form.tickerMessages.map((msg, i) => (
                            <div key={i} className="wp-ticker-item">
                                <span>{msg}</span>
                                <button className="wp-btn-icon wp-btn-icon-danger" onClick={() => removeTicker(i)}>✕</button>
                            </div>
                        ))}
                        <div className="wp-ticker-add">
                            <input value={tickerInput} onChange={e => setTickerInput(e.target.value)} placeholder="Nouveau message..." onKeyDown={e => e.key === 'Enter' && addTicker()} />
                            <button className="wp-btn wp-btn-primary" onClick={addTicker}>+ Ajouter</button>
                        </div>
                    </div>
                )
            }

            {toast && <Toast message={toast} onClose={() => setToast('')} />}
        </>
    );
}

/* =============================================
   ADMINS VIEW — Super admin panel
   ============================================= */
const ALL_PERMISSIONS: { key: keyof AdminUser['permissions']; label: string }[] = [
    { key: 'articles', label: 'Articles' },
    { key: 'events', label: 'Événements' },
    { key: 'team', label: 'Équipe' },
    { key: 'activities', label: 'Activités' },
    { key: 'partners', label: 'Partenaires' },
    { key: 'results', label: 'Résultats' },
    { key: 'pages', label: 'Pages' },
    { key: 'planning', label: 'Planning' },
    { key: 'pricing', label: 'Tarifs' },
    { key: 'settings', label: 'Réglages' },
    { key: 'admins', label: 'Admins' },
];

const DEFAULT_PERMISSIONS: AdminUser['permissions'] = {
    articles: true, events: true, team: true, activities: true,
    partners: false, results: true, pages: false,
    planning: false, pricing: false, settings: false, admins: false,
};

/* =============================================
   MAINTENANCE VIEW — Compression d'images bulk
   ============================================= */
function MaintenanceView() {
    const { articles, partners, team, activities, customPages, socialPosts, settings, setSettings,
        setArticles, setPartners, setTeam, setActivities, setCustomPages, setSocialPosts } = useData();
    const [scanning, setScanning] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [imageUrls, setImageUrls] = useState<Array<{ url: string; field: string; size?: number }>>([]);
    const [progress, setProgress] = useState<{ current: number; total: number; savedKb: number; errors: string[] }>({ current: 0, total: 0, savedKb: 0, errors: [] });
    const [toast, setToast] = useState('');

    const isFirebaseStorageUrl = (u: any): u is string => {
        return typeof u === 'string' && u.includes('firebasestorage.googleapis.com');
    };

    const scanImages = () => {
        setScanning(true);
        const found: Array<{ url: string; field: string }> = [];
        // Settings logo
        if (isFirebaseStorageUrl(settings.logo)) found.push({ url: settings.logo!, field: 'settings.logo' });
        // Articles
        articles.forEach(a => {
            if (isFirebaseStorageUrl(a.image)) found.push({ url: a.image!, field: `articles[${a.id}].image` });
            (a.images || []).forEach((img, i) => {
                if (isFirebaseStorageUrl(img)) found.push({ url: img, field: `articles[${a.id}].images[${i}]` });
            });
        });
        // Partners
        partners.forEach(p => {
            if (isFirebaseStorageUrl(p.logo)) found.push({ url: p.logo!, field: `partners[${p.id}].logo` });
        });
        // Team
        team.forEach(m => {
            if (isFirebaseStorageUrl(m.photo)) found.push({ url: m.photo!, field: `team[${m.id}].photo` });
        });
        // Activities
        activities.forEach(act => {
            if (isFirebaseStorageUrl((act as any).image)) found.push({ url: (act as any).image, field: `activities[${act.id}].image` });
        });
        // Social posts
        socialPosts.forEach(sp => {
            if (isFirebaseStorageUrl(sp.imageUrl)) found.push({ url: sp.imageUrl!, field: `socialPosts[${sp.id}].imageUrl` });
        });
        // Custom pages (embedded images in HTML content)
        customPages.forEach(p => {
            const matches = (p.content || '').matchAll(/<img[^>]+src=["']([^"']+)["']/g);
            for (const m of matches) {
                if (isFirebaseStorageUrl(m[1])) found.push({ url: m[1], field: `customPages[${p.id}].content` });
            }
        });

        // Dedupe by URL (same image may be referenced twice)
        const unique = Array.from(new Map(found.map(f => [f.url, f])).values());
        setImageUrls(unique);
        setScanning(false);
        setToast(`✓ ${unique.length} image${unique.length > 1 ? 's' : ''} Firebase Storage trouvée${unique.length > 1 ? 's' : ''}`);
    };

    const compressBlob = (blob: Blob, fileName: string): Promise<{ blob: Blob; type: string }> => {
        if (blob.type === 'image/gif' || blob.type === 'image/svg+xml') return Promise.resolve({ blob, type: blob.type });
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(blob);
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                URL.revokeObjectURL(url);
                const MAX_W = 1920, MAX_H = 1920;
                let { width, height } = img;
                if (width > MAX_W || height > MAX_H) {
                    const ratio = Math.min(MAX_W / width, MAX_H / height);
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) { resolve({ blob, type: blob.type }); return; }
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob(out => {
                    if (!out || out.size >= blob.size) resolve({ blob, type: blob.type });
                    else resolve({ blob: out, type: 'image/jpeg' });
                }, 'image/jpeg', 0.85);
            };
            img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Erreur lecture image')); };
            img.src = url;
        });
    };

    const uploadCompressed = async (blob: Blob, type: string, originalName: string) => {
        const ext = type === 'image/jpeg' ? '.jpg' : (originalName.match(/\.[^.]+$/)?.[0] || '.bin');
        const baseName = originalName.replace(/\.[^.]+$/, '');
        const newName = `${baseName}_compressed_${Date.now()}${ext}`;
        const storageRef = ref(storage!, `uploads/${newName}`);
        await uploadBytes(storageRef, blob, { contentType: type });
        return await getDownloadURL(storageRef);
    };

    const runCompression = async () => {
        if (!confirm(`Compresser ${imageUrls.length} images ? L'opération peut prendre quelques minutes. Les anciennes images resteront sur Storage pour sécurité (à supprimer manuellement après vérification).`)) return;
        setProcessing(true);
        setProgress({ current: 0, total: imageUrls.length, savedKb: 0, errors: [] });

        // Local mutable copies — we'll write back at the end
        let _settings = { ...settings };
        let _articles = articles.map(a => ({ ...a, images: a.images ? [...a.images] : undefined }));
        let _partners = partners.map(p => ({ ...p }));
        let _team = team.map(m => ({ ...m }));
        let _activities = activities.map(a => ({ ...a }));
        let _socialPosts = socialPosts.map(s => ({ ...s }));
        let _customPages = customPages.map(p => ({ ...p }));

        let savedTotalKb = 0;
        const errors: string[] = [];

        for (let i = 0; i < imageUrls.length; i++) {
            const item = imageUrls[i];
            try {
                const res = await fetch(item.url);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const original = await res.blob();
                const originalKb = original.size / 1024;

                const { blob: compressed, type } = await compressBlob(original, 'image');
                const compressedKb = compressed.size / 1024;

                if (compressed.size >= original.size * 0.95) {
                    // No significant saving — skip
                    setProgress(p => ({ ...p, current: i + 1 }));
                    continue;
                }

                const fileName = item.url.split('/').pop()?.split('?')[0]?.split('%2F').pop() || 'image';
                const newUrl = await uploadCompressed(compressed, type, decodeURIComponent(fileName));
                savedTotalKb += (originalKb - compressedKb);

                // Apply to local mutable copy
                if (item.field === 'settings.logo') _settings.logo = newUrl;
                else if (item.field.startsWith('articles[')) {
                    const m = item.field.match(/articles\[([^\]]+)\]\.(image|images\[(\d+)\])/);
                    if (m) {
                        const aId = m[1];
                        const idx = _articles.findIndex(a => a.id === aId);
                        if (idx >= 0) {
                            if (m[2] === 'image') _articles[idx].image = newUrl;
                            else {
                                const imgIdx = parseInt(m[3]);
                                if (_articles[idx].images) _articles[idx].images![imgIdx] = newUrl;
                            }
                        }
                    }
                } else if (item.field.startsWith('partners[')) {
                    const pId = item.field.match(/partners\[([^\]]+)\]/)?.[1];
                    const idx = _partners.findIndex(p => p.id === pId);
                    if (idx >= 0) _partners[idx].logo = newUrl;
                } else if (item.field.startsWith('team[')) {
                    const tId = item.field.match(/team\[([^\]]+)\]/)?.[1];
                    const idx = _team.findIndex(t => t.id === tId);
                    if (idx >= 0) _team[idx].photo = newUrl;
                } else if (item.field.startsWith('activities[')) {
                    const aId = item.field.match(/activities\[([^\]]+)\]/)?.[1];
                    const idx = _activities.findIndex(a => a.id === aId);
                    if (idx >= 0) (_activities[idx] as any).image = newUrl;
                } else if (item.field.startsWith('socialPosts[')) {
                    const sId = item.field.match(/socialPosts\[([^\]]+)\]/)?.[1];
                    const idx = _socialPosts.findIndex(s => s.id === sId);
                    if (idx >= 0) _socialPosts[idx].imageUrl = newUrl;
                } else if (item.field.startsWith('customPages[')) {
                    const pId = item.field.match(/customPages\[([^\]]+)\]/)?.[1];
                    const idx = _customPages.findIndex(p => p.id === pId);
                    if (idx >= 0) _customPages[idx].content = (_customPages[idx].content || '').split(item.url).join(newUrl);
                }
            } catch (e: any) {
                errors.push(`${item.field} : ${e?.message || 'erreur'}`);
            }
            setProgress(p => ({ ...p, current: i + 1, savedKb: savedTotalKb, errors: [...errors] }));
        }

        // Write back to Firestore
        setSettings(_settings);
        setArticles(_articles);
        setPartners(_partners);
        setTeam(_team);
        setActivities(_activities);
        setSocialPosts(_socialPosts);
        setCustomPages(_customPages);

        setProcessing(false);
        setToast(`✓ Compression terminée. Économie : ${(savedTotalKb / 1024).toFixed(1)} Mo`);
    };

    const pct = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

    return (
        <>
            <div className="admin-header">
                <div>
                    <h1>🛠️ Maintenance</h1>
                    <p className="admin-subtitle">Outils pour optimiser le site et gérer le stockage</p>
                </div>
            </div>

            <div className="admin-card" style={{ marginBottom: 24 }}>
                <h3>📸 Compression d&apos;images existantes</h3>
                <p style={{ color: '#475569', marginBottom: 16, lineHeight: 1.6 }}>
                    Analyse toutes les images stockées sur Firebase Storage du site (articles, partenaires, équipe, etc.) et les compresse pour libérer de l&apos;espace.
                    Réduction typique : <strong>60-90%</strong> sans perte visible. Les images sont redimensionnées max 1920px et passées en JPEG qualité 85%.
                </p>
                <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 8, padding: 14, marginBottom: 16, fontSize: '0.9rem', color: '#92400e' }}>
                    ⚠️ Les <strong>anciennes images</strong> restent sur Storage par sécurité. Vérifiez le site après l&apos;opération puis supprimez-les manuellement via Firebase Console (Storage → uploads).
                </div>

                {imageUrls.length === 0 && !scanning && (
                    <button className="wp-btn wp-btn-primary" onClick={scanImages} disabled={scanning}>
                        🔍 Analyser les images du site
                    </button>
                )}
                {scanning && <p>Analyse en cours…</p>}

                {imageUrls.length > 0 && !processing && progress.total === 0 && (
                    <div>
                        <p style={{ marginBottom: 12 }}>
                            <strong>{imageUrls.length}</strong> images Firebase Storage détectées
                        </p>
                        <div style={{ maxHeight: 200, overflowY: 'auto', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: '0.82rem', fontFamily: 'monospace' }}>
                            {imageUrls.slice(0, 50).map((item, i) => (
                                <div key={i} style={{ padding: '4px 0', borderBottom: '1px solid #f3f4f6', color: '#475569' }}>
                                    <span style={{ color: '#0369a1' }}>{item.field}</span>
                                </div>
                            ))}
                            {imageUrls.length > 50 && <div style={{ padding: '4px 0', color: '#9ca3af' }}>… et {imageUrls.length - 50} autres</div>}
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button className="wp-btn wp-btn-primary" onClick={runCompression}>
                                🚀 Lancer la compression ({imageUrls.length})
                            </button>
                            <button className="wp-btn wp-btn-cancel" onClick={() => { setImageUrls([]); setProgress({ current: 0, total: 0, savedKb: 0, errors: [] }); }}>
                                Annuler
                            </button>
                        </div>
                    </div>
                )}

                {(processing || (progress.total > 0 && !processing)) && (
                    <div>
                        <p style={{ marginBottom: 8 }}>
                            {processing ? '⏳ Compression en cours…' : '✅ Terminé'} — {progress.current} / {progress.total}
                        </p>
                        <div style={{ background: '#e5e7eb', borderRadius: 8, overflow: 'hidden', height: 12, marginBottom: 12 }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #34d399)', transition: 'width 0.3s' }} />
                        </div>
                        <p style={{ fontSize: '0.95rem', color: '#475569' }}>
                            💾 Économie : <strong>{(progress.savedKb / 1024).toFixed(1)} Mo</strong>
                        </p>
                        {progress.errors.length > 0 && (
                            <div style={{ marginTop: 12, padding: 10, background: '#fef2f2', borderRadius: 6, fontSize: '0.85rem' }}>
                                <p style={{ fontWeight: 600, color: '#991b1b', marginBottom: 4 }}>⚠️ {progress.errors.length} erreur(s) :</p>
                                {progress.errors.slice(0, 5).map((err, i) => <div key={i} style={{ color: '#7f1d1d', fontFamily: 'monospace', fontSize: '0.8rem' }}>{err}</div>)}
                            </div>
                        )}
                        {!processing && (
                            <button className="wp-btn" style={{ marginTop: 16 }} onClick={() => { setImageUrls([]); setProgress({ current: 0, total: 0, savedKb: 0, errors: [] }); }}>
                                Fermer
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="admin-card">
                <h3>ℹ️ À propos du quota Firebase Storage</h3>
                <p style={{ color: '#475569', lineHeight: 1.6 }}>
                    Plan gratuit (Spark) : <strong>5 Go de stockage</strong> et <strong>1 Go/jour de téléchargement</strong>.
                    Une fois dépassé, les uploads sont bloqués. Solutions : compresser les images existantes, passer en plan Blaze (pay-as-you-go, ~0,026 $/Go au-delà de la franchise gratuite), ou nettoyer le bucket via Firebase Console.
                </p>
            </div>

            {toast && <Toast message={toast} onClose={() => setToast('')} />}
        </>
    );
}

function AdminsView() {
    const { adminUsers, addAdminUser, updateAdminUser, deleteAdminUser, settings } = useData();
    const { user, isSuperAdmin } = useAuth();
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteLoading, setInviteLoading] = useState(false);
    const [inviteResult, setInviteResult] = useState<{ link?: string; error?: string } | null>(null);
    const [editingPerms, setEditingPerms] = useState<string | null>(null);
    const [tempPerms, setTempPerms] = useState<AdminUser['permissions']>({ ...DEFAULT_PERMISSIONS });
    const [toast, setToast] = useState('');
    const [confirmId, setConfirmId] = useState<string | null>(null);

    const handleInvite = async () => {
        if (!inviteEmail.trim()) return;
        setInviteLoading(true);
        setInviteResult(null);

        const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const baseUrl = window.location.origin;
        const inviteUrl = `${baseUrl}/admin/accept-invite?token=${token}&email=${encodeURIComponent(inviteEmail)}`;

        const newAdmin: AdminUser = {
            id: token,
            email: inviteEmail.trim().toLowerCase(),
            isSuperAdmin: false,
            status: 'invited',
            invitedAt: new Date().toISOString(),
            invitedBy: user?.email || 'super-admin',
            permissions: { ...DEFAULT_PERMISSIONS },
        };
        addAdminUser(newAdmin);

        try {
            const res = await fetch('/api/send-invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: inviteEmail, inviteUrl, clubName: settings.clubName }),
            });
            const data = await res.json();

            if (data.noSmtp) {
                setInviteResult({ link: inviteUrl });
            } else if (data.success) {
                setToast(`✓ Invitation envoyée à ${inviteEmail}`);
                setInviteEmail('');
            } else {
                setInviteResult({ link: inviteUrl, error: "Email non envoyé (configurez SMTP)" });
            }
        } catch {
            setInviteResult({ link: inviteUrl, error: "Email non envoyé — copiez ce lien" });
        } finally {
            setInviteLoading(false);
        }
    };

    const openPerms = (admin: AdminUser) => {
        setEditingPerms(admin.id);
        setTempPerms({ ...DEFAULT_PERMISSIONS, ...admin.permissions });
    };

    const savePerms = () => {
        if (!editingPerms) return;
        updateAdminUser(editingPerms, { permissions: tempPerms });
        setEditingPerms(null);
        setToast('✓ Permissions mises à jour');
    };

    if (!isSuperAdmin) {
        return (
            <div className="admin-header">
                <div>
                    <h1>Administrateurs</h1>
                    <p className="admin-subtitle" style={{ color: '#e63946' }}>⚠️ Accès réservé au super administrateur</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="admin-header">
                <div>
                    <h1>Administrateurs</h1>
                    <p className="admin-subtitle">Gérez les accès et permissions des administrateurs</p>
                </div>
            </div>

            {/* Invite */}
            <div className="admin-card" style={{ marginBottom: 24 }}>
                <h3>📧 Inviter un nouvel administrateur</h3>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginTop: 16 }}>
                    <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                        <label>Adresse email</label>
                        <input
                            type="email"
                            value={inviteEmail}
                            onChange={e => setInviteEmail(e.target.value)}
                            placeholder="prenom.nom@example.com"
                            onKeyDown={e => e.key === 'Enter' && handleInvite()}
                        />
                    </div>
                    <button
                        className="wp-btn wp-btn-primary"
                        onClick={handleInvite}
                        disabled={inviteLoading || !inviteEmail.trim()}
                        style={{ marginBottom: 0 }}
                    >
                        {inviteLoading ? '⏳ Envoi...' : '✉️ Inviter'}
                    </button>
                </div>

                {inviteResult && (
                    <div style={{ marginTop: 16, background: inviteResult.error ? '#fffbeb' : '#f0fdf4', border: `1px solid ${inviteResult.error ? '#fcd34d' : '#86efac'}`, borderRadius: 8, padding: 16 }}>
                        {inviteResult.error && <p style={{ color: '#92400e', marginBottom: 8, fontSize: '0.9rem' }}>⚠️ {inviteResult.error}</p>}
                        <p style={{ fontSize: '0.85rem', color: '#374151', marginBottom: 8 }}>Partagez ce lien avec la personne invitée :</p>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <input
                                value={inviteResult.link}
                                readOnly
                                style={{ flex: 1, padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.8rem', fontFamily: 'monospace', background: '#f9fafb' }}
                            />
                            <button
                                className="wp-btn"
                                onClick={() => { navigator.clipboard.writeText(inviteResult.link!); setToast('✓ Lien copié !'); }}
                            >
                                📋 Copier
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* List */}
            <div className="admin-card">
                <h3>👥 Administrateurs ({adminUsers.length})</h3>
                <table className="admin-table" style={{ marginTop: 16 }}>
                    <thead>
                        <tr>
                            <th>Email</th>
                            <th>Rôle</th>
                            <th>Statut</th>
                            <th>Invité le</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {adminUsers.map(admin => (
                            <tr key={admin.id}>
                                <td><strong>{admin.email}</strong></td>
                                <td>
                                    {admin.isSuperAdmin
                                        ? <span className="wp-badge" style={{ background: '#fef3c7', color: '#92400e' }}>⭐ Super admin</span>
                                        : <span className="wp-badge" style={{ background: '#e0f2fe', color: '#0369a1' }}>👤 Admin</span>}
                                </td>
                                <td>
                                    <span className={`wp-badge ${admin.status === 'active' ? 'wp-badge-success' : 'wp-badge-draft'}`}>
                                        {admin.status === 'active' ? '✓ Actif' : '⏳ Invité'}
                                    </span>
                                </td>
                                <td style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                                    {new Date(admin.invitedAt).toLocaleDateString('fr-FR')}
                                </td>
                                <td>
                                    <div className="wp-action-btns">
                                        <button className="wp-btn-icon" title="Gérer les permissions" onClick={() => openPerms(admin)}>🔑</button>
                                        {!admin.isSuperAdmin && (
                                            <button
                                                className="wp-btn-icon"
                                                title="Promouvoir super admin"
                                                onClick={() => { if (confirm(`Promouvoir ${admin.email} en super administrateur ?`)) { updateAdminUser(admin.id, { isSuperAdmin: true }); setToast('✓ Promu super admin'); } }}
                                            >⭐</button>
                                        )}
                                        <button className="wp-btn-icon wp-btn-icon-danger" title="Révoquer l'accès" onClick={() => setConfirmId(admin.id)}>🗑️</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {adminUsers.length === 0 && (
                            <tr><td colSpan={5} className="wp-empty-row">Aucun administrateur. Invitez quelqu&apos;un ci-dessus.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Permissions modal */}
            {editingPerms && (
                <Modal title="Gérer les permissions" onClose={() => setEditingPerms(null)}>
                    <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: 20 }}>
                        Sélectionnez les sections auxquelles cet administrateur a accès.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        {ALL_PERMISSIONS.map(({ key, label }) => (
                            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', cursor: 'pointer', background: tempPerms[key] ? '#f0fdf4' : 'white' }}>
                                <input
                                    type="checkbox"
                                    checked={!!tempPerms[key]}
                                    onChange={e => setTempPerms({ ...tempPerms, [key]: e.target.checked })}
                                />
                                <span style={{ fontWeight: tempPerms[key] ? 600 : 400 }}>{label}</span>
                            </label>
                        ))}
                    </div>
                    <div style={{ marginTop: 16, padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={Object.values(tempPerms).every(Boolean)}
                                onChange={e => {
                                    const all = {} as AdminUser['permissions'];
                                    ALL_PERMISSIONS.forEach(({ key }) => (all[key] = e.target.checked));
                                    setTempPerms(all);
                                }}
                            />
                            <strong>Tout sélectionner / désélectionner</strong>
                        </label>
                    </div>
                    <div className="modal-actions">
                        <button className="wp-btn wp-btn-cancel" onClick={() => setEditingPerms(null)}>Annuler</button>
                        <button className="wp-btn wp-btn-primary" onClick={savePerms}>💾 Sauvegarder</button>
                    </div>
                </Modal>
            )}

            {confirmId && <ConfirmDialog message="Révoquer l'accès de cet administrateur ?" onConfirm={() => { deleteAdminUser(confirmId); setConfirmId(null); setToast('Accès révoqué'); }} onCancel={() => setConfirmId(null)} />}
            {toast && <Toast message={toast} onClose={() => setToast('')} />}
        </>
    );
}

/* =============================================
   MAIN ADMIN
   ============================================= */
export default function AdminDashboard() {
    const { isAuthenticated } = useAuth();
    const router = useRouter();
    const [activeSection, setActiveSection] = useState('dashboard');

    React.useEffect(() => {
        if (!isAuthenticated) { router.push('/admin/login'); }
    }, [isAuthenticated, router]);

    if (!isAuthenticated) return null;

    const renderSection = () => {
        switch (activeSection) {
            case 'dashboard': return <DashboardView onNav={setActiveSection} />;
            case 'articles': return <ArticlesView />;
            case 'events': return <EventsView />;
            case 'team': return <TeamView />;
            case 'activities': return <ActivitiesView />;
            case 'partners': return <PartnersView />;
            case 'results': return <ResultsView />;
            case 'pages': return <PagesView />;
            case 'planning': return <PlanningView />;
            case 'pricing': return <PricingView />;
            case 'settings': return <SettingsView />;
            case 'maintenance': return <MaintenanceView />;
            case 'admins': return <AdminsView />;
            default: return <DashboardView onNav={setActiveSection} />;
        }
    };

    return (
        <div className="admin-layout">
            <AdminSidebar active={activeSection} onNav={setActiveSection} />
            <main className="admin-main">{renderSection()}</main>
        </div>
    );
}
