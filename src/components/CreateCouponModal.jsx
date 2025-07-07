import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { createCoupon, generateUniqueCouponCode } from '@/lib/supabaseServices';

function CreateCouponModal({ isOpen, onClose, tombola }) {
    const [formData, setFormData] = useState({
        creatorName: '',
        creatorPhone: ''
    });
    const [loading, setLoading] = useState(false);
    const [generatedCoupon, setGeneratedCoupon] = useState(null);
    const [copied, setCopied] = useState(false);
    const { toast } = useToast();

    // Fonction de validation du numéro de téléphone gabonais
    const validateGabonesePhone = (phone) => {
        // Supprimer tous les caractères non numériques
        const cleanPhone = phone.replace(/\D/g, '');

        // Vérifier si c'est un numéro gabonais valide (9 chiffres avec préfixes autorisés)
        const gabonesePrefixes = ['074', '076', '077', '060', '065', '066', '062'];

        if (cleanPhone.length !== 9) {
            return { isValid: false, message: 'Le numéro doit contenir exactement 9 chiffres' };
        }

        const prefix = cleanPhone.substring(0, 3);
        if (!gabonesePrefixes.includes(prefix)) {
            return {
                isValid: false,
                message: `Le préfixe ${prefix} n'est pas valide. Préfixes autorisés: ${gabonesePrefixes.join(', ')}`
            };
        }

        return { isValid: true, message: '' };
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        // Validation en temps réel pour le téléphone
        if (name === 'creatorPhone') {
            const validation = validateGabonesePhone(value);
            setFormData(prev => ({
                ...prev,
                [name]: value,
                phoneError: validation.isValid ? '' : validation.message
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.creatorName.trim() || !formData.creatorPhone.trim()) {
            toast({
                title: "Erreur",
                description: "Veuillez remplir tous les champs.",
                variant: "destructive"
            });
            return;
        }

        // Validation du numéro de téléphone
        const phoneValidation = validateGabonesePhone(formData.creatorPhone);
        if (!phoneValidation.isValid) {
            toast({
                title: "Erreur",
                description: phoneValidation.message,
                variant: "destructive"
            });
            return;
        }

        if (!tombola || !tombola.id) {
            toast({
                title: "Erreur",
                description: "Aucune tombola active pour le moment. Veuillez réessayer plus tard.",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);
        try {
            // Générer un code coupon unique
            const { data: couponCode, error: codeError } = await generateUniqueCouponCode(formData.creatorName);

            if (codeError) {
                throw new Error('Erreur lors de la génération du code coupon');
            }

            // Créer le coupon
            const couponData = {
                code: couponCode,
                tombola_id: tombola.id,
                creator_name: formData.creatorName.trim(),
                creator_phone: formData.creatorPhone.trim(),
                discount_percentage: 10 // Par défaut 10%, peut être modifié par tombola
            };

            const { data: coupon, error } = await createCoupon(couponData);

            if (error) {
                throw error;
            }

            setGeneratedCoupon(coupon);
            toast({
                title: "Succès",
                description: "Votre coupon a été créé avec succès !",
                variant: "default"
            });

        } catch (error) {
            console.error('Erreur lors de la création du coupon:', error);
            toast({
                title: "Erreur",
                description: "Impossible de créer le coupon. Veuillez réessayer.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(generatedCoupon.code);
            setCopied(true);
            toast({
                title: "Copié !",
                description: "Le code coupon a été copié dans le presse-papiers.",
                variant: "default"
            });
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            toast({
                title: "Erreur",
                description: "Impossible de copier le code.",
                variant: "destructive"
            });
        }
    };

    const resetForm = () => {
        setFormData({ creatorName: '', creatorPhone: '', phoneError: '' });
        setGeneratedCoupon(null);
        setCopied(false);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-[#1C1C21] border border-gray-800 rounded-2xl p-6 w-full max-w-md"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-white">
                            {generatedCoupon ? 'Votre Coupon Créé !' : 'Créer un Coupon'}
                        </h2>
                        <button
                            onClick={handleClose}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {!generatedCoupon ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="creatorName" className="text-white">
                                    Votre nom complet
                                </Label>
                                <Input
                                    id="creatorName"
                                    name="creatorName"
                                    type="text"
                                    value={formData.creatorName}
                                    onChange={handleInputChange}
                                    placeholder="Ex: Julien Martin"
                                    className="mt-1 bg-gray-900 border-gray-700 text-white"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="creatorPhone" className="text-white">
                                    Votre numéro de téléphone
                                </Label>
                                <Input
                                    id="creatorPhone"
                                    name="creatorPhone"
                                    type="tel"
                                    value={formData.creatorPhone}
                                    onChange={handleInputChange}
                                    placeholder="Ex: 066 123 456"
                                    className={`mt-1 bg-gray-900 border-gray-700 text-white ${formData.phoneError ? 'border-red-500' : ''
                                        }`}
                                    required
                                />
                                {formData.phoneError && (
                                    <p className="text-red-400 text-sm mt-1">{formData.phoneError}</p>
                                )}
                                <p className="text-gray-400 text-xs mt-1">
                                    Format: 9 chiffres (074, 076, 077, 060, 065, 066, 062)
                                </p>
                            </div>

                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                                <div className="flex items-start space-x-3">
                                    <AlertCircle className="text-yellow-400 mt-0.5 flex-shrink-0" size={20} />
                                    <div className="text-sm text-yellow-200">
                                        <p className="font-semibold mb-1">Comment ça marche ?</p>
                                        <ul className="space-y-1 text-xs">
                                            <li>• Partagez votre code avec vos amis</li>
                                            <li>• Ils obtiennent 10% de réduction</li>
                                            <li>• Vous gagnez des commissions sur leurs achats</li>
                                            <li>• Plus de ventes = plus de commissions !</li>
                                            <li>• Consultez votre dashboard pour voir vos statistiques</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3"
                            >
                                {loading ? 'Création en cours...' : 'Créer mon Coupon'}
                            </Button>
                        </form>
                    ) : (
                        <div className="space-y-6">
                            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                                <div className="flex items-center space-x-3 mb-4">
                                    <CheckCircle className="text-green-400" size={24} />
                                    <div>
                                        <h3 className="text-green-400 font-bold">Coupon créé avec succès !</h3>
                                        <p className="text-green-200 text-sm">Partagez ce code avec vos amis</p>
                                    </div>
                                </div>

                                <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-gray-400 text-sm">Code Coupon</p>
                                            <p className="text-2xl font-bold text-yellow-400 font-mono">
                                                {generatedCoupon.code}
                                            </p>
                                        </div>
                                        <Button
                                            onClick={copyToClipboard}
                                            variant="outline"
                                            size="sm"
                                            className="border-gray-600 text-gray-300 hover:bg-gray-800"
                                        >
                                            {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                                        </Button>
                                    </div>
                                </div>

                                <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                                    <div className="text-center">
                                        <p className="text-gray-400">Réduction</p>
                                        <p className="text-green-400 font-bold">{generatedCoupon.discount_percentage}%</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-gray-400">Joueurs parrainés</p>
                                        <p className="text-blue-400 font-bold">0</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-gray-400">Tombola</p>
                                        <p className="text-white font-bold">{tombola?.title || 'Tombola active'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Button
                                    onClick={handleClose}
                                    className="w-full bg-gray-700 hover:bg-gray-600 text-white"
                                >
                                    Fermer
                                </Button>
                                <Button
                                    onClick={resetForm}
                                    variant="outline"
                                    className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
                                >
                                    Créer un autre coupon
                                </Button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

export default CreateCouponModal; 