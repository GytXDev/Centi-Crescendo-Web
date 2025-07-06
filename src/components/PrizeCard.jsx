import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign } from 'lucide-react';

function PrizeCard({ prize, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="bg-[#1C1C21] border border-gray-800 rounded-2xl p-6 hover:border-yellow-400/50 transition-all duration-300 group"
    >
      <div className="relative mb-4">
        <img 
          className="w-full h-48 object-cover rounded-xl opacity-50"
          alt={prize.image}
         src="https://images.unsplash.com/photo-1638739641967-bc833d955385" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-yellow-400/10 p-4 rounded-full border-2 border-yellow-400/30">
            <DollarSign className="w-12 h-12 text-yellow-400" />
          </div>
        </div>
      </div>
      
      <div className="text-center">
        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-yellow-400 transition-colors">
          {prize.name}
        </h3>
        <p className="text-3xl font-bold text-yellow-400">
          {prize.value}
        </p>
      </div>
    </motion.div>
  );
}

export default PrizeCard;