import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export const SplashAnimation: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  // We set a backup timeout in case the video fails to load or onEnded doesn't fire
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 800); // Wait for exit animation to complete
    }, 9500); 
    return () => clearTimeout(timer);
  }, [onComplete]);

  const handleVideoEnded = () => {
    setIsVisible(false);
    setTimeout(onComplete, 800);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950 overflow-hidden"
        >
          {/* Ambient Background Video (Blurred) to fill horizontal space */}
          <video 
            src="/splash.mp4" 
            autoPlay 
            muted 
            playsInline
            onError={(e) => {
               (e.target as HTMLVideoElement).style.display = 'none';
            }}
            className="absolute inset-0 w-full h-full object-cover opacity-40 blur-[60px] scale-110 saturate-150"
          />

          {/* Main Focused Video (Maintains aspect ratio) */}
          <div className="relative z-10 w-full h-full max-h-[90vh] p-4 flex items-center justify-center drop-shadow-2xl">
             <motion.video 
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                src="/splash.mp4" 
                autoPlay 
                muted 
                playsInline
                onEnded={handleVideoEnded}
                onError={handleVideoEnded}
                className="w-auto h-full max-w-full object-contain rounded-2xl ring-1 ring-white/10 shadow-[0_0_80px_rgba(234,179,8,0.15)]"
             />
          </div>

          {/* Loading Indicator at Bottom */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center"
          >
             <div className="w-48 h-1 bg-zinc-900/80 rounded-full overflow-hidden backdrop-blur-sm ring-1 ring-white/5">
                <motion.div 
                  className="h-full bg-yellow-500"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 8, ease: "easeInOut" }}
                />
             </div>
             <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-3 drop-shadow-sm">
               Loading KOBE Core...
             </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
