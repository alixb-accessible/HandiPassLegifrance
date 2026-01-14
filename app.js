// HandiPass Légifrance - Application principale

// État de l'application
let currentResults = [];
let currentText = null;
let favorites = JSON.parse(localStorage.getItem('handipass_legifrance_favorites') || '[]');

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Charger les favoris
    displayFavorites();
}

// Switch entre les onglets de recherche
function switchSearchTab(tab) {
    // Désactiver tous les onglets
    document.querySelectorAll('.search-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.search-panel').forEach(p => p.classList.remove('active'));
    
    // Activer l'onglet sélectionné
    document.getElementById(`tab-${tab}`).classList.add('active');
    document.getElementById(`search-${tab}`).classList.add('active');
}

// Recherche simple
async function searchSimple(event) {
    event.preventDefault();
    
    const keyword = document.getElementById('search-simple-input').value.trim();
    if (!keyword) return;
    
    showLoading();
    
    try {
        const results = await searchByKeyword(keyword);
        
        if (results.success === false) {
            showError('Erreur lors de la recherche. Vérifiez la connexion à l\'API.');
            return;
        }
        
        displayResults(results, keyword);
    } catch (error) {
        showError('Une erreur est survenue lors de la recherche.');
        console.error(error);
    }
}

// Recherche rapide (depuis les suggestions)
function quickSearch(keyword) {
    document.getElementById('search-simple-input').value = keyword;
    const form = document.querySelector('#search-simple form');
    form.dispatchEvent(new Event('submit'));
}

// Recherche par code
async function searchByCode(event) {
    event.preventDefault();
    
    const codeId = document.getElementById('code-select').value;
    if (!codeId) return;
    
    showLoading();
    
    try {
        const codeStructure = await getCodeStructure(codeId);
        
        if (codeStructure.success === false) {
            showError('Erreur lors de la récupération du code.');
            return;
        }
        
        displayCodeStructure(codeStructure);
    } catch (error) {
        showError('Une erreur est survenue.');
        console.error(error);
    }
}

// Recherche par article
async function searchByArticle(event) {
    event.preventDefault();
    
    const articleNumber = document.getElementById('article-input').value.trim();
    if (!articleNumber) return;
    
    showLoading();
    
    try {
        const results = await searchArticle(articleNumber);
        
        if (results.success === false) {
            showError('Erreur lors de la recherche de l\'article.');
            return;
        }
        
        displayResults(results, `Article ${articleNumber}`);
    } catch (error) {
        showError('Une erreur est survenue.');
        console.error(error);
    }
}

// Recherche rapide d'article (depuis les suggestions)
function quickArticle(articleNumber) {
    document.getElementById('article-input').value = articleNumber;
    switchSearchTab('article');
    const form = document.querySelector('#search-article form');
    form.dispatchEvent(new Event('submit'));
}

// Afficher le loading
function showLoading() {
    document.getElementById('home-section').style.display = 'none';
    document.getElementById('results-section').style.display = 'block';
    document.getElementById('text-section').style.display = 'none';
    document.getElementById('loading').style.display = 'block';
    document.getElementById('results-container').innerHTML = '';
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Afficher les résultats
function displayResults(results, searchQuery) {
    document.getElementById('loading').style.display = 'none';
    
    const container = document.getElementById('results-container');
    
    // Vérifier si on a des résultats
    if (!results.results || results.results.length === 0) {
        container.innerHTML = `
            <div class="results-header">
                <h2>Résultats pour "${searchQuery}"</h2>
                <p class="results-count">Aucun résultat trouvé</p>
            </div>
            <div style="background: #fef3c7; padding: 1.5rem; border-radius: 8px; border-left: 4px solid #fbbf24;">
                <p><strong>Aucun résultat ne correspond à votre recherche.</strong></p>
                <p style="margin-top: 0.5rem;">Essayez avec d'autres mots-clés ou consultez les suggestions.</p>
            </div>
        `;
        return;
    }
    
    // Affichage des résultats
    currentResults = results.results;
    
    let html = `
        <div class="results-header">
            <h2>Résultats pour "${searchQuery}"</h2>
            <p class="results-count">${currentResults.length} résultat(s) trouvé(s)</p>
        </div>
    `;
    
    currentResults.forEach((result, index) => {
        html += `
            <div class="result-item" onclick="showText(${index})">
                <h3 class="result-title">${result.title || result.titreTexte || 'Sans titre'}</h3>
                <p class="result-meta">${result.nature || result.typeTexte || ''}</p>
                <p class="result-excerpt">${result.summary || result.resumeTexte || 'Cliquez pour voir le texte complet'}</p>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Afficher la structure d'un code
function displayCodeStructure(codeStructure) {
    document.getElementById('loading').style.display = 'none';
    
    const container = document.getElementById('results-container');
    
    container.innerHTML = `
        <div class="results-header">
            <h2>${codeStructure.titre || 'Structure du code'}</h2>
        </div>
        <div style="background: #dbeafe; padding: 1.5rem; border-radius: 8px; border-left: 4px solid #3b82f6; margin-bottom: 1rem;">
            <p><strong>Structure du code chargée.</strong> Explorez les différentes sections ci-dessous.</p>
        </div>
    `;
}

// Afficher un texte
async function showText(index) {
    const result = currentResults[index];
    
    showLoading();
    
    try {
        const text = await getTextById(result.id);
        
        if (text.success === false) {
            showError('Erreur lors de la récupération du texte.');
            return;
        }
        
        displayText(text);
    } catch (error) {
        showError('Une erreur est survenue.');
        console.error(error);
    }
}

// Afficher un texte complet
function displayText(text) {
    document.getElementById('results-section').style.display = 'none';
    document.getElementById('text-section').style.display = 'block';
    
    currentText = text;
    
    const container = document.getElementById('text-container');
    
    container.innerHTML = `
        <div class="text-header">
            <h2 class="text-title">${text.title || text.titreTexte || 'Document'}</h2>
            <p class="text-reference">${text.nature || text.typeTexte || ''}</p>
        </div>
        
        <div class="text-actions">
            <button class="action-btn" onclick="copyText()">Copier le texte</button>
            <button class="action-btn secondary" onclick="downloadPDF()">Télécharger en PDF</button>
            <button class="action-btn secondary" onclick="downloadTXT()">Télécharger en TXT</button>
            <button class="action-btn success" onclick="addToFavorites()">Ajouter aux favoris</button>
            <a href="${text.lienLegifrance || 'https://www.legifrance.gouv.fr'}" target="_blank" class="action-btn secondary">Voir sur Légifrance</a>
        </div>
        
        <div class="text-content">
            ${text.contenu || text.texteHtml || '<p>Contenu non disponible</p>'}
        </div>
        
        <div style="background: #dbeafe; padding: 1rem; border-radius: 8px; margin-top: 2rem; border-left: 4px solid #3b82f6;">
            <p><strong>Source :</strong> Légifrance - Consultée le ${new Date().toLocaleDateString('fr-FR')}</p>
            <p style="margin-top: 0.5rem;">Texte à titre informatif. Seule la version sur Légifrance fait foi.</p>
        </div>
    `;
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Copier le texte
function copyText() {
    if (!currentText) return;
    
    const textContent = currentText.content || currentText.contenu || '';
    const fullText = `${currentText.title || currentText.titreTexte}\n\n${textContent}\n\nSource: Légifrance`;
    
    navigator.clipboard.writeText(fullText).then(() => {
        alert('Texte copié dans le presse-papier !');
    }).catch(() => {
        alert('Erreur lors de la copie.');
    });
}

// Télécharger en PDF
function downloadPDF() {
    if (!currentText) return;
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Titre
    doc.setFontSize(16);
    doc.text(currentText.title || currentText.titreTexte || 'Document', 10, 10);
    
    // Référence
    doc.setFontSize(12);
    doc.text(currentText.code || currentText.nature || '', 10, 20);
    
    // Contenu
    doc.setFontSize(10);
    const content = currentText.content || currentText.contenu || 'Contenu non disponible';
    const splitText = doc.splitTextToSize(content, 180);
    doc.text(splitText, 10, 30);
    
    // Footer
    doc.setFontSize(8);
    doc.text(`Source: Légifrance - Consultée le ${new Date().toLocaleDateString('fr-FR')}`, 10, doc.internal.pageSize.height - 10);
    
    // Télécharger
    const filename = `${currentText.title || 'document'}.pdf`.replace(/[^a-z0-9]/gi, '_');
    doc.save(filename);
}

// Télécharger en TXT
function downloadTXT() {
    if (!currentText) return;
    
    const content = currentText.content || currentText.contenu || 'Contenu non disponible';
    const fullText = `${currentText.title || currentText.titreTexte}\n\n${currentText.code || currentText.nature || ''}\n\n${content}\n\nSource: Légifrance\nConsultée le ${new Date().toLocaleDateString('fr-FR')}`;
    
    const blob = new Blob([fullText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentText.title || 'document'}.txt`.replace(/[^a-z0-9]/gi, '_');
    a.click();
    URL.revokeObjectURL(url);
}

// Ajouter aux favoris
function addToFavorites() {
    if (!currentText) return;
    
    const favorite = {
        id: currentText.id,
        title: currentText.title || currentText.titreTexte,
        reference: currentText.code || currentText.nature || '',
        date: new Date().toISOString()
    };
    
    // Vérifier si déjà dans les favoris
    if (favorites.some(f => f.id === favorite.id)) {
        alert('Ce texte est déjà dans vos favoris.');
        return;
    }
    
    favorites.push(favorite);
    localStorage.setItem('handipass_legifrance_favorites', JSON.stringify(favorites));
    
    alert('Ajouté aux favoris !');
    displayFavorites();
}

// Afficher les favoris
function displayFavorites() {
    const section = document.getElementById('favorites-section');
    const list = document.getElementById('favorites-list');
    
    if (favorites.length === 0) {
        section.style.display = 'none';
        return;
    }
    
    section.style.display = 'block';
    
    list.innerHTML = favorites.map((fav, index) => `
        <div class="favorite-item">
            <div>
                <div class="favorite-title" onclick="loadFavorite(${index})">${fav.title}</div>
                <small style="color: var(--gray-600);">${fav.reference}</small>
            </div>
            <button class="remove-favorite" onclick="removeFavorite(${index})">Supprimer</button>
        </div>
    `).join('');
}

// Charger un favori
async function loadFavorite(index) {
    const fav = favorites[index];
    showLoading();
    
    try {
        const text = await getTextById(fav.id);
        displayText(text);
    } catch (error) {
        alert('Erreur lors du chargement du favori.');
    }
}

// Supprimer un favori
function removeFavorite(index) {
    if (confirm('Supprimer ce favori ?')) {
        favorites.splice(index, 1);
        localStorage.setItem('handipass_legifrance_favorites', JSON.stringify(favorites));
        displayFavorites();
    }
}

// Afficher une erreur
function showError(message) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('results-container').innerHTML = `
        <div style="background: #fee2e2; padding: 1.5rem; border-radius: 8px; border-left: 4px solid #dc2626;">
            <p style="font-weight: 600; color: #991b1b;">Erreur</p>
            <p style="color: #991b1b; margin-top: 0.5rem;">${message}</p>
        </div>
    `;
}

// Navigation
function backToSearch() {
    document.getElementById('results-section').style.display = 'none';
    document.getElementById('text-section').style.display = 'none';
    document.getElementById('home-section').style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function backToResults() {
    document.getElementById('text-section').style.display = 'none';
    document.getElementById('results-section').style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Mentions légales
function showMentions() {
    document.getElementById('home-section').style.display = 'none';
    document.getElementById('results-section').style.display = 'none';
    document.getElementById('text-section').style.display = 'none';
    document.getElementById('mentions-section').style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function closeMentions() {
    document.getElementById('mentions-section').style.display = 'none';
    document.getElementById('home-section').style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
