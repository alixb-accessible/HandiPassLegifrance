// Backend Serverless Vercel - Gestion sécurisée de l'API Légifrance

export default async function handler(req, res) {
    // Autoriser les requêtes depuis ton site
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Gérer les requêtes OPTIONS (preflight)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Seulement POST accepté
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    try {
        const { type, keyword, codeId, articleNumber, textId } = req.body;

        // Clé API stockée dans les variables d'environnement Vercel (sécurisée)
        const API_KEY = process.env.LEGIFRANCE_API_KEY;

        if (!API_KEY) {
            return res.status(500).json({ 
                error: 'Clé API non configurée',
                success: false 
            });
        }

        const baseUrl = 'https://api.piste.gouv.fr/dila/legifrance/lf-engine-app';
        let endpoint = '';
        let body = {};

        // Construire la requête selon le type de recherche
        switch (type) {
            case 'keyword':
                endpoint = `${baseUrl}/search`;
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
                endpoint = `${baseUrl}/search`;
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
                endpoint = `${baseUrl}/consult/code`;
                body = { id: codeId };
                break;

            case 'text':
                endpoint = `${baseUrl}/consult/getArticle`;
                body = { id: textId };
                break;

            default:
                return res.status(400).json({ 
                    error: 'Type de recherche invalide',
                    success: false 
                });
        }

        // Appel à l'API Légifrance
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Erreur API Légifrance:', response.status, errorText);
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
