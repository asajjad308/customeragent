import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXTAUTH_URL ?? 'https://supportai.northlane.live';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login', '/register'],
      disallow: ['/api/', '/dashboard', '/admin', '/settings', '/integrations', '/knowledge-base', '/widget', '/suspended'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
