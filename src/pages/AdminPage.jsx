import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { PlusCircle, Edit, Trash2, Users, BarChart, DollarSign, Video, Trophy, LogOut, Gift, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import CreateTombolaModal from '@/components/CreateTombolaModal';
import StatsCard from '@/components/StatsCard';
import Navigation from '@/components/Navigation';
import AdminLogin from '@/components/AdminLogin';
import CommissionSummary from '@/components/CommissionSummary';
import {
  getAllTombolas,
  createTombola,
  updateTombola,
  deleteTombola,
  getGlobalStats,
  getAppConfig,
  updateAppConfigById,
  performDraw,
  getAllCoupons,
  updateCouponDiscount,
  updateCouponCode,
  updateCouponParrainContacte,
  deleteCoupon,
  archiveCoupon,
  createParticipant,
  validateCoupon,
  useCoupon
} from '@/lib/supabaseServices';
import { getPublicUrl } from '@/lib/fileUploadService';
import VideoUpload from '@/components/VideoUpload';
import ConfirmModal from '@/components/ConfirmModal';
import WinnerManagerModal from '@/components/WinnerManagerModal';
import { generateTicketPDF } from '@/utils/pdfGenerator';
import { supabase } from '@/lib/customSupabaseClient';

function AdminPage() {
  const [tombolas, setTombolas] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTombola, setEditingTombola] = useState(null);
  const [winnerVideoPath, setWinnerVideoPath] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [stats, setStats] = useState({
    totalTombolas: 0,
    totalParticipants: 0,
    totalRevenue: 0,
    activeTombolas: 0
  });
  const [confirmDelete, setConfirmDelete] = useState({ open: false, tombolaId: null });
  const [confirmDraw, setConfirmDraw] = useState({ open: false, tombola: null });
  const [isWinnerManagerOpen, setIsWinnerManagerOpen] = useState(false);
  const [selectedTombola, setSelectedTombola] = useState(null);
  const [allCoupons, setAllCoupons] = useState([]);
  const [editingDiscount, setEditingDiscount] = useState({});
  const [updatingId, setUpdatingId] = useState(null);
  const [editingCode, setEditingCode] = useState({});
  const [updatingCodeId, setUpdatingCodeId] = useState(null);
  const [confirmDeleteCoupon, setConfirmDeleteCoupon] = useState({ open: false, couponId: null });
  const [isManualTicketModalOpen, setIsManualTicketModalOpen] = useState(false);
  const [manualTicketForm, setManualTicketForm] = useState({
    name: '',
    phone: '',
    airtelMoneyNumber: '',
    couponCode: '',
    tombolaId: ''
  });
  const [manualTicketLoading, setManualTicketLoading] = useState(false);
  const [manualTicketError, setManualTicketError] = useState('');
  const [manualTicketSuccess, setManualTicketSuccess] = useState('');
  const [manualTicketCreated, setManualTicketCreated] = useState(null);
  const [searchMode, setSearchMode] = useState('create'); // 'create' ou 'search'
  const [searchParticipantId, setSearchParticipantId] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [foundParticipant, setFoundParticipant] = useState(null);

  const { toast } = useToast();

  useEffect(() => {
    // Vérifier l'authentification au chargement
    const authStatus = sessionStorage.getItem('adminAuthenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
      loadData();
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    loadData();
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuthenticated');
    setIsAuthenticated(false);
    toast({
      title: "Déconnexion",
      description: "Vous avez été déconnecté de l'administration.",
      variant: "destructive"
    });
  };

  const loadData = async () => {
    try {
      setLoading(true);

      // Charger les tombolas
      const { data: tombolasData, error: tombolasError } = await getAllTombolas();
      if (tombolasError) {
        console.error('Erreur lors du chargement des tombolas:', tombolasError);
        toast({
          title: "Erreur",
          description: "Impossible de charger les tombolas.",
          variant: "destructive"
        });
      } else {
        setTombolas(tombolasData || []);
      }

      // Charger les statistiques
      const { data: statsData, error: statsError } = await getGlobalStats();
      if (statsError) {
        console.error('Erreur lors du chargement des statistiques:', statsError);
      } else {
        setStats(statsData || {
          totalTombolas: 0,
          totalParticipants: 0,
          totalRevenue: 0,
          activeTombolas: 0
        });
      }

      // Charger la configuration
      const { data: config, error: configError } = await getAppConfig();
      if (configError) {
        console.error('Erreur lors du chargement de la configuration:', configError);
      } else {
        setWinnerVideoPath(config?.winner_video_url || '');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Charger tous les coupons pour la gestion admin
  const loadAllCoupons = async () => {
    const { data } = await getAllCoupons();
    setAllCoupons(data || []);
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAllCoupons();
    }
  }, [isAuthenticated]);

  const handleDiscountInput = (couponId, value) => {
    setEditingDiscount(prev => ({ ...prev, [couponId]: value }));
  };

  const handleUpdateDiscount = async (couponId) => {
    const newDiscount = parseInt(editingDiscount[couponId], 10);
    if (isNaN(newDiscount) || newDiscount < 0 || newDiscount > 100) {
      toast({
        title: "Erreur",
        description: "Le pourcentage doit être entre 0 et 100.",
        variant: "destructive"
      });
      return;
    }
    setUpdatingId(couponId);
    const { error } = await updateCouponDiscount(couponId, newDiscount);
    setUpdatingId(null);
    if (!error) {
      toast({
        title: "Succès",
        description: "Le pourcentage de réduction a été mis à jour.",
        variant: "success"
      });
      setEditingDiscount(prev => ({ ...prev, [couponId]: undefined }));
      loadAllCoupons();
    } else {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le pourcentage.",
        variant: "destructive"
      });
    }
  };

  const handleCreateTombola = async (tombolaData) => {
    try {
      // Extraire les paliers de commission
      const { commission_tiers, ...tombolaDataWithoutTiers } = tombolaData;

      const { data, error } = await createTombola(tombolaDataWithoutTiers);

      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de créer la tombola. Veuillez réessayer.",
          variant: "destructive"
        });
        return;
      }

      // Créer les paliers de commission si disponibles
      if (commission_tiers && commission_tiers.length > 0) {
        try {
          const { error: tiersError } = await updateCommissionTiers(data.id, commission_tiers);
          if (tiersError) {
            console.error('Erreur lors de la création des paliers de commission:', tiersError);
          }
        } catch (tiersError) {
          console.error('Erreur lors de la création des paliers de commission:', tiersError);
        }
      }

      // Recharger les données
      await loadData();

      toast({
        title: "Succès !",
        description: "Tombola créée avec succès !",
        variant: "success"
      });
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateTombola = async (id, updatedData) => {
    try {
      // Extraire les paliers de commission
      const { commission_tiers, ...tombolaDataWithoutTiers } = updatedData;

      const { data, error } = await updateTombola(id, tombolaDataWithoutTiers);

      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de mettre à jour la tombola. Veuillez réessayer.",
          variant: "destructive"
        });
        return;
      }

      // Mettre à jour les paliers de commission si disponibles
      if (commission_tiers && commission_tiers.length > 0) {
        try {
          const { error: tiersError } = await updateCommissionTiers(id, commission_tiers);
          if (tiersError) {
            console.error('Erreur lors de la mise à jour des paliers de commission:', tiersError);
          }
        } catch (tiersError) {
          console.error('Erreur lors de la mise à jour des paliers de commission:', tiersError);
        }
      }

      // Recharger les données
      await loadData();

      toast({
        title: "Succès !",
        description: "Tombola mise à jour avec succès !",
        variant: "success"
      });
      setEditingTombola(null);
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteTombola = async (id) => {
    try {
      const { error } = await deleteTombola(id);
      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de supprimer la tombola. Veuillez réessayer.",
          variant: "destructive"
        });
        return;
      }
      await loadData();
      toast({
        title: "Supprimé",
        description: "Tombola supprimée avec succès",
        variant: "destructive"
      });
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite.",
        variant: "destructive"
      });
    }
  };

  const handleDrawWinners = async (tombola) => {
    setConfirmDraw({ open: true, tombola });
  };

  const confirmDrawWinners = async () => {
    const tombola = confirmDraw.tombola;
    setConfirmDraw({ open: false, tombola: null });
    try {
      const now = new Date();
      const drawDate = new Date(tombola.draw_date);
      if (now < drawDate) {
        toast({
          title: "Tirage impossible",
          description: `La date de tirage (${drawDate.toLocaleDateString('fr-FR')}) n'est pas encore atteinte.`,
          variant: "destructive"
        });
        return;
      }
      if (tombola.status !== 'active') {
        toast({
          title: "Tirage impossible",
          description: "Cette tombola n'est plus active ou a déjà été tirée.",
          variant: "destructive"
        });
        return;
      }
      const { data: winners, error } = await performDraw(tombola.id);
      if (error) {
        toast({
          title: "Erreur lors du tirage",
          description: error.message || "Une erreur s'est produite lors du tirage.",
          variant: "destructive"
        });
        return;
      }
      await loadData();
      toast({
        title: "🎉 Tirage effectué avec succès !",
        description: `${winners.length} gagnant(s) ont été sélectionné(s) pour "${tombola.title}".`,
        variant: "success"
      });
      const winnersList = winners.map((winner, index) =>
        `${index + 1}. ${winner.participants?.name || 'Anonyme'} - ${winner.prize_amount}`
      ).join('\n');
      alert(`🏆 Gagnants de "${tombola.title}":\n\n${winnersList}`);
    } catch (error) {
      console.error('Erreur lors du tirage:', error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite lors du tirage.",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (tombola) => {
    setEditingTombola(tombola);
    setIsCreateModalOpen(true);
  };

  const handleVideoUploaded = async (publicUrl) => {
    try {
      const { error } = await updateAppConfigById(1, {
        winner_video_url: publicUrl
      });

      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de sauvegarder la vidéo. Veuillez réessayer.",
          variant: "destructive"
        });
        return;
      }

      setWinnerVideoPath(publicUrl);
      toast({
        title: "Vidéo uploadée !",
        description: "La vidéo des gagnants a été uploadée avec succès.",
        variant: "success"
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite.",
        variant: "destructive"
      });
    }
  };

  const handleVideoRemoved = async () => {
    try {
      const { error } = await updateAppConfigById(1, {
        winner_video_url: null
      });

      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de supprimer la vidéo. Veuillez réessayer.",
          variant: "destructive"
        });
        return;
      }

      setWinnerVideoPath('');
      toast({
        title: "Vidéo supprimée",
        description: "La vidéo des gagnants a été supprimée.",
        variant: "destructive"
      });
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateCode = async (couponId) => {
    const newCode = editingCode[couponId];
    if (!newCode || newCode.trim() === "") {
      toast({
        title: "Erreur",
        description: "Le code ne peut pas être vide.",
        variant: "destructive"
      });
      return;
    }
    setUpdatingCodeId(couponId);
    const { error } = await updateCouponCode(couponId, newCode.trim());
    setUpdatingCodeId(null);
    if (!error) {
      toast({
        title: "Succès",
        description: "Le code du coupon a été mis à jour.",
        variant: "success"
      });
      setEditingCode(prev => {
        const updated = { ...prev };
        delete updated[couponId];
        return updated;
      });
      loadAllCoupons();
    } else {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le code.",
        variant: "destructive"
      });
    }
  };

  const handleManualTicketInput = (e) => {
    const { name, value } = e.target;
    setManualTicketForm(prev => ({ ...prev, [name]: value }));
  };

  const generateParticipantPDF = (participant) => {
    const couponUse = participant.coupon_uses?.[0];
    const ticketData = {
      name: participant.name,
      phone: participant.phone,
      ticketNumber: participant.ticket_number,
      airtelMoneyNumber: participant.airtel_money_number,
      tombolaTitle: participant.tombolas?.title || 'Tombola',
      originalPrice: participant.tombolas?.ticket_price || 0,
      finalPrice: participant.tombolas?.ticket_price || 0,
      discountAmount: 0,
      drawDate: participant.tombolas?.draw_date || new Date().toISOString(),
      couponCode: couponUse?.coupons?.code || null
    };

    // Si un coupon a été utilisé, calculer les prix corrects
    if (couponUse) {
      ticketData.discountAmount = couponUse.discount_amount || 0;
      ticketData.finalPrice = ticketData.originalPrice - ticketData.discountAmount;
    }

    generateTicketPDF(ticketData);
  };

  const handleSearchParticipant = async () => {
    if (!searchParticipantId.trim()) {
      setSearchError('Veuillez entrer un ID de participant');
      return;
    }

    setSearchLoading(true);
    setSearchError('');
    setFoundParticipant(null);

    try {
      // Rechercher le participant par ID
      const { data: participant, error } = await supabase
        .from('participants')
        .select(`
          *,
          tombolas (
            id,
            title,
            ticket_price,
            draw_date
          ),
          coupon_uses (
            id,
            discount_amount,
            coupons (
              code
            )
          )
        `)
        .eq('id', searchParticipantId.trim())
        .single();

      if (error || !participant) {
        setSearchError('Participant non trouvé avec cet ID');
        return;
      }

      setFoundParticipant(participant);
    } catch (err) {
      setSearchError('Erreur lors de la recherche : ' + (err.message || err));
    } finally {
      setSearchLoading(false);
    }
  };

  const handleManualTicketSubmit = async (e) => {
    e.preventDefault();
    setManualTicketError('');
    setManualTicketSuccess('');
    if (!manualTicketForm.name.trim() || !manualTicketForm.phone.trim() || !manualTicketForm.airtelMoneyNumber.trim() || !manualTicketForm.tombolaId) {
      setManualTicketError('Tous les champs sont obligatoires sauf le code coupon.');
      return;
    }
    setManualTicketLoading(true);
    try {
      let couponValidation = null;
      let discountAmount = 0;
      let couponId = null;
      if (manualTicketForm.couponCode.trim()) {
        const result = await validateCoupon(
          manualTicketForm.couponCode.trim().toUpperCase(),
          manualTicketForm.tombolaId,
          manualTicketForm.phone
        );
        if (!result.isValid) {
          setManualTicketError('Coupon invalide : ' + result.error);
          setManualTicketLoading(false);
          return;
        }
        couponValidation = result;
        discountAmount = result.discountAmount;
        couponId = result.coupon.id;
      }
      // Créer le participant
      const { data: participant, error: participantError } = await createParticipant({
        name: manualTicketForm.name,
        phone: manualTicketForm.phone,
        tombolaId: manualTicketForm.tombolaId,
        airtelMoneyNumber: manualTicketForm.airtelMoneyNumber
      }, 'confirmed');
      if (participantError || !participant) {
        setManualTicketError("Erreur lors de la création du ticket : " + (participantError?.message || ''));
        setManualTicketLoading(false);
        return;
      }
      // Enregistrer l'utilisation du coupon si applicable
      if (couponValidation && couponId) {
        await useCoupon(
          couponId,
          participant.id,
          manualTicketForm.tombolaId,
          tombolas.find(t => t.id === manualTicketForm.tombolaId)?.ticket_price || 0,
          discountAmount,
          (tombolas.find(t => t.id === manualTicketForm.tombolaId)?.ticket_price || 0) - discountAmount
        );
      }
      setManualTicketSuccess('Ticket créé avec succès !');
      setManualTicketCreated({
        ...participant,
        coupon_validation: couponValidation
      });
      setManualTicketForm({ name: '', phone: '', airtelMoneyNumber: '', couponCode: '', tombolaId: '' });
      loadAllCoupons();
    } catch (err) {
      setManualTicketError('Erreur inattendue : ' + (err.message || err));
    } finally {
      setManualTicketLoading(false);
    }
  };

  // Afficher la page de connexion si non authentifié
  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0B0F] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-xl">Chargement en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Administration - Centi Crescendo</title>
        <meta name="description" content="Interface d'administration pour gérer les tombolas Centi Crescendo" />
      </Helmet>

      <div className="min-h-screen bg-[#0B0B0F] text-white">
        <Navigation />

        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Administration</h1>
                <p className="text-white/70">
                  Gérez vos tombolas et suivez les performances
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setEditingTombola(null) || setIsCreateModalOpen(true)}
                  className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold w-full sm:w-auto"
                >
                  <PlusCircle className="w-5 h-5 mr-2" />
                  Nouvelle Tombola
                </Button>

                {/* Nouveau bouton pour accéder au suivi des participants */}
                <Button
                  onClick={() => window.location.href = '/participants'}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold w-full sm:w-auto"
                >
                  <Users className="w-5 h-5 mr-2" />
                  Suivi Participants
                </Button>

                <Button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white font-bold">
                  <LogOut className="w-5 h-5 mr-2" />
                  Déconnexion
                </Button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatsCard title="Total Tombolas" value={stats.totalTombolas} icon={Trophy} color="text-purple-400" />
              <StatsCard title="Participants Totaux" value={stats.totalParticipants} icon={Users} color="text-blue-400" />
              <StatsCard title="Revenus Totaux" value={`${stats.totalRevenue.toLocaleString()} FCFA`} icon={DollarSign} color="text-green-400" />
              <StatsCard title="Tombolas Actives" value={stats.activeTombolas} icon={BarChart} color="text-yellow-400" />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="bg-[#1C1C21]/50 border border-gray-800 rounded-2xl p-6 mb-8"
            >
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <Video className="w-6 h-6 mr-3 text-yellow-400" />
                Vidéo des Gagnants
              </h2>
              <p className="text-gray-400 mb-4">
                Uploadez directement votre vidéo des gagnants. Formats acceptés : MP4, WebM, OGG, AVI, MOV, WMV (max 100MB).
              </p>
              <VideoUpload
                currentVideoPath={winnerVideoPath ? getPublicUrl(winnerVideoPath) : null}
                onVideoUploaded={handleVideoUploaded}
                onVideoRemoved={handleVideoRemoved}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="bg-[#1C1C21]/50 border border-gray-800 rounded-2xl p-6"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Gestion des Tombolas</h2>

              {tombolas.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">Aucune tombola créée pour le moment</p>
                  <p className="text-gray-500">Créez votre première tombola pour commencer !</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tombolas.map((tombola) => (
                    <div key={tombola.id} className="bg-gray-900/50 border border-gray-700 rounded-xl p-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white mb-2">{tombola.title}</h3>
                          <p className="text-gray-400 mb-2">{tombola.description}</p>
                          <div className="flex flex-wrap gap-4 text-sm">
                            <span className="text-yellow-400">Prix: {tombola.ticket_price} FCFA</span>
                            <span className="text-green-400">Participants: {tombola.participants}</span>
                            <span className={`px-2 py-1 rounded-full text-xs ${tombola.status === 'active' ? 'bg-green-500/20 text-green-400' :
                              tombola.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                                'bg-red-500/20 text-red-400'
                              }`}>
                              {tombola.status === 'active' ? 'Active' :
                                tombola.status === 'completed' ? 'Terminée' : 'Annulée'}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleEdit(tombola)}
                            size="sm"
                            className="bg-blue-500 hover:bg-blue-600 text-white"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>

                          <Button
                            onClick={() => handleDrawWinners(tombola)}
                            disabled={tombola.status !== 'active' || new Date() < new Date(tombola.draw_date)}
                            size="sm"
                            className={`${tombola.status === 'active' && new Date() >= new Date(tombola.draw_date)
                              ? 'bg-green-500 hover:bg-green-600 text-white'
                              : 'bg-gray-500 text-gray-400 cursor-not-allowed opacity-50'
                              }`}
                            title={
                              tombola.status !== 'active'
                                ? 'Cette tombola n\'est plus active'
                                : new Date() < new Date(tombola.draw_date)
                                  ? `Tirage disponible le ${new Date(tombola.draw_date).toLocaleDateString('fr-FR')}`
                                  : 'Effectuer le tirage'
                            }
                          >
                            {tombola.status === 'completed' ? 'Terminée' : 'Tirage'}
                          </Button>

                          <Button
                            onClick={() => setConfirmDelete({ open: true, tombolaId: tombola.id })}
                            size="sm"
                            className="bg-red-500 hover:bg-red-600 text-white"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>

                          <Button
                            onClick={() => { setSelectedTombola(tombola); setIsWinnerManagerOpen(true); }}
                            size="sm"
                            className="bg-yellow-500 hover:bg-yellow-600 text-black"
                          >
                            <Trophy className="w-4 h-4 mr-1" />
                            Gérer les gagnants
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>

          {/* Section Récapitulatif des Commissions */}
          {tombolas.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mt-8"
            >
              <CommissionSummary
                tombolaId={tombolas[0]?.id}
                tombolaTitle={tombolas[0]?.title}
              />
            </motion.div>
          )}

          {/* Section Gestion des Coupons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="bg-[#1C1C21]/50 border border-gray-800 rounded-2xl p-6 mt-8"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Gestion des Coupons</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead>
                  <tr className="bg-gray-900 text-gray-300">
                    <th className="px-4 py-2">Code</th>
                    <th className="px-4 py-2">Parrain</th>
                    <th className="px-4 py-2">Téléphone</th>
                    <th className="px-4 py-2">Tombola</th>
                    <th className="px-4 py-2">Réduction (%)</th>
                    <th className="px-4 py-2">Parrain contacté</th>
                    <th className="px-4 py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {allCoupons
                    .slice() // pour ne pas muter l'original
                    .sort((a, b) => (a.parrain_contacte === b.parrain_contacte ? 0 : a.parrain_contacte ? 1 : -1))
                    .map(coupon => (
                      <tr key={coupon.id} className="border-b border-gray-800">
                        <td className="px-4 py-2 font-mono text-yellow-400">
                          {editingCode[coupon.id] !== undefined ? (
                            <input
                              type="text"
                              value={editingCode[coupon.id] || coupon.code}
                              onChange={e => setEditingCode(prev => ({ ...prev, [coupon.id]: e.target.value }))}
                              className="w-24 px-2 py-1 rounded bg-gray-800 text-yellow-400 font-bold border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                              disabled={updatingCodeId === coupon.id}
                            />
                          ) : (
                            coupon.code
                          )}
                        </td>
                        <td className="px-4 py-2">{coupon.creator_name}</td>
                        <td className="px-4 py-2">{coupon.creator_phone}</td>
                        <td className="px-4 py-2">{coupon.tombolas?.title}</td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={editingDiscount[coupon.id] !== undefined ? editingDiscount[coupon.id] : coupon.discount_percentage}
                            onChange={e => handleDiscountInput(coupon.id, e.target.value)}
                            className="w-16 px-2 py-1 rounded bg-gray-800 text-yellow-400 font-bold border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            disabled={updatingId === coupon.id}
                          />
                        </td>
                        <td className="px-4 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={!!coupon.parrain_contacte}
                            onChange={async (e) => {
                              await updateCouponParrainContacte(coupon.id, e.target.checked);
                              loadAllCoupons();
                            }}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex gap-2">
                            {editingCode[coupon.id] !== undefined ? (
                              <button
                                onClick={() => handleUpdateCode(coupon.id)}
                                disabled={updatingCodeId === coupon.id}
                                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded font-bold"
                              >
                                {updatingCodeId === coupon.id ? '...' : 'Mettre à jour'}
                              </button>
                            ) : (
                              <button
                                onClick={() => setEditingCode(prev => ({ ...prev, [coupon.id]: coupon.code }))}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded font-bold"
                              >
                                <Edit className="w-4 h-4 mr-1" />
                              </button>
                            )}
                            <button
                              onClick={() => handleUpdateDiscount(coupon.id)}
                              disabled={updatingId === coupon.id}
                              className="bg-yellow-500 hover:bg-yellow-600 text-black px-3 py-1 rounded font-bold"
                            >
                              {updatingId === coupon.id ? '...' : 'Mettre à jour'}
                            </button>
                            {coupon.total_uses === 0 && (
                              <button
                                onClick={() => setConfirmDeleteCoupon({ open: true, couponId: coupon.id })}
                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded font-bold"
                                title="Supprimer ce coupon (aucun parrainage)"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>

        <CreateTombolaModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingTombola(null);
          }}
          onSubmit={editingTombola ? (data) => handleUpdateTombola(editingTombola.id, data) : handleCreateTombola}
          tombola={editingTombola}
        />

        <ConfirmModal
          isOpen={confirmDelete.open}
          onClose={() => setConfirmDelete({ open: false, tombolaId: null })}
          onConfirm={async () => {
            await handleDeleteTombola(confirmDelete.tombolaId);
            setConfirmDelete({ open: false, tombolaId: null });
          }}
          title="Confirmer la suppression"
          message="Êtes-vous sûr de vouloir supprimer cette tombola ? Cette action est irréversible."
          confirmLabel="Supprimer"
          confirmColor="bg-red-500 hover:bg-red-600"
          icon={<Trash2 />}
        />

        <ConfirmModal
          isOpen={confirmDraw.open}
          onClose={() => setConfirmDraw({ open: false, tombola: null })}
          onConfirm={confirmDrawWinners}
          title="Confirmer le tirage"
          message={confirmDraw.tombola ? `Êtes-vous sûr de vouloir effectuer le tirage pour "${confirmDraw.tombola.title}" ?\n\nCette action est irréversible et sélectionnera ${confirmDraw.tombola.max_winners} gagnant(s) parmi ${confirmDraw.tombola.participants} participant(s).` : ''}
          confirmLabel="Tirer au sort"
          confirmColor="bg-green-500 hover:bg-green-600"
          icon={<Gift />}
        />

        <WinnerManagerModal
          isOpen={isWinnerManagerOpen}
          onClose={() => setIsWinnerManagerOpen(false)}
          tombola={selectedTombola}
        />

        <ConfirmModal
          isOpen={confirmDeleteCoupon.open}
          onClose={() => setConfirmDeleteCoupon({ open: false, couponId: null })}
          onConfirm={async () => {
            await deleteCoupon(confirmDeleteCoupon.couponId);
            setConfirmDeleteCoupon({ open: false, couponId: null });
            loadAllCoupons();
            toast({
              title: "Coupon supprimé",
              description: "Le coupon a bien été supprimé.",
              variant: "success"
            });
          }}
          title="Confirmer la suppression"
          message="Êtes-vous sûr de vouloir supprimer ce coupon ? Cette action est irréversible."
          confirmLabel="Supprimer"
          confirmColor="bg-red-500 hover:bg-red-600"
          icon={<Trash2 />}
        />

        {/* Bouton pour ouvrir la modale d'ajout manuel de ticket */}
        <Button
          className="mb-4 bg-green-600 hover:bg-green-700 text-white font-bold"
          onClick={() => setIsManualTicketModalOpen(true)}
        >
          Créer/Rechercher un ticket
        </Button>
        {/* Modale d'ajout manuel de ticket */}
        {isManualTicketModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-[#1C1C21] border border-gray-800 rounded-2xl p-4 sm:p-6 lg:p-8 w-full max-w-md lg:max-w-lg xl:max-w-xl relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => {
                  setIsManualTicketModalOpen(false);
                  setManualTicketCreated(null);
                  setFoundParticipant(null);
                  setSearchMode('create');
                  setSearchParticipantId('');
                  setSearchError('');
                  setManualTicketForm({ name: '', phone: '', airtelMoneyNumber: '', couponCode: '', tombolaId: '' });
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
              {!manualTicketCreated && !foundParticipant ? (
                <>
                  <h2 className="text-2xl font-bold text-white mb-6">Créer/Rechercher un ticket</h2>

                  {/* Onglets pour basculer entre création et recherche */}
                  <div className="flex mb-6 bg-gray-800 rounded-lg p-1">
                    <button
                      type="button"
                      onClick={() => setSearchMode('create')}
                      className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${searchMode === 'create'
                        ? 'bg-green-600 text-white'
                        : 'text-gray-400 hover:text-white'
                        }`}
                    >
                      Créer un ticket
                    </button>
                    <button
                      type="button"
                      onClick={() => setSearchMode('search')}
                      className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${searchMode === 'search'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:text-white'
                        }`}
                    >
                      Rechercher un ticket
                    </button>
                  </div>

                  {searchMode === 'create' ? (
                    <form onSubmit={handleManualTicketSubmit} className="space-y-4">
                      <div>
                        <label className="text-white block mb-1">Nom complet</label>
                        <input type="text" name="name" value={manualTicketForm.name} onChange={handleManualTicketInput} className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 text-white" required />
                      </div>
                      <div>
                        <label className="text-white block mb-1">Téléphone</label>
                        <input type="tel" name="phone" value={manualTicketForm.phone} onChange={handleManualTicketInput} className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 text-white" required />
                      </div>
                      <div>
                        <label className="text-white block mb-1">Numéro Airtel Money</label>
                        <input type="tel" name="airtelMoneyNumber" value={manualTicketForm.airtelMoneyNumber} onChange={handleManualTicketInput} className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 text-white" required />
                      </div>
                      <div>
                        <label className="text-white block mb-1">Code coupon (optionnel)</label>
                        <input type="text" name="couponCode" value={manualTicketForm.couponCode} onChange={handleManualTicketInput} className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 text-white" />
                      </div>
                      <div>
                        <label className="text-white block mb-1">Tombola</label>
                        <select name="tombolaId" value={manualTicketForm.tombolaId} onChange={handleManualTicketInput} className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 text-white" required>
                          <option value="">Sélectionner une tombola</option>
                          {tombolas.map(t => (
                            <option key={t.id} value={t.id}>{t.title}</option>
                          ))}
                        </select>
                      </div>
                      {manualTicketError && <div className="text-red-400 text-sm">{manualTicketError}</div>}
                      {manualTicketSuccess && <div className="text-green-400 text-sm">{manualTicketSuccess}</div>}
                      <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold" disabled={manualTicketLoading}>
                        {manualTicketLoading ? 'Création...' : 'Créer le ticket'}
                      </Button>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="text-white block mb-1">ID du participant</label>
                        <input
                          type="text"
                          value={searchParticipantId}
                          onChange={(e) => setSearchParticipantId(e.target.value)}
                          placeholder="Entrez l'ID du participant"
                          className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 text-white"
                        />
                      </div>
                      {searchError && <div className="text-red-400 text-sm">{searchError}</div>}
                      <Button
                        onClick={handleSearchParticipant}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
                        disabled={searchLoading}
                      >
                        {searchLoading ? 'Recherche...' : 'Rechercher le participant'}
                      </Button>
                    </div>
                  )}
                </>
              ) : foundParticipant ? (
                <>
                  <h2 className="text-2xl font-bold text-white mb-6">Participant trouvé !</h2>
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <CheckCircle className="text-blue-400" size={24} />
                      <div>
                        <h3 className="text-blue-400 font-bold">Participant trouvé</h3>
                        <p className="text-blue-200 text-sm">Le participant a été trouvé dans la base de données</p>
                      </div>
                    </div>
                    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                      <div className="space-y-2 text-sm">
                        <div>
                          <p className="text-gray-400">ID</p>
                          <p className="text-white font-semibold">{foundParticipant.id}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Nom</p>
                          <p className="text-white font-semibold">{foundParticipant.name}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Téléphone</p>
                          <p className="text-white font-semibold">{foundParticipant.phone}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Numéro de ticket</p>
                          <p className="text-yellow-400 font-mono font-bold text-lg">{foundParticipant.ticket_number}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Tombola</p>
                          <p className="text-white font-semibold">{foundParticipant.tombolas?.title}</p>
                        </div>
                        {foundParticipant.coupon_uses?.[0] && (
                          <div>
                            <p className="text-gray-400">Coupon utilisé</p>
                            <p className="text-green-400 font-semibold">{foundParticipant.coupon_uses[0].coupons?.code}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => generateParticipantPDF(foundParticipant)}
                      className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                    >
                      Télécharger le PDF
                    </Button>
                    <Button
                      onClick={() => {
                        setFoundParticipant(null);
                        setSearchParticipantId('');
                        setSearchError('');
                      }}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold"
                    >
                      Nouvelle recherche
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-white mb-6">Ticket créé avec succès !</h2>
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <CheckCircle className="text-green-400" size={24} />
                      <div>
                        <h3 className="text-green-400 font-bold">Ticket généré</h3>
                        <p className="text-green-200 text-sm">Le ticket a été créé avec succès</p>
                      </div>
                    </div>
                    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                      <div className="space-y-2 text-sm">
                        <div>
                          <p className="text-gray-400">Nom</p>
                          <p className="text-white font-semibold">{manualTicketCreated.name}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Téléphone</p>
                          <p className="text-white font-semibold">{manualTicketCreated.phone}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Numéro de ticket</p>
                          <p className="text-yellow-400 font-mono font-bold text-lg">{manualTicketCreated.ticket_number}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Tombola</p>
                          <p className="text-white font-semibold">{tombolas.find(t => t.id === manualTicketForm.tombolaId)?.title}</p>
                        </div>
                        {manualTicketForm.couponCode && (
                          <div>
                            <p className="text-gray-400">Coupon utilisé</p>
                            <p className="text-green-400 font-semibold">{manualTicketForm.couponCode.toUpperCase()}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => {
                        const selectedTombola = tombolas.find(t => t.id === manualTicketForm.tombolaId);
                        const ticketData = {
                          name: manualTicketCreated.name,
                          phone: manualTicketCreated.phone,
                          ticketNumber: manualTicketCreated.ticket_number,
                          airtelMoneyNumber: manualTicketCreated.airtel_money_number,
                          tombolaTitle: selectedTombola?.title || 'Tombola',
                          originalPrice: selectedTombola?.ticket_price || 0,
                          finalPrice: selectedTombola?.ticket_price || 0,
                          discountAmount: 0,
                          drawDate: selectedTombola?.draw_date || new Date().toISOString(),
                          couponCode: manualTicketForm.couponCode || null
                        };

                        // Si un coupon a été utilisé, calculer les prix corrects
                        if (manualTicketForm.couponCode && manualTicketCreated.coupon_validation) {
                          ticketData.discountAmount = manualTicketCreated.coupon_validation.discountAmount;
                          ticketData.finalPrice = ticketData.originalPrice - ticketData.discountAmount;
                        } else {
                          // Sans coupon, le prix final est le même que le prix original
                          ticketData.finalPrice = ticketData.originalPrice;
                        }

                        generateTicketPDF(ticketData);
                      }}
                      className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                    >
                      Télécharger le PDF
                    </Button>
                    <Button
                      onClick={() => {
                        setIsManualTicketModalOpen(false);
                        setManualTicketCreated(null);
                        setManualTicketForm({ name: '', phone: '', airtelMoneyNumber: '', couponCode: '', tombolaId: '' });
                      }}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold"
                    >
                      Fermer
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default AdminPage;