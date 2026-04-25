import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  getDocs,
} from 'firebase/firestore';
import { db } from './lib/firebase';
import { Song, LATIN_GENRES } from './types';
import { Play, Pause, SkipBack, SkipForward, Volume2, Search, Home, Library, PlusSquare, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { seedLibrary } from './lib/seeder';

// --- Components ---

const Sidebar = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) => (
  <div className="w-60 bg-black/20 border-r border-white/5 p-6 flex flex-col gap-8">
    <div className="flex items-center gap-2 text-white font-bold text-xl tracking-tight uppercase">
      <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
        <Music size={18} className="text-black" />
      </div>
      Symphonia <span className="text-emerald-500 text-[10px] align-top ml-1">LATAM</span>
    </div>
    
    <nav className="flex flex-col gap-2">
      <h3 className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2">Menú Principal</h3>
      <button 
        onClick={() => setActiveTab('home')}
        className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all text-sm font-medium ${activeTab === 'home' ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}
      >
        <Home size={18} /> <span>Inicio</span>
      </button>
      <button 
        onClick={() => setActiveTab('search')}
        className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all text-sm font-medium ${activeTab === 'search' ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}
      >
        <Search size={18} /> <span>Buscar</span>
      </button>
      <button 
        onClick={() => setActiveTab('library')}
        className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all text-sm font-medium ${activeTab === 'library' ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}
      >
        <Library size={18} /> <span>Tu Biblioteca</span>
      </button>
    </nav>

    <div className="flex flex-col gap-1 pt-4 border-t border-white/5">
      <h3 className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2">Tu Música</h3>
      <button className="flex items-center gap-3 text-sm font-medium text-zinc-400 px-3 py-2 rounded-md hover:bg-white/5 hover:text-white transition-all">
        <PlusSquare size={18} />
        <span>Crear lista</span>
      </button>
      <button className="flex items-center gap-3 text-sm font-medium text-zinc-400 px-3 py-2 rounded-md hover:bg-white/5 hover:text-white transition-all">
        <Music size={18} className="text-emerald-500" />
        <span>Tus me gusta</span>
      </button>
    </div>

    <section className="mt-auto">
      <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-600/20 to-blue-600/20 border border-white/10 shadow-lg">
        <p className="text-xs font-semibold mb-1 text-emerald-400">Autoplay Activo</p>
        <p className="text-[10px] text-zinc-400 leading-tight">La próxima canción se reproducirá basada en tus gustos.</p>
      </div>
    </section>
  </div>
);

const Player = ({ 
  currentSong, 
  isPlaying, 
  onTogglePlay, 
  onNext, 
  onPrevious,
  progress 
}: { 
  currentSong: Song | null, 
  isPlaying: boolean, 
  onTogglePlay: () => void,
  onNext: () => void,
  onPrevious: () => void,
  progress: number
}) => (
  <div className="h-24 bg-[#09090b] border-t border-white/5 px-6 flex items-center justify-between sticky bottom-0 z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
    <div className="flex items-center gap-4 w-1/3">
      {currentSong ? (
        <>
          <div className="w-14 h-14 bg-emerald-500/20 rounded-md border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl">
            <img src={currentSong.artworkUrl} alt={currentSong.title} className="w-full h-full object-cover transition-all" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-white text-sm font-bold hover:underline cursor-pointer truncate">{currentSong.title}</span>
            <span className="text-zinc-500 text-xs hover:underline cursor-pointer truncate">{currentSong.author}</span>
          </div>
          <button className="text-emerald-500 hover:scale-110 transition-transform ml-2">
            <Music size={16} />
          </button>
        </>
      ) : (
        <div className="w-14 h-14 bg-zinc-900 border border-white/5 rounded-md animate-pulse" />
      )}
    </div>

    <div className="flex flex-col items-center gap-2 w-1/3">
      <div className="flex items-center gap-6">
        <button className="text-zinc-500 hover:text-white transition-colors" title="Shuffle"><Music size={16} /></button>
        <button onClick={onPrevious} className="text-white hover:text-emerald-400 transition-colors"><SkipBack size={20} fill="currentColor" /></button>
        <button 
          onClick={onTogglePlay}
          className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
        >
          {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} className="ml-1" fill="currentColor" />}
        </button>
        <button onClick={onNext} className="text-white hover:text-emerald-400 transition-colors"><SkipForward size={20} fill="currentColor" /></button>
        <button className="text-emerald-500" title="Replay"><Music size={16} /></button>
      </div>
      <div className="w-full flex items-center gap-2">
        <span className="text-[10px] text-zinc-500 font-mono">0:{Math.floor(progress).toString().padStart(2, '0')}</span>
        <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden relative group cursor-pointer">
          <div 
            className="absolute top-0 left-0 h-full bg-white transition-all duration-300" 
            style={{ width: `${(progress / 30) * 100}%` }}
          />
        </div>
        <span className="text-[10px] text-zinc-500 font-mono">0:30</span>
      </div>
    </div>

    <div className="w-1/3 flex justify-end items-center gap-3">
      <Volume2 size={18} className="text-zinc-500" />
      <div className="w-24 h-1 bg-zinc-800 rounded-full overflow-hidden">
        <div className="h-full w-2/3 bg-emerald-500" />
      </div>
    </div>
  </div>
);

interface SongCardProps {
  song: Song;
  isActive: boolean;
  onClick: () => void;
  key?: React.Key;
}

const SongCard = ({ song, isActive, onClick }: SongCardProps) => (
  <motion.div 
    whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
    onClick={onClick}
    className={`p-4 rounded-xl cursor-pointer transition-all group ${isActive ? 'bg-emerald-500/10 ring-1 ring-emerald-500/30' : ''}`}
  >
    <div className="relative aspect-square mb-4 overflow-hidden rounded-lg shadow-[0_15px_35px_rgba(0,0,0,0.5)]">
      <img src={song.artworkUrl} alt={song.title} className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110" />
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
        <div className="w-12 h-12 bg-emerald-500 text-black rounded-full flex items-center justify-center shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
          <Play fill="currentColor" size={24} className="ml-1" />
        </div>
      </div>
    </div>
    <h3 className="text-sm font-bold text-white truncate mb-1 leading-tight">{song.title}</h3>
    <p className="text-xs text-zinc-500 truncate font-medium">{song.author}</p>
  </motion.div>
);

// --- Main App ---

export default function App() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [progress, setProgress] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressInterval = useRef<number | null>(null);

  useEffect(() => {
    getDocs(collection(db, 'songs')).then(snap => {
      if (snap.empty) seedLibrary();
    });
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'songs'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Song));
      setSongs(docs);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (isPlaying) {
      progressInterval.current = window.setInterval(() => {
        if (audioRef.current) {
          setProgress(audioRef.current.currentTime);
        }
      }, 500);
    } else {
      if (progressInterval.current) clearInterval(progressInterval.current);
    }
    return () => { if (progressInterval.current) clearInterval(progressInterval.current); };
  }, [isPlaying]);

  const handlePlaySong = (song: Song) => {
    if (currentSong?.id === song.id) {
      if (isPlaying) pause();
      else play();
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    setCurrentSong(song);
    const audio = new Audio(song.previewUrl);
    audio.addEventListener('ended', () => handleNext());
    audioRef.current = audio;
    play();

    // Log history for recommendations (Guest mode)
    addDoc(collection(db, 'history'), {
      userId: 'guest',
      songId: song.id,
      genre: song.genre,
      timestamp: serverTimestamp()
    });
  };

  const play = () => {
    audioRef.current?.play();
    setIsPlaying(true);
  };

  const pause = () => {
    audioRef.current?.pause();
    setIsPlaying(false);
  };

  const handleNext = async () => {
    if (!currentSong || songs.length === 0) return;
    
    // Logic: Reproduce the next based on taste (genre)
    // For now: Simple filter by same genre or random if none
    const sameGenreSongs = songs.filter(s => s.genre === currentSong.genre && s.id !== currentSong.id);
    const nextSong = sameGenreSongs.length > 0 
      ? sameGenreSongs[Math.floor(Math.random() * sameGenreSongs.length)]
      : songs[Math.floor(Math.random() * songs.length)];
    
    handlePlaySong(nextSong);
  };

  const handlePrevious = () => {
    if (!currentSong || songs.length === 0) return;
    const currentIndex = songs.findIndex(s => s.id === currentSong.id);
    const prevIndex = (currentIndex - 1 + songs.length) % songs.length;
    handlePlaySong(songs[prevIndex]);
  };

  return (
    <div className="h-screen flex flex-col bg-zinc-950 text-white font-sans overflow-hidden">
      <div className="flex flex-grow overflow-hidden">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <main className="flex-grow overflow-y-auto bg-gradient-to-b from-zinc-900 to-zinc-950 relative">
          <header className="sticky top-0 h-16 px-6 flex items-center justify-between z-40 bg-black/40 backdrop-blur-md border-b border-white/5">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <button className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"><SkipBack size={16} /></button>
                <button className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors opacity-50"><SkipForward size={16} /></button>
              </div>
              <nav className="hidden md:flex gap-6 text-xs font-bold uppercase tracking-widest text-zinc-500">
                <button className="hover:text-white transition-colors">Descubrir</button>
                <button className="text-emerald-500 border-b-2 border-emerald-500 pb-1">Playlists</button>
                <button className="hover:text-white transition-colors">Radio</button>
              </nav>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="text-[10px] uppercase font-black bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/10 transition-all tracking-widest text-[#e4e4e7]">Invitado</button>
            </div>
          </header>

          <div className="p-8">
            <div className="mb-12">
              <h1 className="text-5xl font-black mb-2 tracking-tighter uppercase">Playlist <span className="font-serif italic text-emerald-500 font-normal normal-case text-4xl ml-2">Essential</span></h1>
              <p className="text-zinc-500 text-sm font-medium">3 canciones curadas por género para tu biblioteca de Ritmo Latino.</p>
            </div>
            
            <div className="space-y-16">
              {LATIN_GENRES.map(genre => {
                const genreSongs = songs.filter(s => s.genre === genre);
                if (genreSongs.length === 0) return null;
                
                return (
                  <section key={genre}>
                    <div className="flex items-end justify-between mb-8 border-b border-white/5 pb-4">
                      <h2 className="text-3xl font-black tracking-tighter uppercase leading-none">{genre}</h2>
                      <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] hover:underline cursor-pointer italic">Ver catálogo completo</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-8">
                      {genreSongs.map(song => (
                        <SongCard 
                          key={song.id} 
                          song={song} 
                          isActive={currentSong?.id === song.id}
                          onClick={() => handlePlaySong(song)}
                        />
                      ))}
                    </div>
                  </section>
                )
              })}
            </div>
          </div>
          
          <div className="h-24" /> {/* Spacer */}
        </main>
      </div>

      <Player 
        currentSong={currentSong}
        isPlaying={isPlaying}
        onTogglePlay={isPlaying ? pause : play}
        onNext={handleNext}
        onPrevious={handlePrevious}
        progress={progress}
      />
    </div>
  );
}
