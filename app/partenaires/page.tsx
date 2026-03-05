'use client';
import React, { useState } from 'react';
import { useData } from '@/lib/DataContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import '@/app/globals.css';
import '@/app/components.css';
import '@/app/sections.css';

const TIER_CONFIG = {
    gold: { label: 'Or', color: '#FFD700', bg: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', icon: '🥇', order: 1 },
    silver: { label: 'Argent', color: '#C0C0C0', bg: 'linear-gradient(135deg, #C0C0C0 0%, #A0A0A0 100%)', icon: '🥈', order: 2 },
    bronze: { label: 'Bronze', color: '#CD7F32', bg: 'linear-gradient(135deg, #CD7F32 0%, #8B5E3C 100%)', icon: '🥉', order: 3 },
};





export default function PartenairesPage() {
    const { partners, settings } = useData();
    const pp = settings.partnersPage;
    const [formData, setFormData] = useState({ name: '', company: '', email: '', phone: '', message: '', formule: '' });
    const [formSent, setFormSent] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const validateEmail = (email: string) => {
        return email.includes('@') && email.indexOf('@') > 0 && email.indexOf('@') < email.length - 1 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const validateForm = () => {
        const errors: Record<string, string> = {};
        if (!formData.name.trim()) errors.name = 'Le nom est requis';
        if (!formData.company.trim()) errors.company = "Le nom de l'entreprise est requis";
        if (!formData.email.trim()) errors.email = "L'email est requis";
        else if (!validateEmail(formData.email)) errors.email = 'Veuillez entrer un email valide avec @';
        if (!formData.phone.trim()) errors.phone = 'Le téléphone est requis';
        if (!formData.formule) errors.formule = 'Veuillez sélectionner une formule';
        if (!formData.message.trim()) errors.message = 'Le message est requis';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const FORMULES = [
        { tier: 'bronze' as const, price: pp.pricing.bronze.price, features: pp.pricing.bronze.features },
        { tier: 'silver' as const, price: pp.pricing.silver.price, features: pp.pricing.silver.features, popular: true },
        { tier: 'gold' as const, price: pp.pricing.gold.price, features: pp.pricing.gold.features },
    ];

    const sortedPartners = [...partners].sort((a, b) => TIER_CONFIG[a.tier].order - TIER_CONFIG[b.tier].order);
    const goldPartners = sortedPartners.filter(p => p.tier === 'gold');
    const silverPartners = sortedPartners.filter(p => p.tier === 'silver');
    const bronzePartners = sortedPartners.filter(p => p.tier === 'bronze');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate before sending
        if (!validateForm()) return;

        // Indicateur de chargement (optionnel, ici on le fait simple)
        const submitBtn = document.querySelector('.partner-form-submit') as HTMLButtonElement;
        if (submitBtn) submitBtn.disabled = true;

        try {
            const res = await fetch("https://formsubmit.co/ajax/batiste.courteille@gmail.com", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    _subject: `Nouvelle demande de partenariat - ${formData.company}`,
                    nom: formData.name,
                    entreprise: formData.company,
                    email: formData.email,
                    telephone: formData.phone,
                    formule: formData.formule,
                    message: formData.message
                })
            });

            if (res.ok) {
                setFormSent(true);
                setFormData({ name: '', company: '', email: '', phone: '', message: '', formule: '' });
                setFormErrors({});
                // Reset après 10s
                setTimeout(() => setFormSent(false), 10000);
            } else {
                alert("Une erreur est survenue lors de l'envoi. Merci de nous contacter directement par email.");
            }
        } catch (error) {
            console.error(error);
            alert("Erreur de connexion. Merci de réessayer.");
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    };

    const renderPartnerCard = (p: typeof partners[0], size: 'lg' | 'md' | 'sm') => (
        <a
            key={p.id}
            href={p.url !== '#' ? p.url : undefined}
            target={p.url !== '#' ? '_blank' : undefined}
            rel="noopener"
            className={`partner-card partner-card-${size}`}
        >
            <div className="partner-card-tier" style={{ background: TIER_CONFIG[p.tier].bg }}>
                {TIER_CONFIG[p.tier].icon}
            </div>
            {p.logo ? (
                <img src={p.logo} alt={p.name} className="partner-card-logo" />
            ) : (
                <div className="partner-card-initials" style={{ borderColor: TIER_CONFIG[p.tier].color }}>
                    {p.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
            )}
            <h3 className="partner-card-name">{p.name}</h3>
            {p.description && <p className="partner-card-desc">{p.description}</p>}
            {p.url !== '#' && (
                <span className="partner-card-link">Visiter le site →</span>
            )}
        </a>
    );

    return (
        <>
            <Header />

            {/* Hero Section */}
            <section className="page-hero" style={{ marginTop: 80 }}>
                <div className="container" style={{ textAlign: 'center' }}>
                    <div className="section-label">Partenaires</div>
                    <h1 className="section-title" dangerouslySetInnerHTML={{ __html: pp.heroTitle }} />
                    <p className="section-subtitle" style={{ whiteSpace: 'pre-line' }}>{pp.heroSubtitle}</p>
                </div>
            </section>

            {/* Chiffres clés */}
            <section className="section" style={{ paddingTop: 40, paddingBottom: 40 }}>
                <div className="container">
                    <div className="partners-stats">
                        {pp.stats.map((c, i) => (
                            <div key={i} className="partner-stat">
                                <span className="partner-stat-icon">{c.icon}</span>
                                <strong className="partner-stat-value">{c.value}</strong>
                                <span className="partner-stat-label">{c.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Partenaires actuels */}
            <section className="section section-alt" style={{ paddingTop: 50, paddingBottom: 50 }}>
                <div className="container">
                    <div className="section-header-centered">
                        <h2 className="section-title" style={{ fontSize: '1.8rem' }}>Ils nous font <span className="highlight">confiance</span></h2>
                        <p className="section-subtitle">Merci à nos partenaires qui contribuent au développement de l'athlétisme local</p>
                    </div>

                    {/* Gold Partners */}
                    {goldPartners.length > 0 && (
                        <div className="partners-tier-section">
                            <div className="partners-tier-label" style={{ background: TIER_CONFIG.gold.bg }}>
                                🥇 Partenaires Or
                            </div>
                            <div className="partners-grid partners-grid-lg">
                                {goldPartners.map(p => renderPartnerCard(p, 'lg'))}
                            </div>
                        </div>
                    )}

                    {/* Silver Partners */}
                    {silverPartners.length > 0 && (
                        <div className="partners-tier-section">
                            <div className="partners-tier-label" style={{ background: TIER_CONFIG.silver.bg }}>
                                🥈 Partenaires Argent
                            </div>
                            <div className="partners-grid partners-grid-md">
                                {silverPartners.map(p => renderPartnerCard(p, 'md'))}
                            </div>
                        </div>
                    )}

                    {/* Bronze Partners */}
                    {bronzePartners.length > 0 && (
                        <div className="partners-tier-section">
                            <div className="partners-tier-label" style={{ background: TIER_CONFIG.bronze.bg }}>
                                🥉 Partenaires Bronze
                            </div>
                            <div className="partners-grid partners-grid-sm">
                                {bronzePartners.map(p => renderPartnerCard(p, 'sm'))}
                            </div>
                        </div>
                    )}

                    {partners.length === 0 && (
                        <div className="partners-empty">
                            <span style={{ fontSize: '3rem' }}>🤝</span>
                            <p>Soyez le premier partenaire de l'ACHV !</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Pourquoi devenir partenaire */}
            <section className="section" style={{ paddingTop: 60, paddingBottom: 60 }}>
                <div className="container">
                    <div className="section-header-centered">
                        <h2 className="section-title" style={{ fontSize: '1.8rem' }}>Pourquoi devenir <span className="highlight">partenaire</span> ?</h2>
                        <p className="section-subtitle">Découvrez les avantages de rejoindre notre réseau d'entreprises</p>
                    </div>
                    <div className="avantages-grid">
                        {pp.benefits.map((a, i) => (
                            <div key={i} className="avantage-card">
                                <div className="avantage-icon">{a.icon}</div>
                                <h3>{a.title}</h3>
                                <p>{a.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Formules de partenariat */}
            <section className="section section-alt" style={{ paddingTop: 60, paddingBottom: 60 }}>
                <div className="container">
                    <div className="section-header-centered">
                        <h2 className="section-title" style={{ fontSize: '1.8rem' }}>Nos <span className="highlight">formules</span></h2>
                        <p className="section-subtitle">Choisissez la formule qui correspond à vos objectifs et votre budget</p>
                    </div>
                    <div className="formules-grid">
                        {FORMULES.map((f, i) => (
                            <div key={i} className={`formule-card ${f.popular ? 'formule-popular' : ''}`}>
                                {f.popular && <div className="formule-badge">⭐ Populaire</div>}
                                <div className="formule-tier-icon" style={{ background: TIER_CONFIG[f.tier].bg }}>
                                    {TIER_CONFIG[f.tier].icon}
                                </div>
                                <h3 className="formule-name">Pack {TIER_CONFIG[f.tier].label}</h3>
                                <div className="formule-price">{f.price}</div>
                                <ul className="formule-features">
                                    {f.features.map((feat, j) => (
                                        <li key={j}>
                                            <span className="formule-check">✓</span>
                                            {feat}
                                        </li>
                                    ))}
                                </ul>
                                <a href="#contact-partenaire" className={`formule-cta ${f.popular ? 'formule-cta-primary' : ''}`}>
                                    Nous contacter
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Mécénat & Sponsoring explication */}
            <section className="section" style={{ paddingTop: 50, paddingBottom: 50 }}>
                <div className="container">
                    <div className="mecenat-grid">
                        <div className="mecenat-card">
                            <div className="mecenat-icon">🎁</div>
                            <h3>Mécénat</h3>
                            <p className="mecenat-subtitle">Don sans contrepartie directe</p>
                            <ul>
                                <li><strong>Réduction d'impôt de 60%</strong> du montant du don</li>
                                <li>Dans la limite de 0,5% du chiffre d'affaires HT</li>
                                <li>Possibilité de report sur 5 ans en cas de dépassement</li>
                                <li>Exemple : un don de 1 000€ vous coûte réellement <strong>400€</strong></li>
                            </ul>
                        </div>
                        <div className="mecenat-card">
                            <div className="mecenat-icon">📢</div>
                            <h3>Sponsoring</h3>
                            <p className="mecenat-subtitle">Avec contreparties publicitaires</p>
                            <ul>
                                <li><strong>Charge déductible</strong> du résultat imposable</li>
                                <li>Contreparties proportionnées (visibilité, espaces pub…)</li>
                                <li>Facture émise par le club</li>
                                <li>Exemple : 1 000€ HT déductible = économie de <strong>250€</strong> (IS à 25%)</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Formulaire de contact */}
            <section className="section section-alt" id="contact-partenaire" style={{ paddingTop: 60, paddingBottom: 60 }}>
                <div className="container">
                    <div className="section-header-centered">
                        <h2 className="section-title" style={{ fontSize: '1.8rem' }}>Devenir <span className="highlight">partenaire</span></h2>
                        <p className="section-subtitle">Contactez-nous pour échanger sur un partenariat adapté à vos besoins</p>
                    </div>
                    <div className="partner-form-wrapper">
                        {formSent ? (
                            <div className="partner-form-success">
                                <span style={{ fontSize: '3rem' }}>✅</span>
                                <h3>Message envoyé !</h3>
                                <p>Merci pour votre intérêt. Nous vous recontacterons très rapidement.</p>
                            </div>
                        ) : (
                            <form className="partner-form" onSubmit={handleSubmit} noValidate>
                                <div className="partner-form-row">
                                    <div className="partner-form-group">
                                        <label htmlFor="pf-name">Nom &amp; Prénom *</label>
                                        <input
                                            id="pf-name"
                                            type="text"
                                            placeholder="Jean Dupont"
                                            value={formData.name}
                                            onChange={e => { setFormData({ ...formData, name: e.target.value }); if (formErrors.name) setFormErrors({ ...formErrors, name: '' }); }}
                                            style={formErrors.name ? { borderColor: '#ef4444' } : {}}
                                        />
                                        {formErrors.name && <span className="partner-form-error">{formErrors.name}</span>}
                                    </div>
                                    <div className="partner-form-group">
                                        <label htmlFor="pf-company">Entreprise *</label>
                                        <input
                                            id="pf-company"
                                            type="text"
                                            placeholder="Nom de votre entreprise"
                                            value={formData.company}
                                            onChange={e => { setFormData({ ...formData, company: e.target.value }); if (formErrors.company) setFormErrors({ ...formErrors, company: '' }); }}
                                            style={formErrors.company ? { borderColor: '#ef4444' } : {}}
                                        />
                                        {formErrors.company && <span className="partner-form-error">{formErrors.company}</span>}
                                    </div>
                                </div>
                                <div className="partner-form-row">
                                    <div className="partner-form-group">
                                        <label htmlFor="pf-email">Email * <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--medium-gray)' }}>(avec @)</span></label>
                                        <input
                                            id="pf-email"
                                            type="email"
                                            placeholder="contact@entreprise.fr"
                                            value={formData.email}
                                            onChange={e => { setFormData({ ...formData, email: e.target.value }); if (formErrors.email) setFormErrors({ ...formErrors, email: '' }); }}
                                            style={formErrors.email ? { borderColor: '#ef4444' } : {}}
                                        />
                                        {formErrors.email && <span className="partner-form-error">{formErrors.email}</span>}
                                    </div>
                                    <div className="partner-form-group">
                                        <label htmlFor="pf-phone">Téléphone *</label>
                                        <input
                                            id="pf-phone"
                                            type="tel"
                                            placeholder="06 12 34 56 78"
                                            value={formData.phone}
                                            onChange={e => { setFormData({ ...formData, phone: e.target.value }); if (formErrors.phone) setFormErrors({ ...formErrors, phone: '' }); }}
                                            style={formErrors.phone ? { borderColor: '#ef4444' } : {}}
                                        />
                                        {formErrors.phone && <span className="partner-form-error">{formErrors.phone}</span>}
                                    </div>
                                </div>
                                <div className="partner-form-group">
                                    <label htmlFor="pf-formule">Formule intéressée *</label>
                                    <select
                                        id="pf-formule"
                                        value={formData.formule}
                                        onChange={e => { setFormData({ ...formData, formule: e.target.value }); if (formErrors.formule) setFormErrors({ ...formErrors, formule: '' }); }}
                                        style={formErrors.formule ? { borderColor: '#ef4444' } : {}}
                                    >
                                        <option value="">— Sélectionner une formule —</option>
                                        <option value="bronze">Pack Bronze (à partir de 200€)</option>
                                        <option value="silver">Pack Argent (à partir de 500€)</option>
                                        <option value="gold">Pack Or (à partir de 1 000€)</option>
                                        <option value="custom">Sur mesure</option>
                                    </select>
                                    {formErrors.formule && <span className="partner-form-error">{formErrors.formule}</span>}
                                </div>
                                <div className="partner-form-group">
                                    <label htmlFor="pf-message">Message *</label>
                                    <textarea
                                        id="pf-message"
                                        rows={4}
                                        placeholder="Décrivez votre projet de partenariat, vos attentes…"
                                        value={formData.message}
                                        onChange={e => { setFormData({ ...formData, message: e.target.value }); if (formErrors.message) setFormErrors({ ...formErrors, message: '' }); }}
                                        style={formErrors.message ? { borderColor: '#ef4444' } : {}}
                                    />
                                    {formErrors.message && <span className="partner-form-error">{formErrors.message}</span>}
                                </div>
                                <p style={{ fontSize: '0.8rem', color: 'var(--medium-gray)', margin: '-8px 0 4px', textAlign: 'center' }}>* Tous les champs sont obligatoires</p>
                                <button type="submit" className="partner-form-submit">
                                    🤝 Envoyer ma demande de partenariat
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </section>

            <Footer />

            <style jsx>{`
                /* ====== Stats ====== */
                .partners-stats {
                    display: grid;
                    grid-template-columns: repeat(6, 1fr);
                    gap: 16px;
                }
                .partner-stat {
                    text-align: center;
                    padding: 24px 12px;
                    background: var(--white);
                    border-radius: var(--radius-lg);
                    border: 1px solid var(--light-gray);
                    transition: var(--transition-spring);
                }
                .partner-stat:hover {
                    transform: translateY(-4px);
                    box-shadow: var(--shadow-lg);
                }
                .partner-stat-icon {
                    font-size: 1.8rem;
                    display: block;
                    margin-bottom: 8px;
                }
                .partner-stat-value {
                    display: block;
                    font-family: 'Space Grotesk', sans-serif;
                    font-size: 1.6rem;
                    font-weight: 800;
                    color: var(--primary);
                }
                .partner-stat-label {
                    display: block;
                    font-size: 0.75rem;
                    color: var(--medium-gray);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-top: 4px;
                }

                /* ====== Section header ====== */
                .section-header-centered {
                    text-align: center;
                    margin-bottom: 40px;
                }

                /* ====== Partners tiers ====== */
                .partners-tier-section {
                    margin-bottom: 40px;
                }
                .partners-tier-label {
                    display: inline-block;
                    padding: 6px 20px;
                    border-radius: var(--radius-full);
                    color: white;
                    font-weight: 700;
                    font-size: 0.85rem;
                    margin-bottom: 20px;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                }
                .partners-grid {
                    display: grid;
                    gap: 20px;
                }
                .partners-grid-lg {
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                }
                .partners-grid-md {
                    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                }
                .partners-grid-sm {
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                }
                .partner-card {
                    background: var(--white);
                    border-radius: var(--radius-lg);
                    border: 1px solid var(--light-gray);
                    padding: 28px;
                    text-align: center;
                    text-decoration: none;
                    transition: var(--transition-spring);
                    position: relative;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    cursor: pointer;
                }
                .partner-card::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0;
                    height: 4px;
                    background: var(--gradient-primary);
                    opacity: 0;
                    transition: var(--transition-fast);
                }
                .partner-card:hover {
                    transform: translateY(-6px);
                    box-shadow: var(--shadow-lg);
                }
                .partner-card:hover::before {
                    opacity: 1;
                }
                .partner-card-tier {
                    position: absolute;
                    top: 12px;
                    right: 12px;
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.8rem;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                }
                .partner-card-logo {
                    width: 100px;
                    height: 100px;
                    object-fit: contain;
                    margin-bottom: 16px;
                    border-radius: var(--radius-md);
                }
                .partner-card-initials {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    border: 3px solid;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: 'Space Grotesk', sans-serif;
                    font-size: 1.4rem;
                    font-weight: 800;
                    color: var(--dark);
                    margin-bottom: 16px;
                    background: var(--bg-alt);
                }
                .partner-card-name {
                    font-size: 1rem;
                    font-weight: 700;
                    color: var(--dark);
                    margin-bottom: 6px;
                }
                .partner-card-desc {
                    font-size: 0.82rem;
                    color: var(--medium-gray);
                    line-height: 1.5;
                    margin-bottom: 10px;
                }
                .partner-card-link {
                    font-size: 0.8rem;
                    color: var(--primary);
                    font-weight: 600;
                    margin-top: auto;
                }
                .partners-empty {
                    text-align: center;
                    padding: 60px 0;
                    color: var(--medium-gray);
                }

                /* ====== Avantages ====== */
                .avantages-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 24px;
                }
                .avantage-card {
                    background: var(--white);
                    border-radius: var(--radius-lg);
                    border: 1px solid var(--light-gray);
                    padding: 32px 24px;
                    text-align: center;
                    transition: var(--transition-spring);
                }
                .avantage-card:hover {
                    transform: translateY(-4px);
                    box-shadow: var(--shadow-lg);
                    border-color: var(--primary);
                }
                .avantage-icon {
                    font-size: 2.5rem;
                    margin-bottom: 16px;
                }
                .avantage-card h3 {
                    font-size: 1.05rem;
                    font-weight: 700;
                    color: var(--dark);
                    margin-bottom: 8px;
                }
                .avantage-card p {
                    font-size: 0.85rem;
                    color: var(--medium-gray);
                    line-height: 1.6;
                }

                /* ====== Formules / Pricing ====== */
                .formules-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 24px;
                    align-items: start;
                }
                .formule-card {
                    background: var(--white);
                    border-radius: var(--radius-xl);
                    border: 2px solid var(--light-gray);
                    padding: 36px 28px;
                    text-align: center;
                    transition: var(--transition-spring);
                    position: relative;
                }
                .formule-card:hover {
                    transform: translateY(-4px);
                    box-shadow: var(--shadow-lg);
                }
                .formule-popular {
                    border-color: var(--primary);
                    transform: scale(1.04);
                    box-shadow: var(--shadow-lg);
                }
                .formule-popular:hover {
                    transform: scale(1.06) translateY(-2px);
                }
                .formule-badge {
                    position: absolute;
                    top: -14px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: var(--primary);
                    color: white;
                    font-size: 0.75rem;
                    font-weight: 700;
                    padding: 4px 16px;
                    border-radius: var(--radius-full);
                    white-space: nowrap;
                }
                .formule-tier-icon {
                    width: 56px;
                    height: 56px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                    margin: 0 auto 16px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }
                .formule-name {
                    font-size: 1.2rem;
                    font-weight: 700;
                    color: var(--dark);
                    margin-bottom: 4px;
                }
                .formule-price {
                    font-family: 'Space Grotesk', sans-serif;
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: var(--primary);
                    margin-bottom: 20px;
                }
                .formule-features {
                    list-style: none;
                    padding: 0;
                    margin: 0 0 24px;
                    text-align: left;
                }
                .formule-features li {
                    padding: 8px 0;
                    font-size: 0.85rem;
                    color: var(--dark);
                    border-bottom: 1px solid var(--bg-alt);
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                }
                .formule-check {
                    color: #22c55e;
                    font-weight: 700;
                    flex-shrink: 0;
                    margin-top: 1px;
                }
                .formule-cta {
                    display: inline-block;
                    padding: 12px 28px;
                    border-radius: var(--radius-full);
                    font-size: 0.9rem;
                    font-weight: 600;
                    text-decoration: none;
                    border: 2px solid var(--light-gray);
                    color: var(--dark);
                    transition: var(--transition-fast);
                    cursor: pointer;
                }
                .formule-cta:hover {
                    border-color: var(--primary);
                    color: var(--primary);
                }
                .formule-cta-primary {
                    background: var(--primary);
                    border-color: var(--primary);
                    color: white;
                }
                .formule-cta-primary:hover {
                    background: var(--primary-hover);
                    border-color: var(--primary-hover);
                    color: white;
                    transform: scale(1.03);
                }

                /* ====== Mécénat / Sponsoring ====== */
                .mecenat-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 28px;
                }
                .mecenat-card {
                    background: var(--white);
                    border-radius: var(--radius-xl);
                    border: 1px solid var(--light-gray);
                    padding: 36px;
                    transition: var(--transition-spring);
                }
                .mecenat-card:hover {
                    box-shadow: var(--shadow-lg);
                    transform: translateY(-4px);
                }
                .mecenat-icon {
                    font-size: 2.5rem;
                    margin-bottom: 12px;
                }
                .mecenat-card h3 {
                    font-size: 1.3rem;
                    font-weight: 700;
                    color: var(--dark);
                    margin-bottom: 4px;
                }
                .mecenat-subtitle {
                    font-size: 0.85rem;
                    color: var(--primary);
                    font-weight: 600;
                    margin-bottom: 16px;
                }
                .mecenat-card ul {
                    padding-left: 0;
                    list-style: none;
                }
                .mecenat-card li {
                    padding: 6px 0;
                    font-size: 0.9rem;
                    color: var(--medium-gray);
                    position: relative;
                    padding-left: 20px;
                }
                .mecenat-card li::before {
                    content: '✓';
                    position: absolute;
                    left: 0;
                    color: #22c55e;
                    font-weight: 700;
                }
                .mecenat-card li strong {
                    color: var(--dark);
                }

                /* ====== Contact Form ====== */
                .partner-form-wrapper {
                    max-width: 700px;
                    margin: 0 auto;
                }
                .partner-form {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }
                .partner-form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                }
                .partner-form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                .partner-form-group label {
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: var(--dark);
                }
                .partner-form-group input,
                .partner-form-group select,
                .partner-form-group textarea {
                    padding: 12px 16px;
                    border: 2px solid var(--light-gray);
                    border-radius: var(--radius-md);
                    font-size: 0.9rem;
                    font-family: 'Inter', sans-serif;
                    transition: var(--transition-fast);
                    background: var(--white);
                    color: var(--dark);
                }
                .partner-form-group input:focus,
                .partner-form-group select:focus,
                .partner-form-group textarea:focus {
                    outline: none;
                    border-color: var(--primary);
                    box-shadow: 0 0 0 3px rgba(230, 57, 70, 0.1);
                }
                .partner-form-submit {
                    padding: 14px 32px;
                    background: var(--primary);
                    color: white;
                    border: none;
                    border-radius: var(--radius-full);
                    font-size: 1rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: var(--transition-fast);
                    font-family: 'Inter', sans-serif;
                    align-self: center;
                }
                .partner-form-submit:hover {
                    background: var(--primary-hover);
                    transform: scale(1.03);
                    box-shadow: 0 8px 24px rgba(230, 57, 70, 0.3);
                }
                .partner-form-error {
                    display: block;
                    color: #ef4444;
                    font-size: 0.78rem;
                    margin-top: 4px;
                    font-weight: 500;
                }
                .partner-form-success {
                    text-align: center;
                    padding: 60px 20px;
                    background: var(--white);
                    border-radius: var(--radius-xl);
                    border: 2px solid #22c55e;
                }
                .partner-form-success h3 {
                    font-size: 1.3rem;
                    color: var(--dark);
                    margin: 12px 0 8px;
                }
                .partner-form-success p {
                    color: var(--medium-gray);
                }

                /* ====== Responsive ====== */
                @media (max-width: 900px) {
                    .partners-stats {
                        grid-template-columns: repeat(3, 1fr);
                    }
                    .avantages-grid,
                    .formules-grid {
                        grid-template-columns: 1fr;
                    }
                    .formule-popular {
                        transform: none;
                    }
                    .mecenat-grid {
                        grid-template-columns: 1fr;
                    }
                }
                @media (max-width: 600px) {
                    .partners-stats {
                        grid-template-columns: repeat(2, 1fr);
                    }
                    .partner-form-row {
                        grid-template-columns: 1fr;
                    }
                    .partners-grid-lg,
                    .partners-grid-md,
                    .partners-grid-sm {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </>
    );
}
