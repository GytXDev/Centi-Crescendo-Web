import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Users, Trophy, Phone, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { getCommissionSummaryForTombola, updateAllCommissionsForTombola } from '@/lib/supabaseServices';

function CommissionSummary({ tombolaId, tombolaTitle }) {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
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

    const handleUpdateCommissions = async () => {
        try {
            setUpdating(true);
            const { data, error } = await updateAllCommissionsForTombola(tombolaId);

            if (error) {
                console.error('Erreur lors de la mise à jour des commissions:', error);
                toast({
                    title: "Erreur",
                    description: "Impossible de mettre à jour les commissions.",
                    variant: "destructive"
                });
                return;
            }

            toast({
                title: "Succès",
                description: `${data} commissions mises à jour avec succès.`,
                variant: "default"
            });

            // Recharger les données
            await loadCommissionSummary();
        } catch (error) {
            console.error('Erreur lors de la mise à jour:', error);
            toast({
                title: "Erreur",
                description: "Une erreur inattendue s'est produite.",
                variant: "destructive"
            });
        } finally {
            setUpdating(false);
        }
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
                <Button
                    onClick={handleUpdateCommissions}
                    disabled={updating}
                    className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold"
                >
                    {updating ? 'Mise à jour...' : 'Actualiser les Commissions'}
                </Button>
            </div>

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
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-green-400 font-bold">
                                            {parseFloat(sponsor.total_commission || 0).toLocaleString()} FCFA
                                        </p>
                                        <p className="text-gray-400 text-sm">
                                            {parseFloat(sponsor.total_revenue || 0).toLocaleString()} FCFA de CA
                                        </p>
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

export default CommissionSummary; 