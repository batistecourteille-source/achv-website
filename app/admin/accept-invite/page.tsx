'use client';
import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { useData } from '@/lib/DataContext';
import { Suspense } from 'react';

function AcceptInviteContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { createAdminAccount, login } = useAuth();
    const { adminUsers, updateAdminUser } = useData();

    const token = searchParams.get('token');
    const emailParam = searchParams.get('email');

    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const invitation = adminUsers.find(a => a.id === token && a.status === 'invited');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!invitation) { setError("Invitation invalide ou expirée."); return; }
        if (password.length < 6) { setError("Le mot de passe doit faire au moins 6 caractères."); return; }
        if (password !== confirm) { setError("Les mots de passe ne correspondent pas."); return; }

        setLoading(true);
        try {
            await createAdminAccount(invitation.email, password);
            updateAdminUser(invitation.id, { status: 'active' });
            setSuccess(true);
            setTimeout(() => router.push('/admin'), 2000);
        } catch (err: any) {
            if (err.code === 'auth/email-already-in-use') {
                // Account exists, just activate
                await login(invitation.email, password);
                updateAdminUser(invitation.id, { status: 'active' });
                setSuccess(true);
                setTimeout(() => router.push('/admin'), 2000);
            } else {
                setError(err.message || "Une erreur est survenue.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            padding: 20,
        }}>
            <div style={{
                background: 'white', borderRadius: 16, padding: '40px 36px',
                width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <img src="/logo.png" alt="ACHV" style={{ width: 64, height: 64, objectFit: 'contain', marginBottom: 16 }} />
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1a1a2e', margin: 0 }}>Créer votre compte</h1>
                    <p style={{ color: '#6b7280', marginTop: 8, fontSize: '0.9rem' }}>
                        {invitation ? `Invitation pour ${invitation.email}` : 'Administration ACHV'}
                    </p>
                </div>

                {!invitation && !success && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 16, textAlign: 'center', color: '#dc2626' }}>
                        ⚠️ Ce lien d&apos;invitation est invalide ou a déjà été utilisé.
                    </div>
                )}

                {success && (
                    <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: 16, textAlign: 'center', color: '#16a34a' }}>
                        ✓ Compte créé ! Redirection en cours...
                    </div>
                )}

                {invitation && !success && (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#374151', fontSize: '0.9rem' }}>Email</label>
                            <input
                                value={invitation.email}
                                disabled
                                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', background: '#f9fafb', color: '#6b7280', boxSizing: 'border-box' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#374151', fontSize: '0.9rem' }}>Mot de passe</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Minimum 6 caractères"
                                required
                                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '1rem', boxSizing: 'border-box' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#374151', fontSize: '0.9rem' }}>Confirmer le mot de passe</label>
                            <input
                                type="password"
                                value={confirm}
                                onChange={e => setConfirm(e.target.value)}
                                placeholder="Répétez le mot de passe"
                                required
                                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '1rem', boxSizing: 'border-box' }}
                            />
                        </div>
                        {error && (
                            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 12, color: '#dc2626', fontSize: '0.9rem' }}>
                                {error}
                            </div>
                        )}
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                background: loading ? '#9ca3af' : '#e63946', color: 'white',
                                border: 'none', borderRadius: 8, padding: '12px 24px',
                                fontWeight: 700, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer',
                                marginTop: 8,
                            }}
                        >
                            {loading ? 'Création en cours...' : 'Créer mon compte'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default function AcceptInvitePage() {
    return (
        <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a2e' }}><p style={{ color: 'white' }}>Chargement...</p></div>}>
            <AcceptInviteContent />
        </Suspense>
    );
}
