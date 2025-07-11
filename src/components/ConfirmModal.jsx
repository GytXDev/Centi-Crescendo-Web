import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Confirmer', cancelLabel = 'Annuler', confirmColor = 'bg-red-500 hover:bg-red-600', icon }) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    onClick={onClose}
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative bg-[#1C1C21] border border-gray-800 rounded-2xl p-4 sm:p-6 w-full max-w-sm sm:max-w-md mx-auto z-10"
                >
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            {icon && <span className="text-2xl">{icon}</span>}
                            {title}
                        </h2>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="text-gray-400 hover:bg-gray-800 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                    <div className="text-gray-300 mb-6 whitespace-pre-line">{message}</div>
                    <div className="flex flex-col sm:flex-row justify-end gap-3">
                        <Button onClick={onClose} className="bg-gray-700 hover:bg-gray-600 text-white order-2 sm:order-1">
                            {cancelLabel}
                        </Button>
                        <Button onClick={onConfirm} className={`${confirmColor} text-white font-bold order-1 sm:order-2`}>
                            {confirmLabel}
                        </Button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

export default ConfirmModal; 