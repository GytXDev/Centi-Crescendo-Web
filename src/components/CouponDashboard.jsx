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
import { getCouponsByCreator, updateCouponDiscount } from '@/lib/supabaseServices';

function CouponDashboard({ userPhone }) {
    const [coupons, setCoupons] = useState([]);
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
            }
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = async (code) => {
        try {
            const coupon = coupons.find(c => c.code === code);
            if (!coupon) {
                toast({
                    title: "Erreur",
                    description: "Coupon introuvable.",
                    variant: "destructive"
                });
                return;
            }

            const shareMessage = `🎉 Participe à la ${coupon?.tombolas?.title || 'tombola'} !
Utilise mon code ${code} pour -${coupon?.discount_percentage || 10}% de réduction sur ton ticket 🎟️
👉 https://www.cresapp.site
🍀 Bonne chance !`;

            // Essayer d'abord l'API Clipboard moderne
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(shareMessage);
            } else {
                // Fallback pour les navigateurs plus anciens
                const textArea = document.createElement('textarea');
                textArea.value = shareMessage;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();

                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);

                if (!successful) {
                    throw new Error('execCommand copy failed');
                }
            }

            setCopiedCode(code);
            toast({
                title: "Copié !",
                description: "Le message de partage a été copié dans le presse-papiers.",
                variant: "default"
            });
            setTimeout(() => setCopiedCode(null), 2000);
        } catch (error) {
            console.error('Erreur lors de la copie:', error);

            // Fallback final : afficher le message pour copie manuelle
            const coupon = coupons.find(c => c.code === code);
            const shareMessage = `🎉 Participe à la ${coupon?.tombolas?.title || 'tombola'} !
Utilise mon code ${code} pour -${coupon?.discount_percentage || 10}% de réduction sur ton ticket 🎟️
👉 https://www.cresapp.site
🍀 Bonne chance !`;

            // Créer un modal ou une alerte avec le message
            if (window.confirm('Impossible de copier automatiquement. Voulez-vous voir le message à copier manuellement ?')) {
                alert(`Copiez ce message :\n\n${shareMessage}`);
            }

            toast({
                title: "Erreur de copie",
                description: "Impossible de copier automatiquement. Vérifiez les permissions du navigateur.",
                variant: "destructive"
            });
        }
    };

    const shareCoupon = async (code) => {
        const coupon = coupons.find(c => c.code === code);
        const shareMessage = `🎉 Participe à la ${coupon?.tombolas?.title || 'tombola'} !
Utilise mon code ${code} pour -${coupon?.discount_percentage || 10}% de réduction sur ton ticket 🎟️
👉 https://www.cresapp.site
🍀 Bonne chance !`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Mon coupon de réduction',
                    text: shareMessage,
                    url: 'https://www.cresapp.site'
                });
            } catch (error) {
                copyToClipboard(code);
            }
        } else {
            copyToClipboard(code);
        }
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
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}

export default CouponDashboard; 