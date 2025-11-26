import React, { useState, useRef, useEffect } from 'react';
import { CountryFull } from '../types';
import { X, MapPin, Users, Globe, BookOpen, Music, Plane, Landmark, Play, Pause } from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';

interface InfoPanelProps {
  country: CountryFull | null;
  onClose: () => void;
  isLoadingAI: boolean;
}

const InfoPanel: React.FC<InfoPanelProps> = ({ country, onClose, isLoadingAI }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Reset audio state when country changes
  useEffect(() => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [country]);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.error("Audio play failed", e));
    }
    setIsPlaying(!isPlaying);
  };

  const hasAudio = country?.aiData?.anthem?.audioUrl && country.aiData.anthem.audioUrl.length > 0;

  // Animation Variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 50 } }
  };

  return (
    <AnimatePresence>
      {country && (
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 h-full w-full md:w-[500px] glass-panel z-50 text-white flex flex-col shadow-2xl"
        >
          {/* STICKY HEADER SECTION */}
          <div className="flex-none relative h-56 w-full overflow-hidden bg-black/80 z-20 shadow-lg border-b border-white/10">
             <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a14] via-transparent to-black/40 z-10" />
             <motion.img 
               initial={{ scale: 1.1 }}
               animate={{ scale: 1 }}
               transition={{ duration: 5 }}
               src={country.flags.svg} 
               alt={country.name.common} 
               className="w-full h-full object-cover opacity-70"
             />
             
             {/* Close Button */}
             <button 
                onClick={onClose}
                className="absolute top-4 right-4 z-30 p-2 rounded-full bg-black/40 hover:bg-white/20 transition-colors backdrop-blur-md border border-white/10 group"
             >
                <X size={20} className="text-gray-300 group-hover:text-white transition-colors" />
             </button>

             {/* Title Block */}
             <div className="absolute bottom-4 left-6 z-20 w-full pr-12">
                <motion.h2 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-4xl font-bold font-[Orbitron] tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-500 truncate"
                >
                  {country.name.common}
                </motion.h2>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-wrap items-center gap-3 mt-1 text-sm"
                >
                  <span className="flex items-center gap-1 text-gray-300 bg-black/30 px-2 py-0.5 rounded backdrop-blur-sm border border-white/5">
                    <Globe size={12} className="text-cyan-400" /> {country.region}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-400">{country.subregion}</span>
                </motion.div>
             </div>
          </div>

          {/* SCROLLABLE CONTENT SECTION */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-8 bg-gradient-to-b from-[#0a0a14] to-black/95">
            
            {/* Quick Stats Grid */}
            <motion.div 
              variants={itemVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 gap-4"
            >
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col gap-1 hover:bg-white/10 transition-colors">
                 <div className="flex items-center gap-2 text-cyan-400 mb-1">
                    <MapPin size={16} />
                    <span className="text-xs font-semibold uppercase tracking-wider">Capital</span>
                 </div>
                 <span className="text-lg font-medium truncate">{country.capital?.[0] || 'N/A'}</span>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col gap-1 hover:bg-white/10 transition-colors">
                 <div className="flex items-center gap-2 text-cyan-400 mb-1">
                    <Users size={16} />
                    <span className="text-xs font-semibold uppercase tracking-wider">Population</span>
                 </div>
                 <span className="text-lg font-medium">{(country.population / 1000000).toFixed(1)}M</span>
              </div>
            </motion.div>

            {/* AI Generated Content Section */}
            {isLoadingAI ? (
               <div className="space-y-8 animate-pulse">
                  {/* Summary Skeleton */}
                  <div className="space-y-3 border-l-2 border-white/10 pl-4">
                     <div className="h-2 bg-white/10 rounded-full w-full"></div>
                     <div className="h-2 bg-white/10 rounded-full w-11/12"></div>
                     <div className="h-2 bg-white/10 rounded-full w-3/4"></div>
                  </div>
                  {/* Cards Skeleton */}
                  {[1, 2].map((i) => (
                      <div key={i} className="h-24 bg-white/5 rounded-xl border border-white/5"></div>
                  ))}
               </div>
            ) : country.aiData ? (
               <motion.div 
                 variants={containerVariants}
                 initial="hidden"
                 animate="show"
                 className="space-y-8"
               >
                  
                  {/* Summary */}
                  <motion.div variants={itemVariants} className="prose prose-invert prose-sm">
                     <p className="text-gray-300 leading-relaxed text-base italic border-l-4 border-cyan-500 pl-4 py-1 bg-gradient-to-r from-cyan-900/10 to-transparent rounded-r-lg">
                        "{country.aiData.summary}"
                     </p>
                  </motion.div>

                  {/* Tourism */}
                  <motion.div variants={itemVariants}>
                     <h3 className="text-lg font-[Orbitron] text-cyan-300 mb-4 flex items-center gap-2 border-b border-white/10 pb-2">
                        <Plane size={18} /> Must Visit
                     </h3>
                     <div className="space-y-4">
                        {country.aiData.attractions.map((place, i) => (
                           <motion.div 
                             key={i} 
                             whileHover={{ scale: 1.02 }}
                             className="group bg-white/5 hover:bg-white/10 transition-all p-4 rounded-xl border border-white/5 hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/10 cursor-default"
                           >
                              <div className="flex justify-between items-start gap-3">
                                 <div>
                                    <h4 className="font-semibold text-white group-hover:text-cyan-300 transition-colors">{place.name}</h4>
                                    <p className="text-sm text-gray-400 mt-2 leading-relaxed">{place.description}</p>
                                 </div>
                                 <div className="w-20 h-20 shrink-0 bg-gray-800 rounded-lg overflow-hidden relative shadow-inner">
                                    <img 
                                      src={`https://picsum.photos/seed/${place.name.replace(/\s/g,'')}/200/200`} 
                                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                                      alt="placeholder"
                                    />
                                 </div>
                              </div>
                           </motion.div>
                        ))}
                     </div>
                  </motion.div>

                  {/* Culture & Religion */}
                  <motion.div variants={itemVariants}>
                     <h3 className="text-lg font-[Orbitron] text-purple-300 mb-4 flex items-center gap-2 border-b border-white/10 pb-2">
                        <Landmark size={18} /> Culture
                     </h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="bg-purple-500/5 p-3 rounded-lg border border-purple-500/20 md:col-span-2">
                           <span className="text-purple-300 block text-xs uppercase mb-1 tracking-wider">Local Greeting</span>
                           <span className="text-white font-medium text-lg">"{country.aiData.culture.greetings}"</span>
                        </div>
                        <div className="bg-purple-500/5 p-3 rounded-lg border border-purple-500/20">
                           <span className="text-purple-300 block text-xs uppercase mb-1 tracking-wider">Religion</span>
                           <span className="text-white">{country.aiData.culture.religion}</span>
                        </div>
                        <div className="bg-purple-500/5 p-3 rounded-lg border border-purple-500/20">
                           <span className="text-purple-300 block text-xs uppercase mb-1 tracking-wider">Traditions</span>
                           <div className="flex flex-wrap gap-2 mt-1">
                              {country.aiData.culture.traditions.slice(0,3).map((t,i) => (
                                 <span key={i} className="bg-purple-500/20 px-2 py-0.5 rounded text-xs whitespace-nowrap">{t}</span>
                              ))}
                           </div>
                        </div>
                     </div>
                  </motion.div>

                  {/* Travel Logistics */}
                  <motion.div variants={itemVariants}>
                     <h3 className="text-lg font-[Orbitron] text-green-300 mb-4 flex items-center gap-2 border-b border-white/10 pb-2">
                        <BookOpen size={18} /> Travel Guide
                     </h3>
                     <div className="bg-white/5 rounded-xl p-5 border border-white/10 space-y-4 text-sm">
                        <div className="flex justify-between items-center border-b border-white/10 pb-3">
                           <span className="text-gray-400">Best Time to Visit</span>
                           <span className="text-green-300 font-medium text-right">{country.aiData.travel.bestTimeVisit}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-white/10 pb-3">
                           <span className="text-gray-400">Avg Cost / Day</span>
                           <span className="text-green-300 font-medium">{country.aiData.travel.avgCostPerDayUSD}</span>
                        </div>
                        <div>
                           <span className="text-gray-400 block mb-2">Top Hotels</span>
                           <div className="flex flex-wrap gap-2">
                              {country.aiData.travel.topHotels.map((h, i) => (
                                 <span key={i} className="text-xs bg-green-900/20 text-green-200 px-2.5 py-1 rounded border border-green-700/30">{h}</span>
                              ))}
                           </div>
                        </div>
                     </div>
                  </motion.div>

                  {/* Anthem */}
                  <motion.div variants={itemVariants} className="pb-10">
                      <h3 
                        onClick={() => hasAudio && toggleAudio()}
                        className={`text-lg font-[Orbitron] text-orange-300 mb-4 flex items-center gap-2 select-none border-b border-white/10 pb-2 ${hasAudio ? 'cursor-pointer hover:text-orange-200 transition-colors' : 'opacity-80'}`}
                      >
                        <Music size={18} /> National Anthem 
                        {hasAudio && (
                           <span className="ml-auto text-[10px] uppercase tracking-widest bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-1 rounded animate-pulse">
                             {isPlaying ? 'Playing...' : 'Click to Play'}
                           </span>
                        )}
                     </h3>
                     <div className="bg-gradient-to-r from-orange-900/20 to-transparent p-5 rounded-xl border-l-4 border-orange-500 relative overflow-hidden">
                        <div className="relative z-10 flex justify-between items-center gap-4">
                           <div className="flex-1">
                              <h4 className="text-orange-200 font-semibold text-lg">{country.aiData.anthem.title}</h4>
                              <p className="text-gray-400 text-sm italic mt-2 whitespace-pre-line leading-relaxed opacity-80">
                                 "{country.aiData.anthem.lyricsSnippet}"
                              </p>
                           </div>
                           
                           {/* Audio Player Button */}
                           {hasAudio && (
                             <div className="flex-shrink-0">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleAudio();
                                  }}
                                  className="w-14 h-14 rounded-full bg-orange-500 text-black flex items-center justify-center hover:bg-orange-400 transition-all shadow-lg shadow-orange-500/30 hover:scale-105 active:scale-95"
                                >
                                  {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                                </button>
                                <audio 
                                  ref={audioRef} 
                                  src={country.aiData.anthem.audioUrl} 
                                  onEnded={() => setIsPlaying(false)}
                                  onError={(e) => console.log("Audio failed to load", e)}
                                />
                             </div>
                           )}
                        </div>
                        {/* Background decoration */}
                        <Music className="absolute -bottom-4 -right-4 text-orange-500/10 w-32 h-32 transform rotate-12" />
                     </div>
                  </motion.div>

               </motion.div>
            ) : (
              <div className="text-center text-red-400 py-8 text-sm bg-red-500/10 rounded-lg border border-red-500/20">
                 Unable to retrieve planetary data at this moment.
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InfoPanel;