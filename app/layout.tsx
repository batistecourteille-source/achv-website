import type { Metadata } from "next";
import "./globals.css";
import "./components.css";
import "./sections.css";
import "./admin.css";
import "./responsive.css";
import { DataProvider } from "@/lib/DataContext";
import { AuthProvider } from "@/lib/AuthContext";

export const metadata: Metadata = {
    title: "ACHV - Athletic Club Haute Vilaine",
    description: "Site officiel de l'Athletic Club Haute Vilaine, section du Haute Bretagne Athlétisme. Piste, cross, route, trail et marche nordique.",
    keywords: "ACHV, athlétisme, Haute Vilaine, Noyal-sur-Vilaine, Nouvoitou, trail, running, marche nordique, HBA",
    icons: {
        icon: "/logo.png",
        apple: "/logo.png",
    },
    openGraph: {
        title: "ACHV - Athletic Club Haute Vilaine",
        description: "Rejoignez l'Athletic Club Haute Vilaine ! Piste, cross, route, trail et marche nordique à Noyal-sur-Vilaine et Nouvoitou.",
        url: "https://achv.fr",
        siteName: "ACHV",
        images: [
            {
                url: "/achv-team.jpg",
                width: 1200,
                height: 630,
                alt: "Equipe ACHV",
            },
        ],
        locale: "fr_FR",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "ACHV - Athletic Club Haute Vilaine",
        description: "Site officiel de l'Athletic Club Haute Vilaine. Venez courir avec nous !",
        images: ["/achv-team.jpg"],
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="fr">
            <body>
                <AuthProvider>
                    <DataProvider>
                        {children}
                    </DataProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
