import React, { useState, useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader } from '@react-three/drei';
import { Search, Globe as GlobeIcon, Share2, Info, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Globe3D from './components/Globe3D';
import InfoPanel from './components/InfoPanel';
import { CountryBase, CountryFull } from './types';
import { fetchCountryDetails } from './services/geminiService';

const App: React.FC = () => {
  const [allCountries, setAllCountries] = useState<CountryBase[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<CountryFull | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  // Initial Data Fetch
  useEffect(() => {
    const initData = async () => {
      try {
        const res = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,cca3,capital,region,subregion,latlng,population,flags');
        const data = await res.json();
        // Filter out countries without latlng or with 0 population to clean up the map
        const validData = data.filter((c: any) => c.latlng && c.latlng.length === 2 && c.population > 0);
        setAllCountries(validData);
      } catch (err) {
        console.error("Failed to fetch initial country data", err);
      }
    };
    initData();
  }, []);

  // Handle Selection & AI Fetch
  const handleSelectCountry = async (country: CountryBase) => {
    // If already selected, do nothing
    if (selectedCountry?.cca3 === country.cca3) return;

    // Set basic info immediately
    setSelectedCountry({ ...country });
    setSearchQuery(''); // clear search
    
    // Fetch AI details
    setLoadingAi(true);
    const aiData = await fetchCountryDetails(country.name.common);
    setLoadingAi(false);

    if (aiData) {
      setSelectedCountry(prev => prev?.cca3 === country.cca3 ? { ...prev, aiData } : prev);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setToast("Orbit coordinates copied to clipboard");
      setTimeout(() => setToast(null), 3000);
    });
  };

  const filteredCountries = useMemo(() => {
     if (!searchQuery) return [];
     return allCountries
       .filter(c => c.name.common.toLowerCase().includes(searchQuery.toLowerCase()))
       .slice(0, 5); // Limit suggestions
  }, [allCountries, searchQuery]);

  return (
    <div className="relative w-full h-screen bg-black text-white overflow-hidden">
      
      {/* 3D Scene */}
      <Canvas>
        <Globe3D 
          countries={allCountries} 
          onSelectCountry={handleSelectCountry}
          selectedCountry={selectedCountry} 
        />
      </Canvas>
      <Loader 
        containerStyles={{ background: '#000' }} 
        innerStyles={{ background: '#333', width: '200px' }} 
        barStyles={{ background: '#00ffff' }}
      />

      {/* Top UI Overlay */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start pointer-events-none z-40">
        <div className="pointer-events-auto flex flex-col gap-2">
          <h1 className="text-3xl md:text-5xl font-bold font-[Orbitron] tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 drop-shadow-[0_0_15px_rgba(0,255,255,0.5)]">
            GAIA
          </h1>
          <p className="text-xs text-cyan-500/70 tracking-[0.3em] uppercase">Planetary Explorer System</p>
        </div>

        <div className="pointer-events-auto relative">
           <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 transition-all focus-within:bg-black/80 focus-within:border-cyan-500/50 w-48 md:w-80">
              <Search size={18} className="text-cyan-400" />
              <input 
                type="text"
                placeholder="Locate sector..."
                className="bg-transparent border-none outline-none text-sm w-full text-white placeholder-gray-500 font-mono"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
           </div>

           {/* Search Dropdown */}
           {filteredCountries.length > 0 && (
              <div className="absolute top-full mt-2 left-0 w-full bg-black/90 border border-white/20 rounded-xl overflow-hidden backdrop-blur-xl shadow-2xl">
                {filteredCountries.map(c => (
                  <button 
                    key={c.cca3}
                    onClick={() => handleSelectCountry(c)}
                    className="w-full text-left px-4 py-3 hover:bg-cyan-900/30 flex items-center gap-3 border-b border-white/5 last:border-0 transition-colors"
                  >
                    <img src={c.flags.svg} alt="flag" className="w-6 h-4 object-cover rounded shadow-sm" />
                    <span className="text-sm font-medium">{c.name.common}</span>
                  </button>
                ))}
              </div>
           )}
        </div>
      </div>

      {/* Bottom Bar Controls */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 pointer-events-auto z-30">
        <button 
           className="p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-cyan-500/20 hover:border-cyan-400/50 transition-all group"
           onClick={handleShare}
           title="Share Link"
        >
          <Share2 size={20} className="text-gray-300 group-hover:text-cyan-300" />
        </button>
        <button 
           className="p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-cyan-500/20 hover:border-cyan-400/50 transition-all group"
           onClick={() => setShowInfo(true)}
           title="System Info"
        >
           <Info size={20} className="text-gray-300 group-hover:text-cyan-300" />
        </button>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-cyan-500/20 text-cyan-200 px-6 py-2 rounded-full backdrop-blur-md border border-cyan-500/30 z-50 text-sm font-mono tracking-wide shadow-[0_0_15px_rgba(0,255,255,0.2)]"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Modal */}
      <AnimatePresence>
        {showInfo && (
           <div className="absolute inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div 
                 initial={{ scale: 0.9, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 exit={{ scale: 0.9, opacity: 0 }}
                 className="bg-[#0a0a14] border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
              >
                 {/* Decorative bg elements */}
                 <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                 
                 <button 
                   onClick={() => setShowInfo(false)}
                   className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                 >
                   <X size={20} />
                 </button>

                 <h2 className="text-2xl font-[Orbitron] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-4">GAIA SYSTEM</h2>
                 
                 <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
                   <p>
                     Gaia is an interactive 3D planetary explorer designed to demonstrate the power of 
                     <span className="text-cyan-300"> React Three Fiber</span> and 
                     <span className="text-cyan-300"> Gemini AI</span>.
                   </p>
                   <p>
                     Navigate the globe, select nations, and instantly retrieve cultural, geographical, and travel intelligence synthesized by artificial intelligence.
                   </p>
                   
                   <div className="pt-4 border-t border-white/10 flex flex-col gap-2">
                      <div className="flex justify-between">
                         <span className="text-gray-500">Version</span>
                         <span className="font-mono text-cyan-400">1.2.0 (Stable)</span>
                      </div>
                      <div className="flex justify-between">
                         <span className="text-gray-500">Data Source</span>
                         <span className="font-mono text-cyan-400">Gemini 2.5 Flash</span>
                      </div>
                   </div>
                 </div>
              </motion.div>
           </div>
        )}
      </AnimatePresence>

      {/* Country Info Panel */}
      <InfoPanel 
        country={selectedCountry} 
        isLoadingAI={loadingAi} 
        onClose={() => setSelectedCountry(null)} 
      />

    </div>
  );
};

export default App;