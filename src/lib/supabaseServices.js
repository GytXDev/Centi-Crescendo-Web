import { supabase } from './customSupabaseClient.js';

// ===== SERVICES POUR LES TOMBOLAS =====

/**
 * Récupère toutes les tombolas
 */
export async function getAllTombolas() {
    try {
        const { data, error } = await supabase
            .from('tombolas')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Erreur lors de la récupération des tombolas:', error);
        return { data: null, error };
    }
}

/**
 * Récupère la tombola active actuelle
 */
export async function getCurrentTombola() {
    try {
        const { data, error } = await supabase
            .from('tombolas')
            .select('*')
            .eq('status', 'active')
            .maybeSingle();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Erreur lors de la récupération de la tombola active:', error);
        return { data: null, error };
    }
}

/**
 * Crée une nouvelle tombola
 */
export async function createTombola(tombolaData) {
    try {
        const { data, error } = await supabase
            .from('tombolas')
            .insert([{
                title: tombolaData.title,
                description: tombolaData.description,
                ticket_price: tombolaData.ticketPrice,
                draw_date: tombolaData.drawDate,
                jackpot: tombolaData.jackpot,
                max_winners: tombolaData.maxWinners,
                prizes: tombolaData.prizes,
                status: 'active',
                participants: 0
            }])
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Erreur lors de la création de la tombola:', error);
        return { data: null, error };
    }
}

/**
 * Met à jour une tombola
 */
export async function updateTombola(id, updates) {
    try {
        const { data, error } = await supabase
            .from('tombolas')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la tombola:', error);
        return { data: null, error };
    }
}

/**
 * Supprime une tombola
 */
export async function deleteTombola(id) {
    try {
        const { error } = await supabase
            .from('tombolas')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { error: null };
    } catch (error) {
        console.error('Erreur lors de la suppression de la tombola:', error);
        return { error };
    }
}

// ===== SERVICES POUR LES PARTICIPANTS =====

/**
 * Récupère tous les participants
 */
export async function getAllParticipants() {
    try {
        const { data, error } = await supabase
            .from('participants')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Erreur lors de la récupération des participants:', error);
        return { data: null, error };
    }
}

/**
 * Récupère les participants d'une tombola spécifique
 */
export async function getParticipantsByTombola(tombolaId) {
    try {
        const { data, error } = await supabase
            .from('participants')
            .select('*')
            .eq('tombola_id', tombolaId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Erreur lors de la récupération des participants:', error);
        return { data: null, error };
    }
}

/**
 * Crée un nouveau participant
 */
export async function createParticipant(participantData) {
    try {
        const { data, error } = await supabase
            .from('participants')
            .insert([{
                name: participantData.name,
                phone: participantData.phone,
                tombola_id: participantData.tombolaId,
                ticket_number: generateTicketNumber(),
                payment_status: 'pending',
                airtel_money_number: participantData.airtelMoneyNumber
            }])
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Erreur lors de la création du participant:', error);
        return { data: null, error };
    }
}

/**
 * Met à jour le statut de paiement d'un participant
 */
export async function updateParticipantPayment(id, paymentStatus) {
    try {
        const { data, error } = await supabase
            .from('participants')
            .update({ payment_status: paymentStatus })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Erreur lors de la mise à jour du paiement:', error);
        return { data: null, error };
    }
}

// ===== SERVICES POUR LES GAGNANTS =====

/**
 * Récupère tous les gagnants
 */
export async function getAllWinners() {
    try {
        const { data, error } = await supabase
            .from('winners')
            .select(`
        *,
        participants (
          name,
          phone,
          ticket_number
        ),
        tombolas (
          title,
          jackpot
        )
      `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Erreur lors de la récupération des gagnants:', error);
        return { data: null, error };
    }
}

/**
 * Crée un nouveau gagnant
 */
export async function createWinner(winnerData) {
    try {
        const { data, error } = await supabase
            .from('winners')
            .insert([{
                participant_id: winnerData.participantId,
                tombola_id: winnerData.tombolaId,
                prize_amount: winnerData.prizeAmount,
                prize_rank: winnerData.prizeRank
            }])
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Erreur lors de la création du gagnant:', error);
        return { data: null, error };
    }
}

// ===== SERVICES POUR LES STATISTIQUES =====

/**
 * Récupère les statistiques globales
 */
export async function getGlobalStats() {
    try {
        // Récupérer le nombre total de tombolas
        const { data: tombolas, error: tombolasError } = await supabase
            .from('tombolas')
            .select('id, participants, ticket_price, status');

        if (tombolasError) throw tombolasError;

        // Récupérer le nombre total de participants
        const { count: totalParticipants, error: participantsError } = await supabase
            .from('participants')
            .select('*', { count: 'exact', head: true });

        if (participantsError) throw participantsError;

        // Calculer les statistiques
        const totalTombolas = tombolas.length;
        const activeTombolas = tombolas.filter(t => t.status === 'active').length;
        const totalRevenue = tombolas.reduce((sum, t) => sum + (t.participants || 0) * t.ticket_price, 0);

        return {
            data: {
                totalTombolas,
                totalParticipants: totalParticipants || 0,
                totalRevenue,
                activeTombolas
            },
            error: null
        };
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        return { data: null, error };
    }
}

// ===== SERVICES POUR LES CONFIGURATIONS =====

/**
 * Récupère la configuration de l'application
 */
export async function getAppConfig() {
    try {
        const { data, error } = await supabase
            .from('app_config')
            .select('*')
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Erreur lors de la récupération de la configuration:', error);
        return { data: null, error };
    }
}

/**
 * Met à jour la configuration de l'application
 */
export async function updateAppConfig(config) {
    try {
        const { data, error } = await supabase
            .from('app_config')
            .upsert([config])
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la configuration:', error);
        return { data: null, error };
    }
}

/**
 * Met à jour la configuration de l'application par ID
 */
export async function updateAppConfigById(id, config) {
    try {
        const { data, error } = await supabase
            .from('app_config')
            .update(config)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la configuration:', error);
        return { data: null, error };
    }
}

/**
 * Vérifie le mot de passe admin
 */
export async function verifyAdminPassword(password) {
    try {
        const { data, error } = await supabase
            .from('app_config')
            .select('admin_password')
            .eq('id', 1)
            .single();

        if (error) throw error;
        return { isValid: data?.admin_password === password, error: null };
    } catch (error) {
        console.error('Erreur lors de la vérification du mot de passe:', error);
        return { isValid: false, error };
    }
}

// ===== UTILITAIRES =====

/**
 * Génère un numéro de ticket unique
 */
function generateTicketNumber() {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `TK-${timestamp}-${random}`;
}

/**
 * Met à jour le nombre de participants d'une tombola
 */
export async function updateTombolaParticipants(tombolaId) {
    try {
        const { count, error: countError } = await supabase
            .from('participants')
            .select('*', { count: 'exact', head: true })
            .eq('tombola_id', tombolaId)
            .eq('payment_status', 'confirmed');

        if (countError) throw countError;

        const { error: updateError } = await supabase
            .from('tombolas')
            .update({ participants: count })
            .eq('id', tombolaId);

        if (updateError) throw updateError;

        return { error: null };
    } catch (error) {
        console.error('Erreur lors de la mise à jour des participants:', error);
        return { error };
    }
}

// ===== SERVICES POUR LE TIRAGE =====

/**
 * Récupère les participants éligibles pour une tombola
 */
export async function getEligibleParticipants(tombolaId) {
    try {
        const { data, error } = await supabase
            .from('participants')
            .select('*')
            .eq('tombola_id', tombolaId)
            .eq('payment_status', 'confirmed');

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Erreur lors de la récupération des participants éligibles:', error);
        return { data: null, error };
    }
}

/**
 * Effectue le tirage automatique des gagnants
 */
export async function performDraw(tombolaId) {
    try {
        // Récupérer la tombola
        const { data: tombola, error: tombolaError } = await supabase
            .from('tombolas')
            .select('*')
            .eq('id', tombolaId)
            .single();

        if (tombolaError) throw tombolaError;

        // Vérifier que la tombola est active
        if (tombola.status !== 'active') {
            throw new Error('Cette tombola n\'est pas active');
        }

        // Vérifier que la date de tirage est atteinte
        const now = new Date();
        const drawDate = new Date(tombola.draw_date);
        if (now < drawDate) {
            throw new Error('La date de tirage n\'est pas encore atteinte');
        }

        // Récupérer les participants éligibles
        const { data: participants, error: participantsError } = await getEligibleParticipants(tombolaId);
        if (participantsError) throw participantsError;

        if (!participants || participants.length === 0) {
            throw new Error('Aucun participant éligible pour cette tombola');
        }

        // Déterminer le nombre de gagnants
        const maxWinners = Math.min(tombola.max_winners, participants.length);

        // Effectuer le tirage aléatoire
        const winners = [];
        const shuffledParticipants = [...participants].sort(() => Math.random() - 0.5);

        for (let i = 0; i < maxWinners; i++) {
            const participant = shuffledParticipants[i];

            // Déterminer le prix selon le rang
            let prizeAmount;
            if (tombola.prizes && tombola.prizes.length > 0) {
                const prize = tombola.prizes[i] || tombola.prizes[tombola.prizes.length - 1];
                prizeAmount = prize.value || tombola.jackpot;
            } else {
                // Répartition équitable du jackpot
                prizeAmount = `${Math.floor(parseInt(tombola.jackpot.replace(/\D/g, '')) / maxWinners).toLocaleString()} FCFA`;
            }

            // Créer le gagnant
            const { data: winner, error: winnerError } = await createWinner({
                participantId: participant.id,
                tombolaId: tombolaId,
                prizeAmount: prizeAmount,
                prizeRank: i + 1
            });

            if (winnerError) throw winnerError;
            winners.push(winner);
        }

        // Marquer la tombola comme terminée
        const { error: updateError } = await supabase
            .from('tombolas')
            .update({ status: 'completed' })
            .eq('id', tombolaId);

        if (updateError) throw updateError;

        return { data: winners, error: null };
    } catch (error) {
        console.error('Erreur lors du tirage:', error);
        return { data: null, error };
    }
} 