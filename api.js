// Frontend API - Appelle le backend Vercel au lieu de Légifrance directement

const BACKEND_URL = '/api/search'; // Vercel gère automatiquement cette route

// Recherche simple par mot-clé
async function searchByKeyword(keyword, pageNumber = 1, pageSize = 20) {
    try {
        const response = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'keyword',
                keyword: keyword
            })
        });

        if (!response.ok) {
            throw new Error(`Erreur: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Erreur recherche:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Récupérer un texte par son ID
async function getTextById(textId) {
    try {
        const response = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'text',
                textId: textId
            })
        });

        if (!response.ok) {
            throw new Error(`Erreur: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Erreur récupération texte:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Récupérer la structure d'un code
async function getCodeStructure(codeId) {
    try {
        const response = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'code',
                codeId: codeId
            })
        });

        if (!response.ok) {
            throw new Error(`Erreur: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Erreur récupération code:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Rechercher un article spécifique
async function searchArticle(articleNumber) {
    try {
        const response = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'article',
                articleNumber: articleNumber
            })
        });

        if (!response.ok) {
            throw new Error(`Erreur: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Erreur recherche article:', error);
        return {
            success: false,
            error: error.message
        };
    }
}
