import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Phone, CreditCard, CheckCircle, AlertCircle, Tag, Check, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { generateTicketPDF } from '@/utils/pdfGenerator';
import { createParticipant, updateParticipantPayment, validateCoupon, useCoupon } from '@/lib/supabaseServices';

function ParticipationModal({ isOpen, onClose, tombola }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    airtelMoneyNumber: '',
    couponCode: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [ticketGenerated, setTicketGenerated] = useState(false);
  const [couponValidation, setCouponValidation] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [finalPrice, setFinalPrice] = useState(tombola?.ticket_price || 0);
  const { toast } = useToast();

  const validatePhone = (phone) => {
    const cleanPhone = phone.replace(/\s/g, '');
    // Accepte tous les numéros de téléphone valides (9 chiffres)
    return cleanPhone.length === 9 && /^\d+$/.test(cleanPhone);
  };

  const validateAirtelMoney = (phone) => {
    const cleanPhone = phone.replace(/\s/g, '');
    const airtelPrefixes = ['074', '076', '077'];
    return cleanPhone.length === 9 && airtelPrefixes.some(prefix => cleanPhone.startsWith(prefix));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateCouponCode = async () => {
    if (!formData.couponCode.trim()) {
      setCouponValidation(null);
      setFinalPrice(tombola.ticket_price);
      return;
    }

    setValidatingCoupon(true);
    try {
      const result = await validateCoupon(
        formData.couponCode.trim().toUpperCase(),
        tombola.id,
        formData.phone
      );

      if (result.isValid) {
        setCouponValidation({
          isValid: true,
          coupon: result.coupon,
          discountAmount: result.discountAmount
        });
        setFinalPrice(tombola.ticket_price - result.discountAmount);
        toast({
          title: "Coupon valide !",
          description: `Vous obtenez ${result.discountAmount} FCFA de réduction.`,
          variant: "default"
        });
      } else {
        setCouponValidation({
          isValid: false,
          error: result.error
        });
        setFinalPrice(tombola.ticket_price);
        toast({
          title: "Coupon invalide",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erreur lors de la validation du coupon:', error);
      setCouponValidation({
        isValid: false,
        error: 'Erreur lors de la validation du coupon'
      });
      setFinalPrice(tombola.ticket_price);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez saisir votre nom complet.",
        variant: "destructive"
      });
      return;
    }

    if (!validatePhone(formData.phone)) {
      toast({
        title: "Numéro invalide",
        description: "Veuillez saisir un numéro de téléphone valide (9 chiffres).",
        variant: "destructive"
      });
      return;
    }

    if (!validateAirtelMoney(formData.airtelMoneyNumber)) {
      toast({
        title: "Numéro Airtel Money invalide",
        description: "Veuillez saisir un numéro Airtel Money valide (074, 076 ou 077).",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('processing');

    try {
      // D'abord effectuer le paiement avec le prix final
      const response = await fetch('https://gytx.dev/api/airtelmoney-web.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `amount=${finalPrice}&numero=${formData.airtelMoneyNumber.replace(/\s/g, '')}`
      });

      const responseText = await response.text();

      if (!responseText.includes("successfully processed")) {
        setPaymentStatus('error');
        setIsProcessing(false);
        toast({
          title: "Paiement échoué",
          description: "Le paiement via Airtel Money a échoué. Veuillez réessayer ou vérifier votre solde.",
          variant: "destructive"
        });
        return;
      }

      // Si le paiement est réussi, créer le participant avec payment_status 'confirmed'
      const { data: participant, error: participantError } = await createParticipant({
        name: formData.name,
        phone: formData.phone,
        tombolaId: tombola.id,
        airtelMoneyNumber: formData.airtelMoneyNumber
      }, 'confirmed');

      if (participantError || !participant) {
        setPaymentStatus('error');
        setIsProcessing(false);
        toast({
          title: "Erreur d'inscription",
          description: "Votre paiement a été validé mais une erreur est survenue lors de l'inscription. Merci de contacter le support.",
          variant: "destructive"
        });
        return;
      }

      // Si un coupon valide a été utilisé, enregistrer son utilisation
      if (couponValidation?.isValid) {
        try {
          const { error: couponError } = await useCoupon(
            couponValidation.coupon.id,
            participant.id,
            tombola.id,
            tombola.ticket_price,
            couponValidation.discountAmount,
            finalPrice
          );

          if (couponError) {
            console.error('Erreur lors de l\'enregistrement de l\'utilisation du coupon:', couponError);
            // Ne pas faire échouer le processus pour cette erreur
          }
        } catch (couponError) {
          console.error('Erreur lors de l\'utilisation du coupon:', couponError);
          // Ne pas faire échouer le processus pour cette erreur
        }
      }

      // Le nombre de participants est maintenant calculé dynamiquement
      // Aucune mise à jour manuelle nécessaire

      setPaymentStatus('success');

      const ticketData = {
        name: formData.name,
        phone: formData.phone,
        ticketNumber: participant.ticket_number,
        price: finalPrice,
        originalPrice: tombola.ticket_price,
        discountAmount: couponValidation?.discountAmount || 0,
        couponCode: couponValidation?.isValid ? formData.couponCode : null,
        drawDate: tombola.draw_date,
        tombolaTitle: tombola.title
      };

      generateTicketPDF(ticketData);
      setTicketGenerated(true);

      toast({
        title: "Paiement réussi ! 🎉",
        description: "Votre ticket a été généré et téléchargé automatiquement.",
        variant: "success",
      });

    } catch (error) {
      console.error('Erreur lors de la participation:', error);
      setPaymentStatus('error');

      let errorMessage = "Le paiement a échoué. Veuillez vérifier votre solde et réessayer.";
      if (error.message.includes('création du participant')) {
        errorMessage = "Paiement réussi mais erreur lors de l'enregistrement. Contactez le support.";
      }

      toast({
        title: "Erreur de paiement",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetModal = () => {
    setFormData({ name: '', phone: '', airtelMoneyNumber: '', couponCode: '' });
    setPaymentStatus(null);
    setTicketGenerated(false);
    setIsProcessing(false);
    setCouponValidation(null);
    setFinalPrice(tombola?.ticket_price || 0);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen || !tombola) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={handleClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative bg-[#1C1C21] border border-gray-800 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">
              🎫 Participer à la Tombola
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="text-gray-400 hover:bg-gray-800 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {paymentStatus === 'success' && ticketGenerated ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-8"
            >
              <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">
                Félicitations ! 🎉
              </h3>
              <p className="text-gray-300 mb-6">
                Votre participation est validée. Votre ticket a été téléchargé.
              </p>
              <Button
                onClick={handleClose}
                className="bg-green-500 hover:bg-green-600 text-white font-bold"
              >
                Terminer
              </Button>
            </motion.div>
          ) : (
            <>
              <div className="mb-6 p-4 bg-gray-900/50 rounded-xl border border-gray-700">
                <h3 className="font-bold text-white mb-2">
                  {tombola.title}
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-lg text-white">
                    <span>Prix du ticket :</span>
                    <span className="font-bold text-yellow-400">
                      {tombola.ticket_price} FCFA
                    </span>
                  </div>
                  {couponValidation?.isValid && (
                    <div className="flex justify-between items-center text-sm text-green-400">
                      <span>Réduction coupon :</span>
                      <span className="font-bold">-{couponValidation.discountAmount} FCFA</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-lg text-white border-t border-gray-600 pt-2">
                    <span>Prix final :</span>
                    <span className="font-bold text-green-400">
                      {finalPrice} FCFA
                    </span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nom complet *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      placeholder="Votre nom complet"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Numéro de téléphone *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      placeholder="066 123 456"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Code coupon (optionnel)
                  </label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      name="couponCode"
                      value={formData.couponCode}
                      onChange={handleInputChange}
                      onBlur={validateCouponCode}
                      className={`w-full pl-10 pr-12 py-3 bg-gray-900 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 ${validatingCoupon
                        ? 'border-yellow-400'
                        : couponValidation?.isValid
                          ? 'border-green-500'
                          : couponValidation?.isValid === false
                            ? 'border-red-500'
                            : 'border-gray-700'
                        }`}
                      placeholder="Ex: JULIEN10"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {validatingCoupon ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-400"></div>
                      ) : couponValidation?.isValid ? (
                        <Check className="w-5 h-5 text-green-400" />
                      ) : couponValidation?.isValid === false ? (
                        <XCircle className="w-5 h-5 text-red-400" />
                      ) : null}
                    </div>
                  </div>
                  {couponValidation?.error && (
                    <p className="text-red-400 text-sm mt-1">{couponValidation.error}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Numéro Airtel Money pour le paiement *
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="tel"
                      name="airtelMoneyNumber"
                      value={formData.airtelMoneyNumber}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      placeholder="077 00 00 00"
                      required
                    />
                  </div>
                </div>

                {paymentStatus === 'error' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg"
                  >
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <span className="text-red-400 text-sm">
                      Erreur de paiement. Veuillez réessayer.
                    </span>
                  </motion.div>
                )}

                <Button
                  type="submit"
                  disabled={isProcessing || validatingCoupon}
                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                      Traitement en cours...
                    </div>
                  ) : (
                    `Payer ${finalPrice} FCFA`
                  )}
                </Button>
              </form>

              <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <h4 className="font-semibold text-blue-400 mb-2">ℹ️ Informations importantes</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Le paiement se fait via Airtel Money</li>
                  <li>• Votre ticket sera généré automatiquement après paiement</li>
                  <li>• Le tirage aura lieu le {new Date(tombola.draw_date).toLocaleDateString('fr-FR')}</li>
                  <li>• Les gagnants seront contactés par téléphone</li>
                  <li>• Utilisez un code coupon pour obtenir une réduction</li>
                </ul>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default ParticipationModal;