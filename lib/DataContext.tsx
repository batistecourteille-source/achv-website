'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db } from './firebase';
import { doc, onSnapshot, setDoc, collection, getDocs, writeBatch } from 'firebase/firestore';

export interface SocialPost {
    id: string;
    platform: 'facebook' | 'instagram' | 'linkedin' | 'youtube';
    content: string;
    date: string;
    imageUrl?: string;
    postUrl: string;
}

export interface Article {
    id: string;
    title: string;
    content: string;
    excerpt: string;
    date: string;
    category: string;
    image?: string;
    images?: string[];
    published: boolean;
    city?: 'Noyal' | 'Nouvoitou' | 'Les deux';
    isFeatured?: boolean; // Pour le style journal (A la une)
    author?: string; // NOUVEAU : nom de l'auteur personnalisé
}

export interface Event {
    id: string;
    title: string;
    date: string;
    dateEnd?: string;
    location: string;
    description: string;
    registrationUrl?: string;
    presentationUrl?: string;
}

export interface TeamMember {
    id: string;
    name: string;
    role: string;
    category: 'bureau' | 'coach';
    photo?: string;
    subBureau?: 'noyal' | 'nouvoitou' | '';
}

export interface Activity {
    id: string;
    title: string;
    description: string;
    schedule: string;
    image?: string;
}

export interface Partner {
    id: string;
    name: string;
    url: string;
    logo?: string;
    tier: 'gold' | 'silver' | 'bronze';
    description?: string;
}

export interface CustomPage {
    id: string;
    title: string;
    slug: string;
    content: string;
    image?: string;
    published: boolean;
    showInNav: boolean;
    order: number;
}

export interface Result {
    id: string;
    date: string;
    competition: string;
    discipline: 'piste' | 'cross' | 'route' | 'trail' | 'marche-nordique';
    athletes: { name: string; performance: string; category: string; rank?: string }[];
    location: string;
    url?: string;
}

export interface ClubRecord {
    id: string;
    type: 'stade' | 'hors-stade' | 'indoor' | 'outdoor';
    event: string;
    category: string;
    gender: 'M' | 'F';
    athlete: string;
    performance: string;
    date: string;
    location?: string;
}

export interface PricingItem {
    id: string;
    category: 'Competition' | 'RunningSante' | 'Autre';
    activity: string;
    licenseType: string;
    birthYears: string;
    price: string;
    monClubCode: string;
    comment?: string;
    order: number;
}


export interface SiteSettings {
    clubName: string;
    subtitle: string;
    heroTitle: string;
    heroSubtitle: string;
    aboutText: string;
    aboutImage?: string;
    heroImage?: string;
    contactEmail: string;
    contactEmailInscription: string;
    contactEmailPresident: string;
    facebookUrl: string;
    instagramUrl: string;
    linkedinUrl: string;
    youtubeUrl: string;
    tiktokUrl: string;
    socialVisibility: {
        facebook: boolean;
        instagram: boolean;
        linkedin: boolean;
        youtube: boolean;
        tiktok: boolean;
    };
    address: string;
    tickerMessages: string[];
    licencies: number;
    inscriptionUrl: string;
    reinscriptionUrl: string;
    plaquetteUrl: string;
    hbaUrl: string;
    boutiqueUrl: string;
    heroBadge: string;
    ctaTitle: string;
    ctaText: string;
    instagramPostUrl?: string; // Legacy
    featuredPostUrls: string[];
    instagramAccessToken?: string;
    facebookAccessToken?: string;
    facebookPageId?: string;
    youtubeApiKey?: string;
    youtubeChannelId?: string;
    clubValues: { icon: string; title: string; desc: string }[];
    partnersPage: {
        heroTitle: string;
        heroSubtitle: string;
        stats: { value: string; label: string; icon: string }[];
        benefits: { icon: string; title: string; desc: string }[];
        pricing: {
            bronze: { price: string; features: string[] };
            silver: { price: string; features: string[] };
            gold: { price: string; features: string[] };
        };
    };
    pricingPage: {
        heroTitle: string;
        heroSubtitle: string;
        sectionLabel: string;
        sectionTitle: string;
        sectionSubtitle: string;
        competitionTitle: string;
        competitionDesc: string;
        runningTitle: string;
        runningDesc: string;
        optionsTitle: string;
        notes: string[];
        ctaButton: string;
        ctaSubtext: string;
    };
    clubPage: {
        heroTitle: string;
        heroSubtitle: string;
        introTitle: string;
        description: string;
        image: string;
        affiliationTitle: string;
        affiliationText: string;
        valuesTitle: string;
        facilitiesTitle: string;
        facilities?: { title: string; image: string; description: string }[];
        teamTitle: string;
        teamSubtitle: string;
        ctaTitle: string;
        ctaText: string;
    };
    contactPage: {
        heroTitle: string;
        heroSubtitle: string;
        addressTitle: string;
        socialTitle: string;
        linksTitle: string;
    };
    activitesPage: {
        heroTitle: string;
        heroSubtitle: string;
        planningTitle: string;
        planningSubtitle: string;
        planningLocation: string;
    };
    actualitesPage: {
        heroTitle: string;
        heroSubtitle: string;
    };
    agendaPage: {
        heroTitle: string;
        heroSubtitle: string;
    };
    resultatsPage: {
        heroTitle: string;
        heroSubtitle: string;
        latestTitle: string;
    };
    recordsPage: {
        heroTitle: string;
        heroSubtitle: string;
    };
}

interface DataContextType {
    articles: Article[];
    events: Event[];
    team: TeamMember[];
    activities: Activity[];
    partners: Partner[];
    customPages: CustomPage[];
    results: Result[];
    records: ClubRecord[];
    pricing: PricingItem[];
    settings: SiteSettings;
    setArticles: (a: Article[]) => void;
    setEvents: (e: Event[]) => void;
    setTeam: (t: TeamMember[]) => void;
    setActivities: (a: Activity[]) => void;
    setPartners: (p: Partner[]) => void;
    setCustomPages: (p: CustomPage[]) => void;
    setResults: (r: Result[]) => void;
    setRecords: (r: ClubRecord[]) => void;
    setSettings: (s: SiteSettings) => void;
    addArticle: (a: Article) => void;
    updateArticle: (id: string, a: Partial<Article>) => void;
    deleteArticle: (id: string) => void;
    addEvent: (e: Event) => void;
    updateEvent: (id: string, e: Partial<Event>) => void;
    deleteEvent: (id: string) => void;
    addTeamMember: (t: TeamMember) => void;
    updateTeamMember: (id: string, t: Partial<TeamMember>) => void;
    deleteTeamMember: (id: string) => void;
    addPartner: (p: Partner) => void;
    updatePartner: (id: string, p: Partial<Partner>) => void;
    deletePartner: (id: string) => void;
    addCustomPage: (p: CustomPage) => void;
    updateCustomPage: (id: string, p: Partial<CustomPage>) => void;
    deleteCustomPage: (id: string) => void;
    addResult: (r: Result) => void;
    updateResult: (id: string, r: Partial<Result>) => void;
    deleteResult: (id: string) => void;
    addRecord: (r: ClubRecord) => void;
    updateRecord: (id: string, r: Partial<ClubRecord>) => void;
    deleteRecord: (id: string) => void;
    schedules: ScheduleItem[];
    setSchedules: (s: ScheduleItem[]) => void;
    addSchedule: (s: ScheduleItem) => void;
    updateSchedule: (id: string, s: Partial<ScheduleItem>) => void;
    deleteSchedule: (id: string) => void;
    setPricing: (p: PricingItem[]) => void;
    addPricing: (p: PricingItem) => void;
    updatePricing: (id: string, p: Partial<PricingItem>) => void;
    deletePricing: (id: string) => void;
    socialPosts: SocialPost[];
    setSocialPosts: (p: SocialPost[]) => void;
    addSocialPost: (p: SocialPost) => void;
    updateSocialPost: (id: string, p: Partial<SocialPost>) => void;
    deleteSocialPost: (id: string) => void;
}

export interface ScheduleItem {
    id: string;
    category: string;
    discipline: string;
    ageGroup: string;
    dayTime: string;
    location: string;
    city: string;
    notes?: string;
}

const defaultSettings: SiteSettings = {
    clubName: 'ACHV',
    subtitle: 'Athletic Club Haute Vilaine',
    heroTitle: 'Athletic Club Haute Vilaine',
    heroSubtitle: 'La communauté running de Noyal-sur-Vilaine & Nouvoitou. Piste, cross, route, trail et marche nordique — pour tous les niveaux.',
    aboutText: "L'Athletic Club Haute Vilaine (ACHV) est une section du Haute Bretagne Athlétisme (HBA). Notre club réunit des passionnés d'athlétisme de tous niveaux et tous âges. Basé sur les communes de Noyal-sur-Vilaine et Nouvoitou, nous proposons un encadrement de qualité avec des entraîneurs diplômés FFA pour accompagner chacun dans ses objectifs sportifs, du loisir à la compétition.",
    contactEmail: 'contact.achv@gmail.com',
    contactEmailInscription: 'inscription.achv@gmail.com',
    contactEmailPresident: 'president.achv@gmail.com',
    facebookUrl: 'https://www.facebook.com/groups/299811563560139/',
    instagramUrl: 'https://www.instagram.com/achv_athle/',
    linkedinUrl: '',
    youtubeUrl: '',
    tiktokUrl: '',
    socialVisibility: {
        facebook: false,
        instagram: true,
        linkedin: false,
        youtube: false,
        tiktok: false,
    },
    address: 'Noyal-sur-Vilaine / Nouvoitou, Ille-et-Vilaine (35)',
    tickerMessages: [
        '🔥 NEVEZTELL TRAIL — 17-19 OCTOBRE 2025 À NOUVOITOU',
        '🏃 RELAIS RUN\'IN NOYAL — 12 JUIN 2026',
        '📝 INSCRIPTIONS SAISON 2025/2026 OUVERTES',
        '💪 NOUVEAUX CRÉNEAUX TRAIL LE SAMEDI MATIN',
    ],
    licencies: 250,
    inscriptionUrl: 'https://achv35.monclub.app/app',
    reinscriptionUrl: 'https://achv35.monclub.app/app',
    plaquetteUrl: 'https://achv35.monclub.app/app',
    hbaUrl: 'https://hautebretagneathletisme.fr',
    boutiqueUrl: 'https://b1.intersport-boutique-club.fr/336-hba-athletisme',
    heroBadge: '🏃 Section HBA • Noyal & Nouvoitou',
    ctaTitle: "💙 Rejoignez l'aventure ACHV",
    ctaText: 'Envie de courir, marcher, progresser ? Contactez-nous !',

    instagramPostUrl: 'https://www.instagram.com/p/DUvL_eWjVUb/',
    featuredPostUrls: ['https://www.instagram.com/p/DUvL_eWjVUb/'],
    clubValues: [
        { icon: '🎓', title: 'Formation', desc: 'Des entraîneurs diplômés FFA pour tous les niveaux, du débutant au compétiteur.' },
        { icon: '🤝', title: 'Convivialité', desc: "Un esprit d'équipe, des sorties, des events — l'ambiance ACHV, c'est unique." },
        { icon: '🏆', title: 'Performance', desc: "On t'accompagne vers tes objectifs, quel que soit ton niveau." },
        { icon: '💪', title: 'Bien-être', desc: 'Le sport comme moteur de santé et de plaisir au quotidien.' },
    ],
    partnersPage: {
        heroTitle: 'Nos <span class="highlight">partenaires</span>',
        heroSubtitle: "Ensemble, développons l'athlétisme sur notre territoire.\nRejoignez le réseau d'entreprises partenaires de l'ACHV.",
        stats: [
            { value: '250+', label: 'Licenciés', icon: '🏃' },
            { value: '5', label: 'Disciplines', icon: '🎯' },
            { value: '20+', label: 'Événements / an', icon: '🏆' },
            { value: '2', label: 'Communes', icon: '📍' },
            { value: '2K+', label: 'Followers', icon: '📱' },
            { value: '50+', label: 'Bénévoles actifs', icon: '💪' },
        ],
        benefits: [
            { icon: '📣', title: 'Visibilité locale', desc: 'Logo sur nos supports de communication, maillots, banderoles lors des événements et sur notre site web.' },
            { icon: '🏃', title: 'Sport & Bien-être', desc: 'Sessions de sport encadrées pour vos collaborateurs, team building sportif et accès privilégié à nos événements.' },
            { icon: '💰', title: 'Avantages fiscaux', desc: "Réduction d'impôt de 60% du montant du don dans la limite de 0,5% du CA (mécénat) ou charges déductibles (sponsoring)." },
            { icon: '🌍', title: 'Engagement RSE', desc: 'Associez votre image à des valeurs positives : sport, santé, inclusion, dynamisme du territoire local.' },
            { icon: '🤝', title: "Réseau d'entreprises", desc: 'Intégrez notre réseau de partenaires locaux. Événements networking exclusifs entre entreprises partenaires.' },
            { icon: '🎯', title: 'Communication ciblée', desc: 'Touchez une audience locale engagée : 250+ licenciés, familles, et followers sur les réseaux sociaux.' },
        ],
        pricing: {
            bronze: {
                price: 'À partir de 200€',
                features: ['Logo sur le site internet', 'Mention dans nos communications', 'Invitation aux événements du club', '1 publication sur nos réseaux sociaux']
            },
            silver: {
                price: 'À partir de 500€',
                features: ['Tout le pack Bronze +', 'Logo sur les banderoles événements', 'Encart dans le bulletin du club', '3 publications sur nos réseaux sociaux', '1 session sport entreprise offerte']
            },
            gold: {
                price: 'À partir de 1 000€',
                features: ['Tout le pack Argent +', 'Logo sur les maillots de compétition', 'Stand dédié lors des événements', 'Publications illimitées réseaux sociaux', 'Sessions sport entreprise illimitées', 'Invitation VIP aux événements']
            }
        }
    },
    pricingPage: {
        heroTitle: 'Tarifs & Inscriptions',
        heroSubtitle: 'Saison 2025 / 2026',
        sectionLabel: 'Adhésion',
        sectionTitle: 'Nos tarifs annuels',
        sectionSubtitle: 'Choisissez la licence adaptée à votre pratique.',
        competitionTitle: '🏆 Licence Compétition',
        competitionDesc: "Athlétisme, Cross, Running, Trail ou Marche Nordique. Permet d'accéder à toutes les compétitions et de marquer des points au classement FFA.",
        runningTitle: '🏃‍♂️ Licence Running ou Santé',
        runningDesc: 'Running, Trail ou Marche Nordique. Suffisante pour participer à des courses hors stade. La licence Santé permet seulement la pratique en entraînement.',
        optionsTitle: '➕ Options & Réductions',
        notes: [
            "(1) Permet l'accès à la Préparation Physique Générale (mercredi à Nouvoitou) et à la Musculation Athlétisme (mercredi à Noyal) (avec priorité aux jeunes concourant à haut niveau).",
            "(2) A Nouvoitou, seuls les enfants des années 2017 et 2018 sont acceptés."
        ],
        ctaButton: "S'inscrire sur MonClub",
        ctaSubtext: "Paiement en ligne sécurisé, Chèques Vacances et Coupons Sport acceptés."
    },
    clubPage: {
        heroTitle: "L'Esprit ACHV",
        heroSubtitle: "Plus qu'un club d'athlétisme — une communauté passionnée à Noyal & Nouvoitou",
        introTitle: "L'athlétisme pour tous",
        description: "L'Athletic Club Haute Vilaine (ACHV) est une section du Haute Bretagne Athlétisme (HBA). Notre club réunit des passionnés d'athlétisme de tous niveaux et tous âges. Basé sur les communes de Noyal-sur-Vilaine et Nouvoitou, nous proposons un encadrement de qualité avec des entraîneurs diplômés FFA pour accompagner chacun dans ses objectifs sportifs, du loisir à la compétition.",
        image: "/about-team.png",
        affiliationTitle: "🏅 Affiliation HBA",
        affiliationText: "L'ACHV est fière d'être une section du Haute Bretagne Athlétisme (HBA), club majeur de la région. Cette affiliation nous permet d'offrir à nos athlètes l'accès aux compétitions nationales et un encadrement d'excellence.",
        valuesTitle: "Les valeurs qui nous animent",
        facilitiesTitle: "Nos installations",
        facilities: [
            { title: "🏟️ Stade Nominoë", image: "/stade-nominoe.jpg", description: "Piste d'athlétisme synthétique 400m, sautoirs, lancers. Le cœur de l'activité piste à Noyal-sur-Vilaine." },
            { title: "🧘 Salle des Korrigans", image: "/salle-korrigans.jpg", description: "Espace dédié pour les séances de PPG, Fitness et Athlé Santé en intérieur. Confort et matériel adapté." },
            { title: "🌲 Complexe Nouvoitou", image: "/complexe-nouvoitou.jpg", description: "Site d'entraînement pour l'école d'athlétisme et point de départ de nombreux circuits trail et marche." }
        ],
        teamTitle: "L'équipe dirigeante & technique",
        teamSubtitle: "Une équipe de bénévoles et de professionnels engagés pour le club.",
        ctaTitle: "Envie de nous rejoindre ?",
        ctaText: "Que vous soyez débutant ou confirmé, il y a une place pour vous à l'ACHV."
    },
    contactPage: {
        heroTitle: "Contact",
        heroSubtitle: "Contactez-nous pour toute question",
        addressTitle: "📍 Adresse",
        socialTitle: "🔗 Réseaux sociaux",
        linksTitle: "🌐 Liens utiles"
    },
    activitesPage: {
        heroTitle: "Nos Activités",
        heroSubtitle: "Toutes les disciplines de l'ACHV",
        planningTitle: "📅 Planning des Entraînements",
        planningSubtitle: "Saison 2025/2026 • Retrouvez ci-dessous les créneaux par catégorie.",
        planningLocation: "📍 Noyal-sur-Vilaine (Stade Nominoë / Salle Korrigans) — Nouvoitou (Complexe Sportif)"
    },
    actualitesPage: {
        heroTitle: "Actualités",
        heroSubtitle: "Toutes les news de l'ACHV"
    },
    agendaPage: {
        heroTitle: "Agenda",
        heroSubtitle: "Les prochains rendez-vous de l'ACHV"
    },
    resultatsPage: {
        heroTitle: "Résultats de compétitions",
        heroSubtitle: "Retrouvez les performances de nos athlètes sur toutes les disciplines",
        latestTitle: "🔥 Derniers résultats"
    },
    recordsPage: {
        heroTitle: "Records du Club",
        heroSubtitle: "Les meilleures performances de l'ACHV, stade et hors stade, toutes catégories"
    }
};

const defaultArticles: Article[] = [
    { id: '1', title: 'Un week-end indoor intense et réussi pour l\'ACHV', content: 'Retour sur un week-end de compétitions indoor remarquable pour les athlètes de l\'ACHV et du collectif HBA. De belles performances individuelles et collectives à tous les niveaux ! Nos jeunes athlètes se sont particulièrement distingués.', excerpt: 'Retour sur un week-end de compétitions indoor remarquable...', date: '2026-01-12', category: 'Compétitions', published: true, city: 'Les deux' },
    { id: '2', title: 'Assemblée Générale pleine d\'énergie', content: 'L\'assemblée générale de l\'ACHV s\'est tenue avec succès. Bilan positif de la saison écoulée et de nombreux projets ambitieux pour la nouvelle saison.', excerpt: 'AG réussie avec un bilan positif et des projets ambitieux...', date: '2025-12-07', category: 'Vie du club', published: true, city: 'Les deux' },
    { id: '3', title: '50+ marcheurs mobilisés pour le Téléthon', content: 'Belle mobilisation de nos marcheurs nordiques pour le Téléthon de Noyal-sur-Vilaine. Un bel événement solidaire qui a rassemblé la communauté.', excerpt: 'Belle mobilisation solidaire pour le Téléthon...', date: '2025-12-06', category: 'Événements', published: true, city: 'Noyal' },
    { id: '4', title: 'Charlie Gourlaouen, 2ᵉ au Grand Ménestrail', content: 'Superbe performance de Charlie qui termine 2ème sur le Grand Ménestrail (56 km). Une course exigeante et un résultat remarquable qui fait la fierté du club.', excerpt: 'Superbe 2ème place au Grand Ménestrail (56 km)...', date: '2025-12-22', category: 'Compétitions', published: true, city: 'Les deux' },
    { id: '5', title: 'Sortie trail nocturne de février', content: 'Découvrez la sortie nocturne de février : lampes frontales obligatoires, parcours de 15km dans les chemins de Noyal. Ambiance garantie !', excerpt: 'Trail nocturne en février — ambiance garantie !', date: '2026-02-01', category: 'Sorties', published: true, city: 'Noyal' },
    { id: '6', title: 'La Grimpette 2025 — Coësmes', content: 'Nos marcheurs nordiques à l\'honneur lors de la Grimpette 2025 à Coësmes. Bravo à tous les participants, podiums et ambiance au top !', excerpt: 'Nos marcheurs nordiques brillent à la Grimpette...', date: '2025-12-01', category: 'Compétitions', published: true, city: 'Les deux' },
];

const defaultEvents: Event[] = [
    { id: '1', title: 'Neveztell Trail', date: '2025-10-17', dateEnd: '2025-10-19', location: 'Nouvoitou', description: 'Le trail emblématique de l\'ACHV — 12km, 25km et 45km' },
    { id: '2', title: 'Relais Run\'in Noyal', date: '2026-06-12', location: 'Noyal-sur-Vilaine', description: 'Course relais conviviale par équipes' },
    { id: '3', title: 'Cross départemental', date: '2026-01-25', location: 'Rennes', description: 'Championnats départementaux de cross-country' },
    { id: '4', title: 'Trail nocturne', date: '2026-02-15', location: 'Noyal-sur-Vilaine', description: 'Sortie trail nocturne 15km — lampes frontales requises' },
];

const defaultTeam: TeamMember[] = [
    { id: '1', name: 'Président(e)', role: 'Président(e)', category: 'bureau' },
    { id: '2', name: 'Secrétaire', role: 'Secrétaire', category: 'bureau' },
    { id: '3', name: 'Trésorier(e)', role: 'Trésorier(e)', category: 'bureau' },
    { id: '4', name: 'Coach Piste', role: 'Entraîneur Piste — Diplômé FFA', category: 'coach' },
    { id: '5', name: 'Coach Trail', role: 'Entraîneur Trail / Route', category: 'coach' },
    { id: '6', name: 'Coach Marche Nordique', role: 'Encadrant Marche Nordique', category: 'coach' },
];

const defaultActivities: Activity[] = [
    { id: '1', title: 'Piste & Stade', description: 'Entraînements sur piste pour tous niveaux : sprint, demi-fond, fond, sauts, lancers. Séances encadrées par des coaches diplômés FFA.', schedule: 'Mardi et Jeudi 18h30-20h', image: '/activity-track.png' },
    { id: '2', title: 'Trail', description: 'Sorties nature et sentiers pour découvrir les paysages locaux. Travail de dénivelé et technicité.', schedule: 'Samedi 9h (Sortie longue)', image: '/activity-trail.png' },
    { id: '3', title: 'Marche Nordique', description: 'Séances de marche nordique encadrées dans un cadre naturel exceptionnel, pour la forme et la convivialité.', schedule: 'Lundi et Vendredi 9h30', image: '/activity-nordic.png' },
    { id: '4', title: 'Cross', description: 'Préparation et participation aux compétitions de cross-country. Entraînements spécifiques saison hivernale.', schedule: 'Saison hivernale', image: '/activity-cross.png' },
    { id: '5', title: 'Fitness / Athlé Santé', description: 'Séances de Pilates, Renforcement musculaire et Circuit Training adaptées à tous les niveaux. Idéal pour améliorer votre condition physique générale dans une ambiance conviviale.', schedule: 'Lundi 18h30 (Pilates), Mardi 19h45 (Renfo), Jeudi 19h45 (Circuit)', image: '/activity-fitness.png' },
    { id: '6', title: 'Course sur Route', description: 'Séances variées sur route (endurance, seuil, VMA) pour préparer vos objectifs du 10km au marathon. Groupes de niveaux.', schedule: 'Mercredi 18h30', image: '/activity-road.png' },
];

const defaultPartners: Partner[] = [
    { id: '1', name: 'Intersport', url: 'https://b1.intersport-boutique-club.fr/336-hba-athletisme', tier: 'gold', logo: '/partners/intersport.png', description: 'Équipementier officiel du club. Remises exclusives pour les licenciés ACHV.' },
    { id: '2', name: 'Mairie de Noyal-sur-Vilaine', url: '#', tier: 'gold', logo: '/partners/noyal.png', description: 'Soutien institutionnel, mise à disposition des infrastructures sportives et subventions.' },
    { id: '3', name: 'Mairie de Nouvoitou', url: '#', tier: 'gold', logo: '/partners/nouvoitou.png', description: 'Partenaire institutionnel pour le développement de l\'athlétisme sur la commune.' },

    { id: '4', name: 'Haute Bretagne Athlétisme', url: 'https://hautebretagneathletisme.fr', tier: 'silver', logo: '/partners/hba.jpg', description: 'Club multi-sections regroupant les sections athlétisme du territoire.' },
];

const defaultSchedule: ScheduleItem[] = [
    // Athlétisme à Noyal sur Vilaine, stade Paul Ricard
    { id: '1', category: 'Adultes Piste', discipline: 'Athlétisme', ageGroup: 'Cadets et +', dayTime: 'Lundi 18h00 - 20h00', location: 'Stade Paul Ricard', city: 'Noyal' },
    { id: '2', category: 'Jeunes', discipline: 'Lancer, cross ou sauts', ageGroup: 'Benjamins et +', dayTime: 'Mardi 18h00 - 19h15', location: 'Stade Paul Ricard', city: 'Noyal' },
    { id: '3', category: 'Adultes Piste', discipline: 'Musculation Athlétisme', ageGroup: 'Cadets et +', dayTime: 'Mercredi 17h30 - 19h15', location: 'Stade Paul Ricard', city: 'Noyal' },
    { id: '4', category: 'Jeunes', discipline: 'Athlétisme', ageGroup: 'Minimes et +', dayTime: 'Jeudi 18h30 - 20h00', location: 'Stade Paul Ricard', city: 'Noyal' },
    { id: '5', category: 'Jeunes', discipline: 'Athlétisme Eveils', ageGroup: 'Eveils', dayTime: 'Samedi 10h00 - 11h30', location: 'Stade Paul Ricard', city: 'Noyal' },
    { id: '6', category: 'Jeunes', discipline: 'Athlétisme', ageGroup: 'Poussins à Masters', dayTime: 'Samedi 10h00 - 12h00', location: 'Stade Paul Ricard', city: 'Noyal' },
    { id: '7', category: 'Adultes Piste', discipline: 'Athlétisme', ageGroup: 'Poussins à Masters', dayTime: 'Samedi 10h00 - 12h00', location: 'Stade Paul Ricard', city: 'Noyal' },

    // Athlétisme à Nouvoitou, stade de Nouvoitou
    { id: '8', category: 'Jeunes', discipline: 'Athlétisme Eveils / Poussins / Benjamins', ageGroup: 'Eveils, Poussins, Benjamins', dayTime: 'Mercredi 14h00 - 16h00', location: 'Stade de Nouvoitou', city: 'Nouvoitou' },
    { id: '9', category: 'Jeunes', discipline: 'Athlétisme Minimes', ageGroup: 'Minimes', dayTime: 'Mercredi 14h00 - 16h00', location: 'Stade de Nouvoitou', city: 'Nouvoitou' },
    { id: '10', category: 'Forme & Santé', discipline: 'Préparation Physique Générale', ageGroup: 'Tous niveaux', dayTime: 'Mercredi 19h00 - 20h00', location: 'Stade de Nouvoitou', city: 'Nouvoitou' },

    // Marche nordique
    { id: '11', category: 'Marche Nordique', discipline: 'Marche Nordique', ageGroup: 'Tous niveaux', dayTime: 'Mardi 09h00 - 11h00', location: 'Noyal / Nouvoitou', city: 'Les deux' },
    { id: '12', category: 'Marche Nordique', discipline: 'Marche Nordique', ageGroup: 'Tous niveaux', dayTime: 'Mardi 18h30 - 20h45', location: 'Noyal / Nouvoitou', city: 'Les deux' },
    { id: '13', category: 'Marche Nordique', discipline: 'Marche Nordique', ageGroup: 'Tous niveaux', dayTime: 'Jeudi 09h00 - 11h00', location: 'Noyal / Nouvoitou', city: 'Les deux' },
    { id: '14', category: 'Marche Nordique', discipline: 'Marche Nordique', ageGroup: 'Tous niveaux', dayTime: 'Jeudi 18h30 - 20h45', location: 'Noyal / Nouvoitou', city: 'Les deux' },
    { id: '15', category: 'Marche Nordique', discipline: 'Marche Nordique', ageGroup: 'Tous niveaux', dayTime: 'Samedi 09h00 - 11h15', location: 'Noyal / Nouvoitou', city: 'Les deux' },

    // Running
    { id: '16', category: 'Adultes Hors-Stade', discipline: 'Running', ageGroup: 'Tous niveaux', dayTime: 'Mardi 18h30 - 20h00', location: 'Noyal', city: 'Noyal' },
    { id: '17', category: 'Adultes Hors-Stade', discipline: 'Running', ageGroup: 'Tous niveaux', dayTime: 'Jeudi 18h30 - 20h00', location: 'Noyal', city: 'Noyal' },
    { id: '18', category: 'Adultes Hors-Stade', discipline: 'Running', ageGroup: 'Tous niveaux', dayTime: 'Samedi 10h00 - 12h00', location: 'Noyal', city: 'Noyal' },
    { id: '19', category: 'Adultes Hors-Stade', discipline: 'Running', ageGroup: 'Tous niveaux', dayTime: 'Dimanche 09h00 - 11h00', location: 'Noyal', city: 'Noyal' },
    { id: '20', category: 'Adultes Hors-Stade', discipline: 'Running', ageGroup: 'Tous niveaux', dayTime: 'Mardi 19h00 - 20h30', location: 'Nouvoitou', city: 'Nouvoitou' },
    { id: '21', category: 'Adultes Hors-Stade', discipline: 'Running', ageGroup: 'Tous niveaux', dayTime: 'Jeudi 19h00 - 20h30', location: 'Nouvoitou', city: 'Nouvoitou' },

    // Trail
    { id: '22', category: 'Adultes Hors-Stade', discipline: 'Trail', ageGroup: 'Tous niveaux', dayTime: 'Samedi 10h00 - 11h30', location: 'Nouvoitou', city: 'Nouvoitou' },
    { id: '23', category: 'Adultes Hors-Stade', discipline: 'Trail', ageGroup: 'Tous niveaux', dayTime: 'Samedi 09h45 - 11h45', location: 'Noyal', city: 'Noyal' },

    // Fitness - Salle de Korrigans
    { id: '24', category: 'Forme & Santé', discipline: 'Pilates', ageGroup: 'Adultes', dayTime: 'Lundi 18h30 - 19h30', location: 'Salle des Korrigans', city: 'Noyal' },
    { id: '25', category: 'Forme & Santé', discipline: 'Pilates', ageGroup: 'Adultes', dayTime: 'Mardi 18h30 - 19h30', location: 'Salle des Korrigans', city: 'Noyal' },
    { id: '26', category: 'Forme & Santé', discipline: 'Renforcement musculaire', ageGroup: 'Adultes', dayTime: 'Mardi 19h45 - 20h45', location: 'Salle des Korrigans', city: 'Noyal' },
    { id: '27', category: 'Forme & Santé', discipline: 'Circuit training', ageGroup: 'Adultes', dayTime: 'Jeudi 19h45 - 20h45', location: 'Salle des Korrigans', city: 'Noyal' },
];

const defaultCustomPages: CustomPage[] = [];

const defaultResults: Result[] = [
    { id: '1', date: '2026-01-12', competition: 'Meeting Indoor Rennes', discipline: 'piste', athletes: [{ name: 'Lucas Martin', performance: '2\'05"40', category: 'Senior', rank: '3e' }, { name: 'Emma Dupont', performance: '2\'25"10', category: 'Espoir', rank: '5e' }], location: 'Rennes' },
    { id: '2', date: '2026-01-25', competition: 'Cross départemental', discipline: 'cross', athletes: [{ name: 'Charlie Gourlaouen', performance: '35\'12"', category: 'Senior', rank: '2e' }], location: 'Rennes' },
    { id: '3', date: '2025-12-22', competition: 'Grand Ménestrail', discipline: 'trail', athletes: [{ name: 'Charlie Gourlaouen', performance: '5h42\'15"', category: 'Senior', rank: '2e' }], location: 'Menestrail' },
    { id: '4', date: '2025-12-01', competition: 'La Grimpette 2025', discipline: 'marche-nordique', athletes: [{ name: 'Marie Lebreton', performance: '1h15\'00"', category: 'V1', rank: '1ère' }, { name: 'Jean-Pierre Morel', performance: '1h18\'30"', category: 'V2', rank: '3e' }], location: 'Coësmes' },
    { id: '5', date: '2026-02-01', competition: 'Semi-marathon de Rennes', discipline: 'route', athletes: [{ name: 'Thomas Berger', performance: '1h22\'45"', category: 'Senior', rank: '15e' }], location: 'Rennes' },
];

const defaultRecords: ClubRecord[] = [
    // STADE - Hommes
    { id: '1', type: 'stade', event: '100m', category: 'Senior', gender: 'M', athlete: 'Lucas Martin', performance: '11"25', date: '2025-06-15', location: 'Rennes' },
    { id: '2', type: 'stade', event: '200m', category: 'Senior', gender: 'M', athlete: 'Lucas Martin', performance: '23"10', date: '2025-07-05', location: 'Pacé' },
    { id: '3', type: 'stade', event: '400m', category: 'Senior', gender: 'M', athlete: 'Nicolas Chevrier', performance: '52"80', date: '2024-05-20', location: 'Rennes' },
    { id: '4', type: 'stade', event: '800m', category: 'Senior', gender: 'M', athlete: 'Thomas Berger', performance: '2\'02"50', date: '2025-06-28', location: 'Saint-Malo' },
    { id: '5', type: 'stade', event: '1500m', category: 'Senior', gender: 'M', athlete: 'Thomas Berger', performance: '4\'12"30', date: '2025-05-10', location: 'Rennes' },
    { id: '6', type: 'stade', event: '5000m', category: 'Senior', gender: 'M', athlete: 'Charlie Gourlaouen', performance: '16\'05"00', date: '2024-09-14', location: 'Cesson-Sévigné' },
    { id: '7', type: 'stade', event: '3000m Steeple', category: 'Senior', gender: 'M', athlete: 'Maxime Roux', performance: '10\'15"00', date: '2025-06-01', location: 'Rennes' },
    // STADE - Femmes
    { id: '8', type: 'stade', event: '100m', category: 'Senior', gender: 'F', athlete: 'Emma Dupont', performance: '13"05', date: '2025-06-15', location: 'Rennes' },
    { id: '9', type: 'stade', event: '800m', category: 'Senior', gender: 'F', athlete: 'Emma Dupont', performance: '2\'22"10', date: '2025-07-12', location: 'Pacé' },
    { id: '10', type: 'stade', event: '1500m', category: 'Senior', gender: 'F', athlete: 'Sophie Laurent', performance: '5\'01"80', date: '2025-05-10', location: 'Rennes' },
    // STADE - Jeunes
    { id: '11', type: 'stade', event: '1000m', category: 'Cadet', gender: 'M', athlete: 'Antoine Petit', performance: '2\'52"00', date: '2025-06-22', location: 'Rennes' },
    { id: '12', type: 'stade', event: '100m', category: 'Cadet', gender: 'F', athlete: 'Léa Moreau', performance: '13"50', date: '2025-05-18', location: 'Pacé' },
    // HORS-STADE
    { id: '13', type: 'hors-stade', event: '10 km', category: 'Senior', gender: 'M', athlete: 'Thomas Berger', performance: '34\'15"', date: '2025-03-08', location: 'Rennes' },
    { id: '14', type: 'hors-stade', event: 'Semi-marathon', category: 'Senior', gender: 'M', athlete: 'Charlie Gourlaouen', performance: '1h15\'20"', date: '2024-10-20', location: 'Vannes' },
    { id: '15', type: 'hors-stade', event: 'Marathon', category: 'Senior', gender: 'M', athlete: 'Charlie Gourlaouen', performance: '2h45\'30"', date: '2024-04-14', location: 'Paris' },
    { id: '16', type: 'hors-stade', event: '10 km', category: 'Senior', gender: 'F', athlete: 'Emma Dupont', performance: '40\'25"', date: '2025-03-08', location: 'Rennes' },
    { id: '17', type: 'hors-stade', event: 'Semi-marathon', category: 'Senior', gender: 'F', athlete: 'Sophie Laurent', performance: '1h32\'45"', date: '2024-10-20', location: 'Vannes' },
    { id: '18', type: 'hors-stade', event: 'Cross court', category: 'Senior', gender: 'M', athlete: 'Charlie Gourlaouen', performance: '25\'40"', date: '2025-01-25', location: 'Rennes' },
    { id: '19', type: 'hors-stade', event: 'Cross long', category: 'Senior', gender: 'M', athlete: 'Thomas Berger', performance: '38\'10"', date: '2025-01-25', location: 'Rennes' },
];

const defaultPricing: PricingItem[] = [
    // LICENCE COMPETITION
    { id: '1', category: 'Competition', activity: 'Éveil Athlé (2)', licenseType: 'Découverte', birthYears: '2017 à 2019', price: '120,00 €', monClubCode: '0101', order: 1 },
    { id: '2', category: 'Competition', activity: 'Poussin', licenseType: 'Découverte', birthYears: '2015 – 2016', price: '120,00 €', monClubCode: '0102', order: 2 },
    { id: '3', category: 'Competition', activity: 'Benjamin', licenseType: 'Compétition', birthYears: '2013 – 2014', price: '125,00 €', monClubCode: '0103', order: 3 },
    { id: '4', category: 'Competition', activity: 'Minime', licenseType: 'Compétition', birthYears: '2011 – 2012', price: '130,00 €', monClubCode: '0104', order: 4 },
    { id: '5', category: 'Competition', activity: 'Cadet', licenseType: 'Compétition', birthYears: '2009 – 2010', price: '140,00 €', monClubCode: '0105', order: 5 },
    { id: '6', category: 'Competition', activity: 'Junior', licenseType: 'Compétition', birthYears: '2007 – 2008', price: '140,00 €', monClubCode: '0106', order: 6 },
    { id: '7', category: 'Competition', activity: 'Espoir', licenseType: 'Compétition', birthYears: '2004 à 2006', price: '150,00 €', monClubCode: '0107', order: 7 },
    { id: '8', category: 'Competition', activity: 'Senior', licenseType: 'Compétition', birthYears: '1992 à 2003', price: '155,00 €', monClubCode: '0108', order: 8 },
    { id: '9', category: 'Competition', activity: 'Master', licenseType: 'Compétition', birthYears: '1991 et avant', price: '155,00 €', monClubCode: '0109', order: 9 },
    // MAILLOT
    { id: '10', category: 'Autre', activity: 'Maillot Compétition (obligatoire)', licenseType: '-', birthYears: '-', price: '35,00 €', monClubCode: '1001', comment: 'Sauf Eveil, Poussin et Benjamin', order: 10 },
    // RUNNING / SANTE
    { id: '11', category: 'RunningSante', activity: 'Running', licenseType: 'Running ou Santé', birthYears: '2009 et avant', price: '125,00 €', monClubCode: '0001', order: 11 },
    { id: '12', category: 'RunningSante', activity: 'Marche Nordique', licenseType: 'Running ou Santé', birthYears: '2009 et avant', price: '125,00 €', monClubCode: '0003', order: 12 },
    { id: '13', category: 'RunningSante', activity: 'Trail', licenseType: 'Running ou Santé', birthYears: '2009 et avant', price: '125,00 €', monClubCode: '0002', order: 13 },
    { id: '14', category: 'RunningSante', activity: 'Fitness : circuit, renfo, pilates', licenseType: 'Sans licence', birthYears: '2009 et avant', price: '150,00 €', monClubCode: '0501', order: 14 },
    // REDUCTION
    { id: '15', category: 'Autre', activity: 'Réduction famille', licenseType: '-', birthYears: '-', price: '20,00 €', monClubCode: '-', comment: 'Applicable 1 fois dès 3 adhésions à taux plein', order: 15 },
];

const defaultSocialPosts: SocialPost[] = [
    {
        id: '101',
        platform: 'instagram',
        content: "Les résultats qui font vibrer l’ACHV 🔥 Encore un week-end ultra dense pour le club ! Pré-France U18, Championnat départemental minimes... Bravo à tous nos athlètes pour leurs performances. 🏃‍♂️💨",
        date: '2026-02-12',
        imageUrl: '/social/insta-1.jpg',
        postUrl: 'https://www.instagram.com/achv_athle/p/DUoeYi9Denh/'
    },
    {
        id: '102',
        platform: 'instagram',
        content: "🇫🇷 Direction Miramas pour le Championnat de France d’épreuves combinées et de marche ! Tous derrière Chloé et Elsa qui représentent fièrement nos couleurs. Allez les filles ! 💪 #ACHV #France",
        date: '2026-02-08',
        imageUrl: '/social/insta-2.jpg',
        postUrl: 'https://www.instagram.com/achv_athle/p/DUdbMddjRgr/'
    },
    {
        id: '103',
        platform: 'instagram',
        content: "Retour en images sur le Championnat de Bretagne de Cross à Carnac 📹 Des parcours exigeants mais une ambiance de folie ! Bravo à la #TeamACHV 🖤🤍",
        date: '2026-02-06',
        imageUrl: '/activity-cross.png',
        postUrl: 'https://www.instagram.com/achv_athle/reel/DUYvrHZjbyc/'
    },
    {
        id: '104',
        platform: 'facebook',
        content: "🚨 Rappel : Assemblée Générale du club ce vendredi à 19h30 salle Tréma. Venez nombreux pour faire le bilan de la saison et préparer la suite ! 🥤 Un pot de l'amitié suivra.",
        date: '2026-02-10',
        imageUrl: '/hero-club.jpg',
        postUrl: '#'
    },
    {
        id: '105',
        platform: 'facebook',
        content: "Album photo du week-end en ligne ! 📸 Merci à nos photographes bénévoles pour ces superbes clichés des départementaux.",
        date: '2026-02-03',
        imageUrl: '/activity-track.png',
        postUrl: '#'
    },
    {
        id: '106',
        platform: 'linkedin',
        content: "L'ACHV est fier de renouveler son partenariat avec Super U Noyal pour la saison 2026/2027. Un soutien précieux pour le développement de notre école d'athlétisme. 🤝 #Sponsoring #Sport #Local",
        date: '2026-01-28',
        imageUrl: '/achv-team.jpg',
        postUrl: '#'
    },
    {
        id: '107',
        platform: 'youtube',
        content: "Aftermovie - Foulées de Noyal 2025 🎥 Revivez les meilleurs moments de cette édition record !",
        date: '2025-12-15',
        imageUrl: '/activity-road.png',
        postUrl: '#'
    }
];

const DataContext = createContext<DataContextType | null>(null);

// Utility for basic deep nesting preservation
const mergeSettings = (stored: any, defaults: SiteSettings): SiteSettings => {
    return {
        ...defaults,
        ...stored,
        socialVisibility: { ...defaults.socialVisibility, ...(stored?.socialVisibility || {}) },
        partnersPage: { ...defaults.partnersPage, ...(stored?.partnersPage || {}) },
        pricingPage: { ...defaults.pricingPage, ...(stored?.pricingPage || {}) },
        clubPage: { ...defaults.clubPage, ...(stored?.clubPage || {}) },
        contactPage: { ...defaults.contactPage, ...(stored?.contactPage || {}) },
        activitesPage: { ...defaults.activitesPage, ...(stored?.activitesPage || {}) },
        actualitesPage: { ...defaults.actualitesPage, ...(stored?.actualitesPage || {}) },
        agendaPage: { ...defaults.agendaPage, ...(stored?.agendaPage || {}) },
        resultatsPage: { ...defaults.resultatsPage, ...(stored?.resultatsPage || {}) },
        recordsPage: { ...defaults.recordsPage, ...(stored?.recordsPage || {}) },
        instagramPostUrl: stored?.instagramPostUrl || defaults.instagramPostUrl,
        featuredPostUrls: stored?.featuredPostUrls || defaults.featuredPostUrls,
        instagramAccessToken: stored?.instagramAccessToken || '',
        facebookAccessToken: stored?.facebookAccessToken || '',
        facebookPageId: stored?.facebookPageId || '',
        youtubeApiKey: stored?.youtubeApiKey || '',
        youtubeChannelId: stored?.youtubeChannelId || '',
    };
};

export function DataProvider({ children }: { children: ReactNode }) {
    const [articles, setArticlesState] = useState<Article[]>([]);
    const [events, setEventsState] = useState<Event[]>([]);
    const [team, setTeamState] = useState<TeamMember[]>([]);
    const [activities, setActivitiesState] = useState<Activity[]>([]);
    const [partners, setPartnersState] = useState<Partner[]>([]);
    const [customPages, setCustomPagesState] = useState<CustomPage[]>([]);
    const [results, setResultsState] = useState<Result[]>([]);
    const [records, setRecordsState] = useState<ClubRecord[]>([]);
    const [schedules, setSchedulesState] = useState<ScheduleItem[]>([]);
    const [pricing, setPricingState] = useState<PricingItem[]>([]);
    const [socialPosts, setSocialPostsState] = useState<SocialPost[]>([]);
    const [settings, setSettingsState] = useState<SiteSettings>(defaultSettings);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const unsub = onSnapshot(doc(db, 'site', 'achv'), (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                if (data.articles) setArticlesState(data.articles);
                if (data.events) setEventsState(data.events);
                if (data.team) setTeamState(data.team);
                if (data.activities) setActivitiesState(data.activities);

                // Partners migration: Sync logos from code to DB, but respect user edits
                if (data.partners) {
                    const mergedPartners = data.partners.map((p: Partner) => {
                        const defaultP = defaultPartners.find(dp => dp.id === p.id);
                        if (defaultP) {
                            // Force update for HBA logo to ensure new file is used
                            if (p.id === '4') return { ...p, logo: defaultP.logo };

                            // For others: respect user edits if present, else use default
                            return { ...p, logo: p.logo || defaultP.logo };
                        }
                        return p;
                    });

                    // Check if update is needed
                    const needsUpdate = JSON.stringify(mergedPartners) !== JSON.stringify(data.partners);

                    if (needsUpdate) {
                        console.log("Syncing partners data with code...");
                        setPartnersState(mergedPartners);
                        // Save quietly
                        setDoc(doc(db, 'site', 'achv'), { partners: mergedPartners }, { merge: true })
                            .catch(err => console.error("Sync error:", err));
                    } else {
                        setPartnersState(data.partners);
                    }
                } else {
                    setPartnersState(defaultPartners);
                }

                if (data.customPages) setCustomPagesState(data.customPages);
                if (data.results) setResultsState(data.results);
                if (data.records) setRecordsState(data.records);
                if (data.schedules) setSchedulesState(data.schedules);
                if (data.pricing) setPricingState(data.pricing);
                if (data.socialPosts) setSocialPostsState([...data.socialPosts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
                if (data.settings) setSettingsState(mergeSettings(data.settings, defaultSettings));
            } else {
                // Initialize Firestore with defaults if empty
                const initialData = {
                    articles: defaultArticles,
                    events: defaultEvents,
                    team: defaultTeam,
                    activities: defaultActivities,
                    partners: defaultPartners,
                    customPages: defaultCustomPages,
                    results: defaultResults,
                    records: defaultRecords,
                    schedules: defaultSchedule,
                    pricing: defaultPricing,
                    socialPosts: defaultSocialPosts,
                    settings: defaultSettings
                };
                setDoc(doc(db, 'site', 'achv'), initialData).catch(console.error);

                setArticlesState(defaultArticles);
                setEventsState(defaultEvents);
                setTeamState(defaultTeam);
                setActivitiesState(defaultActivities);
                setPartnersState(defaultPartners);
                setCustomPagesState(defaultCustomPages);
                setResultsState(defaultResults);
                setRecordsState(defaultRecords);
                setSchedulesState(defaultSchedule);
                setPricingState(defaultPricing);
                setSocialPostsState(defaultSocialPosts);
                setSettingsState(defaultSettings);
            }
            setLoaded(true);
        }, (error) => {
            console.error("Firestore Error:", error);
            // Fallback to defaults on error
            setArticlesState(defaultArticles);
            setEventsState(defaultEvents);
            setTeamState(defaultTeam);
            setActivitiesState(defaultActivities);
            setPartnersState(defaultPartners);
            setCustomPagesState(defaultCustomPages);
            setResultsState(defaultResults);
            setRecordsState(defaultRecords);
            setSchedulesState(defaultSchedule);
            setPricingState(defaultPricing);
            setSocialPostsState(defaultSocialPosts);
            setSettingsState(defaultSettings);
            setLoaded(true);
        });

    }, []);

    const saveToFirestore = async (key: string, data: any) => {
        try {
            await setDoc(doc(db, 'site', 'achv'), { [key]: data }, { merge: true });
        } catch (error: any) {
            console.error("Error saving to Firestore:", error);
            alert(`Erreur de sauvegarde automatique : ${error.message}\n\nSi l'erreur mentionne "size" ou "quota", la base de données est trop pleine. Il faudra supprimer des éléments volumineux.`);
        }
    };

    const setArticles = (a: Article[]) => { setArticlesState(a); saveToFirestore('articles', a); };
    const setEvents = (e: Event[]) => { setEventsState(e); saveToFirestore('events', e); };
    const setTeam = (t: TeamMember[]) => { setTeamState(t); saveToFirestore('team', t); };
    const setActivities = (a: Activity[]) => { setActivitiesState(a); saveToFirestore('activities', a); };
    const setPartners = (p: Partner[]) => { setPartnersState(p); saveToFirestore('partners', p); };
    const setCustomPages = (p: CustomPage[]) => { setCustomPagesState(p); saveToFirestore('customPages', p); };
    const setResults = (r: Result[]) => { setResultsState(r); saveToFirestore('results', r); };
    const setRecords = (r: ClubRecord[]) => { setRecordsState(r); saveToFirestore('records', r); };
    const setSchedules = (s: ScheduleItem[]) => { setSchedulesState(s); saveToFirestore('schedules', s); };
    const setPricing = (p: PricingItem[]) => { setPricingState(p); saveToFirestore('pricing', p); };
    const setSocialPosts = (p: SocialPost[]) => {
        const sorted = [...p].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setSocialPostsState(sorted);
        saveToFirestore('socialPosts', sorted);
    };
    const setSettings = (s: SiteSettings) => { setSettingsState(s); saveToFirestore('settings', s); };

    const addArticle = (a: Article) => setArticles([a, ...articles]);
    const updateArticle = (id: string, data: Partial<Article>) => setArticles(articles.map(a => a.id === id ? { ...a, ...data } : a));
    const deleteArticle = (id: string) => setArticles(articles.filter(a => a.id !== id));

    const addEvent = (e: Event) => setEvents([e, ...events]);
    const updateEvent = (id: string, data: Partial<Event>) => setEvents(events.map(e => e.id === id ? { ...e, ...data } : e));
    const deleteEvent = (id: string) => setEvents(events.filter(e => e.id !== id));

    const addTeamMember = (t: TeamMember) => setTeam([...team, t]);
    const updateTeamMember = (id: string, data: Partial<TeamMember>) => setTeam(team.map(t => t.id === id ? { ...t, ...data } : t));
    const deleteTeamMember = (id: string) => setTeam(team.filter(t => t.id !== id));

    const addPartner = (p: Partner) => setPartners([...partners, p]);
    const updatePartner = (id: string, data: Partial<Partner>) => setPartners(partners.map(p => p.id === id ? { ...p, ...data } : p));
    const deletePartner = (id: string) => setPartners(partners.filter(p => p.id !== id));

    const addCustomPage = (p: CustomPage) => setCustomPages([...customPages, p]);
    const updateCustomPage = (id: string, data: Partial<CustomPage>) => setCustomPages(customPages.map(p => p.id === id ? { ...p, ...data } : p));
    const deleteCustomPage = (id: string) => setCustomPages(customPages.filter(p => p.id !== id));

    const addResult = (r: Result) => setResults([r, ...results]);
    const updateResult = (id: string, data: Partial<Result>) => setResults(results.map(r => r.id === id ? { ...r, ...data } : r));
    const deleteResult = (id: string) => setResults(results.filter(r => r.id !== id));

    const addRecord = (r: ClubRecord) => setRecords([r, ...records]);
    const updateRecord = (id: string, data: Partial<ClubRecord>) => setRecords(records.map(r => r.id === id ? { ...r, ...data } : r));
    const deleteRecord = (id: string) => setRecords(records.filter(r => r.id !== id));

    const addSchedule = (s: ScheduleItem) => setSchedules([...schedules, s]);
    const updateSchedule = (id: string, data: Partial<ScheduleItem>) => setSchedules(schedules.map(s => s.id === id ? { ...s, ...data } : s));
    const deleteSchedule = (id: string) => setSchedules(schedules.filter(s => s.id !== id));

    const addPricing = (p: PricingItem) => setPricing([...pricing, p]);
    const updatePricing = (id: string, data: Partial<PricingItem>) => setPricing(pricing.map(item => item.id === id ? { ...item, ...data } : item));
    const deletePricing = (id: string) => setPricing(pricing.filter(item => item.id !== id));

    const addSocialPost = (p: SocialPost) => setSocialPosts([p, ...socialPosts]);
    const updateSocialPost = (id: string, data: Partial<SocialPost>) => setSocialPosts(socialPosts.map(p => p.id === id ? { ...p, ...data } : p));
    const deleteSocialPost = (id: string) => setSocialPosts(socialPosts.filter(p => p.id !== id));

    // We always render children to avoid hydration mismatches and allow SSR
    // The data will be default values until Firestore loads on the client


    return (
        <DataContext.Provider value={{
            articles, events, team, activities, partners, customPages, results, records, settings,
            setArticles, setEvents, setTeam, setActivities, setPartners, setCustomPages, setResults, setRecords, setSettings,
            addArticle, updateArticle, deleteArticle,
            addEvent, updateEvent, deleteEvent,
            addTeamMember, updateTeamMember, deleteTeamMember,
            addPartner, updatePartner, deletePartner,
            addCustomPage, updateCustomPage, deleteCustomPage,
            addResult, updateResult, deleteResult,
            addRecord, updateRecord, deleteRecord,
            schedules, setSchedules, addSchedule, updateSchedule, deleteSchedule,
            pricing, setPricing, addPricing, updatePricing, deletePricing,
            socialPosts, setSocialPosts, addSocialPost, updateSocialPost, deleteSocialPost,
        }}>
            {children}
        </DataContext.Provider>
    );
}

export function useData() {
    const ctx = useContext(DataContext);
    if (!ctx) throw new Error('useData must be used within DataProvider');
    return ctx;
}
