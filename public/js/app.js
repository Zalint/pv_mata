// Application principale
const App = {
    currentEditId: null,

    // Initialisation
    init() {
        this.setupForm();
        this.setDefaultDate();
        this.setDefaultFilterDates();
        this.loadMetadata();
        this.loadActivities();
    },

    // Définir la date par défaut (aujourd'hui)
    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('date').value = today;
    },

    // Définir les dates par défaut pour les filtres (1er jour du mois - aujourd'hui)
    setDefaultFilterDates() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0'); // mois de 01 à 12
        const day = String(today.getDate()).padStart(2, '0');
        
        // Format YYYY-MM-DD sans conversion timezone
        const firstDayOfMonth = `${year}-${month}-01`;
        const todayString = `${year}-${month}-${day}`;
        
        document.getElementById('filterDateDebut').value = firstDayOfMonth;
        document.getElementById('filterDateFin').value = todayString;
    },

    // Configuration du formulaire
    setupForm() {
        const form = document.getElementById('activityForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitForm();
        });
    },

    // Soumettre le formulaire
    async submitForm() {
        const formError = document.getElementById('formError');
        const formSuccess = document.getElementById('formSuccess');
        const submitBtn = document.querySelector('#activityForm button[type="submit"]');
        
        formError.style.display = 'none';
        formSuccess.style.display = 'none';

        // Récupérer les données du formulaire
        const formData = {
            date: document.getElementById('date').value,
            point_vente: document.getElementById('point_vente').value,
            responsable: document.getElementById('responsable').value,
            note_ventes: document.getElementById('note_ventes').value,
            plaintes_client: document.getElementById('plaintes_client').value,
            produits_manquants: document.getElementById('produits_manquants').value,
            commentaire_livreurs: document.getElementById('commentaire_livreurs').value,
            commentaire: document.getElementById('commentaire').value
        };

        submitBtn.disabled = true;
        const originalText = document.getElementById('formSubmitText').textContent;
        document.getElementById('formSubmitText').textContent = 'Enregistrement...';

        try {
            let response;
            const activityId = document.getElementById('activityId').value;

            if (activityId) {
                // Mise à jour
                response = await this.apiRequest(`/api/activities/${activityId}`, 'PUT', formData);
            } else {
                // Création
                response = await this.apiRequest('/api/activities', 'POST', formData);
            }

            formSuccess.textContent = activityId ? 'Activité modifiée avec succès !' : 'Activité créée avec succès !';
            formSuccess.style.display = 'block';
            
            this.resetForm();
            this.loadActivities();
            this.loadMetadata();

            // Masquer le message après 3 secondes
            setTimeout(() => {
                formSuccess.style.display = 'none';
            }, 3000);

        } catch (error) {
            formError.textContent = error.message;
            formError.style.display = 'block';
        } finally {
            submitBtn.disabled = false;
            document.getElementById('formSubmitText').textContent = originalText;
        }
    },

    // Réinitialiser le formulaire
    resetForm() {
        document.getElementById('activityForm').reset();
        document.getElementById('activityId').value = '';
        document.getElementById('formSubmitText').textContent = '✓ Enregistrer';
        this.setDefaultDate();
        document.getElementById('formError').style.display = 'none';
        document.getElementById('formSuccess').style.display = 'none';
    },

    // Charger les activités
    async loadActivities(filters = null) {
        const tbody = document.getElementById('activitiesTableBody');
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center;">Chargement...</td></tr>';

        try {
            // Si aucun filtre fourni, utiliser les valeurs des champs de filtre
            if (filters === null) {
                filters = {
                    dateDebut: document.getElementById('filterDateDebut').value,
                    dateFin: document.getElementById('filterDateFin').value,
                    pointVente: document.getElementById('filterPointVente').value
                };
            }

            const queryParams = new URLSearchParams();
            if (filters.dateDebut) queryParams.append('dateDebut', filters.dateDebut);
            if (filters.dateFin) queryParams.append('dateFin', filters.dateFin);
            if (filters.pointVente) queryParams.append('pointVente', filters.pointVente);

            const url = `/api/activities${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
            const activities = await this.apiRequest(url, 'GET');

            if (activities.length === 0) {
                tbody.innerHTML = '<tr><td colspan="9" style="text-align: center;">Aucune activité trouvée</td></tr>';
                return;
            }

            tbody.innerHTML = activities.map(activity => this.createActivityRow(activity)).join('');
        } catch (error) {
            tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: red;">Erreur: ${error.message}</td></tr>`;
        }
    },

    // Créer une ligne de tableau pour une activité
    createActivityRow(activity) {
        const user = Auth.getUser();
        const canEdit = user.role === 'ADMIN' || user.role === 'MANAGER';
        const canDelete = user.role === 'ADMIN';

        const date = new Date(activity.date).toLocaleDateString('fr-FR');
        
        // Extraire la date au format YYYY-MM-DD sans conversion timezone
        const dateOnly = activity.date.split('T')[0];
        
        return `
            <tr>
                <td>${date}</td>
                <td>${this.escapeHtml(activity.point_vente)}</td>
                <td>${this.escapeHtml(activity.responsable)}</td>
                <td>${activity.note_ventes || '-'}</td>
                <td>${this.truncate(activity.plaintes_client, 50)}</td>
                <td>${this.truncate(activity.produits_manquants, 50)}</td>
                <td>${this.truncate(activity.commentaire_livreurs, 50)}</td>
                <td>${this.truncate(activity.commentaire, 50)}</td>
                <td>
                    <div class="action-buttons" style="display: flex; flex-direction: column; gap: 5px;">
                        <button class="btn btn-info" onclick="CustomersModule.openCustomersModal(${activity.id}, '${dateOnly}', '${this.escapeHtml(activity.point_vente).replace(/'/g, "\\'")}')">👥 Clients</button>
                        ${canEdit ? `<button class="btn btn-warning" onclick="App.editActivity(${activity.id})">✏️ Modifier</button>` : ''}
                        ${canDelete ? `<button class="btn btn-danger" onclick="App.deleteActivity(${activity.id})">🗑️ Supprimer</button>` : ''}
                    </div>
                </td>
            </tr>
        `;
    },

    // Éditer une activité
    async editActivity(id) {
        try {
            const activity = await this.apiRequest(`/api/activities/${id}`, 'GET');
            
            // Remplir le formulaire
            document.getElementById('activityId').value = activity.id;
            document.getElementById('date').value = activity.date.split('T')[0];
            document.getElementById('point_vente').value = activity.point_vente;
            document.getElementById('responsable').value = activity.responsable;
            document.getElementById('note_ventes').value = activity.note_ventes || '';
            document.getElementById('plaintes_client').value = activity.plaintes_client || '';
            document.getElementById('produits_manquants').value = activity.produits_manquants || '';
            document.getElementById('commentaire_livreurs').value = activity.commentaire_livreurs || '';
            document.getElementById('commentaire').value = activity.commentaire || '';
            
            document.getElementById('formSubmitText').textContent = '✓ Mettre à jour';
            
            // Scroller vers le formulaire
            document.querySelector('.card').scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            alert('Erreur: ' + error.message);
        }
    },

    // Supprimer une activité
    async deleteActivity(id) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette activité ?')) {
            return;
        }

        try {
            await this.apiRequest(`/api/activities/${id}`, 'DELETE');
            this.loadActivities();
        } catch (error) {
            alert('Erreur: ' + error.message);
        }
    },

    // Charger les métadonnées (points de vente, responsables)
    async loadMetadata() {
        try {
            // Charger depuis les fichiers JSON locaux
            const [pointsVenteRes, responsablesRes] = await Promise.all([
                fetch('/data/points-vente.json'),
                fetch('/data/responsables.json')
            ]);

            const pointsVente = await pointsVenteRes.json();
            const responsables = await responsablesRes.json();

            // Remplir le dropdown point de vente du formulaire
            const pointVenteSelect = document.getElementById('point_vente');
            const currentPointVente = pointVenteSelect.value;
            pointVenteSelect.innerHTML = '<option value="">Sélectionner un point de vente</option>' +
                pointsVente.map(pv => `<option value="${this.escapeHtml(pv)}">${this.escapeHtml(pv)}</option>`).join('');
            if (currentPointVente) pointVenteSelect.value = currentPointVente;

            // Remplir le dropdown responsable du formulaire
            const responsableSelect = document.getElementById('responsable');
            const currentResponsable = responsableSelect.value;
            responsableSelect.innerHTML = '<option value="">Sélectionner un responsable</option>' +
                responsables.map(r => `<option value="${this.escapeHtml(r)}">${this.escapeHtml(r)}</option>`).join('');
            if (currentResponsable) responsableSelect.value = currentResponsable;

            // Remplir le filtre des points de vente
            const filterPointVente = document.getElementById('filterPointVente');
            const currentFilterValue = filterPointVente.value;
            filterPointVente.innerHTML = '<option value="">Tous les points de vente</option>' +
                pointsVente.map(pv => `<option value="${this.escapeHtml(pv)}">${this.escapeHtml(pv)}</option>`).join('');
            filterPointVente.value = currentFilterValue;
        } catch (error) {
            console.error('Erreur lors du chargement des métadonnées:', error);
        }
    },

    // Appliquer les filtres
    applyFilters() {
        const filters = {
            dateDebut: document.getElementById('filterDateDebut').value,
            dateFin: document.getElementById('filterDateFin').value,
            pointVente: document.getElementById('filterPointVente').value
        };
        this.loadActivities(filters);
    },

    // Effacer les filtres
    clearFilters() {
        document.getElementById('filterDateDebut').value = '';
        document.getElementById('filterDateFin').value = '';
        document.getElementById('filterPointVente').value = '';
        this.loadActivities();
    },

    // Fonction utilitaire pour les requêtes API
    async apiRequest(url, method = 'GET', body = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Auth.getToken()}`
            }
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(url, options);
        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                // Token expiré ou invalide
                Auth.logout();
            }
            throw new Error(data.error || 'Erreur lors de la requête');
        }

        return data;
    },

    // Échapper le HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // Tronquer le texte
    truncate(text, maxLength) {
        if (!text) return '-';
        text = this.escapeHtml(text);
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    },

    // Toggle collapse/expand section
    toggleSection(sectionId) {
        const section = document.getElementById(sectionId);
        const icon = document.getElementById(sectionId + 'Icon');
        
        if (section.style.display === 'none') {
            section.style.display = 'block';
            icon.textContent = '▼'; // Flèche vers le bas
        } else {
            section.style.display = 'none';
            icon.textContent = '▶'; // Flèche vers la droite
        }
    }
};

// Fonction globale pour afficher des notifications
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    const colors = {
        success: '#198754',
        error: '#dc3545',
        info: '#0d6efd',
        warning: '#ffc107'
    };
    
    notification.style.background = colors[type] || colors.info;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
