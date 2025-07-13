import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Users, Trophy, Phone, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { getCommissionSummaryForTombola, checkSponsorPaymentStatus } from '@/lib/supabaseServices';
import CommissionPaymentButton from './CommissionPaymentButton';
import jsPDF from 'jspdf';

function CommissionSummary({ tombolaId, tombolaTitle }) {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [paymentStatuses, setPaymentStatuses] = useState({});
    const { toast } = useToast();

    useEffect(() => {
        if (tombolaId) {
            loadCommissionSummary();
        }
    }, [tombolaId]);

    const loadCommissionSummary = async () => {
        try {
            setLoading(true);
            const { data, error } = await getCommissionSummaryForTombola(tombolaId);

            if (error) {
                toast({
                    title: "Erreur",
                    description: "Impossible de charger le récapitulatif des commissions.",
                    variant: "destructive"
                });
                return;
            }

            setSummary(data);

            // Vérifier le statut de paiement de chaque parrain
            if (data && data.topSponsors) {
                const statuses = {};
                for (const sponsor of data.topSponsors) {
                    const { data: paymentData } = await checkSponsorPaymentStatus(sponsor.id, tombolaId);
                    statuses[sponsor.id] = paymentData;
                }
                setPaymentStatuses(statuses);
            }
        } catch (error) {
            console.error('Erreur lors du chargement:', error);
            toast({
                title: "Erreur",
                description: "Une erreur inattendue s'est produite.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentComplete = (payment) => {
        // Recharger les données après un paiement
        loadCommissionSummary();
    };

    if (loading) {
        return (
            <div className="bg-[#1C1C21]/50 border border-gray-800 rounded-2xl p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
                    <div className="grid md:grid-cols-3 gap-4 mb-6">
                        <div className="h-20 bg-gray-700 rounded"></div>
                        <div className="h-20 bg-gray-700 rounded"></div>
                        <div className="h-20 bg-gray-700 rounded"></div>
                    </div>
                    <div className="h-64 bg-gray-700 rounded"></div>
                </div>
            </div>
        );
    }

    if (!summary) {
        return (
            <div className="bg-[#1C1C21]/50 border border-gray-800 rounded-2xl p-6">
                <p className="text-gray-400 text-center">Aucune donnée de commission disponible</p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1C1C21]/50 border border-gray-800 rounded-2xl p-6"
        >
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white flex items-center">
                    <DollarSign className="w-6 h-6 mr-3 text-yellow-400" />
                    Récapitulatif des Commissions - {tombolaTitle}
                </h3>
            </div>

            {/* Bouton Export PDF Top Parrains */}
            {summary.topSponsors && summary.topSponsors.length > 0 && (
                <div className="mb-4 flex justify-end">
                    <Button
                        className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold"
                        onClick={() => exportTopSponsorsPDF(summary.topSponsors, tombolaTitle)}
                    >
                        Télécharger PDF Top Parrains
                    </Button>
                </div>
            )}

            {/* Statistiques globales */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Total Commissions</p>
                            <p className="text-2xl font-bold text-green-400">
                                {summary.totalCommissions.toLocaleString()} FCFA
                            </p>
                        </div>
                        <DollarSign className="w-8 h-8 text-green-400" />
                    </div>
                </div>

                <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Revenus Totaux</p>
                            <p className="text-2xl font-bold text-blue-400">
                                {summary.totalRevenue.toLocaleString()} FCFA
                            </p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-blue-400" />
                    </div>
                </div>

                <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Tickets Vendus</p>
                            <p className="text-2xl font-bold text-yellow-400">
                                {summary.totalTickets}
                            </p>
                        </div>
                        <Users className="w-8 h-8 text-yellow-400" />
                    </div>
                </div>
            </div>

            {/* Paliers de commission */}
            {summary.tiers && summary.tiers.length > 0 && (
                <div className="mb-8">
                    <h4 className="text-lg font-bold text-white mb-4 flex items-center">
                        <Trophy className="w-5 h-5 mr-2 text-yellow-400" />
                        Paliers de Commission
                    </h4>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {summary.tiers.map((tier, index) => (
                            <div key={tier.id} className="bg-gray-900/50 border border-gray-700 rounded-lg p-3">
                                <div className="text-center">
                                    <p className="text-gray-400 text-sm">{tier.tier_name}</p>
                                    <p className="text-lg font-bold text-yellow-400">{tier.commission_percentage}%</p>
                                    <p className="text-xs text-gray-500">Min: {tier.min_tickets} tickets</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Top parrains */}
            <div>
                <h4 className="text-lg font-bold text-white mb-4 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-blue-400" />
                    Top Parrains ({summary.topSponsors.length})
                </h4>

                {summary.topSponsors.length === 0 ? (
                    <div className="text-center py-8 bg-gray-900/50 border border-gray-700 rounded-lg">
                        <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400">Aucun parrain pour le moment</p>
                        <p className="text-gray-500 text-sm">Les parrains apparaîtront ici une fois qu'ils auront vendu des tickets</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {summary.topSponsors.map((sponsor, index) => (
                            <div key={sponsor.id} className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
                                            <span className="text-yellow-400 text-sm font-bold">{index + 1}</span>
                                        </div>
                                        <div>
                                            <p className="text-white font-semibold">{sponsor.creator_name}</p>
                                            <div className="flex items-center space-x-4 text-sm text-gray-400">
                                                <span className="flex items-center">
                                                    <Phone className="w-3 h-3 mr-1" />
                                                    {sponsor.creator_phone}
                                                </span>
                                                <span className="flex items-center">
                                                    <User className="w-3 h-3 mr-1" />
                                                    {sponsor.total_uses} tickets
                                                </span>
                                            </div>
                                            {sponsor.bonus_commission > 0 && (
                                                <div className="text-yellow-400 text-xs font-semibold mt-1">
                                                    🎁 Bonus Parrainage : +{parseInt(sponsor.bonus_commission).toLocaleString()} CFA
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-green-400 font-bold">
                                            {parseFloat(sponsor.total_commission || 0).toLocaleString()} FCFA
                                        </p>
                                        <p className="text-gray-400 text-sm">
                                            {parseFloat(sponsor.total_revenue || 0).toLocaleString()} FCFA de CA
                                        </p>
                                        {/* Bouton de paiement */}
                                        <div className="mt-2">
                                            <CommissionPaymentButton
                                                sponsor={sponsor}
                                                tombolaId={tombolaId}
                                                tombolaTitle={tombolaTitle}
                                                onPaymentComplete={handlePaymentComplete}
                                                isPaid={!!paymentStatuses[sponsor.id]}
                                                paymentData={paymentStatuses[sponsor.id]}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}

function exportTopSponsorsPDF(topSponsors, tombolaTitle) {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Top Parrains - ${tombolaTitle || ''}`, 105, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text('Classement des parrains par nombre de tickets vendus', 105, 25, { align: 'center' });

    // En-têtes de colonnes
    const headers = ['Rang', 'Nom', 'Coupon', 'Téléphone', 'Tickets vendus'];
    let startY = 40;
    let colX = [20, 45, 100, 140, 170];
    headers.forEach((header, i) => {
        doc.setFont('helvetica', 'bold');
        doc.text(header, colX[i], startY);
    });
    doc.setFont('helvetica', 'normal');

    // Lignes de parrains
    topSponsors.forEach((sponsor, idx) => {
        const y = startY + 10 + idx * 10;
        doc.text(String(idx + 1), colX[0], y);
        doc.text(sponsor.creator_name || '-', colX[1], y);
        doc.text(sponsor.code || '-', colX[2], y);
        doc.text(sponsor.creator_phone || '-', colX[3], y);
        doc.text(String(sponsor.total_uses || 0), colX[4], y);
    });

    doc.save('top-parrains.pdf');
}

export default CommissionSummary; 