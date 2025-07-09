import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Tag, TrendingUp, Users, DollarSign, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Navigation from '@/components/Navigation';
import CreateCouponModal from '@/components/CreateCouponModal';
import CouponDashboard from '@/components/CouponDashboard';
import { getCurrentTombola } from '@/lib/supabaseServices';

function CouponDashboardPage() {
    const [userPhone, setUserPhone] = useState('');
    const [isCreateCouponOpen, setIsCreateCouponOpen] = useState(false);
    const [currentTombola, setCurrentTombola] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    React.useEffect(() => {
        loadCurrentTombola();
    }, []);

    const loadCurrentTombola = async () => {
        try {
            const { data: tombola, error } = await getCurrentTombola();
            if (!error && tombola) {
                setCurrentTombola(tombola);
            }
        } catch (error) {
            console.error('Erreur lors du chargement de la tombola:', error);
        }
    };

    const handlePhoneSubmit = (e) => {
        e.preventDefault();
        if (userPhone.trim()) {
            setIsAuthenticated(true);
        }
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setUserPhone('');
    };

    return (
        <>
            <Helmet>
                <title>Dashboard Coupons - Centi Crescendo | Suivi de vos Commissions</title>
                <meta name="description" content="Consultez vos statistiques de parrainage, vos commissions et gérez vos coupons de réduction sur Centi Crescendo." />
            </Helmet>

            <div className="min-h-screen text-white bg-[#0B0B0F]">
                <Navigation />

                <section className="relative overflow-hidden pt-20 pb-28 px-4">
                    <div className="container mx-auto text-center relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="max-w-4xl mx-auto"
                        >
                            <h1 className="text-5xl md:text-6xl font-bold mb-6">
                                🎫 <span className="text-yellow-400">Dashboard Coupons</span>
                            </h1>
                            <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
                                Suivez vos performances de parrainage et gérez vos commissions
                            </p>
                        </motion.div>
                    </div>
                </section>

                <section className="py-16 px-4 bg-[#0B0B0F]">
                    <div className="container mx-auto max-w-6xl">
                        {!isAuthenticated ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="max-w-md mx-auto"
                            >
                                <div className="bg-[#1C1C21]/50 border border-gray-800 rounded-2xl p-8">
                                    <div className="text-center mb-6">
                                        <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Tag className="text-yellow-400" size={32} />
                                        </div>
                                        <h2 className="text-2xl font-bold text-white mb-2">
                                            Accéder à vos Coupons
                                        </h2>
                                        <p className="text-gray-400">
                                            Entrez votre numéro de téléphone pour voir vos statistiques
                                        </p>
                                    </div>

                                    <form onSubmit={handlePhoneSubmit} className="space-y-4">
                                        <div>
                                            <Label htmlFor="phone" className="text-white">
                                                Numéro de téléphone
                                            </Label>
                                            <Input
                                                id="phone"
                                                type="tel"
                                                value={userPhone}
                                                onChange={(e) => setUserPhone(e.target.value)}
                                                placeholder="Ex: 066 123 456"
                                                className="mt-1 bg-gray-900 border-gray-700 text-white"
                                                required
                                            />
                                        </div>

                                        <Button
                                            type="submit"
                                            className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3"
                                        >
                                            Voir mes Coupons
                                        </Button>
                                    </form>

                                    <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                        <h4 className="font-semibold text-blue-400 mb-2">ℹ️ Informations</h4>
                                        <ul className="text-sm text-gray-300 space-y-1">
                                            <li>• Utilisez le numéro avec lequel vous avez créé vos coupons</li>
                                            <li>• Vous verrez toutes vos statistiques de parrainage</li>
                                            <li>• Vos commissions et performances en temps réel</li>
                                        </ul>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="space-y-8">
                                {/* En-tête avec bouton de déconnexion et création de coupon */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-col md:flex-row md:items-center justify-between gap-4"
                                >
                                    <div>
                                        <h2 className="text-3xl font-bold text-white mb-2">
                                            Vos Coupons et Commissions
                                        </h2>
                                        <p className="text-gray-400">
                                            Connecté avec : {userPhone}
                                        </p>
                                    </div>
                                    <div className="flex gap-3">
                                        <Button
                                            onClick={() => setIsCreateCouponOpen(true)}
                                            className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Créer un Coupon
                                        </Button>
                                        <Button
                                            onClick={handleLogout}
                                            variant="outline"
                                            className="border-gray-600 text-gray-300 hover:bg-gray-800"
                                        >
                                            Modifier mon numéro de téléphone
                                        </Button>
                                    </div>
                                </motion.div>

                                {/* Dashboard des coupons */}
                                <CouponDashboard userPhone={userPhone} />
                            </div>
                        )}
                    </div>
                </section>

                {/* Modal de création de coupon */}
                <CreateCouponModal
                    isOpen={isCreateCouponOpen}
                    onClose={() => setIsCreateCouponOpen(false)}
                    tombola={currentTombola}
                />
            </div>
        </>
    );
}

export default CouponDashboardPage; 