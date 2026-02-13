'use client';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { useData, Article, Event as Ev, TeamMember, Activity, Partner, CustomPage, Result, ClubRecord, ScheduleItem, PricingItem } from '@/lib/DataContext';
import '@/app/admin.css';

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

    const handleFile = async (file: File) => {
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert("Ce fichier n'est pas une image.");
            return;
        }

        // Limit file size to 5MB client-side check
        if (file.size > 5 * 1024 * 1024) {
            alert("L'image est trop volumineuse (Max 5 Mo).");
            return;
        }

        setUploading(true);
        try {
            const url = await upload(file, folder);
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
    const ref = useRef<HTMLTextAreaElement>(null);

    const wrap = (before: string, after: string) => {
        const ta = ref.current;
        if (!ta) return;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const selected = value.substring(start, end);
        const newVal = value.substring(0, start) + before + selected + after + value.substring(end);
        onChange(newVal);
        setTimeout(() => { ta.focus(); ta.setSelectionRange(start + before.length, end + before.length); }, 0);
    };

    return (
        <div className="wp-richtext">
            <div className="wp-toolbar">
                <button type="button" title="Gras" onClick={() => wrap('<strong>', '</strong>')}>𝗕</button>
                <button type="button" title="Italique" onClick={() => wrap('<em>', '</em>')}>𝘐</button>
                <button type="button" title="Souligné" onClick={() => wrap('<u>', '</u>')}>U̲</button>
                <span className="wp-toolbar-sep" />
                <button type="button" title="Titre H3" onClick={() => wrap('<h3>', '</h3>')}>H3</button>
                <button type="button" title="Paragraphe" onClick={() => wrap('<p>', '</p>')}>¶</button>
                <button type="button" title="Liste" onClick={() => wrap('<ul>\n<li>', '</li>\n</ul>')}>☰</button>
                <span className="wp-toolbar-sep" />
                <button type="button" title="Lien" onClick={() => wrap('<a href="">', '</a>')}>🔗</button>
            </div>
            <textarea ref={ref} value={value} onChange={e => onChange(e.target.value)} rows={rows} placeholder={placeholder} />
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
        { id: 'records', icon: '📈', label: 'Records' },
        { id: 'pages', icon: '📄', label: 'Pages' },
        { id: 'planning', icon: '🗓️', label: 'Planning' },
        { id: 'pricing', icon: '💰', label: 'Tarifs' },
        { id: 'settings', icon: '⚙️', label: 'Réglages' },
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
    const [form, setForm] = useState({ title: '', content: '', excerpt: '', date: '', category: '', image: '', published: true, city: 'Les deux' });
    const [toast, setToast] = useState('');
    const [confirmId, setConfirmId] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');

    const openNew = () => { setEditing(null); setForm({ title: '', content: '', excerpt: '', date: new Date().toISOString().split('T')[0], category: 'Vie du club', image: '', published: true, city: 'Les deux' }); setShowModal(true); };
    const openEdit = (a: Article) => { setEditing(a); setForm({ title: a.title, content: a.content, excerpt: a.excerpt, date: a.date, category: a.category, image: a.image || '', published: a.published, city: a.city || 'Les deux' }); setShowModal(true); };

    const save = () => {
        if (!form.title.trim()) return;
        // Cast city to satisfy TS since form.city is inferred as string
        const data = { ...form, city: form.city as 'Noyal' | 'Nouvoitou' | 'Les deux' };
        if (editing) { updateArticle(editing.id, data); setToast('✓ Article modifié avec succès'); }
        else { addArticle({ ...data, id: Date.now().toString() }); setToast('✓ Article créé avec succès'); }
        setShowModal(false);
    };

    const filtered = filter === 'all' ? articles : articles.filter(a => filter === 'published' ? a.published : !a.published);

    return (
        <>
            <div className="admin-header">
                <div>
                    <h1>Articles</h1>
                    <p className="admin-subtitle">Gérez les actualités de votre club</p>
                </div>
                <button className="wp-btn wp-btn-primary" onClick={openNew}>+ Nouvel article</button>
            </div>

            <div className="wp-filters">
                <button className={`wp-filter ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Tous ({articles.length})</button>
                <button className={`wp-filter ${filter === 'published' ? 'active' : ''}`} onClick={() => setFilter('published')}>Publiés ({articles.filter(a => a.published).length})</button>
                <button className={`wp-filter ${filter === 'draft' ? 'active' : ''}`} onClick={() => setFilter('draft')}>Brouillons ({articles.filter(a => !a.published).length})</button>
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
                                <td><StatusBadge active={a.published} /></td>
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
                            <div className="form-group"><label>Contenu</label><RichTextArea value={form.content} onChange={v => setForm({ ...form, content: v })} placeholder="Rédigez le contenu de l'article ici..." /></div>
                            <div className="form-group"><label>Extrait</label><p className="form-hint">Un résumé court affiché dans les aperçus</p><textarea value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })} rows={2} placeholder="Résumé de l'article en une ou deux phrases..." /></div>
                        </div>
                        <div className="wp-editor-sidebar">
                            <div className="wp-sidebar-box">
                                <h4>Publication</h4>
                                <label className="wp-toggle-label"><input type="checkbox" checked={form.published} onChange={e => setForm({ ...form, published: e.target.checked })} /> Publié</label>
                                <div className="form-group"><label>Date</label><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
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
                                <h4>Image à la une</h4>
                                <ImageUpload value={form.image} onChange={v => setForm({ ...form, image: v })} label="" hint="Apparaît en aperçu sur la liste des actualités" />
                            </div>
                        </div>
                    </div>
                    <div className="modal-actions">
                        <button className="wp-btn wp-btn-cancel" onClick={() => setShowModal(false)}>Annuler</button>
                        <button className="wp-btn wp-btn-primary" onClick={save}>💾 {editing ? 'Mettre à jour' : 'Publier'}</button>
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
    const [form, setForm] = useState({ title: '', date: '', dateEnd: '', location: '', description: '' });
    const [toast, setToast] = useState('');
    const [confirmId, setConfirmId] = useState<string | null>(null);

    const openNew = () => { setEditing(null); setForm({ title: '', date: new Date().toISOString().split('T')[0], dateEnd: '', location: '', description: '' }); setShowModal(true); };
    const openEdit = (e: Ev) => { setEditing(e); setForm({ title: e.title, date: e.date, dateEnd: e.dateEnd || '', location: e.location, description: e.description }); setShowModal(true); };

    const save = () => {
        if (!form.title.trim()) return;
        const eventData = { ...form, dateEnd: form.dateEnd || undefined };
        if (editing) { updateEvent(editing.id, eventData); setToast('✓ Événement modifié'); }
        else { addEvent({ ...eventData, id: Date.now().toString() }); setToast('✓ Événement créé'); }
        setShowModal(false);
    };

    const sortedEvents = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
        <>
            <div className="admin-header">
                <div><h1>Événements</h1><p className="admin-subtitle">Gérez l&apos;agenda de votre club</p></div>
                <button className="wp-btn wp-btn-primary" onClick={openNew}>+ Nouvel événement</button>
            </div>
            <div className="admin-card">
                <table className="admin-table">
                    <thead><tr><th>Titre</th><th>Date</th><th>Lieu</th><th>Actions</th></tr></thead>
                    <tbody>
                        {sortedEvents.map(e => (
                            <tr key={e.id}>
                                <td><strong className="wp-title-link" onClick={() => openEdit(e)}>{e.title}</strong></td>
                                <td>
                                    {new Date(e.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    {e.dateEnd && ` — ${new Date(e.dateEnd).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                                </td>
                                <td>📍 {e.location}</td>
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
    const [form, setForm] = useState({ name: '', role: '', category: 'bureau' as 'bureau' | 'coach', photo: '' });
    const [toast, setToast] = useState('');
    const [tab, setTab] = useState<'bureau' | 'coach'>('bureau');
    const [confirmId, setConfirmId] = useState<string | null>(null);

    const openNew = (cat: 'bureau' | 'coach') => { setEditing(null); setForm({ name: '', role: '', category: cat, photo: '' }); setShowModal(true); };
    const openEdit = (m: TeamMember) => { setEditing(m); setForm({ name: m.name, role: m.role, category: m.category, photo: m.photo || '' }); setShowModal(true); };

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
function ResultsView() {
    const { results, addResult, updateResult, deleteResult } = useData();
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Result | null>(null);
    const [form, setForm] = useState({ competition: '', date: '', discipline: 'piste' as Result['discipline'], location: '', url: '', athletes: [{ name: '', performance: '', category: '', rank: '' }] });
    const [confirmId, setConfirmId] = useState('');
    const [toast, setToast] = useState('');

    const openNew = () => { setEditing(null); setForm({ competition: '', date: new Date().toISOString().split('T')[0], discipline: 'piste', location: '', url: '', athletes: [{ name: '', performance: '', category: '', rank: '' }] }); setShowModal(true); };
    const openEdit = (r: Result) => { setEditing(r); setForm({ competition: r.competition, date: r.date, discipline: r.discipline, location: r.location, url: r.url || '', athletes: r.athletes.map(a => ({ ...a, rank: a.rank || '' })) }); setShowModal(true); };

    const addAthlete = () => setForm({ ...form, athletes: [...form.athletes, { name: '', performance: '', category: '', rank: '' }] });
    const removeAthlete = (i: number) => setForm({ ...form, athletes: form.athletes.filter((_, idx) => idx !== i) });
    const updateAthlete = (i: number, field: string, val: string) => {
        const updated = [...form.athletes];
        (updated[i] as Record<string, string>)[field] = val;
        setForm({ ...form, athletes: updated });
    };

    const save = () => {
        if (!form.competition || !form.date) return;
        const validAthletes = form.athletes.filter(a => a.name && a.performance);
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

                    <h4 style={{ margin: '20px 0 12px', fontSize: '0.95rem' }}>Athlètes</h4>
                    {form.athletes.map((a, i) => (
                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 0.7fr 0.5fr auto', gap: 8, marginBottom: 8, alignItems: 'end' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}><label style={{ fontSize: '0.7rem' }}>Nom</label><input value={a.name} onChange={e => updateAthlete(i, 'name', e.target.value)} placeholder="Nom" /></div>
                            <div className="form-group" style={{ marginBottom: 0 }}><label style={{ fontSize: '0.7rem' }}>Performance</label><input value={a.performance} onChange={e => updateAthlete(i, 'performance', e.target.value)} placeholder="Chrono" /></div>
                            <div className="form-group" style={{ marginBottom: 0 }}><label style={{ fontSize: '0.7rem' }}>Catégorie</label><input value={a.category} onChange={e => updateAthlete(i, 'category', e.target.value)} placeholder="Senior" /></div>
                            <div className="form-group" style={{ marginBottom: 0 }}><label style={{ fontSize: '0.7rem' }}>Classement</label><input value={a.rank} onChange={e => updateAthlete(i, 'rank', e.target.value)} placeholder="3e" /></div>
                            <button className="wp-btn-icon wp-btn-icon-danger" onClick={() => removeAthlete(i)} style={{ marginBottom: 2 }}>✕</button>
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
                    <div className="form-group"><label>Titre Hero</label><input value={pageForm.heroTitle} onChange={e => setPageForm({ ...pageForm, heroTitle: e.target.value })} /></div>
                    <div className="form-group"><label>Sous-titre Hero</label><input value={pageForm.heroSubtitle} onChange={e => setPageForm({ ...pageForm, heroSubtitle: e.target.value })} /></div>

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
    const { settings, setSettings, socialPosts, addSocialPost, deleteSocialPost } = useData();
    const [form, setForm] = useState(settings);
    useEffect(() => setForm(settings), [settings]);
    const [toast, setToast] = useState('');
    const [tickerInput, setTickerInput] = useState('');
    const [activeTab, setActiveTab] = useState('general');

    // New state for adding social post
    const [newPost, setNewPost] = useState({ platform: 'facebook', content: '', imageUrl: '', postUrl: '' });

    const handleAddPost = () => {
        if (!newPost.content) return;
        addSocialPost({
            id: Date.now().toString(),
            platform: newPost.platform as 'facebook' | 'instagram' | 'linkedin' | 'youtube',
            content: newPost.content,
            imageUrl: newPost.imageUrl,
            postUrl: newPost.postUrl,
            date: new Date().toISOString().split('T')[0]
        });
        setNewPost({ platform: 'facebook', content: '', imageUrl: '', postUrl: '' });
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
                    { id: 'records', label: '⚡ Records' },
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
                        <div className="form-group"><label>Sous-titre</label><input value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })} /></div>
                    </div>
                    <div className="form-group"><label>Adresse</label><input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
                </div>
            )}

            {activeTab === 'hero' && (
                <>
                    <div className="admin-card">
                        <h3>Section Hero (bannière d&apos;accueil)</h3>
                        <div className="form-group"><label>Badge (haut de page)</label><input value={form.heroBadge} onChange={e => setForm({ ...form, heroBadge: e.target.value })} /></div>
                        <div className="form-group"><label>Sous-titre du Hero</label><textarea value={form.heroSubtitle} onChange={e => setForm({ ...form, heroSubtitle: e.target.value })} rows={3} /></div>
                        <div className="form-group"><label>Nombre de licenciés affiché</label><input type="number" value={form.licencies} onChange={e => setForm({ ...form, licencies: parseInt(e.target.value) || 0 })} /></div>
                        <ImageUpload value={form.heroImage || ''} onChange={v => setForm({ ...form, heroImage: v })} label="Image de fond du Hero" hint="Si vide, la photo d'équipe par défaut sera utilisée" />
                    </div>
                    <div className="admin-card">
                        <h3>Section « Qui sommes-nous »</h3>
                        <div className="form-group"><label>Texte de présentation</label><textarea value={form.aboutText} onChange={e => setForm({ ...form, aboutText: e.target.value })} rows={5} /></div>
                        <ImageUpload value={form.aboutImage || ''} onChange={v => setForm({ ...form, aboutImage: v })} label="Photo de la section" hint="Si vide, la photo d'équipe par défaut sera utilisée" />
                    </div>
                    <div className="admin-card">
                        <h3>Section &quot;Rejoignez-nous&quot; (CTA bas de page d&apos;accueil)</h3>
                        <div className="form-group"><label>Titre</label><input value={form.ctaTitle} onChange={e => setForm({ ...form, ctaTitle: e.target.value })} /></div>
                        <div className="form-group"><label>Texte</label><textarea value={form.ctaText} onChange={e => setForm({ ...form, ctaText: e.target.value })} rows={2} /></div>
                    </div>
                </>
            )}

            {activeTab === 'club' && (
                <div className="admin-card">
                    <h3>Page Club</h3>
                    <div className="form-group"><label>Titre Hero</label><input value={form.clubPage.heroTitle} onChange={e => setForm({ ...form, clubPage: { ...form.clubPage, heroTitle: e.target.value } })} /></div>
                    <div className="form-group"><label>Sous-titre Hero</label><input value={form.clubPage.heroSubtitle} onChange={e => setForm({ ...form, clubPage: { ...form.clubPage, heroSubtitle: e.target.value } })} /></div>
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
                    <div className="form-group"><label>Titre CTA</label><input value={form.clubPage.ctaTitle} onChange={e => setForm({ ...form, clubPage: { ...form.clubPage, ctaTitle: e.target.value } })} /></div>
                    <div className="form-group"><label>Texte CTA</label><input value={form.clubPage.ctaText} onChange={e => setForm({ ...form, clubPage: { ...form.clubPage, ctaText: e.target.value } })} /></div>

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
                    <div className="form-group"><label>Titre Hero</label><input value={form.activitesPage.heroTitle} onChange={e => setForm({ ...form, activitesPage: { ...form.activitesPage, heroTitle: e.target.value } })} /></div>
                    <div className="form-group"><label>Sous-titre Hero</label><input value={form.activitesPage.heroSubtitle} onChange={e => setForm({ ...form, activitesPage: { ...form.activitesPage, heroSubtitle: e.target.value } })} /></div>
                    <div className="form-group"><label>Titre Planning</label><input value={form.activitesPage.planningTitle} onChange={e => setForm({ ...form, activitesPage: { ...form.activitesPage, planningTitle: e.target.value } })} /></div>
                    <div className="form-group"><label>Sous-titre Planning</label><textarea value={form.activitesPage.planningSubtitle} onChange={e => setForm({ ...form, activitesPage: { ...form.activitesPage, planningSubtitle: e.target.value } })} rows={2} /></div>
                    <div className="form-group"><label>Info Lieux Planning</label><input value={form.activitesPage.planningLocation} onChange={e => setForm({ ...form, activitesPage: { ...form.activitesPage, planningLocation: e.target.value } })} /></div>
                </div>
            )}

            {activeTab === 'articles' && (
                <div className="admin-card">
                    <h3>Page Actualités</h3>
                    <div className="form-group"><label>Titre Hero</label><input value={form.actualitesPage.heroTitle} onChange={e => setForm({ ...form, actualitesPage: { ...form.actualitesPage, heroTitle: e.target.value } })} /></div>
                    <div className="form-group"><label>Sous-titre Hero</label><input value={form.actualitesPage.heroSubtitle} onChange={e => setForm({ ...form, actualitesPage: { ...form.actualitesPage, heroSubtitle: e.target.value } })} /></div>
                </div>
            )}

            {activeTab === 'agenda' && (
                <div className="admin-card">
                    <h3>Page Agenda</h3>
                    <div className="form-group"><label>Titre Hero</label><input value={form.agendaPage.heroTitle} onChange={e => setForm({ ...form, agendaPage: { ...form.agendaPage, heroTitle: e.target.value } })} /></div>
                    <div className="form-group"><label>Sous-titre Hero</label><input value={form.agendaPage.heroSubtitle} onChange={e => setForm({ ...form, agendaPage: { ...form.agendaPage, heroSubtitle: e.target.value } })} /></div>
                </div>
            )}

            {activeTab === 'results' && (
                <div className="admin-card">
                    <h3>Page Résultats</h3>
                    <div className="form-group"><label>Titre Hero (HTML autorisé)</label><input value={form.resultatsPage.heroTitle} onChange={e => setForm({ ...form, resultatsPage: { ...form.resultatsPage, heroTitle: e.target.value } })} /></div>
                    <div className="form-group"><label>Sous-titre Hero</label><input value={form.resultatsPage.heroSubtitle} onChange={e => setForm({ ...form, resultatsPage: { ...form.resultatsPage, heroSubtitle: e.target.value } })} /></div>
                    <div className="form-group"><label>Titre 'Derniers résultats'</label><input value={form.resultatsPage.latestTitle} onChange={e => setForm({ ...form, resultatsPage: { ...form.resultatsPage, latestTitle: e.target.value } })} /></div>
                </div>
            )}

            {activeTab === 'records' && (
                <div className="admin-card">
                    <h3>Page Records</h3>
                    <div className="form-group"><label>Titre Hero (HTML autorisé)</label><input value={form.recordsPage.heroTitle} onChange={e => setForm({ ...form, recordsPage: { ...form.recordsPage, heroTitle: e.target.value } })} /></div>
                    <div className="form-group"><label>Sous-titre Hero</label><input value={form.recordsPage.heroSubtitle} onChange={e => setForm({ ...form, recordsPage: { ...form.recordsPage, heroSubtitle: e.target.value } })} /></div>
                </div>
            )}

            {activeTab === 'partners' && (
                <>
                    <div className="admin-card">
                        <h3>En-tête de page</h3>
                        <div className="form-group"><label>Titre (HTML autorisé)</label><input value={form.partnersPage.heroTitle} onChange={e => setForm({ ...form, partnersPage: { ...form.partnersPage, heroTitle: e.target.value } })} /></div>
                        <div className="form-group"><label>Sous-titre</label><textarea value={form.partnersPage.heroSubtitle} onChange={e => setForm({ ...form, partnersPage: { ...form.partnersPage, heroSubtitle: e.target.value } })} rows={3} /></div>
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
                    <div className="form-group"><label>Titre Hero</label><input value={form.contactPage.heroTitle} onChange={e => setForm({ ...form, contactPage: { ...form.contactPage, heroTitle: e.target.value } })} /></div>
                    <div className="form-group"><label>Sous-titre Hero</label><input value={form.contactPage.heroSubtitle} onChange={e => setForm({ ...form, contactPage: { ...form.contactPage, heroSubtitle: e.target.value } })} /></div>
                    <div className="form-group"><label>Titre Adresse</label><input value={form.contactPage.addressTitle} onChange={e => setForm({ ...form, contactPage: { ...form.contactPage, addressTitle: e.target.value } })} /></div>
                    <div className="form-group"><label>Titre Réseaux</label><input value={form.contactPage.socialTitle} onChange={e => setForm({ ...form, contactPage: { ...form.contactPage, socialTitle: e.target.value } })} /></div>
                    <div className="form-group"><label>Titre Liens</label><input value={form.contactPage.linksTitle} onChange={e => setForm({ ...form, contactPage: { ...form.contactPage, linksTitle: e.target.value } })} /></div>

                    <h3 style={{ marginTop: 24 }}>Adresses email (fonctionnelles)</h3>
                    <p className="form-hint" style={{ marginBottom: 16 }}>Ces adresses sont utilisées pour les liens &quot;mailto:&quot;</p>
                    <div className="form-group"><label>Email bureau</label><input value={form.contactEmail} onChange={e => setForm({ ...form, contactEmail: e.target.value })} /></div>
                    <div className="form-group"><label>Email inscriptions</label><input value={form.contactEmailInscription} onChange={e => setForm({ ...form, contactEmailInscription: e.target.value })} /></div>
                    <div className="form-group"><label>Email président</label><input value={form.contactEmailPresident} onChange={e => setForm({ ...form, contactEmailPresident: e.target.value })} /></div>
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

            {activeTab === 'social' && (
                <>
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

                        <div className="wp-form-row" style={{ alignItems: 'flex-end', marginBottom: 24, background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                            <div className="form-group">
                                <label>Plateforme</label>
                                <select value={newPost.platform} onChange={e => setNewPost({ ...newPost, platform: e.target.value as any })}>
                                    <option value="facebook">Facebook</option>
                                    <option value="instagram">Instagram</option>
                                    <option value="linkedin">LinkedIn</option>
                                    <option value="youtube">YouTube</option>
                                </select>
                            </div>
                            <div className="form-group" style={{ flex: 2 }}>
                                <label>Contenu du post</label>
                                <textarea value={newPost.content} onChange={e => setNewPost({ ...newPost, content: e.target.value })} rows={2} placeholder="Texte du post..." />
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Image (URL)</label>
                                <input value={newPost.imageUrl} onChange={e => setNewPost({ ...newPost, imageUrl: e.target.value })} placeholder="/img.jpg" />
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Lien Post (URL)</label>
                                <input value={newPost.postUrl} onChange={e => setNewPost({ ...newPost, postUrl: e.target.value })} placeholder="https://..." />
                            </div>
                            <button className="wp-btn wp-btn-primary" onClick={handleAddPost} disabled={!newPost.content}>+ Ajouter</button>
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
                                        <button className="wp-btn-icon wp-btn-icon-danger" style={{ width: 24, height: 24 }} onClick={() => deleteSocialPost(post.id)}>✕</button>
                                    </div>
                                    <p style={{ fontSize: '0.9rem', marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.content}</p>
                                    {post.imageUrl && <img src={post.imageUrl} alt="preview" style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 4 }} />}
                                    <small style={{ color: '#94a3b8', display: 'block', marginTop: 8 }}>{post.date}</small>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

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
            case 'records': return <RecordsView />;
            case 'pages': return <PagesView />;
            case 'planning': return <PlanningView />;
            case 'pricing': return <PricingView />;
            case 'settings': return <SettingsView />;
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
