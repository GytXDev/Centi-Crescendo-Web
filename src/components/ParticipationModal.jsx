import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Phone, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { generateTicketPDF } from '@/utils/pdfGenerator';
import { createParticipant, updateTombolaParticipants, updateParticipantPayment } from '@/lib/supabaseServices';

function ParticipationModal({ isOpen, onClose, tombola }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    airtelMoneyNumber: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [ticketGenerated, setTicketGenerated] = useState(false);
  const { toast } = useToast();

  const validatePhone = (phone) => {
    const cleanPhone = phone.replace(/\s/g, '');
    const airtelPrefixes = ['074', '076', '077'];

    if (cleanPhone.length !== 9) {
      return false;
    }

    return airtelPrefixes.some(prefix => cleanPhone.startsWith(prefix));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
        description: "Veuillez saisir un numéro Airtel Money valide (ex: 074123456).",
        variant: "destructive"
      });
      return;
    }

    if (!validatePhone(formData.airtelMoneyNumber)) {
      toast({
        title: "Numéro Airtel Money invalide",
        description: "Veuillez saisir un numéro Airtel Money valide pour le paiement.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('processing');

    try {
      // Créer le participant dans Supabase
      const { data: participant, error: participantError } = await createParticipant({
        name: formData.name,
        phone: formData.phone,
        tombolaId: tombola.id,
        airtelMoneyNumber: formData.airtelMoneyNumber
      });

      if (participantError) {
        throw new Error('Erreur lors de la création du participant');
      }

      // Simuler le paiement (remplacez par votre logique de paiement réelle)
      const response = await fetch('https://gytx.dev/api/airtelmoney-web.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `amount=${tombola.ticket_price}&numero=${formData.airtelMoneyNumber.replace(/\s/g, '')}`
      });

      const responseText = await response.text();

      if (responseText.includes("successfully processed")) {
        // Mettre à jour le statut de paiement
        await updateParticipantPayment(participant.id, 'confirmed');

        // Mettre à jour le nombre de participants de la tombola
        await updateTombolaParticipants(tombola.id);

        setPaymentStatus('success');

        const ticketData = {
          name: formData.name,
          phone: formData.phone,
          ticketNumber: participant.ticket_number,
          price: tombola.ticket_price,
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

      } else {
        // Mettre à jour le statut de paiement en cas d'échec
        await updateParticipantPayment(participant.id, 'failed');
        throw new Error('Paiement échoué');
      }
    } catch (error) {
      console.error('Erreur lors de la participation:', error);
      setPaymentStatus('error');
      toast({
        title: "Erreur de paiement",
        description: "Le paiement a échoué. Veuillez vérifier votre solde et réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetModal = () => {
    setFormData({ name: '', phone: '', airtelMoneyNumber: '' });
    setPaymentStatus(null);
    setTicketGenerated(false);
    setIsProcessing(false);
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
                <div className="flex justify-between items-center text-lg text-white">
                  <span>Prix du ticket :</span>
                  <span className="font-bold text-yellow-400">
                    {tombola.ticket_price} FCFA
                  </span>
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
                      placeholder="074 123 456"
                      required
                    />
                  </div>
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
                      placeholder="074 123 456"
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
                  disabled={isProcessing}
                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                      Traitement en cours...
                    </div>
                  ) : (
                    `Payer ${tombola.ticket_price} FCFA`
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