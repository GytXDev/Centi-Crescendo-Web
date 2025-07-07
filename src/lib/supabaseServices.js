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
            .select('id, ticket_price, status');

        if (tombolasError) throw tombolasError;

        // Récupérer le nombre total de participants confirmés
        const { count: totalParticipants, error: participantsError } = await supabase
            .from('participants')
            .select('*', { count: 'exact', head: true })
            .eq('payment_status', 'confirmed');

        if (participantsError) throw participantsError;

        // Calculer les revenus totaux en comptant les participants confirmés par tombola
        let totalRevenue = 0;
        for (const tombola of tombolas) {
            const { count: participantsCount } = await supabase
                .from('participants')
                .select('*', { count: 'exact', head: true })
                .eq('tombola_id', tombola.id)
                .eq('payment_status', 'confirmed');

            totalRevenue += (participantsCount || 0) * tombola.ticket_price;
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
        if (coupon.tombola_id !== tombolaId) {
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
        const { data, error } = await supabase
            .from('coupon_uses')
            .insert([{
                coupon_id: couponId,
                participant_id: participantId,
                tombola_id: tombolaId,
                original_price: originalPrice,
                discount_amount: discountAmount,
                final_price: finalPrice
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
 * Récupère les paliers de commission pour une tombola
 */
export async function getCommissionTiers(tombolaId) {
    try {
        const { data, error } = await supabase
            .from('commission_tiers')
            .select('*')
            .eq('tombola_id', tombolaId)
            .order('min_tickets', { ascending: true });

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Erreur lors de la récupération des paliers de commission:', error);
        return { data: null, error };
    }
}

/**
 * Crée ou met à jour les paliers de commission pour une tombola
 */
export async function updateCommissionTiers(tombolaId, tiers) {
    try {
        // Supprimer les anciens paliers
        const { error: deleteError } = await supabase
            .from('commission_tiers')
            .delete()
            .eq('tombola_id', tombolaId);

        if (deleteError) throw deleteError;

        // Insérer les nouveaux paliers
        const tiersWithTombolaId = tiers.map(tier => ({
            ...tier,
            tombola_id: tombolaId
        }));

        const { data, error } = await supabase
            .from('commission_tiers')
            .insert(tiersWithTombolaId)
            .select();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Erreur lors de la mise à jour des paliers de commission:', error);
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

// ===== SERVICES POUR LES COMMISSIONS =====

/**
 * Calcule les commissions pour un coupon basé sur le nombre de tickets vendus
 */
export async function calculateCouponCommission(couponId) {
    try {
        // Récupérer les informations du coupon et de la tombola
        const { data: coupon, error: couponError } = await supabase
            .from('coupons')
            .select(`
                *,
                tombolas (
                    id,
                    jackpot,
                    ticket_price
                ),
                coupon_uses (
                    id,
                    final_price,
                    used_at
                )
            `)
            .eq('id', couponId)
            .single();

        if (couponError) throw couponError;

        // Récupérer les paliers de commission
        const { data: tiers, error: tiersError } = await getCommissionTiers(coupon.tombola_id);
        if (tiersError) throw tiersError;

        // Calculer le nombre de tickets vendus
        const ticketsSold = coupon.coupon_uses.length;

        // Trouver le palier approprié
        let applicableTier = null;
        for (let i = tiers.length - 1; i >= 0; i--) {
            if (ticketsSold >= tiers[i].min_tickets) {
                applicableTier = tiers[i];
                break;
            }
        }

        if (!applicableTier) {
            return { data: { commission: 0, tier: null }, error: null };
        }

        // Calculer la commission
        const totalRevenue = coupon.coupon_uses.reduce((sum, use) => sum + use.final_price, 0);
        const commission = (totalRevenue * applicableTier.commission_percentage) / 100;

        return {
            data: {
                commission: Math.round(commission),
                tier: applicableTier,
                ticketsSold,
                totalRevenue
            },
            error: null
        };
    } catch (error) {
        console.error('Erreur lors du calcul de la commission:', error);
        return { data: null, error };
    }
}

/**
 * Met à jour les commissions pour tous les coupons d'une tombola
 */
export async function updateAllCommissionsForTombola(tombolaId) {
    try {
        // Récupérer tous les coupons de la tombola
        const { data: coupons, error: couponsError } = await getCouponsByTombola(tombolaId);
        if (couponsError) throw couponsError;

        const updates = [];
        for (const coupon of coupons) {
            const { data: commissionData } = await calculateCouponCommission(coupon.id);
            if (commissionData) {
                updates.push({
                    id: coupon.id,
                    total_commission: commissionData.commission
                });
            }
        }

        // Mettre à jour tous les coupons
        if (updates.length > 0) {
            const { error: updateError } = await supabase
                .from('coupons')
                .upsert(updates);

            if (updateError) throw updateError;
        }

        return { data: updates.length, error: null };
    } catch (error) {
        console.error('Erreur lors de la mise à jour des commissions:', error);
        return { data: null, error };
    }
}

/**
 * Récupère le récapitulatif des commissions pour une tombola
 */
export async function getCommissionSummaryForTombola(tombolaId) {
    try {
        // Récupérer les statistiques des coupons
        const { data: couponStats, error: statsError } = await getCouponStatsForTombola(tombolaId);
        if (statsError) throw statsError;

        // Récupérer les paliers de commission
        const { data: tiers, error: tiersError } = await getCommissionTiers(tombolaId);
        if (tiersError) throw tiersError;

        // Calculer les totaux
        const totalCommissions = couponStats.reduce((sum, coupon) => sum + parseFloat(coupon.total_commission || 0), 0);
        const totalRevenue = couponStats.reduce((sum, coupon) => sum + parseFloat(coupon.total_revenue || 0), 0);
        const totalTickets = couponStats.reduce((sum, coupon) => sum + (coupon.total_uses || 0), 0);

        // Trier les parrains par performance
        const topSponsors = couponStats
            .filter(coupon => coupon.total_uses > 0)
            .sort((a, b) => b.total_uses - a.total_uses)
            .slice(0, 10); // Top 10

        return {
            data: {
                totalCommissions: Math.round(totalCommissions),
                totalRevenue: Math.round(totalRevenue),
                totalTickets,
                topSponsors,
                tiers,
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