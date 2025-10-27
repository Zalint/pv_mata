// Module Gestion des Clients
const CustomersModule = {
    currentActivityId: null,
    currentDate: null,
    currentPointVente: null,
    customers: [],
    currentCustomer: null,
    editMode: false,

    // Initialiser le module
    init() {
        this.createModals();
        this.attachEventListeners();
    },

    // Créer les modals HTML
    createModals() {
        // Modal principal des clients
        const customersModal = `
            <div class="modal-customers-overlay" id="customersModalOverlay">
                <div class="modal-customers">
                    <div class="modal-customers-header">
                        <h2 id="customersModalTitle">Détail des commandes MATA</h2>
                        <button class="btn-close-modal" onclick="CustomersModule.closeCustomersModal()">✕</button>
                    </div>
                    <div class="modal-customers-toolbar">
                        <button class="btn-add-customer" onclick="CustomersModule.openFormModal()">
                            + Ajouter une commande
                        </button>
                    </div>
                    <div class="modal-customers-body">
                        <div class="customers-table-container">
                            <table class="customers-table">
                                <thead>
                                    <tr>
                                        <th>Numéro de téléphone</th>
                                        <th>Nom Client</th>
                                        <th>Point de vente</th>
                                        <th>Montant (FCFA)</th>
                                        <th>Type client</th>
                                        <th>Comment connu?</th>
                                        <th>Commentaire</th>
                                        <th>Note globale</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="customersTableBody">
                                    <tr>
                                        <td colspan="9" style="text-align: center; padding: 40px;">
                                            <div class="loading-spinner"></div>
                                            Chargement...
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="modal-customers-stats">
                        <h3>📊 Statistiques du jour</h3>
                        <div class="stats-grid" id="customersStatsGrid">
                            <div class="stat-item">
                                <div class="stat-label">Total commandes</div>
                                <div class="stat-value">-</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Modal formulaire
        const formModal = `
            <div class="form-modal-overlay" id="formModalOverlay">
                <div class="form-modal">
                    <div class="form-modal-header">
                        <h3 id="formModalTitle">Nouvelle commande</h3>
                        <button class="btn-close-modal" onclick="CustomersModule.closeFormModal()">✕</button>
                    </div>
                    <div class="form-modal-body">
                        <form id="customerForm" onsubmit="CustomersModule.handleFormSubmit(event)">
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="customer_date">Date *</label>
                                    <input type="date" id="customer_date" name="date" required readonly style="background-color: #e9ecef; cursor: not-allowed;">
                                    <small style="color: #6c757d;">Date de l'activité (non modifiable)</small>
                                </div>
                                <div class="form-group">
                                    <label for="customer_telephone">Numéro de téléphone *</label>
                                    <input type="tel" id="customer_telephone" name="telephone" 
                                           placeholder="+221 77 XXX XX XX" required
                                           onblur="CustomersModule.checkPhoneExists(this.value)">
                                    <small id="phoneStatus" style="display: none;"></small>
                                </div>
                            </div>

                            <div class="form-row">
                                <div class="form-group">
                                    <label for="customer_nom">Nom du client *</label>
                                    <input type="text" id="customer_nom" name="nom_client" required>
                                </div>
                                <div class="form-group">
                                    <label for="customer_point_vente">Point de vente *</label>
                                    <input type="text" id="customer_point_vente" name="point_vente" required>
                                </div>
                            </div>

                            <div class="form-row">
                                <div class="form-group">
                                    <label for="customer_montant">Montant commande (FCFA) *</label>
                                    <input type="number" id="customer_montant" name="montant_commande" 
                                           min="0" step="100" required>
                                </div>
                                <div class="form-group">
                                    <label for="customer_type">Type client *</label>
                                    <input type="text" id="customer_type" name="type_client" readonly 
                                           style="background-color: #e9ecef; cursor: not-allowed;" 
                                           value="Nouveau" required>
                                    <small style="color: #6c757d;">Déterminé automatiquement selon le téléphone</small>
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="customer_comment_connu">Comment nous avez-vous connu ?</label>
                                <select id="customer_comment_connu" name="comment_connu">
                                    <option value="">Sélectionner...</option>
                                    <option value="Réseaux sociaux">Réseaux sociaux</option>
                                    <option value="Bouche à oreille">Bouche à oreille</option>
                                    <option value="Publicité">Publicité</option>
                                    <option value="Client existant">Client existant</option>
                                    <option value="Site web">Site web</option>
                                    <option value="Autre">Autre</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label for="customer_commentaire">Commentaire client</label>
                                <textarea id="customer_commentaire" name="commentaire_client" 
                                          placeholder="Commentaires du client..."></textarea>
                            </div>

                            <hr style="margin: 30px 0; border: none; border-top: 2px solid #e9ecef;">
                            <h4 style="margin-bottom: 20px; color: #495057;">Évaluation du service (sur 10)</h4>

                            <div class="form-row">
                                <div class="form-group">
                                    <label for="note_qualite">Qualité des produits</label>
                                    <input type="number" id="note_qualite" name="note_qualite_produits" 
                                           min="0" max="10" step="0.1" value="5" 
                                           placeholder="Ex: 7.5"
                                           oninput="CustomersModule.updateNoteGlobale()">
                                    <small style="color: #6c757d;">Note de 0 à 10</small>
                                </div>
                                <div class="form-group">
                                    <label for="note_prix">Niveau de prix</label>
                                    <input type="number" id="note_prix" name="note_niveau_prix" 
                                           min="0" max="10" step="0.1" value="5" 
                                           placeholder="Ex: 8.0"
                                           oninput="CustomersModule.updateNoteGlobale()">
                                    <small style="color: #6c757d;">Note de 0 à 10</small>
                                </div>
                            </div>

                            <div class="form-row">
                                <div class="form-group">
                                    <label for="note_service">Service commercial</label>
                                    <input type="number" id="note_service" name="note_service_commercial" 
                                           min="0" max="10" step="0.1" value="5" 
                                           placeholder="Ex: 9.5"
                                           oninput="CustomersModule.updateNoteGlobale()">
                                    <small style="color: #6c757d;">Note de 0 à 10</small>
                                </div>
                                <div class="form-group">
                                    <label>Note globale</label>
                                    <div id="note_globale_display" style="font-size: 24px; font-weight: bold; color: #0d6efd; padding: 10px 0;">5.0/10 ⭐</div>
                                </div>
                            </div>

                            <div class="form-actions">
                                <button type="button" class="btn-cancel" onclick="CustomersModule.closeFormModal()">
                                    Annuler
                                </button>
                                <button type="submit" class="btn-save">
                                    Enregistrer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        // Ajouter les modals au DOM
        document.body.insertAdjacentHTML('beforeend', customersModal);
        document.body.insertAdjacentHTML('beforeend', formModal);
    },

    // Attacher les event listeners
    attachEventListeners() {
        // Fermer les modals en cliquant sur l'overlay
        document.getElementById('customersModalOverlay').addEventListener('click', (e) => {
            if (e.target.id === 'customersModalOverlay') {
                this.closeCustomersModal();
            }
        });

        document.getElementById('formModalOverlay').addEventListener('click', (e) => {
            if (e.target.id === 'formModalOverlay') {
                this.closeFormModal();
            }
        });
    },

    // Ouvrir le modal des clients pour une activité
    async openCustomersModal(activityId, date, pointVente) {
        this.currentActivityId = activityId;
        // La date arrive déjà au format YYYY-MM-DD depuis app.js
        this.currentDate = date;
        this.currentPointVente = pointVente;

        // Mettre à jour le titre
        document.getElementById('customersModalTitle').textContent = 
            `Détail des commandes MATA - ${pointVente} - ${this.formatDate(this.currentDate)}`;

        // Afficher le modal
        document.getElementById('customersModalOverlay').classList.add('active');

        // Charger les données
        await this.loadCustomers();
        await this.loadStats();
    },

    // Charger la liste des clients
    async loadCustomers() {
        try {
            // La date est déjà au format YYYY-MM-DD grâce à openCustomersModal
            const dateOnly = this.currentDate;
            
            const params = new URLSearchParams({
                date: dateOnly,
                point_vente: this.currentPointVente
            });

            if (this.currentActivityId) {
                params.append('activity_id', this.currentActivityId);
            }

            // Ajouter un timestamp pour éviter le cache
            params.append('_t', Date.now());

            const response = await fetch(`/api/customers?${params}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Cache-Control': 'no-cache'
                }
            });

            if (!response.ok) throw new Error('Erreur lors du chargement');

            this.customers = await response.json();
            console.log('Clients chargés:', this.customers.length);
            this.renderCustomersTable();
        } catch (error) {
            console.error('Erreur:', error);
            showNotification('Erreur lors du chargement des clients', 'error');
        }
    },

    // Rendre le tableau des clients
    renderCustomersTable() {
        const tbody = document.getElementById('customersTableBody');
        const user = Auth.getUser();
        
        if (this.customers.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; padding: 40px; color: #6c757d;">
                        Aucune commande enregistrée pour cette date
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.customers.map(customer => {
            const canEdit = user.role === 'ADMIN' || user.role === 'MANAGER';
            
            // Les ADMIN peuvent toujours supprimer
            // Les MANAGER peuvent supprimer dans les 48h
            let canDelete = user.role === 'ADMIN';
            if (user.role === 'MANAGER') {
                const createdAt = new Date(customer.created_at);
                const now = new Date();
                const diffHours = (now - createdAt) / (1000 * 60 * 60);
                canDelete = diffHours <= 48;
            }
            
            return `
            <tr class="client-row" id="row-${customer.id}">
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
                <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${customer.commentaire_client || '-'}
                </td>
                <td>
                    <div class="note-display ${this.getNoteClass(customer.note_globale)}">
                        ${customer.note_globale ? parseFloat(customer.note_globale).toFixed(1) + '/10 ⭐' : '-'}
                    </div>
                </td>
                <td>
                    <button class="btn-action btn-voir" onclick="CustomersModule.toggleDetails(${customer.id})" title="Voir détails">
                        👁️
                    </button>
                    ${canEdit ? `<button class="btn-action btn-edit" onclick="CustomersModule.editCustomer(${customer.id})" title="Modifier">
                        ✏️
                    </button>` : ''}
                    ${canDelete ? `<button class="btn-action btn-delete" onclick="CustomersModule.deleteCustomer(${customer.id})" title="Supprimer">
                        🗑️
                    </button>` : ''}
                </td>
            </tr>
            <tr class="client-details" id="details-${customer.id}">
                <td colspan="9">
                    <div class="client-details-content">
                        <div class="client-details-grid">
                            <div class="detail-item">
                                <span class="detail-label">Qualité produits:</span>
                                <span class="detail-value">${customer.note_qualite_produits || '-'}/10</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Niveau prix:</span>
                                <span class="detail-value">${customer.note_niveau_prix || '-'}/10</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Service:</span>
                                <span class="detail-value">${customer.note_service_commercial || '-'}/10</span>
                            </div>
                        </div>
                        <div style="margin-top: 10px;">
                            <span class="detail-label">Commentaire:</span>
                            <span class="detail-value">${customer.commentaire_client || 'Aucun commentaire'}</span>
                        </div>
                    </div>
                </td>
            </tr>
            `;
        }).join('');
    },

    // Toggle détails d'un client
    toggleDetails(customerId) {
        const row = document.getElementById(`row-${customerId}`);
        const details = document.getElementById(`details-${customerId}`);
        
        row.classList.toggle('expanded');
        details.classList.toggle('show');
    },

    // Charger les statistiques
    async loadStats() {
        try {
            // La date est déjà au format YYYY-MM-DD grâce à openCustomersModal
            const dateOnly = this.currentDate;
            
            const params = new URLSearchParams({
                date: dateOnly,
                point_vente: this.currentPointVente
            });

            if (this.currentActivityId) {
                params.append('activity_id', this.currentActivityId);
            }

            // Ajouter un timestamp pour éviter le cache
            params.append('_t', Date.now());

            const response = await fetch(`/api/customers/stats?${params}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Cache-Control': 'no-cache'
                }
            });

            if (!response.ok) throw new Error('Erreur lors du chargement');

            const stats = await response.json();
            console.log('Stats:', stats);
            this.renderStats(stats);
        } catch (error) {
            console.error('Erreur:', error);
        }
    },

    // Rendre les statistiques
    renderStats(stats) {
        const grid = document.getElementById('customersStatsGrid');
        grid.innerHTML = `
            <div class="stat-item">
                <div class="stat-label">Total commandes</div>
                <div class="stat-value">${stats.total_clients}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Montant total</div>
                <div class="stat-value">${this.formatMontant(stats.montant_total)}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Nouveaux clients</div>
                <div class="stat-value">${stats.nouveaux_clients} (${stats.taux_nouveaux}%)</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Clients récurrents</div>
                <div class="stat-value">${stats.clients_recurrents} (${stats.taux_recurrents}%)</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Note moyenne</div>
                <div class="stat-value">${stats.note_moyenne || '-'}/10 ⭐</div>
            </div>
        `;
    },

    // Ouvrir le formulaire (ajout ou édition)
    openFormModal(customer = null) {
        this.editMode = !!customer;
        this.currentCustomer = customer;

        // Titre du modal
        document.getElementById('formModalTitle').textContent = 
            this.editMode ? 'Modifier la commande' : 'Nouvelle commande';

        // Toujours forcer la date de l'activité (format YYYY-MM-DD)
        // La date est déjà au bon format grâce à openCustomersModal
        document.getElementById('customer_date').value = this.currentDate;
        
        // Pré-remplir le formulaire
        if (customer) {
            document.getElementById('customer_telephone').value = customer.telephone;
            document.getElementById('customer_nom').value = customer.nom_client;
            document.getElementById('customer_point_vente').value = customer.point_vente;
            document.getElementById('customer_montant').value = customer.montant_commande;
            document.getElementById('customer_type').value = customer.type_client;
            document.getElementById('customer_comment_connu').value = customer.comment_connu || '';
            document.getElementById('customer_commentaire').value = customer.commentaire_client || '';
            
            // Notes
            document.getElementById('note_qualite').value = customer.note_qualite_produits || 5;
            document.getElementById('note_prix').value = customer.note_niveau_prix || 5;
            document.getElementById('note_service').value = customer.note_service_commercial || 5;
            
            this.updateNoteGlobale();
        } else {
            // Réinitialiser le formulaire avec les valeurs par défaut
            document.getElementById('customerForm').reset();
            document.getElementById('customer_date').value = this.currentDate;
            document.getElementById('customer_point_vente').value = this.currentPointVente;
            
            // Réinitialiser les notes
            document.getElementById('note_qualite').value = 5;
            document.getElementById('note_prix').value = 5;
            document.getElementById('note_service').value = 5;
            this.updateNoteGlobale();
        }

        // Afficher le modal
        document.getElementById('formModalOverlay').classList.add('active');
    },

    // Calculer et afficher la note globale
    updateNoteGlobale() {
        const qualite = parseFloat(document.getElementById('note_qualite').value) || 0;
        const prix = parseFloat(document.getElementById('note_prix').value) || 0;
        const service = parseFloat(document.getElementById('note_service').value) || 0;
        
        const moyenne = (qualite + prix + service) / 3;
        document.getElementById('note_globale_display').textContent = moyenne.toFixed(1) + '/10 ⭐';
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
            const statusEl = document.getElementById('phoneStatus');
            
            if (result.exists) {
                statusEl.textContent = `🟢 Client récurrent (${result.count} commande${result.count > 1 ? 's' : ''})`;
                statusEl.style.color = '#198754';
                statusEl.style.display = 'block';
                document.getElementById('customer_type').value = 'Récurrent';
                
                // Pré-remplir "Comment connu?" avec la valeur précédente si elle existe
                if (result.comment_connu) {
                    document.getElementById('customer_comment_connu').value = result.comment_connu;
                }
            } else {
                statusEl.textContent = '🔵 Nouveau client';
                statusEl.style.color = '#0d6efd';
                statusEl.style.display = 'block';
                document.getElementById('customer_type').value = 'Nouveau';
            }
        } catch (error) {
            console.error('Erreur:', error);
        }
    },

    // Gérer la soumission du formulaire
    async handleFormSubmit(event) {
        event.preventDefault();

        const formData = new FormData(event.target);
        const data = {
            activity_id: this.currentActivityId,
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
            const url = this.editMode ? `/api/customers/${this.currentCustomer.id}` : '/api/customers';
            const method = this.editMode ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erreur lors de l\'enregistrement');
            }

            showNotification(
                this.editMode ? 'Client modifié avec succès' : 'Client ajouté avec succès', 
                'success'
            );
            
            this.closeFormModal();
            await this.loadCustomers();
            await this.loadStats();
        } catch (error) {
            console.error('Erreur:', error);
            showNotification(error.message, 'error');
        }
    },

    // Modifier un client
    editCustomer(customerId) {
        const customer = this.customers.find(c => c.id === customerId);
        if (customer) {
            this.openFormModal(customer);
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

            if (!response.ok) throw new Error('Erreur lors de la suppression');

            showNotification('Client supprimé avec succès', 'success');
            await this.loadCustomers();
            await this.loadStats();
        } catch (error) {
            console.error('Erreur:', error);
            showNotification(error.message, 'error');
        }
    },

    // Fermer le modal des clients
    closeCustomersModal() {
        document.getElementById('customersModalOverlay').classList.remove('active');
        this.currentActivityId = null;
        this.currentDate = null;
        this.currentPointVente = null;
        this.customers = [];
    },

    // Fermer le modal formulaire
    closeFormModal() {
        document.getElementById('formModalOverlay').classList.remove('active');
        document.getElementById('customerForm').reset();
        this.editMode = false;
        this.currentCustomer = null;
    },

    // Helpers
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    },

    formatMontant(montant) {
        return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
    },

    getNoteClass(note) {
        if (!note) return '';
        const n = parseFloat(note);
        if (n >= 8) return 'excellent';
        if (n >= 6) return 'good';
        if (n >= 4) return 'average';
        return 'poor';
    }
};

// Initialiser le module au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    CustomersModule.init();
});
