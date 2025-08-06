import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../engine/gameStore';
import { AtmosphereType } from '../../types/game';

interface AtmosphereManagerProps {
  children: React.ReactNode;
}

interface AtmosphereEffects {
  particles: boolean;
  distortion: boolean;
  colorShift: boolean;
  soundscape: boolean;
  visualNoise: boolean;
}

const AtmosphereManager: React.FC<AtmosphereManagerProps> = ({ children }) => {
  const { atmosphere, currentLevel } = useGameStore();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [effects, setEffects] = useState<AtmosphereEffects>({
    particles: false,
    distortion: false,
    colorShift: false,
    soundscape: false,
    visualNoise: false
  });
  const [previousAtmosphere, setPreviousAtmosphere] = useState<AtmosphereType>(atmosphere);

  // Handle atmosphere transitions
  useEffect(() => {
    if (atmosphere !== previousAtmosphere) {
      setIsTransitioning(true);
      
      // Transition duration based on atmosphere change intensity
      const transitionDuration = getTransitionDuration(previousAtmosphere, atmosphere);
      
      setTimeout(() => {
        setPreviousAtmosphere(atmosphere);
        setIsTransitioning(false);
      }, transitionDuration);
    }
  }, [atmosphere, previousAtmosphere]);

  // Update effects based on atmosphere
  useEffect(() => {
    const atmosphereEffects = {
      cheerful: {
        particles: true,
        distortion: false,
        colorShift: false,
        soundscape: false,
        visualNoise: false
      },
      neutral: {
        particles: false,
        distortion: false,
        colorShift: false,
        soundscape: false,
        visualNoise: false
      },
      unsettling: {
        particles: true,
        distortion: false,
        colorShift: true,
        soundscape: true,
        visualNoise: false
      },
      dark_transition: {
        particles: true,
        distortion: true,
        colorShift: true,
        soundscape: true,
        visualNoise: true
      },
      horror: {
        particles: true,
        distortion: true,
        colorShift: true,
        soundscape: true,
        visualNoise: true
      }
    };
    
    setEffects(atmosphereEffects[atmosphere]);
  }, [atmosphere]);

  const getTransitionDuration = (from: AtmosphereType, to: AtmosphereType): number => {
    const intensityMap = {
      cheerful: 0,
      neutral: 1,
      unsettling: 2,
      dark_transition: 3,
      horror: 4
    };
    
    const intensityDiff = Math.abs(intensityMap[to] - intensityMap[from]);
    return 1000 + (intensityDiff * 500); // Base 1s + 0.5s per intensity level
  };

  const getAtmosphereCSS = (atmosphere: AtmosphereType) => {
    const styles = {
      cheerful: {
        filter: 'brightness(1.1) saturate(1.2) hue-rotate(0deg)',
        background: 'radial-gradient(circle at 50% 50%, rgba(255, 245, 245, 0.1) 0%, transparent 70%)',
        transition: 'all 2s ease-in-out'
      },
      neutral: {
        filter: 'brightness(1) saturate(1) hue-rotate(0deg)',
        background: 'transparent',
        transition: 'all 1.5s ease-in-out'
      },
      unsettling: {
        filter: 'brightness(0.95) saturate(1.1) hue-rotate(10deg) contrast(1.05)',
        background: 'radial-gradient(circle at 30% 70%, rgba(214, 158, 46, 0.1) 0%, transparent 60%)',
        transition: 'all 2s ease-in-out'
      },
      dark_transition: {
        filter: 'brightness(0.8) saturate(0.9) hue-rotate(-10deg) contrast(1.2)',
        background: 'radial-gradient(circle at 70% 30%, rgba(45, 55, 72, 0.2) 0%, transparent 50%)',
        transition: 'all 3s ease-in-out'
      },
      horror: {
        filter: 'brightness(0.6) saturate(0.7) hue-rotate(-20deg) contrast(1.4)',
        background: 'radial-gradient(circle at 50% 50%, rgba(139, 0, 0, 0.15) 0%, rgba(0, 0, 0, 0.3) 70%)',
        transition: 'all 4s ease-in-out'
      }
    };
    
    return styles[atmosphere];
  };

  const renderParticleSystem = () => {
    if (!effects.particles) return null;
    
    const particleCount = {
      cheerful: 15,
      neutral: 0,
      unsettling: 20,
      dark_transition: 25,
      horror: 30
    }[atmosphere];
    
    const particleColor = {
      cheerful: '#FED7D7',
      neutral: '#E2E8F0',
      unsettling: '#D69E2E',
      dark_transition: '#4A5568',
      horror: '#8B0000'
    }[atmosphere];
    
    return (
      <div className="fixed inset-0 pointer-events-none z-0">
        {Array.from({ length: particleCount }).map((_, i) => (
          <motion.div
            key={`${atmosphere}-particle-${i}`}
            className="absolute rounded-full"
            style={{
              width: `${Math.random() * 6 + 2}px`,
              height: `${Math.random() * 6 + 2}px`,
              backgroundColor: particleColor,
              opacity: Math.random() * 0.6 + 0.1,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, Math.random() * 20 - 10, 0],
              opacity: [0.1, 0.6, 0.1],
              scale: [0.5, 1.2, 0.5]
            }}
            transition={{
              duration: 3 + Math.random() * 4,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: Math.random() * 2
            }}
          />
        ))}
      </div>
    );
  };

  const renderVisualNoise = () => {
    if (!effects.visualNoise) return null;
    
    const noiseIntensity = {
      dark_transition: 0.02,
      horror: 0.05
    }[atmosphere] || 0;
    
    return (
      <div 
        className="fixed inset-0 pointer-events-none z-10"
        style={{
          background: `
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 2px,
              rgba(255, 255, 255, ${noiseIntensity}) 2px,
              rgba(255, 255, 255, ${noiseIntensity}) 4px
            ),
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(0, 0, 0, ${noiseIntensity}) 2px,
              rgba(0, 0, 0, ${noiseIntensity}) 4px
            )
          `,
          animation: atmosphere === 'horror' ? 'flicker 0.15s infinite linear' : 'none'
        }}
      />
    );
  };

  const renderDistortionEffects = () => {
    if (!effects.distortion) return null;
    
    return (
      <div className="fixed inset-0 pointer-events-none z-5">
        {atmosphere === 'horror' && (
          <>
            {/* Pulsing red overlay */}
            <motion.div
              className="absolute inset-0 bg-red-900"
              animate={{
                opacity: [0, 0.1, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />
            
            {/* Creeping shadows */}
            <motion.div
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), transparent 20%, rgba(0,0,0,0.3) 80%)'
              }}
              animate={{
                opacity: [0.3, 0.7, 0.3]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />
          </>
        )}
        
        {atmosphere === 'dark_transition' && (
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(45deg, transparent 30%, rgba(0,0,0,0.1) 50%, transparent 70%)'
            }}
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%', '0% 0%']
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'linear'
            }}
          />
        )}
      </div>
    );
  };

  const renderTransitionOverlay = () => {
    if (!isTransitioning) return null;
    
    return (
      <motion.div
        className="fixed inset-0 z-50 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          background: atmosphere === 'horror' ? 
            'radial-gradient(circle, rgba(0,0,0,0.8) 0%, rgba(139,0,0,0.3) 100%)' :
            atmosphere === 'dark_transition' ?
            'radial-gradient(circle, rgba(0,0,0,0.6) 0%, rgba(45,55,72,0.2) 100%)' :
            'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 100%)'
        }}
      >
        <div className="flex items-center justify-center h-full">
          <motion.div
            className="text-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
          >
            <div 
              className="text-2xl font-bold"
              style={{
                color: atmosphere === 'horror' || atmosphere === 'dark_transition' ? '#E2E8F0' : '#1A202C',
                textShadow: atmosphere === 'horror' ? '0 0 10px rgba(139, 0, 0, 0.8)' : 'none'
              }}
            >
              {atmosphere === 'horror' ? 'DESCENDING INTO DARKNESS...' :
               atmosphere === 'dark_transition' ? 'The shadows grow longer...' :
               atmosphere === 'unsettling' ? 'Something feels different...' :
               'Atmosphere shifting...'}
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  };

  const atmosphereStyle = getAtmosphereCSS(atmosphere);

  return (
    <div 
      className="relative min-h-screen"
      style={{
        filter: atmosphereStyle.filter,
        transition: atmosphereStyle.transition
      }}
    >
      {/* Base atmosphere overlay */}
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: atmosphereStyle.background,
          transition: atmosphereStyle.transition
        }}
      />
      
      {/* Particle system */}
      {renderParticleSystem()}
      
      {/* Visual noise */}
      {renderVisualNoise()}
      
      {/* Distortion effects */}
      {renderDistortionEffects()}
      
      {/* Main content */}
      <div className="relative z-20">
        {children}
      </div>
      
      {/* Transition overlay */}
      <AnimatePresence>
        {renderTransitionOverlay()}
      </AnimatePresence>
      
      {/* CSS animations for horror effects */}
      <style>{`
        @keyframes flicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        
        @keyframes pulse-red {
          0%, 100% { background-color: rgba(139, 0, 0, 0); }
          50% { background-color: rgba(139, 0, 0, 0.1); }
        }
        
        .horror-flicker {
          animation: flicker 0.15s infinite linear;
        }
        
        .horror-pulse {
          animation: pulse-red 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default AtmosphereManager;