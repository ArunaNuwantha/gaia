import React, { useState, useRef, useEffect } from 'react';
import { CountryFull } from '../types';
import { X, MapPin, Users, Globe, BookOpen, Music, Plane, Landmark, Play, Pause, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

  return (
    <AnimatePresence>
      {country && (
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 h-full w-full md:w-[480px] glass-panel z-50 text-white overflow-y-auto"
        >
          {/* Header Image / Flag Gradient */}
          <div className="relative h-48 w-full overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0a0a14] z-10" />
             <img 
               src={country.flags.svg} 
               alt={country.name.common} 
               className="w-full h-full object-cover opacity-60"
             />
             <button 
                onClick={onClose}
                className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/40 hover:bg-white/10 transition-colors backdrop-blur-md"
             >
                <X size={20} />
             </button>
             <div className="absolute bottom-4 left-6 z-20">
                <h2 className="text-4xl font-bold font-[Orbitron] tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-500">
                  {country.name.common}
                </h2>
                <p className="text-gray-400 text-sm flex items-center gap-2 mt-1">
                  <Globe size={14} /> {country.region} • {country.subregion}
                </p>
             </div>
          </div>

          <div className="p-6 space-y-8">
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col gap-1">
                 <div className="flex items-center gap-2 text-cyan-400 mb-1">
                    <MapPin size={16} />
                    <span className="text-xs font-semibold uppercase tracking-wider">Capital</span>
                 </div>
                 <span className="text-lg font-medium">{country.capital?.[0] || 'N/A'}</span>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col gap-1">
                 <div className="flex items-center gap-2 text-cyan-400 mb-1">
                    <Users size={16} />
                    <span className="text-xs font-semibold uppercase tracking-wider">Population</span>
                 </div>
                 <span className="text-lg font-medium">{(country.population / 1000000).toFixed(1)}M</span>
              </div>
            </div>

            {/* AI Generated Content Section */}
            {isLoadingAI ? (
               <div className="space-y-8 animate-pulse">
                  {/* Summary Skeleton */}
                  <div className="space-y-3 border-l-2 border-white/10 pl-4">
                     <div className="h-2 bg-white/10 rounded-full w-full"></div>
                     <div className="h-2 bg-white/10 rounded-full w-11/12"></div>
                     <div className="h-2 bg-white/10 rounded-full w-3/4"></div>
                  </div>

                  {/* Tourism Skeleton */}
                  <div>
                     <div className="h-4 bg-white/10 rounded w-32 mb-4"></div>
                     <div className="space-y-4">
                        {[1, 2].map((i) => (
                           <div key={i} className="bg-white/5 p-4 rounded-lg border border-white/5 flex justify-between gap-4">
                               <div className="flex-1 space-y-3">
                                  <div className="h-3 bg-white/10 rounded w-24"></div>
                                  <div className="space-y-2">
                                    <div className="h-2 bg-white/10 rounded w-full"></div>
                                    <div className="h-2 bg-white/10 rounded w-5/6"></div>
                                  </div>
                               </div>
                               <div className="w-16 h-12 bg-white/10 rounded self-center"></div>
                           </div>
                        ))}
                     </div>
                  </div>

                  {/* Culture Skeleton */}
                  <div className="grid grid-cols-1 gap-3">
                     {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white/5 p-3 rounded-lg h-14 flex flex-col justify-center gap-2">
                            <div className="h-2 bg-white/10 rounded w-20"></div>
                            <div className="h-2 bg-white/10 rounded w-32"></div>
                        </div>
                     ))}
                  </div>

                  {/* Anthem Skeleton */}
                  <div className="h-24 bg-white/5 rounded-xl border border-white/5"></div>
               </div>
            ) : country.aiData ? (
               <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  
                  {/* Summary */}
                  <div className="prose prose-invert prose-sm">
                     <p className="text-gray-300 leading-relaxed text-base italic border-l-2 border-cyan-500 pl-4">
                        "{country.aiData.summary}"
                     </p>
                  </div>

                  {/* Tourism */}
                  <div>
                     <h3 className="text-lg font-[Orbitron] text-cyan-300 mb-4 flex items-center gap-2">
                        <Plane size={18} /> Must Visit
                     </h3>
                     <div className="space-y-4">
                        {country.aiData.attractions.map((place, i) => (
                           <div key={i} className="group bg-white/5 hover:bg-white/10 transition-colors p-4 rounded-lg border border-white/5">
                              <div className="flex justify-between items-start">
                                 <h4 className="font-semibold text-white group-hover:text-cyan-300 transition-colors">{place.name}</h4>
                                 <div className="w-16 h-10 bg-gray-700 rounded overflow-hidden relative">
                                    <img 
                                      src={`https://picsum.photos/seed/${place.name.replace(/\s/g,'')}/200/100`} 
                                      className="w-full h-full object-cover opacity-70"
                                      alt="placeholder"
                                    />
                                 </div>
                              </div>
                              <p className="text-sm text-gray-400 mt-2">{place.description}</p>
                           </div>
                        ))}
                     </div>
                  </div>

                  {/* Culture & Religion */}
                  <div>
                     <h3 className="text-lg font-[Orbitron] text-purple-300 mb-4 flex items-center gap-2">
                        <Landmark size={18} /> Culture
                     </h3>
                     <div className="grid grid-cols-1 gap-3 text-sm">
                        <div className="bg-purple-500/10 p-3 rounded-lg border border-purple-500/20">
                           <span className="text-purple-300 block text-xs uppercase mb-1">Local Greeting</span>
                           <span className="text-white font-medium">"{country.aiData.culture.greetings}"</span>
                        </div>
                        <div className="bg-purple-500/10 p-3 rounded-lg border border-purple-500/20">
                           <span className="text-purple-300 block text-xs uppercase mb-1">Religion</span>
                           <span className="text-white">{country.aiData.culture.religion}</span>
                        </div>
                        <div className="bg-purple-500/10 p-3 rounded-lg border border-purple-500/20">
                           <span className="text-purple-300 block text-xs uppercase mb-1">Traditions</span>
                           <div className="flex flex-wrap gap-2 mt-1">
                              {country.aiData.culture.traditions.map((t,i) => (
                                 <span key={i} className="bg-purple-500/20 px-2 py-0.5 rounded text-xs">{t}</span>
                              ))}
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Travel Logistics */}
                  <div>
                     <h3 className="text-lg font-[Orbitron] text-green-300 mb-4 flex items-center gap-2">
                        <BookOpen size={18} /> Travel Guide
                     </h3>
                     <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-3 text-sm">
                        <div className="flex justify-between border-b border-white/10 pb-2">
                           <span className="text-gray-400">Best Time</span>
                           <span className="text-green-300">{country.aiData.travel.bestTimeVisit}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/10 pb-2">
                           <span className="text-gray-400">Avg Cost/Day</span>
                           <span className="text-green-300">{country.aiData.travel.avgCostPerDayUSD}</span>
                        </div>
                        <div>
                           <span className="text-gray-400 block mb-2">Top Hotels</span>
                           <div className="flex flex-wrap gap-2">
                              {country.aiData.travel.topHotels.map((h, i) => (
                                 <span key={i} className="text-xs bg-green-900/30 text-green-200 px-2 py-1 rounded border border-green-700/30">{h}</span>
                              ))}
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Anthem */}
                  <div>
                      <h3 
                        onClick={() => hasAudio && toggleAudio()}
                        className={`text-lg font-[Orbitron] text-orange-300 mb-4 flex items-center gap-2 select-none ${hasAudio ? 'cursor-pointer hover:text-orange-200 transition-colors' : 'opacity-80'}`}
                      >
                        <Music size={18} /> National Anthem 
                        {hasAudio && (
                           <span className="ml-auto text-[10px] uppercase tracking-widest bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-1 rounded animate-pulse">
                             {isPlaying ? 'Playing...' : 'Click to Play'}
                           </span>
                        )}
                     </h3>
                     <div className="bg-gradient-to-r from-orange-900/20 to-transparent p-4 rounded-xl border-l-4 border-orange-500">
                        <div className="flex justify-between items-start">
                           <div className="flex-1">
                              <h4 className="text-orange-200 font-semibold">{country.aiData.anthem.title}</h4>
                              <p className="text-gray-400 text-sm italic mt-2 whitespace-pre-line">
                                 "{country.aiData.anthem.lyricsSnippet}"
                              </p>
                           </div>
                           
                           {/* Audio Player */}
                           {hasAudio && (
                             <div className="ml-4 flex-shrink-0">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleAudio();
                                  }}
                                  className="w-12 h-12 rounded-full bg-orange-500 text-black flex items-center justify-center hover:bg-orange-400 transition-all shadow-lg shadow-orange-500/20 hover:scale-105"
                                >
                                  {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
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
                     </div>
                  </div>

               </div>
            ) : (
              <div className="text-center text-red-400 py-8 text-sm bg-red-500/10 rounded-lg border border-red-500/20">
                 Unable to retrieve planetary data at this moment.
              </div>
            )}
            
            <div className="h-20" /> {/* Spacer */}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InfoPanel;