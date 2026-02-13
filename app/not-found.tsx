import Link from 'next/link';
import '@/app/globals.css';

export default function NotFound() {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: 'var(--dark)',
            color: 'var(--white)',
            textAlign: 'center',
            padding: '20px'
        }}>
            <h1 style={{ fontSize: '6rem', marginBottom: '0', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: '800' }}>404</h1>
            <h2 style={{ fontSize: '2rem', marginBottom: '20px' }}>Oups ! Vous êtes sorti de la piste.</h2>
            <p style={{ maxWidth: '600px', marginBottom: '40px', color: 'var(--medium-gray)', fontSize: '1.2rem' }}>
                La page que vous cherchez n'existe pas ou a été déplacée. Revenez sur le bon chemin !
            </p>
            <Link href="/" className="btn btn-primary">
                Retour à l'accueil
            </Link>
        </div>
    );
}
