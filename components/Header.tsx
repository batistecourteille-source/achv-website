'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useData } from '@/lib/DataContext';

export default function Header() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const { settings, customPages } = useData();
    const pathname = usePathname();
    const visiblePages = customPages.filter(p => p.published && p.showInNav).sort((a, b) => a.order - b.order);

    const isActive = (href: string) => {
        if (href === '/') return pathname === '/';
        return pathname.startsWith(href);
    };

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <header className={`header ${scrolled || pathname !== '/' ? 'scrolled' : ''}`} id="main-header">
            <div className="nav-container">
                <Link href="/" className="nav-logo" onClick={() => setMobileOpen(false)}>
                    <img src="/logo.png" alt="ACHV Logo" />
                    <div className="nav-logo-text">
                        {settings.clubName}
                        <span>{settings.subtitle}</span>
                    </div>
                </Link>
                <nav className={`nav-links ${mobileOpen ? 'mobile-open' : ''}`} id="main-nav">
                    <li><Link href="/" className={isActive('/') ? 'active' : ''} onClick={() => setMobileOpen(false)}>Accueil</Link></li>
                    <li className="nav-dropdown">
                        <a href="#club" className={isActive('/club') ? 'active' : ''}>Le Club ▾</a>
                        <div className="nav-dropdown-content">
                            <Link href="/club" onClick={() => setMobileOpen(false)}>Présentation</Link>
                            <Link href="/club#bureau" onClick={() => setMobileOpen(false)}>Bureau</Link>
                            <Link href="/club#coachs" onClick={() => setMobileOpen(false)}>Coachs</Link>
                        </div>
                    </li>
                    <li><Link href="/actualites" className={isActive('/actualites') ? 'active' : ''} onClick={() => setMobileOpen(false)}>Actualités</Link></li>
                    <li><Link href="/agenda" className={isActive('/agenda') ? 'active' : ''} onClick={() => setMobileOpen(false)}>Agenda</Link></li>
                    <li className="nav-dropdown">
                        <a href="#activites" className={(isActive('/activites') || isActive('/tarifs')) ? 'active' : ''}>Activités ▾</a>
                        <div className="nav-dropdown-content">
                            <Link href="/activites" onClick={() => setMobileOpen(false)}>Les Activités</Link>
                            <Link href="/tarifs" onClick={() => setMobileOpen(false)}>Tarifs & Adhésion</Link>
                        </div>
                    </li>
                    <li className="nav-dropdown">
                        <a href="#performances" className={(isActive('/resultats') || isActive('/records')) ? 'active' : ''}>Performances ▾</a>
                        <div className="nav-dropdown-content">
                            <Link href="/resultats" onClick={() => setMobileOpen(false)}>Résultats</Link>
                            <Link href="/records" onClick={() => setMobileOpen(false)}>Records</Link>
                        </div>
                    </li>
                    {visiblePages.map(p => (
                        <li key={p.id}><Link href={`/p/${p.slug}`} className={isActive(`/p/${p.slug}`) ? 'active' : ''} onClick={() => setMobileOpen(false)}>{p.title}</Link></li>
                    ))}
                    <li><Link href="/contact" className={isActive('/contact') ? 'active' : ''} onClick={() => setMobileOpen(false)}>Contact</Link></li>
                    <li><Link href="/partenaires" className={isActive('/partenaires') ? 'active' : ''} onClick={() => setMobileOpen(false)}>Partenaires</Link></li>
                    <li><a href={settings.inscriptionUrl} target="_blank" rel="noopener" className="nav-cta">Inscription</a></li>
                </nav>
                <button
                    className={`mobile-menu-btn ${mobileOpen ? 'open' : ''}`}
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label="Menu"
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>
        </header>
    );
}
