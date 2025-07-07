import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Gift, Trophy, Users, PlayCircle, Tag, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import ParticipationModal from '@/components/ParticipationModal';
import CreateCouponModal from '@/components/CreateCouponModal';
import Countdown from '@/components/Countdown';
import WinnerCard from '@/components/WinnerCard';
import Navigation from '@/components/Navigation';
import { getCurrentTombola, getAllWinners, getAppConfig } from '@/lib/supabaseServices';
import { getPublicUrl } from '@/lib/fileUploadService';
import VideoPlayer from '@/components/YouTubeVideo';

function HomePage() {
  const [currentTombola, setCurrentTombola] = useState(null);
  const [isParticipationOpen, setIsParticipationOpen] = useState(false);
  const [isCreateCouponOpen, setIsCreateCouponOpen] = useState(false);
  const [winners, setWinners] = useState([]);
  const [winnerVideoUrl, setWinnerVideoUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [contactPhone, setContactPhone] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Charger la tombola active
      const { data: tombola, error: tombolaError } = await getCurrentTombola();
      if (tombolaError) {
        console.error('Erreur lors du chargement de la tombola:', tombolaError);
        toast({
          title: "Erreur",
          description: "Impossible de charger la tombola active.",
          variant: "destructive"
        });
      } else {
        setCurrentTombola(tombola);
      }

      // Charger les gagnants récents
      const { data: winnersData, error: winnersError } = await getAllWinners();
      if (winnersError) {
        console.error('Erreur lors du chargement des gagnants:', winnersError);
      } else {
        setWinners(winnersData || []);
      }

      // Charger la configuration de l'application
      const { data: config, error: configError } = await getAppConfig();
      if (configError) {
        console.error('Erreur lors du chargement de la configuration:', configError);
      } else {
        setWinnerVideoUrl(config?.winner_video_url);
        setContactPhone(config?.contact_phone);
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

  const handleParticipate = () => {
    if (!currentTombola) {
      toast({
        title: "Erreur",
        description: "Aucune tombola active pour le moment.",
        variant: "destructive"
      });
      return;
    }

    // Vérifier si la date de tirage est atteinte
    const now = new Date();
    const drawDate = new Date(currentTombola.draw_date);

    if (now >= drawDate) {
      toast({
        title: "Participation fermée",
        description: "Le tirage a commencé. Les participations sont maintenant fermées.",
        variant: "destructive"
      });
      return;
    }

    setIsParticipationOpen(true);
  };

  // Fonction pour vérifier si la tombola est encore ouverte aux participations
  const isTombolaOpen = () => {
    if (!currentTombola) return false;
    const now = new Date();
    const drawDate = new Date(currentTombola.draw_date);
    return now < drawDate;
  };

  // Fonction pour vérifier si la tombola peut être tirée
  const canDrawTombola = () => {
    if (!currentTombola) return false;
    const now = new Date();
    const drawDate = new Date(currentTombola.draw_date);
    return now >= drawDate && currentTombola.status === 'active';
  };

  // Fonction pour obtenir le statut de la tombola
  const getTombolaStatus = () => {
    if (!currentTombola) return 'none';
    if (currentTombola.status === 'completed') return 'completed';
    if (canDrawTombola()) return 'ready_to_draw';
    if (isTombolaOpen()) return 'open';
    return 'closed';
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
        <title>Centi Crescendo - Tombola Digitale | Gagnez des Sommes d'Argent</title>
        <meta name="description" content="Participez à la tombola digitale Centi Crescendo et tentez de gagner d'importantes sommes d'argent ! Paiement sécurisé via Airtel Money." />
      </Helmet>

      <div className="min-h-screen text-white bg-[#0B0B0F]">
        <Navigation />

        <section className="relative overflow-hidden pt-20 pb-28 px-4">
          <div className="container mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl mx-auto"
            >
              {currentTombola && (
                <h1 className="text-5xl md:text-6xl font-bold mb-6">
                  🎯 Gagne <span className="text-yellow-400">
                    {new Intl.NumberFormat('fr-FR').format(currentTombola.jackpot)} FCFA !
                  </span>
                </h1>
              )}
              {currentTombola?.description && (
                <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
                  {currentTombola.description}
                </p>
              )}

              {currentTombola && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="bg-[#1C1C21]/50 border border-gray-800 rounded-3xl p-8 mb-8 backdrop-blur-sm"
                >
                  <h2 className="text-3xl font-bold text-white mb-4">
                    {currentTombola.title}
                  </h2>

                  <Countdown targetDate={currentTombola.draw_date} />

                  <div className="grid md:grid-cols-3 gap-6 mb-8 text-white">
                    <div className="text-center bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                      <p className="text-gray-400 text-sm">Prix du ticket</p>
                      <p className="text-2xl font-bold text-yellow-400">
                        {currentTombola.ticket_price} FCFA
                      </p>
                    </div>
                    <div className="text-center bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                      <p className="text-gray-400 text-sm">Participants</p>
                      <p className="text-2xl font-bold text-green-400">
                        {currentTombola.participants}
                      </p>
                    </div>
                    <div className="text-center bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                      <p className="text-gray-400 text-sm">Statut</p>
                      <p className={`text-lg font-bold ${getTombolaStatus() === 'open' ? 'text-green-400' :
                        getTombolaStatus() === 'ready_to_draw' ? 'text-orange-400' :
                          getTombolaStatus() === 'completed' ? 'text-blue-400' :
                            'text-red-400'
                        }`}>
                        {getTombolaStatus() === 'open' ? 'Ouverte' :
                          getTombolaStatus() === 'ready_to_draw' ? 'Tirage imminent' :
                            getTombolaStatus() === 'completed' ? 'Terminée' :
                              'Fermée'}
                      </p>
                    </div>
                  </div>

                  {getTombolaStatus() === 'ready_to_draw' && (
                    <div className="mb-4 p-4 bg-orange-500/20 border border-orange-500/30 rounded-lg">
                      <p className="text-orange-300 text-center">
                        🎯 Le tirage peut maintenant être effectué ! Les participations sont fermées.
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={handleParticipate}
                    disabled={!isTombolaOpen()}
                    size="lg"
                    className={`font-bold text-xl px-12 py-7 rounded-lg transition-all duration-300 shadow-lg ${isTombolaOpen()
                      ? 'bg-yellow-400 hover:bg-yellow-500 text-black pulse-glow transform hover:scale-105 shadow-yellow-400/20'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                      }`}
                  >
                    {isTombolaOpen() ? 'Participer maintenant' : 'Participation fermée'}
                  </Button>
                </motion.div>
              )}

              {!currentTombola && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="bg-[#1C1C21]/50 border border-gray-800 rounded-3xl p-8 mb-8 backdrop-blur-sm"
                >
                  <h2 className="text-3xl font-bold text-white mb-4">
                    Aucune tombola active
                  </h2>
                  <p className="text-gray-300 text-lg">
                    Il n'y a actuellement aucune tombola active. Revenez bientôt pour participer !
                  </p>
                </motion.div>
              )}
            </motion.div>
          </div>
        </section>

        <section className="py-20 px-4 bg-[#0B0B0F]">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl font-bold text-white mb-4">
                🎥 Ils ont gagné, ils témoignent !
              </h2>
              <p className="text-gray-300 text-lg max-w-3xl mx-auto">
                La chance sourit aux audacieux. Découvrez les histoires de nos heureux gagnants et imaginez-vous à leur place.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl mx-auto"
            >
              <VideoPlayer
                videoUrl={winnerVideoUrl}
                title="Témoignage du gagnant"
                className="shadow-2xl shadow-yellow-400/10 border-2 border-gray-800"
              />
            </motion.div>
          </div>
        </section>

        <section className="py-16 px-4 bg-[#0B0B0F]">

        </section>

        {winners.length > 0 && (
          <section className="py-16 px-4 bg-black">
            <div className="container mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center mb-12"
              >
                <h2 className="text-4xl font-bold text-white mb-4">
                  🎉 Nos Derniers Gagnants
                </h2>
                <p className="text-gray-300 text-lg">
                  Ils ont tenté leur chance et ont gagné !
                </p>
              </motion.div>

              <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {winners.slice(0, 4).map(winner => (
                  <WinnerCard
                    key={winner.id}
                    winner={{
                      id: winner.id,
                      name: winner.participants?.name || 'Anonyme',
                      prize: winner.prize_amount,
                      ticketNumber: winner.participants?.ticket_number || 'N/A',
                      date: new Date(winner.created_at).toLocaleDateString('fr-FR'),
                      photo_url: winner.photo_url
                    }}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="py-16 px-4 bg-[#0B0B0F]">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl font-bold text-white mb-4">Comment Participer ?</h2>
              <p className="text-gray-300 text-lg">
                C'est simple, rapide et sécurisé !
              </p>
            </motion.div>

            <div className="grid md:grid-cols-4 gap-8">
              {[
                { step: "1", title: "Inscrivez-vous", description: "Remplissez le formulaire avec votre nom et numéro Airtel Money.", icon: "📝" },
                { step: "2", title: "Payez", description: "Effectuez le paiement sécurisé via Airtel Money.", icon: "💳" },
                { step: "3", title: "Recevez votre ticket", description: "Téléchargez automatiquement votre ticket PDF unique.", icon: "🎫" },
                { step: "4", title: "Attendez le tirage", description: "Le tirage est 100% aléatoire et transparent.", icon: "🎯" }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="bg-[#1C1C21]/50 border border-gray-800 rounded-2xl p-6 h-full hover:border-yellow-400/50 transition-all duration-300">
                    <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                      {item.icon}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      Étape {item.step} : {item.title}
                    </h3>
                    <p className="text-gray-400">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION COUPONS ET PARRAINAGE */}
        <section className="py-16 px-4 bg-black">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl font-bold text-white mb-4">
                🎫 Créez votre Coupon et Gagnez des Commissions !
              </h2>
              <p className="text-gray-300 text-lg max-w-3xl mx-auto">
                Devenez parrain et gagnez de l'argent en partageant vos coupons. Plus vos amis participent, plus vous gagnez !
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-[#1C1C21]/50 border border-gray-800 rounded-2xl p-8"
              >
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Tag className="text-yellow-400" size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Créez votre Coupon</h3>
                  <p className="text-gray-400">
                    Générez un code unique et partagez-le avec vos amis
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                      <span className="text-green-400 text-sm font-bold">1</span>
                    </div>
                    <span className="text-gray-300">Remplissez vos informations</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                      <span className="text-green-400 text-sm font-bold">2</span>
                    </div>
                    <span className="text-gray-300">Recevez votre code unique</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                      <span className="text-green-400 text-sm font-bold">3</span>
                    </div>
                    <span className="text-gray-300">Partagez et gagnez des commissions</span>
                  </div>
                </div>

                <Button
                  onClick={() => setIsCreateCouponOpen(true)}
                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3"
                >
                  Créer mon Coupon
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-[#1C1C21]/50 border border-gray-800 rounded-2xl p-8"
              >
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="text-blue-400" size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Système de Commissions</h3>
                  <p className="text-gray-400">
                    Gagnez de l'argent selon vos performances
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-300">Bronze</span>
                      <span className="text-yellow-400 font-bold">3%</span>
                    </div>
                    <p className="text-gray-400 text-sm">50 tickets vendus</p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-300">Argent</span>
                      <span className="text-yellow-400 font-bold">5%</span>
                    </div>
                    <p className="text-gray-400 text-sm">100 tickets vendus</p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-300">Or</span>
                      <span className="text-yellow-400 font-bold">10%</span>
                    </div>
                    <p className="text-gray-400 text-sm">200 tickets vendus</p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-300">Platine</span>
                      <span className="text-yellow-400 font-bold">15%</span>
                    </div>
                    <p className="text-gray-400 text-sm">500 tickets vendus</p>
                  </div>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-center mt-12"
            >
              <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-6 max-w-2xl mx-auto">
                <h3 className="text-xl font-bold text-yellow-400 mb-3">
                  💡 Comment ça marche ?
                </h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-300">
                  <div>
                    <p className="font-semibold mb-2">Pour vos amis :</p>
                    <ul className="space-y-1">
                      <li>• 10% de réduction sur leur ticket</li>
                      <li>• Paiement sécurisé via Airtel Money</li>
                      <li>• Ticket PDF automatique</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold mb-2">Pour vous :</p>
                    <ul className="space-y-1">
                      <li>• Commissions selon vos ventes</li>
                      <li>• Suivi en temps réel</li>
                      <li>• Paiements automatiques</li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* SECTION SUPPORT & CONTACT */}
        <section className="py-12 px-4 bg-black border-t border-gray-800">
          <div className="container mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-block w-full max-w-xl"
            >
              <h2 className="text-3xl font-bold text-yellow-400 mb-4">Support & Contact</h2>
              <p className="text-lg text-gray-300 mb-4">
                Besoin d'aide ou d'informations ? Notre support est disponible sur WhatsApp !
              </p>
              {contactPhone && (
                <div className="mb-4">
                  <span className="font-semibold text-white">Téléphone : </span>
                  <a href={`tel:${contactPhone}`} className="text-yellow-400 hover:underline">{contactPhone}</a>
                </div>
              )}
              <a
                href="https://whatsapp.com/channel/0029Vb6804bCXC3IZmra730o"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full text-lg shadow-lg transition-all duration-300"
              >
                📢 Rejoindre la chaîne WhatsApp
              </a>
            </motion.div>
          </div>
        </section>

        <ParticipationModal
          isOpen={isParticipationOpen}
          onClose={() => setIsParticipationOpen(false)}
          tombola={currentTombola}
        />

        <CreateCouponModal
          isOpen={isCreateCouponOpen}
          onClose={() => setIsCreateCouponOpen(false)}
          tombola={currentTombola}
        />
      </div>
    </>
  );
}

export default HomePage;