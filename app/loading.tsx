'use client';

export default function Loading() {
    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--dark)',
            zIndex: 9999
        }}>
            <div style={{
                width: '50px',
                height: '50px',
                border: '4px solid rgba(255, 255, 255, 0.1)',
                borderTopColor: 'var(--primary)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
            }} />
            <style jsx>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
