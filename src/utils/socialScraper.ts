
export interface ScrapedSocialData {
    Facebook: string | null;
    Instagram: string | null;
    WhatsApp: string | null;
    Telegram: string | null;
}

/**
 * Intenta obtener los contadores de seguidores de las redes sociales usando proxies.
 * ADVERTENCIA: Este método puede fallar debido a restricciones de CORS y bloqueos de las plataformas.
 * Es recomendable usar esto solo como una ayuda para rellenar campos en el panel de administración.
 */
export const scrapeSocialStats = async (): Promise<ScrapedSocialData> => {
    const urls = {
        facebook: 'https://www.facebook.com/debelingoconangel/',
        instagram: 'https://www.instagram.com/debelingoconangel/',
        whatsapp: 'https://whatsapp.com/channel/0029Va8nc2A77qVZokI0aC2K',
        telegram: 'https://t.me/s/debelingoconangel'
    };

    // Helper para hacer fetch con fallback a múltiples proxies
    const fetchWithFallback = async (url: string): Promise<string | null> => {
        const proxies = [
            // Proxy 1: AllOrigins
            async () => {
                const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}&t=${Date.now()}`);
                if (!res.ok) throw new Error('Network response was not ok');
                const data = await res.json();
                return data.contents;
            },
            // Proxy 2: Codetabs
            async () => {
                const res = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`);
                if (!res.ok) throw new Error('Network response was not ok');
                return await res.text();
            },
            // Proxy 3: Corsproxy.io
            async () => {
                const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`);
                if (!res.ok) throw new Error('Network response was not ok');
                return await res.text();
            }
        ];

        for (const proxy of proxies) {
            try {
                const content = await proxy();
                if (content && content.length > 500) return content;
            } catch (err) {
                console.warn(`Proxy failed for ${url}`, err);
                continue;
            }
        }
        return null;
    };

    // Ejecutar peticiones en paralelo
    const [fbContent, igContent, waContent, tgContent] = await Promise.all([
        fetchWithFallback(urls.facebook),
        fetchWithFallback(urls.instagram),
        fetchWithFallback(urls.whatsapp),
        fetchWithFallback(urls.telegram)
    ]);

    // Funciones de parsing robustas
    const parsers = {
        generic: (text: string | null, regexes: RegExp[]) => {
            if (!text) return null;
            for (const regex of regexes) {
                const match = text.match(regex);
                if (match && match[1]) return match[1].trim();
            }
            return null;
        }
    };

    return {
        Facebook: parsers.generic(fbContent, [
            /([0-9\.,]+[KM]?)\s*Me gusta/i,
            /([0-9\.,]+[KM]?)\s*likes/i,
            /"favorites_count":([0-9]+)/,
            /([0-9\s\.,]+)\s*seguidores/i
        ]),
        Instagram: parsers.generic(igContent, [
            /([0-9\.,]+[KM]?)\s*Followers/i,
            /([0-9\.,]+[KM]?)\s*Seguidores/i,
            /"edge_followed_by":{"count":([0-9]+)}/
        ]),
        WhatsApp: parsers.generic(waContent, [
            /([0-9\.,]+[KM]?)\s*followers/i,
            /([0-9\.,]+[KM]?)\s*seguidores/i,
            /"subscriber_count":([0-9]+)/
        ]),
        Telegram: parsers.generic(tgContent, [
            /([0-9\s\.,]+)\s*subscribers/i,
            /([0-9\s\.,]+)\s*suscriptores/i,
            /class="tgme_page_extra">\s*([0-9\s\.,]+)\s*subscribers/i
        ])
    };
};

export const scrapeProfileImage = async (url: string): Promise<string | null> => {
    const proxies = [
        async () => {
            const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}&t=${Date.now()}`);
            if (!res.ok) throw new Error('Network response was not ok');
            const data = await res.json();
            return data.contents;
        },
        async () => {
            const res = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`);
            if (!res.ok) throw new Error('Network response was not ok');
            return await res.text();
        },
        async () => {
            const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`);
            if (!res.ok) throw new Error('Network response was not ok');
            return await res.text();
        }
    ];

    for (const proxy of proxies) {
        try {
            const content = await proxy();
            if (!content || content.length < 500) continue;

            // Try to find og:image
            const match = content.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
                content.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);

            if (match && match[1]) {
                // Decode HTML entities if present
                let imageUrl = match[1].replace(/&amp;/g, '&');
                return imageUrl;
            }
        } catch (err) {
            console.warn(`Proxy failed for image scrape of ${url}`, err);
            continue;
        }
    }
    return null;
};
