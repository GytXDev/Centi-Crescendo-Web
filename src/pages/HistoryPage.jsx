import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Trophy, Calendar, Users, Gift } from 'lucide-react';
import Navigation from '@/components/Navigation';
import WinnerCard from '@/components/WinnerCard';
import { getAllTombolas, getAllWinners } from '@/lib/supabaseServices';

function HistoryPage() {
  const [pastTombolas, setPastTombolas] = useState([]);
  const [allWinners, setAllWinners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Charger toutes les tombolas (passées et actuelles)
      const { data: tombolasData, error: tombolasError } = await getAllTombolas();
      if (tombolasError) {
        console.error('Erreur lors du chargement des tombolas:', tombolasError);
      } else {
        // Filtrer les tombolas passées (terminées ou annulées)
        const pastTombolas = (tombolasData || []).filter(t =>
          t.status === 'completed' || t.status === 'cancelled'
        );
        setPastTombolas(pastTombolas);
      }

      // Charger tous les gagnants
      const { data: winnersData, error: winnersError } = await getAllWinners();
      if (winnersError) {
        console.error('Erreur lors du chargement des gagnants:', winnersError);
      } else {
        setAllWinners(winnersData || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

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
        <title>Historique des Tombolas - Centi Crescendo</title>
        <meta name="description" content="Découvrez l'historique de toutes nos tombolas et nos gagnants précédents" />
      </Helmet>

      <div className="min-h-screen bg-[#0B0B0F]">
        <Navigation />

        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Historique des Tombolas
              </h1>
              <p className="text-white/80 text-lg">
                Revivez les moments magiques de nos précédentes tombolas
              </p>
            </div>

            {/* Past Tombolas */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold text-white mb-8 text-center">
                🏆 Tombolas Passées
              </h2>

              {pastTombolas.length === 0 ? (
                <div className="bg-[#1C1C21]/50 border border-gray-800 rounded-2xl p-12 text-center">
                  <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">
                    Aucune tombola passée pour le moment
                  </p>
                  <p className="text-gray-500 mt-2">
                    Les tombolas terminées apparaîtront ici
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-8">
                  {pastTombolas.map((tombola, index) => (
                    <motion.div
                      key={tombola.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      className="bg-[#1C1C21]/50 border border-gray-800 rounded-2xl p-6 hover:border-yellow-400/50 transition-all duration-300"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <Trophy className="w-8 h-8 text-yellow-400" />
                        <h3 className="text-xl font-bold text-white">
                          {tombola.title}
                        </h3>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400 mb-1">Date du tirage</p>
                          <p className="text-white font-medium">
                            {new Date(tombola.draw_date).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 mb-1">Participants</p>
                          <p className="text-white font-medium flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {tombola.participants}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 mb-1">Gagnants</p>
                          <p className="text-white font-medium">
                            {tombola.max_winners}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 mb-1">Jackpot</p>
                          <p className="text-white font-medium">
                            {tombola.jackpot}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${tombola.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                          'bg-red-500/20 text-red-400'
                          }`}>
                          {tombola.status === 'completed' ? 'Terminée' : 'Annulée'}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </section>

            {/* All Winners */}
            <section>
              <h2 className="text-3xl font-bold text-white mb-8 text-center">
                🎉 Tous nos Gagnants
              </h2>

              {allWinners.length === 0 ? (
                <div className="bg-[#1C1C21]/50 border border-gray-800 rounded-2xl p-12 text-center">
                  <Gift className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">
                    Aucun gagnant pour le moment
                  </p>
                  <p className="text-gray-500 mt-2">
                    Les gagnants apparaîtront ici après les tirages
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {allWinners.map((winner, index) => (
                    <motion.div
                      key={winner.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                    >
                      <WinnerCard
                        winner={{
                          id: winner.id,
                          name: winner.participants?.name || 'Anonyme',
                          prize: winner.prize_amount,
                          ticketNumber: winner.participants?.ticket_number || 'N/A',
                          date: new Date(winner.created_at).toLocaleDateString('fr-FR'),
                          photo_url: winner.photo_url,
                          tombola: winner.tombolas?.title || 'Tombola'
                        }}
                        showTombola={true}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </section>
          </motion.div>
        </div>
      </div>
    </>
  );
}

export default HistoryPage;