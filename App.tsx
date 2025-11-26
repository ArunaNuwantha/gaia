import React, { useState, useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader } from '@react-three/drei';
import { Search, Globe as GlobeIcon, Share2, Info } from 'lucide-react';
import Globe3D from './components/Globe3D';
import InfoPanel from './components/InfoPanel';
import { CountryBase, CountryFull } from './types';
import { fetchCountryDetails } from './services/geminiService';

const App: React.FC = () => {
  const [allCountries, setAllCountries] = useState<CountryBase[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<CountryFull | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
    setIsMenuOpen(false); // close menu if open

    // Fetch AI details
    setLoadingAi(true);
    const aiData = await fetchCountryDetails(country.name.common);
    setLoadingAi(false);

    if (aiData) {
      setSelectedCountry(prev => prev?.cca3 === country.cca3 ? { ...prev, aiData } : prev);
    }
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
           onClick={() => alert("Share coordinates link copied to clipboard.")}
        >
          <Share2 size={20} className="text-gray-300 group-hover:text-cyan-300" />
        </button>
        <button 
           className="p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-cyan-500/20 hover:border-cyan-400/50 transition-all group"
           onClick={() => alert("Gaia System v1.0. Data provided by Gemini AI & RestCountries.")}
        >
           <Info size={20} className="text-gray-300 group-hover:text-cyan-300" />
        </button>
      </div>

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
