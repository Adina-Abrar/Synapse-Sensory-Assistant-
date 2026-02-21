
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ConnectionStatus } from './types';
import { GeminiLiveSession } from './services/gemini-live';

const App: React.FC = () => {
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [safetyAlert, setSafetyAlert] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<GeminiLiveSession | null>(null);

  const apiKey = process.env.API_KEY || "";

  const handleTranscription = useCallback((text: string, role: 'user' | 'assistant') => {
    if (role === 'assistant') {
      const upperText = text.toUpperCase();
      if (upperText.includes("STOP") || upperText.includes("CAUTION")) {
        setSafetyAlert(text);
        setTimeout(() => setSafetyAlert(null), 6000);
      }
    }
  }, []);

  const handleStart = async () => {
    if (!videoRef.current || !canvasRef.current || !apiKey) {
      setError("SYSTEM: HARDWARE OR AUTH FAILURE.");
      return;
    }

    try {
      setStatus(ConnectionStatus.CONNECTING);
      setError(null);
      
      const session = new GeminiLiveSession(apiKey);
      sessionRef.current = session;

      await session.start(videoRef.current, canvasRef.current, {
        onTranscription: handleTranscription,
        onStatusChange: (s) => setStatus(s as ConnectionStatus),
        onError: (e) => setError(e),
      });

    } catch (err) {
      setError("LINK FAILURE: ACCESS DENIED.");
      setStatus(ConnectionStatus.ERROR);
    }
  };

  const handleStop = () => {
    if (sessionRef.current) {
      sessionRef.current.stop();
      sessionRef.current = null;
    }
    setStatus(ConnectionStatus.IDLE);
    setSafetyAlert(null);
  };

  const toggleConnection = () => {
    if (status === ConnectionStatus.ACTIVE) {
      handleStop();
    } else {
      handleStart();
    }
  };

  const isActive = status === ConnectionStatus.ACTIVE;

  return (
    <div className="h-screen w-screen bg-black text-white flex flex-col relative select-none overflow-hidden" 
         onClick={isActive ? toggleConnection : undefined}>
      {/* Background Vision Feed - Full Color */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video 
          ref={videoRef} 
          className={`w-full h-full object-cover video-filter transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-20'}`}
          muted
          playsInline
        />
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Interface Overlays */}
      <header className={`relative z-10 p-10 flex justify-between items-start pointer-events-none transition-opacity duration-500 ${isActive ? 'opacity-50' : 'opacity-100'}`}>
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 bg-[#0c0c0c] border border-zinc-800 flex items-center justify-center rounded-xl shadow-inner">
             <div className="w-2 h-2 bg-zinc-600 rotate-45"></div>
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-widest leading-none">SYNAPSE</h1>
            <p className="text-[11px] text-zinc-500 font-bold tracking-[0.4em] mt-2 uppercase opacity-80">SENSORY NODE</p>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-1">
          <div className={`status-dot ${isActive ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,1)]' : 'bg-zinc-700'}`}></div>
          <span className="text-[11px] font-black tracking-[0.4em] text-zinc-500 uppercase">
            {isActive ? 'LINKED' : 'STANDBY'}
          </span>
        </div>
      </header>

      {/* Central Node Interaction - Hidden when active to avoid interrupting capture */}
      <main className={`relative z-10 flex-1 flex flex-col items-center justify-center -mt-10 transition-all duration-700 ${isActive ? 'active-state-node' : 'opacity-100'}`}>
        <button 
          onClick={toggleConnection}
          className="group relative flex flex-col items-center gap-16 transition-transform duration-500 active:scale-95"
          aria-label={isActive ? "Disconnect Node" : "Link Node"}
        >
          {/* External Housing */}
          <div className="w-64 h-64 squircle border border-white/5 flex items-center justify-center transition-all duration-700 relative">
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-10 transition-opacity rounded-[64px]"></div>
            
            {/* 3D Diamond Node */}
            <div className={`w-14 h-14 transition-all duration-500 diamond-3d
              ${isActive ? 'diamond-glow-active' : 'opacity-40 group-hover:opacity-100'}
            `}></div>
          </div>

          {/* Prompt Text */}
          <div className="text-center">
            <h2 className={`text-xl font-black tracking-[0.8em] transition-all duration-500 uppercase
              ${isActive ? 'text-blue-500 scale-110' : 'text-white'}
            `}>
              {isActive ? 'LINKED' : status === ConnectionStatus.CONNECTING ? 'LINKING' : 'TAP TO LINK'}
            </h2>
          </div>
        </button>
      </main>

      {/* Dynamic Safety Toast - Always visible even in active mode */}
      {safetyAlert && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-600 text-white px-10 py-5 rounded-2xl font-black text-2xl tracking-widest shadow-2xl animate-pulse border-2 border-red-400 z-50">
          {safetyAlert.toUpperCase()}
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 text-red-500 text-xs font-black tracking-widest uppercase bg-black/80 px-6 py-3 border border-red-900/40 rounded-full backdrop-blur-md z-20">
          {error}
        </div>
      )}

      {/* Interaction Icon Footer - Hidden when active */}
      <footer className={`relative z-10 p-16 flex flex-col items-center transition-all duration-500 ${isActive ? 'opacity-0 translate-y-10' : 'opacity-100 translate-y-0 pointer-events-none'}`}>
        <div className="w-16 h-16 bg-zinc-900/40 border border-white/5 rounded-2xl flex items-center justify-center backdrop-blur-sm">
           <svg className="w-8 h-8 text-white/40" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
           </svg>
        </div>
        <div className="mt-8 flex gap-2">
           <div className="w-1.5 h-1.5 bg-zinc-800 rounded-full"></div>
           <div className="w-1.5 h-1.5 bg-zinc-800 rounded-full"></div>
           <div className="w-1.5 h-1.5 bg-zinc-800 rounded-full"></div>
        </div>
      </footer>

      {/* Stop hint for when interface is hidden */}
      {isActive && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-30 text-[9px] font-bold tracking-widest uppercase pointer-events-none">
          TAP ANYWHERE TO UNLINK
        </div>
      )}

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default App;
