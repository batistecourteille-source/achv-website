'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const { login, isAuthenticated, sendPasswordReset } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isAuthenticated) { router.push('/admin'); }
    }, [isAuthenticated, router]);

    if (isAuthenticated) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        try {
            await login(username, password);
            router.push('/admin');
        } catch (err: any) {
            console.error(err);
            setError('Identifiants incorrects ou compte non activé.');
        }
    };

    const handleResetPassword = async () => {
        if (!username) {
            setError('Veuillez saisir votre email pour réinitialiser le mot de passe.');
            return;
        }
        setError('');
        setMessage('');
        try {
            await sendPasswordReset(username);
            setMessage('Email de réinitialisation envoyé ! Vérifiez votre boîte de réception.');
        } catch (err: any) {
            console.error(err);
            setError('Erreur lors de l\'envoi de l\'email. Vérifiez l\'adresse saisie.');
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <img src="/logo.png" alt="ACHV" style={{ height: 60, filter: 'none' }} />
                </div>
                <h1>Administration</h1>
                <p>Connectez-vous pour gérer le site</p>
                {error && <div className="login-error">{error}</div>}
                {message && <div style={{ background: '#dcfce7', color: '#166534', padding: '12px', borderRadius: '4px', marginBottom: '16px', fontSize: '0.9rem' }}>{message}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            placeholder="votre@email.com"
                            required
                            id="login-username"
                        />
                    </div>
                    <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label>Mot de passe</label>
                            <button
                                type="button"
                                onClick={handleResetPassword}
                                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.8rem', cursor: 'pointer', padding: 0 }}
                            >
                                Mot de passe oublié ?
                            </button>
                        </div>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            id="login-password"
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                        Se connecter
                    </button>
                </form>
                <p style={{ marginTop: 24, fontSize: '0.8rem', color: '#adb5bd', textAlign: 'center' }}>
                    Connectez-vous avec votre compte administrateur Firebase.
                </p>
            </div>
        </div>
    );
}
