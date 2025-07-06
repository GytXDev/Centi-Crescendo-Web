import React from 'react';
import { motion } from 'framer-motion';

function StatsCard({ title, value, icon: Icon, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#1C1C21]/50 border border-gray-800 rounded-2xl p-6 hover:border-yellow-400/50 transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl bg-gray-800 ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      
      <div>
        <p className="text-white/70 text-sm mb-1">
          {title}
        </p>
        <p className="text-2xl font-bold text-white">
          {value}
        </p>
      </div>
    </motion.div>
  );
}

export default StatsCard;