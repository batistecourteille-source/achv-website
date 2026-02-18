'use client';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html>
            <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#f0f0f0' }}>
                <h2 style={{ fontSize: '24px', marginBottom: '10px' }}>Something went wrong!</h2>
                <p style={{ color: '#666', marginBottom: '20px' }}>Global Error caught.</p>
                <button
                    onClick={() => reset()}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#0070f3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '16px'
                    }}
                >Try again</button>
            </body>
        </html>
    );
}
