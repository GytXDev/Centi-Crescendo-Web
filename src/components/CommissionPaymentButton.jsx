import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Download, CheckCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { createSponsorPayment, generatePaymentReceipt, checkSponsorPaymentStatus } from '@/lib/supabaseServices';
import { generateReceiptPDF } from '@/utils/pdfGenerator';

function CommissionPaymentButton({
    sponsor,
    tombolaId,
    tombolaTitle,
    onPaymentComplete,
    isPaid = false,
    paymentData: existingPaymentData = null
}) {
    const [loading, setLoading] = useState(false);
    const [paid, setPaid] = useState(isPaid);
    const [paymentData, setPaymentData] = useState(existingPaymentData);
    const { toast } = useToast();

    // Mettre à jour l'état si isPaid change
    useEffect(() => {
        setPaid(isPaid);
        if (isPaid && existingPaymentData) {
            setPaymentData(existingPaymentData);
        }
    }, [isPaid, existingPaymentData]);

    const handlePayment = async () => {
        if (loading || paid) return;

        // Validation des données du parrain
        if (!sponsor.creator_name || !sponsor.creator_phone) {
            console.error('Données du parrain manquantes:', {
                id: sponsor.id,
                name: sponsor.creator_name,
                phone: sponsor.creator_phone
            });
            toast({
                title: "Erreur",
                description: "Données du parrain incomplètes. Impossible d'effectuer le paiement.",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);
        try {
            const totalAmount = parseFloat(sponsor.total_commission || 0) + parseFloat(sponsor.bonus_commission || 0);

            console.log('Données du paiement:', {
                sponsorId: sponsor.id,
                tombolaId: tombolaId,
                totalAmount: totalAmount,
                sponsorName: sponsor.creator_name,
                sponsorPhone: sponsor.creator_phone
            });

            // Vérifier si un paiement existe déjà avant de créer un nouveau
            const { data: existingPayment, error: checkError } = await checkSponsorPaymentStatus(sponsor.id, tombolaId);
            if (checkError && checkError.code !== 'PGRST116') {
                throw new Error(`Erreur lors de la vérification: ${checkError.message}`);
            }

            if (existingPayment) {
                // Un paiement existe déjà, mettre à jour l'état local
                setPaid(true);
                setPaymentData(existingPayment);
                toast({
                    title: "Paiement déjà effectué",
                    description: `Un paiement de ${totalAmount.toLocaleString()} FCFA existe déjà pour ${sponsor.creator_name}`,
                    variant: "default"
                });
                return;
            }

            // Créer le paiement
            const { data: payment, error } = await createSponsorPayment(
                sponsor.id,
                tombolaId,
                totalAmount,
                sponsor.creator_name,
                sponsor.creator_phone
            );

            if (error) {
                throw new Error(error);
            }

            // Vérifier immédiatement que le paiement a été créé
            const { data: verifyPayment, error: verifyError } = await checkSponsorPaymentStatus(sponsor.id, tombolaId);
            if (verifyError || !verifyPayment) {
                throw new Error('Le paiement n\'a pas pu être vérifié après création');
            }

            // Générer le reçu PDF avec la date de paiement de la base de données
            const receiptData = {
                receiptNumber: payment.receipt_number,
                sponsorName: sponsor.creator_name,
                sponsorPhone: sponsor.creator_phone,
                amount: totalAmount,
                tombolaTitle: tombolaTitle,
                paymentDate: new Date(payment.payment_date).toLocaleDateString('fr-FR'),
                commissionDetails: {
                    baseCommission: parseFloat(sponsor.total_commission || 0),
                    bonusCommission: parseFloat(sponsor.bonus_commission || 0),
                    totalTickets: sponsor.total_uses
                }
            };

            // Générer et télécharger le PDF
            generateReceiptPDF(receiptData);

            setPaid(true);
            setPaymentData(payment);
            toast({
                title: "Paiement effectué",
                description: `Le paiement de ${totalAmount.toLocaleString()} FCFA a été enregistré pour ${sponsor.creator_name}`,
                variant: "success"
            });

            if (onPaymentComplete) {
                onPaymentComplete(payment);
            }
        } catch (error) {
            console.error('Erreur lors du paiement:', error);
            toast({
                title: "Erreur",
                description: "Impossible d'effectuer le paiement. Veuillez réessayer.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadReceipt = () => {
        if (!paymentData) return;

        const receiptData = {
            receiptNumber: paymentData.receipt_number,
            sponsorName: sponsor.creator_name,
            sponsorPhone: sponsor.creator_phone,
            amount: parseFloat(sponsor.total_commission || 0) + parseFloat(sponsor.bonus_commission || 0),
            tombolaTitle: tombolaTitle,
            paymentDate: new Date(paymentData.payment_date).toLocaleDateString('fr-FR'),
            commissionDetails: {
                baseCommission: parseFloat(sponsor.total_commission || 0),
                bonusCommission: parseFloat(sponsor.bonus_commission || 0),
                totalTickets: sponsor.total_uses
            }
        };

        generateReceiptPDF(receiptData);
    };

    const totalAmount = parseFloat(sponsor.total_commission || 0) + parseFloat(sponsor.bonus_commission || 0);

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
        >
            {paid ? (
                <Button
                    onClick={handleDownloadReceipt}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    title="Télécharger le reçu de paiement"
                >
                    <div className="flex items-center">
                        <FileText className="w-4 h-4 mr-2" />
                        Télécharger Reçu
                    </div>
                </Button>
            ) : (
                <Button
                    onClick={handlePayment}
                    disabled={loading}
                    className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold"
                >
                    {loading ? (
                        <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                            Traitement...
                        </div>
                    ) : (
                        <div className="flex items-center">
                            <DollarSign className="w-4 h-4 mr-2" />
                            Payer {totalAmount.toLocaleString()} FCFA
                        </div>
                    )}
                </Button>
            )}
        </motion.div>
    );
}

export default CommissionPaymentButton; 