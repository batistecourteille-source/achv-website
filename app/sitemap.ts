import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://achv.fr';

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
        },
        {
            url: `${baseUrl}/club`,
            lastModified: new Date(),
        },
        {
            url: `${baseUrl}/actualites`,
            lastModified: new Date(),
        },
        {
            url: `${baseUrl}/agenda`,
            lastModified: new Date(),
        },
        {
            url: `${baseUrl}/activites`,
            lastModified: new Date(),
        },
        {
            url: `${baseUrl}/partenaires`,
            lastModified: new Date(),
        },
        {
            url: `${baseUrl}/tarifs`,
            lastModified: new Date(),
        },
        {
            url: `${baseUrl}/contact`,
            lastModified: new Date(),
        },
    ];
}
