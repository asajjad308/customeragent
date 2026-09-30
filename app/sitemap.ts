import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXTAUTH_URL ?? 'https://supportai.northlane.live';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, lastModified: new Date('2026-09-30'), changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/register`, lastModified: new Date('2026-09-30'), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/login`, lastModified: new Date('2026-09-30'), changeFrequency: 'monthly', priority: 0.3 },
  ];
}
