import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    TrendingUp,
    Users,
    DollarSign,
    Copy,
    CheckCircle,
    AlertCircle,
    Trophy,
    Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { getCouponsByCreator, getCommissionTiers, updateCouponDiscount } from '@/lib/supabaseServices';

function CouponDashboard({ userPhone }) {
    const [coupons, setCoupons] = useState([]);
    const [commissionTiers, setCommissionTiers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copiedCode, setCopiedCode] = useState(null);
    const { toast } = useToast();
    const [editingDiscount, setEditingDiscount] = useState({});
    const [updatingId, setUpdatingId] = useState(null);

    useEffect(() => {
        if (userPhone) {
            loadUserCoupons();
        }
    }, [userPhone]);

    const loadUserCoupons = async () => {
        try {
            setLoading(true);

            const { data: userCoupons, error: couponsError } = await getCouponsByCreator(userPhone);
            if (couponsError) {
                console.error('Erreur lors du chargement des coupons:', couponsError);
            } else {
                setCoupons(userCoupons || []);

                // Charger les paliers de commission pour chaque tombola
                if (userCoupons && userCoupons.length > 0) {
                    const tombolaIds = [...new Set(userCoupons.map(c => c.tombola_id))];
                    const allTiers = {};

                    for (const tombolaId of tombolaIds) {
                        const { data: tiers, error: tiersError } = await getCommissionTiers(tombolaId);
                        if (!tiersError && tiers) {
                            allTiers[tombolaId] = tiers;
                        }
                    }
                    setCommissionTiers(allTiers);
                }
            }
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = async (code) => {
        try {
            await navigator.clipboard.writeText(code);
            setCopiedCode(code);
            toast({
                title: "Copié !",
                description: "Le code coupon a été copié dans le presse-papiers.",
                variant: "default"
            });
            setTimeout(() => setCopiedCode(null), 2000);
        } catch (error) {
            toast({
                title: "Erreur",
                description: "Impossible de copier le code.",
                variant: "destructive"
            });
        }
    };

    const shareCoupon = async (code) => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Mon coupon de réduction',
                    text: `Utilisez mon code coupon ${code} pour obtenir 10% de réduction sur votre ticket de tombola !`,
                    url: window.location.href
                });
            } catch (error) {
                copyToClipboard(code);
            }
        } else {
            copyToClipboard(code);
        }
    };

    const getCurrentTier = (coupon) => {
        const tiers = commissionTiers[coupon.tombola_id] || [];
        const currentTier = tiers
            .filter(tier => tier.min_tickets <= coupon.total_uses)
            .sort((a, b) => b.min_tickets - a.min_tickets)[0];

        return currentTier;
    };

    const getNextTier = (coupon) => {
        const tiers = commissionTiers[coupon.tombola_id] || [];
        const nextTier = tiers
            .filter(tier => tier.min_tickets > coupon.total_uses)
            .sort((a, b) => a.min_tickets - b.min_tickets)[0];

        return nextTier;
    };

    const getProgressPercentage = (coupon) => {
        const currentTier = getCurrentTier(coupon);
        const nextTier = getNextTier(coupon);

        if (!currentTier) return 0;
        if (!nextTier) return 100;

        const currentTierTickets = currentTier.min_tickets;
        const nextTierTickets = nextTier.min_tickets;
        const progress = ((coupon.total_uses - currentTierTickets) / (nextTierTickets - currentTierTickets)) * 100;

        return Math.min(100, Math.max(0, progress));
    };

    const handleDiscountInput = (couponId, value) => {
        setEditingDiscount(prev => ({ ...prev, [couponId]: value }));
    };

    const handleUpdateDiscount = async (couponId) => {
        const newDiscount = parseInt(editingDiscount[couponId], 10);
        if (isNaN(newDiscount) || newDiscount < 0 || newDiscount > 100) {
            toast({
                title: "Erreur",
                description: "Le pourcentage doit être entre 0 et 100.",
                variant: "destructive"
            });
            return;
        }
        setUpdatingId(couponId);
        const { error } = await updateCouponDiscount(couponId, newDiscount);
        setUpdatingId(null);
        if (!error) {
            toast({
                title: "Succès",
                description: "Le pourcentage de réduction a été mis à jour.",
                variant: "success"
            });
            setEditingDiscount(prev => ({ ...prev, [couponId]: undefined }));
            loadUserCoupons();
        } else {
            toast({
                title: "Erreur",
                description: "Impossible de mettre à jour le pourcentage.",
                variant: "destructive"
            });
        }
    };

    if (loading) {
        return (
            <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-4"></div>
                <p className="text-gray-400">Chargement de vos coupons...</p>
            </div>
        );
    }

    if (coupons.length === 0) {
        return (
            <div className="text-center py-8">
                <AlertCircle className="text-gray-400 mx-auto mb-4" size={48} />
                <h3 className="text-xl font-bold text-white mb-2">Aucun coupon créé</h3>
                <p className="text-gray-400 mb-4">
                    Vous n'avez pas encore créé de coupon de parrainage.
                </p>
                <p className="text-sm text-gray-500">
                    Créez votre premier coupon pour commencer à gagner des commissions !
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Statistiques globales */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
                <div className="bg-[#1C1C21]/50 border border-gray-800 rounded-xl p-4">
                    <div className="flex items-center space-x-3">
                        <div className="bg-blue-500/20 p-2 rounded-lg">
                            <Users className="text-blue-400" size={20} />
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm">Total joueurs parrainés</p>
                            <p className="text-2xl font-bold text-white">
                                {coupons.reduce((sum, coupon) => sum + coupon.total_uses, 0)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-[#1C1C21]/50 border border-gray-800 rounded-xl p-4">
                    <div className="flex items-center space-x-3">
                        <div className="bg-green-500/20 p-2 rounded-lg">
                            <DollarSign className="text-green-400" size={20} />
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm">Revenus générés</p>
                            <p className="text-2xl font-bold text-white">
                                {coupons.reduce((sum, coupon) => sum + parseFloat(coupon.total_revenue || 0), 0).toLocaleString()} FCFA
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-[#1C1C21]/50 border border-gray-800 rounded-xl p-4">
                    <div className="flex items-center space-x-3">
                        <div className="bg-yellow-500/20 p-2 rounded-lg">
                            <TrendingUp className="text-yellow-400" size={20} />
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm">Commissions</p>
                            <p className="text-2xl font-bold text-white">
                                {coupons.reduce((sum, coupon) => sum + parseFloat(coupon.total_commission || 0), 0).toLocaleString()} FCFA
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Liste des coupons */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-white">Vos Coupons</h3>

                {coupons.map((coupon, index) => {
                    const currentTier = getCurrentTier(coupon);
                    const nextTier = getNextTier(coupon);
                    const progressPercentage = getProgressPercentage(coupon);

                    return (
                        <motion.div
                            key={coupon.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-[#1C1C21]/50 border border-gray-800 rounded-xl p-6"
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                                {/* Informations du coupon */}
                                <div className="flex-1">
                                    <div className="flex items-center space-x-4 mb-3">
                                        <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2">
                                            <span className="text-yellow-400 font-mono font-bold text-lg">
                                                {coupon.code}
                                            </span>
                                        </div>
                                        <div className="flex space-x-2">
                                            <Button
                                                onClick={() => copyToClipboard(coupon.code)}
                                                variant="outline"
                                                size="sm"
                                                className="border-gray-600 text-gray-300 hover:bg-gray-800"
                                            >
                                                {copiedCode === coupon.code ? <CheckCircle size={16} /> : <Copy size={16} />}
                                            </Button>
                                            <Button
                                                onClick={() => shareCoupon(coupon.code)}
                                                variant="outline"
                                                size="sm"
                                                className="border-gray-600 text-gray-300 hover:bg-gray-800"
                                            >
                                                <Share2 size={16} />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <p className="text-gray-400">Tombola</p>
                                            <p className="text-white font-semibold">{coupon.tombolas?.title}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400">Joueurs parrainés</p>
                                            <p className="text-green-400 font-bold">{coupon.total_uses}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400">Réduction</p>
                                            <p className="text-yellow-400 font-bold">{coupon.discount_percentage}%</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400">Commissions</p>
                                            <p className="text-blue-400 font-bold">
                                                {parseFloat(coupon.total_commission || 0).toLocaleString()} FCFA
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Progression des paliers */}
                                <div className="md:w-64">
                                    <div className="bg-gray-900 rounded-lg p-4">
                                        <div className="flex items-center space-x-2 mb-3">
                                            <Trophy className="text-yellow-400" size={16} />
                                            <span className="text-white font-semibold text-sm">
                                                {currentTier ? `Niveau ${currentTier.tier_name}` : 'Aucun niveau'}
                                            </span>
                                        </div>

                                        {currentTier && (
                                            <div className="mb-2">
                                                <div className="flex justify-between text-xs text-gray-400 mb-1">
                                                    <span>{currentTier.min_tickets} tickets</span>
                                                    <span>{currentTier.commission_percentage}% commission</span>
                                                </div>
                                                <div className="w-full bg-gray-700 rounded-full h-2">
                                                    <div
                                                        className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                                                        style={{ width: `${progressPercentage}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )}

                                        {nextTier && (
                                            <div className="text-xs text-gray-400">
                                                <p>Prochain niveau : {nextTier.tier_name}</p>
                                                <p>Il vous manque {nextTier.min_tickets - coupon.total_uses} tickets</p>
                                            </div>
                                        )}

                                        {!nextTier && currentTier && (
                                            <div className="text-xs text-green-400">
                                                <p>Niveau maximum atteint !</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}

export default CouponDashboard; 