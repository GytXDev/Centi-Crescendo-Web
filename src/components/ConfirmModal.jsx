import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Lock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirmer",
    cancelText = "Annuler",
    variant = "default",
    secureDelete = false,
    tombolaTitle = ""
}) {
    const [password, setPassword] = useState('');
    const [confirmationText, setConfirmationText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleConfirm = async () => {
        if (secureDelete) {
            if (!password.trim()) {
                setError('Le mot de passe est requis');
                return;
            }
            if (!confirmationText.trim()) {
                setError('Le texte de confirmation est requis');
                return;
            }
        }

        setLoading(true);
        setError('');

        try {
            if (secureDelete) {
                await onConfirm(password, confirmationText);
            } else {
                await onConfirm();
            }
            handleClose();
        } catch (error) {
            setError(error.message || 'Une erreur s\'est produite');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setPassword('');
        setConfirmationText('');
        setError('');
        setLoading(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={handleClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-[#1C1C21] border border-gray-800 rounded-2xl p-6 w-full max-w-md"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center mb-4">
                        {secureDelete ? (
                            <Lock className="w-6 h-6 text-red-400 mr-3" />
                        ) : variant === "destructive" ? (
                            <AlertTriangle className="w-6 h-6 text-red-400 mr-3" />
                        ) : (
                            <AlertTriangle className="w-6 h-6 text-yellow-400 mr-3" />
                        )}
                        <h3 className="text-xl font-bold text-white">{title}</h3>
                    </div>

                    <p className="text-gray-300 mb-6">{message}</p>

                    {secureDelete && (
                        <div className="space-y-4 mb-6">
                            <div>
                                <Label htmlFor="password" className="text-white">
                                    Mot de passe administrateur
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Entrez le mot de passe"
                                    className="mt-1 bg-gray-900 border-gray-700 text-white"
                                />
                            </div>
                            <div>
                                <Label htmlFor="confirmation" className="text-white">
                                    Confirmation de suppression
                                </Label>
                                <Input
                                    id="confirmation"
                                    type="text"
                                    value={confirmationText}
                                    onChange={(e) => setConfirmationText(e.target.value)}
                                    placeholder={`Écrivez : "oui je souhaite supprimer ${tombolaTitle}"`}
                                    className="mt-1 bg-gray-900 border-gray-700 text-white"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Écrivez exactement : "oui je souhaite supprimer {tombolaTitle}"
                                </p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-900/20 border border-red-700 rounded-lg p-3 mb-4">
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    <div className="flex space-x-3">
                        <Button
                            variant="outline"
                            onClick={handleClose}
                            disabled={loading}
                            className="flex-1"
                        >
                            {cancelText}
                        </Button>
                        <Button
                            variant={variant === "destructive" ? "destructive" : "default"}
                            onClick={handleConfirm}
                            disabled={loading}
                            className="flex-1"
                        >
                            {loading ? (
                                <div className="flex items-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    {secureDelete ? "Suppression..." : "Chargement..."}
                                </div>
                            ) : (
                                <div className="flex items-center">
                                    {secureDelete && <Trash2 className="w-4 h-4 mr-2" />}
                                    {confirmText}
                                </div>
                            )}
                        </Button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default ConfirmModal; 