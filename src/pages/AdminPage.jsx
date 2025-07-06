import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { PlusCircle, Edit, Trash2, Users, BarChart, DollarSign, Video, Trophy, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import CreateTombolaModal from '@/components/CreateTombolaModal';
import StatsCard from '@/components/StatsCard';
import Navigation from '@/components/Navigation';
import AdminLogin from '@/components/AdminLogin';
import {
  getAllTombolas,
  createTombola,
  updateTombola,
  deleteTombola,
  getGlobalStats,
  getAppConfig,
  updateAppConfigById,
  performDraw
} from '@/lib/supabaseServices';
import { getPublicUrl } from '@/lib/fileUploadService';
import VideoUpload from '@/components/VideoUpload';

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

  const handleCreateTombola = async (tombolaData) => {
    try {
      const { data, error } = await createTombola(tombolaData);

      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de créer la tombola. Veuillez réessayer.",
          variant: "destructive"
        });
        return;
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
      const { data, error } = await updateTombola(id, updatedData);

      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de mettre à jour la tombola. Veuillez réessayer.",
          variant: "destructive"
        });
        return;
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

      // Recharger les données
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
    try {
      // Vérifier que la date de tirage est atteinte
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

      // Vérifier que la tombola est active
      if (tombola.status !== 'active') {
        toast({
          title: "Tirage impossible",
          description: "Cette tombola n'est plus active ou a déjà été tirée.",
          variant: "destructive"
        });
        return;
      }

      // Confirmation avant le tirage
      const confirmed = window.confirm(
        `Êtes-vous sûr de vouloir effectuer le tirage pour "${tombola.title}" ?\n\n` +
        `Cette action est irréversible et sélectionnera ${tombola.max_winners} gagnant(s) parmi ${tombola.participants} participant(s).`
      );

      if (!confirmed) return;

      // Effectuer le tirage
      const { data: winners, error } = await performDraw(tombola.id);

      if (error) {
        toast({
          title: "Erreur lors du tirage",
          description: error.message || "Une erreur s'est produite lors du tirage.",
          variant: "destructive"
        });
        return;
      }

      // Recharger les données
      await loadData();

      // Afficher le résultat
      toast({
        title: "🎉 Tirage effectué avec succès !",
        description: `${winners.length} gagnant(s) ont été sélectionné(s) pour "${tombola.title}".`,
        variant: "success"
      });

      // Afficher les détails des gagnants
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
                <Button onClick={() => { setEditingTombola(null); setIsCreateModalOpen(true); }} className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold w-full sm:w-auto">
                  <PlusCircle className="w-5 h-5 mr-2" />
                  Nouvelle Tombola
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
                            onClick={() => handleDeleteTombola(tombola.id)}
                            size="sm"
                            className="bg-red-500 hover:bg-red-600 text-white"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        </div>

        <CreateTombolaModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingTombola(null);
          }}
          onSubmit={editingTombola ? handleUpdateTombola : handleCreateTombola}
          editingTombola={editingTombola}
        />
      </div>
    </>
  );
}

export default AdminPage;