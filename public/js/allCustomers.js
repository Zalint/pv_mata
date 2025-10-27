// Module pour gérer l'affichage de tous les clients
const AllCustomers = {
    customers: [],
    currentPage: 1,
    pageSize: 50,
    totalPages: 1,

    init() {
        this.loadPointsVente();
        // Ne pas définir de dates par défaut - charger tous les clients
        this.loadCustomers();
        this.attachEventListeners();
        this.loadPointsVenteForAddForm();
    },

    // Attacher les event listeners
    attachEventListeners() {
        // Fermer le modal d'édition en cliquant sur l'overlay
        const editOverlay = document.getElementById('editModalOverlay');
        if (editOverlay) {
            editOverlay.addEventListener('click', (e) => {
                if (e.target.id === 'editModalOverlay') {
                    this.closeEditModal();
                }
            });
        }

        // Fermer le modal d'ajout en cliquant sur l'overlay
        const addOverlay = document.getElementById('addModalOverlay');
        if (addOverlay) {
            addOverlay.addEventListener('click', (e) => {
                if (e.target.id === 'addModalOverlay') {
                    this.closeAddModal();
                }
            });
        }

        // Event listener pour la vérification du téléphone
        const addTelephone = document.getElementById('add_telephone');
        if (addTelephone) {
            addTelephone.addEventListener('blur', (e) => {
                this.checkPhoneExists(e.target.value);
            });
        }

        // Event listeners pour les notes dans le formulaire d'ajout
        ['add_note_qualite', 'add_note_prix', 'add_note_service'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', () => this.updateAddNoteGlobale());
            }
        });
    },

    // Définir les dates par défaut (mois en cours) - utilisé uniquement après effacement
    setDefaultDates() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        
        document.getElementById('filterDateDebut').value = `${year}-${month}-01`;
        document.getElementById('filterDateFin').value = `${year}-${month}-${day}`;
    },

    // Charger les points de vente
    async loadPointsVente() {
        try {
            const response = await fetch('/data/points-vente.json');
            const pointsVente = await response.json();
            
            const select = document.getElementById('filterPointVente');
            select.innerHTML = '<option value="">Tous les points de vente</option>' +
                pointsVente.map(pv => `<option value="${pv}">${pv}</option>`).join('');
        } catch (error) {
            console.error('Erreur:', error);
        }
    },

    // Charger les clients
    async loadCustomers() {
        try {
            const params = this.getFiltersParams();
            params.append('page', this.currentPage);
            params.append('pageSize', this.pageSize);

            const response = await fetch(`/api/customers/all?${params}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error('Erreur lors du chargement');

            const data = await response.json();
            this.customers = data.customers;
            this.totalPages = data.totalPages;
            
            this.renderTable();
            this.renderPagination();
            this.renderStats(data.stats);
        } catch (error) {
            console.error('Erreur:', error);
            showNotification('Erreur lors du chargement des clients', 'error');
        }
    },

    // Obtenir les paramètres de filtre
    getFiltersParams() {
        const params = new URLSearchParams();
        
        const telephone = document.getElementById('searchTelephone').value.trim();
        const nom = document.getElementById('searchNom').value.trim();
        const pointVente = document.getElementById('filterPointVente').value;
        const typeClient = document.getElementById('filterTypeClient').value;
        const dateDebut = document.getElementById('filterDateDebut').value;
        const dateFin = document.getElementById('filterDateFin').value;

        if (telephone) params.append('telephone', telephone);
        if (nom) params.append('nom', nom);
        if (pointVente) params.append('point_vente', pointVente);
        if (typeClient) params.append('type_client', typeClient);
        if (dateDebut) params.append('dateDebut', dateDebut);
        if (dateFin) params.append('dateFin', dateFin);

        return params;
    },

    // Afficher le tableau
    renderTable() {
        const tbody = document.getElementById('customersTableBody');
        const user = Auth.getUser();

        if (this.customers.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; padding: 40px;">
                        Aucun client trouvé
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.customers.map(customer => {
            const canEdit = user.role === 'ADMIN' || user.role === 'MANAGER';
            
            let canDelete = user.role === 'ADMIN';
            if (user.role === 'MANAGER') {
                const createdAt = new Date(customer.created_at);
                const now = new Date();
                const diffHours = (now - createdAt) / (1000 * 60 * 60);
                canDelete = diffHours <= 48;
            }

            const date = customer.date ? new Date(customer.date + 'T00:00:00').toLocaleDateString('fr-FR') : '-';

            return `
                <tr>
                    <td>${date}</td>
                    <td>${customer.telephone}</td>
                    <td>${customer.nom_client}</td>
                    <td>${customer.point_vente}</td>
                    <td>${this.formatMontant(customer.montant_commande)}</td>
                    <td>
                        <span class="badge ${customer.type_client === 'Nouveau' ? 'badge-nouveau' : 'badge-recurrent'}">
                            ${customer.type_client === 'Nouveau' ? '🔵' : '🟢'} ${customer.type_client}
                        </span>
                    </td>
                    <td>${customer.comment_connu || '-'}</td>
                    <td>
                        <div class="note-display ${this.getNoteClass(customer.note_globale)}">
                            ${customer.note_globale ? parseFloat(customer.note_globale).toFixed(1) + '/10 ⭐' : '-'}
                        </div>
                        <div style="font-size: 11px; color: #6c757d; margin-top: 5px;">
                            ${customer.note_qualite_produits ? 'Q: ' + parseFloat(customer.note_qualite_produits).toFixed(1) : ''}
                            ${customer.note_niveau_prix ? ' | P: ' + parseFloat(customer.note_niveau_prix).toFixed(1) : ''}
                            ${customer.note_service_commercial ? ' | S: ' + parseFloat(customer.note_service_commercial).toFixed(1) : ''}
                        </div>
                        ${customer.commentaire_client ? `<div style="font-size: 11px; margin-top: 5px; font-style: italic;">${customer.commentaire_client.substring(0, 50)}${customer.commentaire_client.length > 50 ? '...' : ''}</div>` : ''}
                    </td>
                    <td>
                        <button class="btn-action btn-voir" onclick="AllCustomers.viewDetails(${customer.id})" title="Voir détails">
                            👁️
                        </button>
                        ${canEdit ? `<button class="btn-action btn-edit" onclick="AllCustomers.editCustomer(${customer.id})" title="Modifier">
                            ✏️
                        </button>` : ''}
                        ${canDelete ? `<button class="btn-action btn-delete" onclick="AllCustomers.deleteCustomer(${customer.id})" title="Supprimer">
                            🗑️
                        </button>` : ''}
                    </td>
                </tr>
            `;
        }).join('');
    },

    // Afficher la pagination
    renderPagination() {
        const pagination = document.getElementById('pagination');
        
        if (this.totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let html = '';
        
        // Bouton précédent
        html += `<button class="btn btn-secondary btn-sm" onclick="AllCustomers.changePage(${this.currentPage - 1})" 
                    ${this.currentPage === 1 ? 'disabled' : ''}>← Précédent</button>`;
        
        // Numéros de page
        for (let i = 1; i <= this.totalPages; i++) {
            if (i === 1 || i === this.totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                html += `<button class="btn ${i === this.currentPage ? 'btn-primary' : 'btn-secondary'} btn-sm" 
                            onclick="AllCustomers.changePage(${i})">${i}</button>`;
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                html += `<span>...</span>`;
            }
        }
        
        // Bouton suivant
        html += `<button class="btn btn-secondary btn-sm" onclick="AllCustomers.changePage(${this.currentPage + 1})" 
                    ${this.currentPage === this.totalPages ? 'disabled' : ''}>Suivant →</button>`;
        
        pagination.innerHTML = html;
    },

    // Changer de page
    changePage(page) {
        if (page < 1 || page > this.totalPages) return;
        this.currentPage = page;
        this.loadCustomers();
        window.scrollTo(0, 0);
    },

    // Afficher les statistiques
    renderStats(stats) {
        const grid = document.getElementById('globalStats');
        grid.innerHTML = `
            <div class="stat-item">
                <div class="stat-label">Total clients</div>
                <div class="stat-value">${stats.total_clients}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Nouveaux</div>
                <div class="stat-value">${stats.nouveaux_clients} (${stats.taux_nouveaux}%)</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Récurrents</div>
                <div class="stat-value">${stats.clients_recurrents} (${stats.taux_recurrents}%)</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Note moyenne</div>
                <div class="stat-value">${stats.note_moyenne || '-'}/10 ⭐</div>
            </div>
        `;
    },

    // Appliquer les filtres
    applyFilters() {
        this.currentPage = 1;
        this.loadCustomers();
    },

    // Effacer les filtres
    clearFilters() {
        document.getElementById('searchTelephone').value = '';
        document.getElementById('searchNom').value = '';
        document.getElementById('filterPointVente').value = '';
        document.getElementById('filterTypeClient').value = '';
        this.setDefaultDates();
        this.applyFilters();
    },

    // Voir les détails d'un client
    viewDetails(customerId) {
        const customer = this.customers.find(c => c.id === customerId);
        if (!customer) return;

        alert(`Détails du client:\n\n` +
            `Téléphone: ${customer.telephone}\n` +
            `Nom: ${customer.nom_client}\n` +
            `Point de vente: ${customer.point_vente}\n` +
            `Montant: ${this.formatMontant(customer.montant_commande)}\n` +
            `Type: ${customer.type_client}\n` +
            `Comment connu: ${customer.comment_connu || '-'}\n` +
            `Commentaire: ${customer.commentaire_client || '-'}\n\n` +
            `Notes:\n` +
            `- Qualité produits: ${customer.note_qualite_produits || '-'}/10\n` +
            `- Niveau prix: ${customer.note_niveau_prix || '-'}/10\n` +
            `- Service: ${customer.note_service_commercial || '-'}/10\n` +
            `- Note globale: ${customer.note_globale ? parseFloat(customer.note_globale).toFixed(1) : '-'}/10`
        );
    },

    // Modifier un client
    editCustomer(customerId) {
        const customer = this.customers.find(c => c.id === customerId);
        if (!customer) return;

        // Remplir le formulaire
        document.getElementById('edit_customer_id').value = customer.id;
        document.getElementById('edit_date').value = customer.date;
        document.getElementById('edit_telephone').value = customer.telephone;
        document.getElementById('edit_nom').value = customer.nom_client;
        document.getElementById('edit_point_vente').value = customer.point_vente;
        document.getElementById('edit_montant').value = customer.montant_commande;
        document.getElementById('edit_type').value = customer.type_client;
        document.getElementById('edit_comment_connu').value = customer.comment_connu || '';
        document.getElementById('edit_commentaire').value = customer.commentaire_client || '';
        
        // Notes
        document.getElementById('edit_note_qualite').value = customer.note_qualite_produits || 5;
        document.getElementById('edit_note_prix').value = customer.note_niveau_prix || 5;
        document.getElementById('edit_note_service').value = customer.note_service_commercial || 5;
        
        this.updateEditNoteGlobale();
        
        // Ajouter les event listeners pour les notes
        document.getElementById('edit_note_qualite').oninput = () => this.updateEditNoteGlobale();
        document.getElementById('edit_note_prix').oninput = () => this.updateEditNoteGlobale();
        document.getElementById('edit_note_service').oninput = () => this.updateEditNoteGlobale();
        
        // Afficher le modal
        document.getElementById('editModalOverlay').classList.add('active');
    },

    // Mettre à jour la note globale dans le modal d'édition
    updateEditNoteGlobale() {
        const qualite = parseFloat(document.getElementById('edit_note_qualite').value) || 0;
        const prix = parseFloat(document.getElementById('edit_note_prix').value) || 0;
        const service = parseFloat(document.getElementById('edit_note_service').value) || 0;
        
        const moyenne = (qualite + prix + service) / 3;
        document.getElementById('edit_note_globale_display').textContent = moyenne.toFixed(1) + '/10 ⭐';
    },

    // Fermer le modal d'édition
    closeEditModal() {
        document.getElementById('editModalOverlay').classList.remove('active');
    },

    // Gérer la soumission du formulaire d'édition
    async handleEditSubmit(event) {
        event.preventDefault();

        const customerId = document.getElementById('edit_customer_id').value;
        const formData = new FormData(event.target);
        
        const data = {
            date: formData.get('date'),
            telephone: formData.get('telephone'),
            nom_client: formData.get('nom_client'),
            point_vente: formData.get('point_vente'),
            montant_commande: parseInt(formData.get('montant_commande')),
            type_client: formData.get('type_client'),
            comment_connu: formData.get('comment_connu') || null,
            commentaire_client: formData.get('commentaire_client') || null,
            note_qualite_produits: parseFloat(formData.get('note_qualite_produits')),
            note_niveau_prix: parseFloat(formData.get('note_niveau_prix')),
            note_service_commercial: parseFloat(formData.get('note_service_commercial'))
        };

        try {
            const response = await fetch(`/api/customers/${customerId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erreur lors de la modification');
            }

            showNotification('Client modifié avec succès', 'success');
            this.closeEditModal();
            this.loadCustomers();
        } catch (error) {
            console.error('Erreur:', error);
            showNotification(error.message, 'error');
        }
    },

    // Supprimer un client
    async deleteCustomer(customerId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) return;

        try {
            const response = await fetch(`/api/customers/${customerId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erreur lors de la suppression');
            }

            showNotification('Client supprimé avec succès', 'success');
            this.loadCustomers();
        } catch (error) {
            console.error('Erreur:', error);
            showNotification(error.message, 'error');
        }
    },

    // Formater le montant
    formatMontant(montant) {
        return new Intl.NumberFormat('fr-FR', {
            minimumFractionDigits: 0
        }).format(montant) + ' FCFA';
    },

    // Obtenir la classe CSS pour la note
    getNoteClass(note) {
        if (!note) return '';
        const n = parseFloat(note);
        if (n >= 8) return 'note-excellente';
        if (n >= 6) return 'note-bonne';
        if (n >= 4) return 'note-moyenne';
        return 'note-faible';
    },

    // Charger les points de vente pour le formulaire d'ajout
    async loadPointsVenteForAddForm() {
        try {
            const response = await fetch('/data/points-vente.json');
            const pointsVente = await response.json();
            
            const select = document.getElementById('add_point_vente');
            if (select) {
                select.innerHTML = '<option value="">Sélectionner...</option>' +
                    pointsVente.map(pv => `<option value="${pv}">${pv}</option>`).join('');
            }
        } catch (error) {
            console.error('Erreur:', error);
        }
    },

    // Ouvrir le modal d'ajout
    openAddModal() {
        // Réinitialiser le formulaire
        document.getElementById('addCustomerForm').reset();
        
        // Définir la date du jour
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        document.getElementById('add_date').value = `${year}-${month}-${day}`;
        
        // Réinitialiser les notes
        document.getElementById('add_note_qualite').value = 5;
        document.getElementById('add_note_prix').value = 5;
        document.getElementById('add_note_service').value = 5;
        this.updateAddNoteGlobale();
        
        // Type client par défaut
        document.getElementById('add_type').value = 'Nouveau';
        
        // Masquer l'info de type client
        document.getElementById('add_client_type_info').style.display = 'none';
        
        // Afficher le modal
        document.getElementById('addModalOverlay').classList.add('active');
    },

    // Fermer le modal d'ajout
    closeAddModal() {
        document.getElementById('addModalOverlay').classList.remove('active');
        document.getElementById('addCustomerForm').reset();
        document.getElementById('add_client_type_info').style.display = 'none';
    },

    // Mettre à jour la note globale dans le formulaire d'ajout
    updateAddNoteGlobale() {
        const qualite = parseFloat(document.getElementById('add_note_qualite').value) || 0;
        const prix = parseFloat(document.getElementById('add_note_prix').value) || 0;
        const service = parseFloat(document.getElementById('add_note_service').value) || 0;
        
        const moyenne = (qualite + prix + service) / 3;
        document.getElementById('add_note_globale_display').textContent = moyenne.toFixed(1) + '/10 ⭐';
    },

    // Vérifier si le téléphone existe
    async checkPhoneExists(telephone) {
        if (!telephone || telephone.length < 8) return;

        try {
            const response = await fetch(`/api/customers/check-phone?telephone=${encodeURIComponent(telephone)}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) return;

            const result = await response.json();
            const infoEl = document.getElementById('add_client_type_info');
            const detectedTypeEl = document.getElementById('add_detected_type');
            const typeInput = document.getElementById('add_type');
            const commentConnuSelect = document.getElementById('add_comment_connu');
            
            if (result.exists) {
                detectedTypeEl.textContent = `Récurrent (🔁 ${result.count} commande${result.count > 1 ? 's' : ''})`;
                infoEl.style.display = 'block';
                infoEl.style.backgroundColor = '#d1ecf1';
                infoEl.style.borderColor = '#17a2b8';
                typeInput.value = 'Récurrent';
                
                // Pré-remplir "Comment connu?" avec la valeur précédente si elle existe
                if (result.comment_connu) {
                    commentConnuSelect.value = result.comment_connu;
                }
            } else {
                detectedTypeEl.textContent = 'Nouveau (🆕)';
                infoEl.style.display = 'block';
                infoEl.style.backgroundColor = '#e7f3ff';
                infoEl.style.borderColor = '#2196F3';
                typeInput.value = 'Nouveau';
            }
        } catch (error) {
            console.error('Erreur:', error);
        }
    },

    // Gérer la soumission du formulaire d'ajout
    async handleAddSubmit(event) {
        event.preventDefault();

        const formData = new FormData(event.target);
        
        const data = {
            date: formData.get('date'),
            telephone: formData.get('telephone'),
            nom_client: formData.get('nom_client'),
            point_vente: formData.get('point_vente'),
            montant_commande: parseInt(formData.get('montant_commande')),
            type_client: formData.get('type_client'),
            comment_connu: formData.get('comment_connu') || null,
            commentaire_client: formData.get('commentaire_client') || null,
            note_qualite_produits: parseFloat(formData.get('note_qualite_produits')),
            note_niveau_prix: parseFloat(formData.get('note_niveau_prix')),
            note_service_commercial: parseFloat(formData.get('note_service_commercial'))
        };

        try {
            const response = await fetch('/api/customers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erreur lors de l\'ajout');
            }

            showNotification('Commande ajoutée avec succès', 'success');
            this.closeAddModal();
            this.loadCustomers();
        } catch (error) {
            console.error('Erreur:', error);
            showNotification(error.message, 'error');
        }
    }
};

// Fonctions utilitaires
function showNotification(message, type = 'info') {
    alert(message);
}

// Initialiser au chargement
document.addEventListener('DOMContentLoaded', () => {
    // Vérifier l'authentification
    Auth.checkAuth();
    
    // Si authentifié, initialiser le module
    if (Auth.isAuthenticated()) {
        AllCustomers.init();
    }
});
