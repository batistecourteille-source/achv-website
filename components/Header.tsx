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

    // State for mobile dropdowns
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    const isActive = (href: string) => {
        if (href === '/') return pathname === '/';
        return pathname.startsWith(href);
    };

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const toggleDropdown = (e: React.MouseEvent, name: string) => {
        if (window.innerWidth <= 900) {
            e.preventDefault();
            setActiveDropdown(activeDropdown === name ? null : name);
        }
    };

    const handleLinkClick = () => {
        setMobileOpen(false);
        setActiveDropdown(null);
    };

    return (
        <header className={`header ${scrolled || pathname !== '/' ? 'scrolled' : ''}`} id="main-header">
            <div className="nav-container">
                <Link href="/" className="nav-logo" onClick={handleLinkClick}>
                    <img src="/logo.png" alt="ACHV Logo" />
                    <div className="nav-logo-text">
                        {settings.clubName}
                        <span>{settings.subtitle}</span>
                    </div>
                </Link>
                <nav className={`nav-links ${mobileOpen ? 'mobile-open' : ''}`} id="main-nav">
                    <li><Link href="/" className={isActive('/') ? 'active' : ''} onClick={handleLinkClick}>Accueil</Link></li>

                    <li className={`nav-dropdown ${activeDropdown === 'club' ? 'mobile-active' : ''}`}>
                        <a href="#club" className={isActive('/club') ? 'active' : ''} onClick={(e) => toggleDropdown(e, 'club')}>
                            Le Club ▾
                        </a>
                        <div className="nav-dropdown-content">
                            <Link href="/club" onClick={handleLinkClick}>Présentation</Link>
                            <Link href="/club#bureau" onClick={handleLinkClick}>Bureau</Link>
                            <Link href="/club#coachs" onClick={handleLinkClick}>Coachs</Link>
                        </div>
                    </li>

                    <li className={`nav-dropdown ${activeDropdown === 'actualites' ? 'mobile-active' : ''}`}>
                        <a href="#actualites" className={isActive('/actualites') ? 'active' : ''} onClick={(e) => toggleDropdown(e, 'actualites')}>
                            Actualités ▾
                        </a>
                        <div className="nav-dropdown-content">
                            <Link href="/actualites?tab=blog" onClick={handleLinkClick}>📝 Blog / Articles</Link>
                            <Link href="/actualites?tab=social" onClick={handleLinkClick}>📱 Réseaux Sociaux</Link>
                        </div>
                    </li>

                    <li><Link href="/agenda" className={isActive('/agenda') ? 'active' : ''} onClick={handleLinkClick}>Agenda</Link></li>

                    <li className={`nav-dropdown ${activeDropdown === 'activites' ? 'mobile-active' : ''}`}>
                        <a href="#activites" className={(isActive('/activites') || isActive('/tarifs')) ? 'active' : ''} onClick={(e) => toggleDropdown(e, 'activites')}>
                            Activités ▾
                        </a>
                        <div className="nav-dropdown-content">
                            <Link href="/activites" onClick={handleLinkClick}>Les Activités</Link>
                            <Link href="/tarifs" onClick={handleLinkClick}>Tarifs & Adhésion</Link>
                        </div>
                    </li>

                    <li className={`nav-dropdown ${activeDropdown === 'performances' ? 'mobile-active' : ''}`}>
                        <a href="#performances" className={(isActive('/resultats') || isActive('/records')) ? 'active' : ''} onClick={(e) => toggleDropdown(e, 'performances')}>
                            Performances ▾
                        </a>
                        <div className="nav-dropdown-content">
                            <Link href="/resultats" onClick={handleLinkClick}>Résultats</Link>
                            <Link href="/records" onClick={handleLinkClick}>Records</Link>
                        </div>
                    </li>

                    {visiblePages.map(p => (
                        <li key={p.id}><Link href={`/p/${p.slug}`} className={isActive(`/p/${p.slug}`) ? 'active' : ''} onClick={handleLinkClick}>{p.title}</Link></li>
                    ))}

                    <li><Link href="/contact" className={isActive('/contact') ? 'active' : ''} onClick={handleLinkClick}>Contact</Link></li>
                    <li><Link href="/partenaires" className={isActive('/partenaires') ? 'active' : ''} onClick={handleLinkClick}>Partenaires</Link></li>
                    <li><a href={settings.inscriptionUrl} target="_blank" rel="noopener" className="nav-cta">Inscription</a></li>
                </nav>
                <button
                    className={`mobile-menu-btn ${mobileOpen ? 'open' : ''}`}
                    onClick={() => {
                        setMobileOpen(!mobileOpen);
                        setActiveDropdown(null);
                    }}
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
