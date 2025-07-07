import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

function CreateTombolaModal({ isOpen, onClose, onSubmit, tombola }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    ticketPrice: '',
    drawDate: '',
    maxWinners: '',
    prizes: [{ name: '', value: '', image: '' }],
    jackpot: '',
    commissionTiers: [
      { tier_name: 'Bronze', min_tickets: 50, commission_percentage: 3 },
      { tier_name: 'Argent', min_tickets: 100, commission_percentage: 5 },
      { tier_name: 'Or', min_tickets: 200, commission_percentage: 10 },
      { tier_name: 'Platine', min_tickets: 500, commission_percentage: 15 }
    ]
  });
  const { toast } = useToast();

  useEffect(() => {
    if (tombola) {
      setFormData({
        title: tombola.title || '',
        description: tombola.description || '',
        ticketPrice: tombola.ticket_price || tombola.ticketPrice || '',
        drawDate: tombola.draw_date ? new Date(tombola.draw_date).toISOString().slice(0, 16) :
          tombola.drawDate ? new Date(tombola.drawDate).toISOString().slice(0, 16) : '',
        maxWinners: tombola.max_winners || tombola.maxWinners || '',
        prizes: tombola.prizes || [{ name: '', value: '', image: '' }],
        jackpot: tombola.jackpot || '',
        commissionTiers: tombola.commission_tiers || [
          { tier_name: 'Bronze', min_tickets: 50, commission_percentage: 3 },
          { tier_name: 'Argent', min_tickets: 100, commission_percentage: 5 },
          { tier_name: 'Or', min_tickets: 200, commission_percentage: 10 },
          { tier_name: 'Platine', min_tickets: 500, commission_percentage: 15 }
        ]
      });
    } else {
      resetForm();
    }
  }, [tombola, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePrizeChange = (index, field, value) => {
    const updatedPrizes = [...formData.prizes];
    updatedPrizes[index][field] = value;
    setFormData(prev => ({
      ...prev,
      prizes: updatedPrizes
    }));
  };

  const addPrize = () => {
    setFormData(prev => ({
      ...prev,
      prizes: [...prev.prizes, { name: '', value: '', image: '' }]
    }));
  };

  const removePrize = (index) => {
    if (formData.prizes.length > 1) {
      const updatedPrizes = formData.prizes.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        prizes: updatedPrizes
      }));
    }
  };

  const handleCommissionTierChange = (index, field, value) => {
    const updatedTiers = [...formData.commissionTiers];
    updatedTiers[index][field] = value;
    setFormData(prev => ({
      ...prev,
      commissionTiers: updatedTiers
    }));
  };

  const addCommissionTier = () => {
    setFormData(prev => ({
      ...prev,
      commissionTiers: [...prev.commissionTiers, { tier_name: '', min_tickets: 0, commission_percentage: 0 }]
    }));
  };

  const removeCommissionTier = (index) => {
    if (formData.commissionTiers.length > 1) {
      const updatedTiers = formData.commissionTiers.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        commissionTiers: updatedTiers
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.description.trim() || !formData.jackpot.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    if (!formData.ticketPrice || isNaN(formData.ticketPrice) || formData.ticketPrice <= 0) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un prix de ticket valide",
        variant: "destructive"
      });
      return;
    }

    if (!formData.drawDate) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une date de tirage",
        variant: "destructive"
      });
      return;
    }

    const drawDate = new Date(formData.drawDate);
    if (drawDate <= new Date() && !tombola) { // Allow editing past dates for completed tombolas
      toast({
        title: "Erreur",
        description: "La date de tirage doit être dans le futur",
        variant: "destructive"
      });
      return;
    }

    const validPrizes = formData.prizes.filter(prize =>
      prize.name.trim() && prize.value.trim()
    );

    if (validPrizes.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez ajouter au moins un prix",
        variant: "destructive"
      });
      return;
    }

    const tombolaData = {
      ...formData,
      ticket_price: parseInt(formData.ticketPrice),
      max_winners: parseInt(formData.maxWinners) || validPrizes.length,
      prizes: validPrizes.map(prize => ({
        ...prize,
        image: prize.image || `Prix ${prize.name}`
      })),
      commission_tiers: formData.commissionTiers.filter(tier =>
        tier.tier_name.trim() && tier.min_tickets > 0 && tier.commission_percentage > 0
      )
    };

    onSubmit(tombolaData);
    handleClose();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      ticketPrice: '',
      drawDate: '',
      maxWinners: '',
      prizes: [{ name: '', value: '', image: '' }],
      jackpot: '',
      commissionTiers: [
        { tier_name: 'Bronze', min_tickets: 50, commission_percentage: 3 },
        { tier_name: 'Argent', min_tickets: 100, commission_percentage: 5 },
        { tier_name: 'Or', min_tickets: 200, commission_percentage: 10 },
        { tier_name: 'Platine', min_tickets: 500, commission_percentage: 15 }
      ]
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

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
          className="relative bg-[#1C1C21] border border-gray-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">
              {tombola ? '✏️ Modifier la Tombola' : '➕ Créer une Nouvelle Tombola'}
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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Titre de la tombola *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="Ex: Grande Tombola de Noël"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Jackpot (ex: 1,000,000 FCFA) *
                </label>
                <input
                  type="text"
                  name="jackpot"
                  value={formData.jackpot}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="1,000,000 FCFA"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
                placeholder="Décrivez votre tombola..."
                required
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Prix du ticket (FCFA) *
                </label>
                <input
                  type="number"
                  name="ticketPrice"
                  value={formData.ticketPrice}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="999"
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Date du tirage *
                </label>
                <input
                  type="datetime-local"
                  name="drawDate"
                  value={formData.drawDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Nombre de gagnants
                </label>
                <input
                  type="number"
                  name="maxWinners"
                  value={formData.maxWinners}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="Auto"
                  min="1"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-gray-300 text-sm font-medium">
                  Prix à gagner *
                </label>
                <Button
                  type="button"
                  onClick={addPrize}
                  size="sm"
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter un prix
                </Button>
              </div>

              <div className="space-y-4">
                {formData.prizes.map((prize, index) => (
                  <div key={index} className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-white font-medium">Prix #{index + 1}</h4>
                      {formData.prizes.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removePrize(index)}
                          size="icon"
                          variant="ghost"
                          className="text-red-400 hover:bg-red-400/10 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={prize.name}
                        onChange={(e) => handlePrizeChange(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        placeholder="Nom du prix"
                      />
                      <input
                        type="text"
                        value={prize.value}
                        onChange={(e) => handlePrizeChange(index, 'value', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        placeholder="Valeur (ex: 500,000 FCFA)"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section Paliers de Commission */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-gray-300 text-sm font-medium">
                  Paliers de Commission pour les Parrains
                </label>
                <Button
                  type="button"
                  onClick={addCommissionTier}
                  size="sm"
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter un palier
                </Button>
              </div>

              <div className="space-y-4">
                {formData.commissionTiers.map((tier, index) => (
                  <div key={index} className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-white font-medium">Palier #{index + 1}</h4>
                      {formData.commissionTiers.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removeCommissionTier(index)}
                          size="icon"
                          variant="ghost"
                          className="text-red-400 hover:bg-red-400/10 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid md:grid-cols-3 gap-3">
                      <input
                        type="text"
                        value={tier.tier_name}
                        onChange={(e) => handleCommissionTierChange(index, 'tier_name', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        placeholder="Nom du palier (ex: Bronze)"
                      />
                      <input
                        type="number"
                        value={tier.min_tickets}
                        onChange={(e) => handleCommissionTierChange(index, 'min_tickets', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        placeholder="Tickets minimum"
                        min="0"
                      />
                      <input
                        type="number"
                        value={tier.commission_percentage}
                        onChange={(e) => handleCommissionTierChange(index, 'commission_percentage', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        placeholder="% Commission"
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="text-sm text-blue-200">
                  <p className="font-semibold mb-2">💡 Comment fonctionnent les commissions ?</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Les parrains gagnent des commissions selon le nombre de tickets vendus</li>
                    <li>• Plus ils vendent de tickets, plus leur pourcentage de commission augmente</li>
                    <li>• Les commissions sont calculées sur le montant final payé par les clients</li>
                    <li>• Le total des commissions est déduit du jackpot de la tombola</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                onClick={handleClose}
                variant="outline"
                className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black font-bold"
              >
                {tombola ? 'Enregistrer les modifications' : 'Créer la Tombola'}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default CreateTombolaModal;