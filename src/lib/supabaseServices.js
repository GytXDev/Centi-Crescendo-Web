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

        // Calculer le nombre de participants pour chaque tombola
        const tombolasWithParticipants = await Promise.all(
            (data || []).map(async (tombola) => {
                const { count: participantsCount, error: countError } = await supabase
                    .from('participants')
                    .select('*', { count: 'exact', head: true })
                    .eq('tombola_id', tombola.id)
                    .eq('payment_status', 'confirmed');

                return {
                    ...tombola,
                    participants: countError ? 0 : (participantsCount || 0)
                };
            })
        );

        return { data: tombolasWithParticipants, error: null };
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

        // Si une tombola active est trouvée, calculer le nombre de participants dynamiquement
        if (data) {
            const { count: participantsCount, error: countError } = await supabase
                .from('participants')
                .select('*', { count: 'exact', head: true })
                .eq('tombola_id', data.id)
                .eq('payment_status', 'confirmed');

            if (!countError) {
                return {
                    data: {
                        ...data,
                        participants: participantsCount || 0
                    },
                    error: null
                };
            }
        }

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
                status: 'active'
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
            .select(`
                *,
                tombolas (
                    id,
                    title,
                    ticket_price,
                    draw_date,
                    jackpot,
                    status
                ),
                coupon_uses (
                    id,
                    coupon_id,
                    original_price,
                    discount_amount,
                    final_price,
                    commission_earned,
                    used_at,
                    coupons (
                        code,
                        discount_percentage,
                        creator_name,
                        creator_phone
                    )
                ),
                winners (
                    id,
                    prize_amount,
                    prize_rank,
                    created_at
                )
            `)
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
export async function createParticipant(participantData, paymentStatus = 'confirmed') {
    try {
        const { data, error } = await supabase
            .from('participants')
            .insert([{
                name: participantData.name,
                phone: participantData.phone,
                tombola_id: participantData.tombolaId,
                ticket_number: generateTicketNumber(),
                payment_status: paymentStatus,
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

/**
 * Récupère les gagnants d'une tombola spécifique
 */
export async function getWinnersByTombola(tombolaId) {
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
            .eq('tombola_id', tombolaId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Erreur lors de la récupération des gagnants de la tombola:', error);
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
            .select('id, ticket_price, status');

        if (tombolasError) throw tombolasError;

        // Récupérer le nombre total de participants confirmés
        const { count: totalParticipants, error: participantsError } = await supabase
            .from('participants')
            .select('*', { count: 'exact', head: true })
            .eq('payment_status', 'confirmed');

        if (participantsError) throw participantsError;

        // Récupérer tous les participants confirmés
        const { data: participants } = await supabase
            .from('participants')
            .select('id, tombola_id, payment_status')
            .eq('payment_status', 'confirmed');

        // Récupérer tous les coupon_uses (tickets achetés avec coupon)
        const { data: couponUses } = await supabase
            .from('coupon_uses')
            .select('participant_id, final_price');

        // Map pour retrouver le prix payé par participant via coupon
        const couponPriceByParticipant = {};
        (couponUses || []).forEach(cu => {
            couponPriceByParticipant[cu.participant_id] = cu.final_price;
        });

        // Calculer les revenus totaux en additionnant le prix payé par chaque participant
        let totalRevenue = 0;
        for (const participant of participants || []) {
            if (couponPriceByParticipant[participant.id] !== undefined) {
                totalRevenue += couponPriceByParticipant[participant.id];
            } else {
                // Trouver le prix du ticket de la tombola associée
                const tombola = tombolas.find(t => t.id === participant.tombola_id);
                totalRevenue += tombola ? tombola.ticket_price : 0;
            }
        }

        // Calculer les statistiques
        const totalTombolas = tombolas.length;
        const activeTombolas = tombolas.filter(t => t.status === 'active').length;

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
 * Calcule le nombre de participants d'une tombola
 */
export async function getTombolaParticipantsCount(tombolaId) {
    try {
        const { count, error } = await supabase
            .from('participants')
            .select('*', { count: 'exact', head: true })
            .eq('tombola_id', tombolaId)
            .eq('payment_status', 'confirmed');

        if (error) throw error;
        return { data: count || 0, error: null };
    } catch (error) {
        console.error('Erreur lors du calcul du nombre de participants:', error);
        return { data: 0, error };
    }
}

/**
 * Met à jour le nombre de participants d'une tombola (fonction legacy - dépréciée)
 * @deprecated Utilisez getTombolaParticipantsCount() à la place
 */
export async function updateTombolaParticipants(tombolaId) {
    console.warn('updateTombolaParticipants est dépréciée. Utilisez getTombolaParticipantsCount() à la place.');
    return getTombolaParticipantsCount(tombolaId);
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

            // Chercher si le participant a utilisé un coupon pour cette tombola
            const { data: couponUse } = await supabase
                .from('coupon_uses')
                .select('coupon_id, coupons(discount_percentage)')
                .eq('participant_id', participant.id)
                .eq('tombola_id', tombolaId)
                .single();

            let bonusCommission = null;
            if (couponUse && couponUse.coupons && couponUse.coupons.discount_percentage) {
                // Calculer le bonus : pourcentage de réduction * montant du gros lot
                const jackpotValue = parseInt(tombola.jackpot.replace(/\D/g, ''));
                bonusCommission = Math.round(jackpotValue * couponUse.coupons.discount_percentage / 100);
            }

            // Créer le gagnant avec bonusCommission si applicable
            const { data: winner, error: winnerError } = await supabase
                .from('winners')
                .insert([{
                    participant_id: participant.id,
                    tombola_id: tombolaId,
                    prize_amount: prizeAmount,
                    prize_rank: i + 1,
                    bonus_commission: bonusCommission
                }])
                .select()
                .single();

            if (winnerError) throw winnerError;
            winners.push(winner);
        }

        // Marquer la tombola comme terminée
        const { error: updateError } = await supabase
            .from('tombolas')
            .update({ status: 'completed' })
            .eq('id', tombolaId);

        if (updateError) throw updateError;

        // À la fin de performDraw, après avoir marqué la tombola comme terminée
        // Archiver tous les coupons utilisés pour cette tombola
        await supabase
            .from('coupons')
            .update({ is_archived: true })
            .eq('tombola_id', tombolaId)
            .gt('total_uses', 0);

        return { data: winners, error: null };
    } catch (error) {
        console.error('Erreur lors du tirage:', error);
        return { data: null, error };
    }
}

// ===== SERVICES POUR LE SYSTÈME DE COUPONS ET PARRAINAGE =====

/**
 * Crée un nouveau coupon pour une tombola
 */
export async function createCoupon(couponData) {
    try {
        const { data, error } = await supabase
            .from('coupons')
            .insert([couponData])
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Erreur lors de la création du coupon:', error);
        return { data: null, error };
    }
}

/**
 * Récupère tous les coupons d'une tombola
 */
export async function getCouponsByTombola(tombolaId) {
    try {
        const { data, error } = await supabase
            .from('coupons')
            .select('*')
            .eq('tombola_id', tombolaId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Erreur lors de la récupération des coupons:', error);
        return { data: null, error };
    }
}

/**
 * Récupère un coupon par son code
 */
export async function getCouponByCode(code) {
    try {
        const { data, error } = await supabase
            .from('coupons')
            .select(`
                *,
                tombolas (
                    id,
                    title,
                    ticket_price,
                    status,
                    draw_date
                )
            `)
            .eq('code', code)
            .eq('is_active', true)
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Erreur lors de la récupération du coupon:', error);
        return { data: null, error };
    }
}

/**
 * Vérifie si un coupon est valide pour une tombola
 */
export async function validateCoupon(code, tombolaId, userPhone) {
    try {
        const { data: coupon, error } = await getCouponByCode(code);

        if (error || !coupon) {
            return { isValid: false, error: 'Coupon invalide ou inexistant' };
        }

        // Vérifier que le coupon appartient à la bonne tombola
        if (String(coupon.tombola_id) !== String(tombolaId)) {
            return { isValid: false, error: 'Ce coupon n\'est pas valide pour cette tombola' };
        }

        // Vérifier que l'utilisateur n'utilise pas son propre coupon
        if (coupon.creator_phone === userPhone) {
            return { isValid: false, error: 'Vous ne pouvez pas utiliser votre propre coupon' };
        }

        // Vérifier que la tombola est encore active
        if (coupon.tombolas.status !== 'active') {
            return { isValid: false, error: 'Cette tombola n\'est plus active' };
        }

        // Vérifier que la date de tirage n'est pas dépassée
        const now = new Date();
        const drawDate = new Date(coupon.tombolas.draw_date);
        if (now >= drawDate) {
            return { isValid: false, error: 'Les participations sont fermées pour cette tombola' };
        }

        return {
            isValid: true,
            coupon: coupon,
            discountAmount: Math.floor(coupon.tombolas.ticket_price * coupon.discount_percentage / 100)
        };
    } catch (error) {
        console.error('Erreur lors de la validation du coupon:', error);
        return { isValid: false, error: 'Erreur lors de la validation du coupon' };
    }
}

/**
 * Enregistre l'utilisation d'un coupon
 */
export async function useCoupon(couponId, participantId, tombolaId, originalPrice, discountAmount, finalPrice) {
    try {
        const commissionEarned = discountAmount * 2;
        const { data, error } = await supabase
            .from('coupon_uses')
            .insert([{
                coupon_id: couponId,
                participant_id: participantId,
                tombola_id: tombolaId,
                original_price: originalPrice,
                discount_amount: discountAmount,
                final_price: finalPrice,
                commission_earned: commissionEarned
            }])
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Erreur lors de l\'utilisation du coupon:', error);
        return { data: null, error };
    }
}

/**
 * Récupère les statistiques d'un coupon
 */
export async function getCouponStats(couponId) {
    try {
        const { data, error } = await supabase
            .from('coupons')
            .select(`
                *,
                coupon_uses (
                    id,
                    final_price,
                    used_at
                )
            `)
            .eq('id', couponId)
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques du coupon:', error);
        return { data: null, error };
    }
}

/**
 * Récupère les coupons créés par un utilisateur (par numéro de téléphone)
 */
export async function getCouponsByCreator(creatorPhone) {
    try {
        const { data, error } = await supabase
            .from('coupons')
            .select(`
                *,
                tombolas (
                    id,
                    title,
                    status
                ),
                coupon_uses (
                    id,
                    final_price,
                    used_at
                )
            `)
            .eq('creator_phone', creatorPhone)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Erreur lors de la récupération des coupons du créateur:', error);
        return { data: null, error };
    }
}

/**
 * Récupère les statistiques globales des coupons pour une tombola
 */
export async function getCouponStatsForTombola(tombolaId) {
    try {
        const { data, error } = await supabase
            .from('coupons')
            .select(`
                id,
                code,
                creator_name,
                creator_phone,
                total_uses,
                total_revenue,
                total_commission,
                created_at
            `)
            .eq('tombola_id', tombolaId)
            .order('total_uses', { ascending: false });

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques des coupons:', error);
        return { data: null, error };
    }
}

/**
 * Génère un code coupon unique basé sur le nom du créateur
 */
export async function generateUniqueCouponCode(creatorName) {
    try {
        // Utiliser la fonction PostgreSQL pour générer le code
        const { data, error } = await supabase
            .rpc('generate_coupon_code', { creator_name: creatorName });

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Erreur lors de la génération du code coupon:', error);
        return { data: null, error };
    }
}

/**
 * Met à jour le pourcentage de discount d'un coupon
 */
export async function updateCouponDiscount(couponId, newDiscount) {
    try {
        const { data, error } = await supabase
            .from('coupons')
            .update({ discount_percentage: newDiscount })
            .eq('id', couponId)
            .select()
            .single();
        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Erreur lors de la mise à jour du discount:', error);
        return { data: null, error };
    }
}

/**
 * Met à jour le code d'un coupon
 */
export async function updateCouponCode(couponId, newCode) {
    try {
        const { data, error } = await supabase
            .from('coupons')
            .update({ code: newCode })
            .eq('id', couponId)
            .select()
            .single();
        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Erreur lors de la mise à jour du code coupon:', error);
        return { data: null, error };
    }
}

/**
 * Met à jour le statut de contact du parrain pour un coupon
 */
export async function updateCouponParrainContacte(couponId, parrainContacte) {
    const { data, error } = await supabase
        .from('coupons')
        .update({ parrain_contacte: parrainContacte })
        .eq('id', couponId);
    return { data, error };
}

/**
 * Supprime un coupon par son id
 */
export async function deleteCoupon(couponId) {
    // Vérifier que le coupon n'a jamais été utilisé
    const { data: coupon } = await supabase
        .from('coupons')
        .select('total_uses')
        .eq('id', couponId)
        .single();
    if (!coupon || coupon.total_uses > 0) {
        return { data: null, error: 'Impossible de supprimer un coupon déjà utilisé.' };
    }
    const { data, error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', couponId);
    return { data, error };
}

/**
 * Archive un coupon
 */
export async function archiveCoupon(couponId) {
    const { data, error } = await supabase
        .from('coupons')
        .update({ is_archived: true })
        .eq('id', couponId)
        .select()
        .single();
    return { data, error };
}

// ===== SERVICES POUR LES COMMISSIONS =====

/**
 * Récupère le récapitulatif des commissions pour une tombola
 */
export async function getCommissionSummaryForTombola(tombolaId) {
    try {
        // Récupérer les statistiques des coupons
        const { data: couponStats, error: statsError } = await getCouponStatsForTombola(tombolaId);
        if (statsError) throw statsError;

        // Récupérer tous les gagnants de la tombola pour les bonus
        const { data: winners, error: winnersError } = await getWinnersByTombola(tombolaId);
        if (winnersError) throw winnersError;

        // Map : coupon_id -> bonus total
        const bonusByCouponId = {};
        (winners || []).forEach(winner => {
            if (winner.bonus_commission && winner.bonus_commission > 0 && winner.coupon_id) {
                bonusByCouponId[winner.coupon_id] = (bonusByCouponId[winner.coupon_id] || 0) + parseFloat(winner.bonus_commission);
            }
        });

        // Calculer les totaux
        const totalCommissions = couponStats.reduce((sum, coupon) => sum + parseFloat(coupon.total_commission || 0), 0);
        const totalRevenue = couponStats.reduce((sum, coupon) => sum + parseFloat(coupon.total_revenue || 0), 0);
        const totalTickets = couponStats.reduce((sum, coupon) => sum + (coupon.total_uses || 0), 0);

        // Trier les parrains par performance
        const topSponsors = couponStats
            .filter(coupon => coupon.total_uses > 0)
            .sort((a, b) => b.total_uses - a.total_uses)
            .slice(0, 10) // Top 10
            .map(coupon => ({
                ...coupon,
                bonus_commission: bonusByCouponId[coupon.id] || 0
            }));

        return {
            data: {
                totalCommissions: Math.round(totalCommissions),
                totalRevenue: Math.round(totalRevenue),
                totalTickets,
                topSponsors,
                couponStats
            },
            error: null
        };
    } catch (error) {
        console.error('Erreur lors de la récupération du récapitulatif des commissions:', error);
        return { data: null, error };
    }
}

/**
 * Crée un paiement de commission
 */
export async function createCommissionPayment(couponId, tierId, amount) {
    try {
        const { data, error } = await supabase
            .from('commission_payments')
            .insert([{
                coupon_id: couponId,
                tier_id: tierId,
                amount: amount,
                payment_status: 'pending'
            }])
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Erreur lors de la création du paiement de commission:', error);
        return { data: null, error };
    }
}

/**
 * Met à jour le statut d'un paiement de commission
 */
export async function updateCommissionPaymentStatus(paymentId, status) {
    try {
        const updateData = { payment_status: status };
        if (status === 'paid') {
            updateData.payment_date = new Date().toISOString();
        }

        const { data, error } = await supabase
            .from('commission_payments')
            .update(updateData)
            .eq('id', paymentId)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Erreur lors de la mise à jour du statut de paiement:', error);
        return { data: null, error };
    }
}

/**
 * Met à jour l'URL de la photo d'un gagnant
 */
export async function updateWinnerPhotoUrl(winnerId, photoUrl) {
    try {
        const { data, error } = await supabase
            .from('winners')
            .update({ photo_url: photoUrl })
            .eq('id', winnerId)
            .select()
            .single();
        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error("Erreur lors de la mise à jour de la photo du gagnant:", error);
        return { data: null, error };
    }
}

export async function getAllCoupons({ includeArchived = false } = {}) {
    let query = supabase
        .from('coupons')
        .select(`*, tombolas (title), creator_name, creator_phone, parrain_contacte`)
        .order('created_at', { ascending: false });
    if (!includeArchived) {
        query = query.eq('is_archived', false);
    }
    const { data, error } = await query;
    if (error) throw error;
    return { data, error: null };
}

/**
 * Supprime automatiquement tous les coupons non utilisés d'une tombola inactive
 */
export async function deleteUnusedCouponsForInactiveTombola(tombolaId) {
    try {
        // Vérifier que la tombola est inactive
        const { data: tombola, error: tombolaError } = await supabase
            .from('tombolas')
            .select('status')
            .eq('id', tombolaId)
            .single();

        if (tombolaError) throw tombolaError;
        if (tombola.status === 'active') {
            return { data: null, error: 'Impossible de supprimer les coupons d\'une tombola active' };
        }

        // Supprimer tous les coupons non utilisés
        const { data, error } = await supabase
            .from('coupons')
            .delete()
            .eq('tombola_id', tombolaId)
            .eq('total_uses', 0);

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Erreur lors de la suppression des coupons non utilisés:', error);
        return { data: null, error };
    }
}

/**
 * Vérifie s'il y a des coupons non utilisés dans une tombola inactive
 */
export async function hasUnusedCouponsInInactiveTombola(tombolaId) {
    try {
        // Vérifier que la tombola est inactive
        const { data: tombola, error: tombolaError } = await supabase
            .from('tombolas')
            .select('status')
            .eq('id', tombolaId)
            .single();

        if (tombolaError) throw tombolaError;
        if (tombola.status === 'active') {
            return { data: false, error: null };
        }

        // Compter les coupons non utilisés
        const { count, error } = await supabase
            .from('coupons')
            .select('*', { count: 'exact', head: true })
            .eq('tombola_id', tombolaId)
            .eq('total_uses', 0);

        if (error) throw error;
        return { data: count > 0, error: null };
    } catch (error) {
        console.error('Erreur lors de la vérification des coupons non utilisés:', error);
        return { data: false, error };
    }
}

/**
 * Supprime une tombola avec vérification du mot de passe et confirmation
 */
export async function deleteTombolaWithConfirmation(id, password, confirmationText) {
    try {
        // Vérifier le mot de passe admin
        const { data: adminCheck, error: adminError } = await verifyAdminPassword(password);
        if (adminError || !adminCheck) {
            return { data: null, error: 'Mot de passe administrateur incorrect' };
        }

        // Récupérer le nom de la tombola pour vérification
        const { data: tombola, error: tombolaError } = await supabase
            .from('tombolas')
            .select('title')
            .eq('id', id)
            .single();

        if (tombolaError) throw tombolaError;

        // Vérifier le texte de confirmation
        const expectedText = `oui je souhaite supprimer ${tombola.title}`;
        if (confirmationText.toLowerCase().trim() !== expectedText.toLowerCase().trim()) {
            return { data: null, error: `Texte de confirmation incorrect. Veuillez écrire exactement : "${expectedText}"` };
        }

        // Supprimer la tombola
        const { error: deleteError } = await supabase
            .from('tombolas')
            .delete()
            .eq('id', id);

        if (deleteError) throw deleteError;
        return { data: { success: true }, error: null };
    } catch (error) {
        console.error('Erreur lors de la suppression de la tombola:', error);
        return { data: null, error };
    }
}

/**
 * Crée un paiement de commission pour un parrain
 */
export async function createSponsorPayment(sponsorId, tombolaId, amount, sponsorName, sponsorPhone) {
    try {
        // Vérifier d'abord s'il existe déjà un paiement
        const { data: existingPayment, error: checkError } = await checkSponsorPaymentStatus(sponsorId, tombolaId);
        if (checkError && checkError.code !== 'PGRST116') {
            throw checkError;
        }

        if (existingPayment) {
            return {
                data: existingPayment,
                error: 'Un paiement existe déjà pour ce parrain et cette tombola'
            };
        }

        const { data, error } = await supabase
            .from('sponsor_payments')
            .insert([{
                sponsor_id: parseInt(sponsorId),
                tombola_id: parseInt(tombolaId),
                amount: amount,
                sponsor_name: sponsorName,
                sponsor_phone: sponsorPhone,
                payment_status: 'paid',
                payment_date: new Date().toISOString(),
                receipt_number: generateReceiptNumber()
            }])
            .select()
            .single();

        if (error) {
            // Gérer spécifiquement les erreurs de contrainte unique
            if (error.code === '23505') {
                return {
                    data: null,
                    error: 'Un paiement existe déjà pour ce parrain et cette tombola'
                };
            }
            throw error;
        }

        return { data, error: null };
    } catch (error) {
        console.error('Erreur lors de la création du paiement parrain:', error);
        return { data: null, error };
    }
}

/**
 * Vérifie si un parrain a déjà été payé pour une tombola
 */
export async function checkSponsorPaymentStatus(sponsorId, tombolaId) {
    try {
        const { data, error } = await supabase
            .from('sponsor_payments')
            .select('*')
            .eq('sponsor_id', sponsorId)
            .eq('tombola_id', tombolaId)
            .eq('payment_status', 'paid')
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            throw error;
        }

        return { data: data || null, error: null };
    } catch (error) {
        console.error('Erreur lors de la vérification du statut de paiement:', error);
        return { data: null, error };
    }
}

/**
 * Génère un numéro de reçu unique
 */
function generateReceiptNumber() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `RCP-${timestamp}-${random}`;
}

/**
 * Récupère les paiements de commission pour une tombola
 */
export async function getSponsorPaymentsForTombola(tombolaId) {
    try {
        const { data, error } = await supabase
            .from('sponsor_payments')
            .select('*')
            .eq('tombola_id', tombolaId)
            .order('payment_date', { ascending: false });

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Erreur lors de la récupération des paiements parrain:', error);
        return { data: null, error };
    }
}

/**
 * Récupère les paiements de commission pour un parrain
 */
export async function getSponsorPaymentsForSponsor(sponsorId) {
    try {
        const { data, error } = await supabase
            .from('sponsor_payments')
            .select(`
                *,
                tombolas (
                    id,
                    title
                )
            `)
            .eq('sponsor_id', sponsorId)
            .eq('payment_status', 'paid')
            .order('payment_date', { ascending: false });

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Erreur lors de la récupération des paiements parrain:', error);
        return { data: null, error };
    }
}

/**
 * Génère un reçu PDF pour un paiement de commission
 */
export async function generatePaymentReceipt(paymentId) {
    try {
        const { data: payment, error } = await supabase
            .from('sponsor_payments')
            .select('*')
            .eq('id', paymentId)
            .single();

        if (error) throw error;
        return { data: payment, error: null };
    } catch (error) {
        console.error('Erreur lors de la génération du reçu:', error);
        return { data: null, error };
    }
} 