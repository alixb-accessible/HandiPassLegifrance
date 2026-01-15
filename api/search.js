// Backend Serverless Vercel - Gestion OAuth + API Légifrance

// Variables d'environnement
const CLIENT_ID = process.env.LEGIFRANCE_API_KEY;
const CLIENT_SECRET = process.env.LEGIFRANCE_CLIENT_SECRET;
const TOKEN_URL = 'https://oauth.piste.gouv.fr/api/oauth/token';
const API_BASE_URL = 'https://api.piste.gouv.fr/dila/legifrance/lf-engine-app';

// Cache du token en mémoire (valide 1h)
let cachedToken = null;
let tokenExpiration = null;

// Fonction pour obtenir un token OAuth
async function getAccessToken() {
    // Si on a un token en cache et qu'il est encore valide
    if (cachedToken && tokenExpiration && Date.now() < tokenExpiration) {
        return cachedToken;
    }

    // Sinon, on en demande un nouveau
    try {
        // Encoder les credentials en Base64 pour Basic Auth
        const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
        
        const response = await fetch(TOKEN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${credentials}`
            },
            body: new URLSearchParams({
                grant_type: 'client_credentials',
                scope: 'openid'
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Erreur OAuth:', response.status, errorText);
            throw new Error(`Erreur OAuth: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        
        // Stocker le token en cache (expire dans 1h)
        cachedToken = data.access_token;
        tokenExpiration = Date.now() + ((data.expires_in || 3600) * 1000) - 60000; // -1min de marge
        
        console.log('Token obtenu avec succès, expire dans', data.expires_in, 'secondes');
        
        return cachedToken;

    } catch (error) {
        console.error('Erreur lors de l\'obtention du token:', error);
        throw error;
    }
}

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    try {
        const { type, keyword, codeId, articleNumber, textId } = req.body;

        // Vérifier les clés
        if (!CLIENT_ID || !CLIENT_SECRET) {
            return res.status(500).json({ 
                error: 'Configuration incomplète',
                success: false 
            });
        }

        // Obtenir un token d'accès
        const accessToken = await getAccessToken();

        let endpoint = '';
        let body = {};

        // Construire la requête selon le type
        switch (type) {
            case 'keyword':
                endpoint = `${API_BASE_URL}/search`;
                body = {
                    recherche: {
                        champs: [{
                            typeChamp: 'ALL',
                            criteres: [{
                                typeRecherche: 'UN_DES_MOTS',
                                valeur: keyword
                            }]
                        }],
                        pageNumber: 1,
                        pageSize: 20,
                        sort: 'PERTINENCE',
                        operateur: 'ET'
                    },
                    fond: 'GLOBAL'
                };
                break;

            case 'article':
                endpoint = `${API_BASE_URL}/search`;
                body = {
                    recherche: {
                        champs: [{
                            typeChamp: 'ARTICLE',
                            criteres: [{
                                typeRecherche: 'EXACTE',
                                valeur: articleNumber
                            }]
                        }],
                        pageNumber: 1,
                        pageSize: 20,
                        sort: 'PERTINENCE',
                        operateur: 'ET'
                    },
                    fond: 'CODE_DATE'
                };
                break;

            case 'code':
                endpoint = `${API_BASE_URL}/consult/code`;
                body = { id: codeId };
                break;

            case 'text':
                endpoint = `${API_BASE_URL}/consult/getArticle`;
                body = { id: textId };
                break;

            default:
                return res.status(400).json({ 
                    error: 'Type de recherche invalide',
                    success: false 
                });
        }

        // Appel à l'API Légifrance avec le token
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Erreur API Légifrance:', response.status, errorText);
            
            // Si erreur 401, le token a peut-être expiré, on le réinitialise
            if (response.status === 401) {
                cachedToken = null;
                tokenExpiration = null;
            }
            
            return res.status(response.status).json({ 
                error: `Erreur API: ${response.status}`,
                details: errorText,
                success: false 
            });
        }

        const data = await response.json();
        return res.status(200).json(data);

    } catch (error) {
        console.error('Erreur serveur:', error);
        return res.status(500).json({ 
            error: 'Erreur serveur',
            message: error.message,
            success: false 
        });
    }
}
