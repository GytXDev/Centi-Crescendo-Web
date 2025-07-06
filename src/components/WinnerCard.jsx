import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Calendar, Ticket } from 'lucide-react';

function WinnerCard({ winner, showTombola = false }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, borderColor: 'rgba(255, 215, 0, 0.5)' }}
      className="bg-[#1C1C21] border border-gray-800 rounded-2xl p-6 transition-all duration-300"
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="relative">
          <img 
            className="w-16 h-16 rounded-full object-cover border-2 border-gray-700"
            alt={`Photo de ${winner.name}`}
           src="https://images.unsplash.com/photo-1673381572188-9c26638c73fd" />
          <div className="absolute -bottom-1 -right-1 bg-yellow-400 p-1 rounded-full">
            <Trophy className="w-4 h-4 text-black" />
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white">
            {winner.name}
          </h3>
          <p className="text-green-400 font-medium text-lg">
            A gagné {winner.prize}
          </p>
        </div>
      </div>
      
      <div className="space-y-2 text-sm border-t border-gray-800 pt-4 mt-4">
        <div className="flex items-center gap-2 text-gray-400">
          <Ticket className="w-4 h-4 text-yellow-400" />
          <span>Ticket: {winner.ticketNumber}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-400">
          <Calendar className="w-4 h-4 text-yellow-400" />
          <span>Gagné le: {new Date(winner.date).toLocaleDateString('fr-FR')}</span>
        </div>
        {showTombola && winner.tombola && (
          <div className="text-gray-400">
            <span className="font-medium">Tombola:</span> {winner.tombola}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default WinnerCard;