import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../game/engine/gameStore';
import { useAudio } from '../game/audio/useAudio';
import { AtmosphereType } from '../types/game';

interface MainMenuProps {
  onStartGame: () => void;
  onShowSettings?: () => void;
  onShowCredits?: () => void;
  onEnterHome?: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ 
  onStartGame, 
  onShowSettings, 
  onShowCredits, 
  onEnterHome,
}) => {
  const { 
    currentLevel, 
    atmosphere, 
    playerProgress, 
    resetGame 
  } = useGameStore();
  const { playClick, playHover } = useAudio();
  
  const [showContinueOption, setShowContinueOption] = useState(false);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [backgroundParticles, setBackgroundParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    opacity: number;
    speed: number;
  }>>([]);

  // Check if there's a saved game
  useEffect(() => {
    setShowContinueOption(currentLevel > 1 || playerProgress.completedLevels.length > 0);
  }, [currentLevel, playerProgress]);

  // Generate background particles based on atmosphere
  useEffect(() => {
    const particleCount = atmosphere === 'horror' ? 20 : 
                         atmosphere === 'dark_transition' ? 15 : 
                         atmosphere === 'unsettling' ? 10 : 5;
    
    const particles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * (atmosphere === 'horror' ? 8 : 4) + 2,
      opacity: Math.random() * 0.5 + 0.1,
      speed: Math.random() * 2 + 1
    }));
    
    setBackgroundParticles(particles);
  }, [atmosphere]);

  const getBackgroundStyle = (atmosphere: AtmosphereType) => {
    const backgrounds = {
      cheerful: {
        background: 'linear-gradient(135deg, #FFF5F5 0%, #FED7D7 25%, #FBB6CE 50%, #E6FFFA 75%, #B4E5FF 100%)',
        filter: 'brightness(1.1) saturate(1.2)'
      },
      neutral: {
        background: 'linear-gradient(135deg, #F7FAFC 0%, #EDF2F7 50%, #E2E8F0 100%)',
        filter: 'brightness(1)'
      },
      unsettling: {
        background: 'linear-gradient(135deg, #FDF6E3 0%, #FAF089 30%, #D69E2E 70%, #B7791F 100%)',
        filter: 'brightness(0.9) contrast(1.1) sepia(0.2)'
      },
      dark_transition: {
        background: 'linear-gradient(135deg, #2D3748 0%, #1A202C 40%, #171923 70%, #0F0F0F 100%)',
        filter: 'brightness(0.8) contrast(1.3)'
      },
      horror: {
        background: 'linear-gradient(135deg, #000000 0%, #1A1A2E 20%, #2C1810 40%, #0F0F0F 60%, #000000 100%)',
        filter: 'brightness(0.6) contrast(1.5) saturate(0.7)'
      }
    };
    
    return backgrounds[atmosphere];
  };

  const getTextColor = (atmosphere: AtmosphereType) => {
    return atmosphere === 'dark_transition' || atmosphere === 'horror' ? '#E2E8F0' : '#1A202C';
  };

  const getButtonStyle = (buttonType: string, isHovered: boolean) => {
    const baseStyles = {
      cheerful: {
        background: isHovered ? '#FED7D7' : '#F7FAFC',
        border: '#E2E8F0',
        color: '#1A202C',
        shadow: '0 4px 15px rgba(0,0,0,0.1)'
      },
      neutral: {
        background: isHovered ? '#EDF2F7' : '#F7FAFC',
        border: '#CBD5E0',
        color: '#2D3748',
        shadow: '0 4px 15px rgba(0,0,0,0.1)'
      },
      unsettling: {
        background: isHovered ? '#FAF089' : '#FDF6E3',
        border: '#D69E2E',
        color: '#744210',
        shadow: '0 4px 15px rgba(214, 158, 46, 0.3)'
      },
      dark_transition: {
        background: isHovered ? '#4A5568' : '#2D3748',
        border: '#718096',
        color: '#E2E8F0',
        shadow: '0 4px 20px rgba(0,0,0,0.5)'
      },
      horror: {
        background: isHovered ? '#2C1810' : '#1A1A2E',
        border: '#8B0000',
        color: '#E2E8F0',
        shadow: isHovered ? '0 0 25px rgba(139, 0, 0, 0.6)' : '0 4px 20px rgba(0,0,0,0.8)'
      }
    };
    
    const style = baseStyles[atmosphere];
    
    // Special styling for different button types
    if (buttonType === 'start' && atmosphere === 'horror') {
      return {
        ...style,
        background: isHovered ? '#8B0000' : '#2C1810',
        shadow: isHovered ? '0 0 30px rgba(139, 0, 0, 0.8), inset 0 0 10px rgba(139, 0, 0, 0.3)' : style.shadow
      };
    }
    
    return style;
  };

  const getGameTitle = () => {
    const titles = {
      cheerful: 'Puzzle Paradise',
      neutral: 'Mind Bender',
      unsettling: 'The Shifting Maze',
      dark_transition: 'Echoes in the Dark',
      horror: 'DESCENT INTO MADNESS'
    };
    
    return titles[atmosphere];
  };

  const getGameSubtitle = () => {
    const subtitles = {
      cheerful: 'A delightful puzzle adventure awaits!',
      neutral: 'Challenge your mind with engaging puzzles',
      unsettling: 'Something feels... different about these puzzles',
      dark_transition: 'The deeper you go, the darker it becomes',
      horror: 'Every puzzle brings you closer to the abyss'
    };
    
    return subtitles[atmosphere];
  };

  const backgroundStyle = getBackgroundStyle(atmosphere);
  const textColor = getTextColor(atmosphere);

  return (
    <div 
      className="min-h-screen flex items-center justify-center relative overflow-hidden transition-all duration-1000"
      style={{
        background: backgroundStyle.background,
        filter: backgroundStyle.filter
      }}
    >
      {/* Animated background particles */}
      <div className="absolute inset-0 pointer-events-none">
        {backgroundParticles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              backgroundColor: atmosphere === 'horror' ? '#8B0000' : 
                             atmosphere === 'dark_transition' ? '#4A5568' : 
                             atmosphere === 'unsettling' ? '#D69E2E' : '#CBD5E0',
              opacity: particle.opacity,
              left: `${particle.x}%`,
              top: `${particle.y}%`
            }}
            animate={{
              y: [0, -20, 0],
              x: [0, Math.random() * 10 - 5, 0],
              opacity: [particle.opacity, particle.opacity * 0.5, particle.opacity]
            }}
            transition={{
              duration: particle.speed + 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        ))}
      </div>

      {/* Horror-specific atmospheric effects */}
      {atmosphere === 'horror' && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-black opacity-30 animate-pulse" />
          <div className="absolute top-0 left-0 w-full h-full">
            {Array.from({ length: 3 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute bg-red-900 opacity-20 rounded-full"
                style={{
                  width: '200px',
                  height: '200px',
                  top: `${20 + i * 30}%`,
                  left: `${10 + i * 40}%`
                }}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.1, 0.3, 0.1]
                }}
                transition={{
                  duration: 4 + i,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="relative z-10 text-center max-w-2xl mx-auto px-6">
        {/* Game Title */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="mb-8"
        >
          <h1 
            className="text-6xl font-bold mb-4 transition-all duration-500"
            style={{ 
              color: textColor,
              textShadow: atmosphere === 'horror' ? '0 0 20px rgba(139, 0, 0, 0.8)' : 
                         atmosphere === 'dark_transition' ? '0 0 15px rgba(0, 0, 0, 0.5)' : 
                         'none',
              fontFamily: atmosphere === 'horror' ? 'serif' : 'inherit'
            }}
          >
            {getGameTitle()}
          </h1>
          <p 
            className="text-lg opacity-80 transition-all duration-500"
            style={{ color: textColor }}
          >
            {getGameSubtitle()}
          </p>
        </motion.div>

        {/* Progress indicator */}
        {showContinueOption && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8 p-4 rounded-lg"
            style={{
              backgroundColor: atmosphere === 'horror' ? 'rgba(0,0,0,0.5)' : 
                             atmosphere === 'dark_transition' ? 'rgba(0,0,0,0.3)' : 
                             'rgba(255,255,255,0.2)',
              border: `1px solid ${atmosphere === 'horror' ? '#2C1810' : '#E2E8F0'}`
            }}
          >
            <div 
              className="text-sm mb-2"
              style={{ color: textColor }}
            >
              Current Progress
            </div>
            <div 
              className="text-lg font-semibold"
              style={{ color: textColor }}
            >
              Level {currentLevel} • {playerProgress.completedLevels.length} Completed
            </div>
          </motion.div>
        )}

        {/* Menu buttons */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="space-y-4"
        >
          {/* Continue Game Button */}
          <AnimatePresence>
            {showContinueOption && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="w-full py-4 px-8 rounded-xl font-bold text-xl transition-all duration-200 border-2"
                style={getButtonStyle('continue', hoveredButton === 'continue')}
                onMouseEnter={() => { setHoveredButton('continue'); playHover(); }}
              onMouseLeave={() => setHoveredButton(null)}
              onClick={() => { playClick(); onStartGame(); }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {atmosphere === 'horror' ? 'RETURN TO THE NIGHTMARE' : 
                 atmosphere === 'dark_transition' ? 'Continue Into Darkness' : 
                 'Continue Game'}
              </motion.button>
            )}
          </AnimatePresence>

          {/* New Game Button */}
          <motion.button
            className="w-full py-4 px-8 rounded-xl font-bold text-xl transition-all duration-200 border-2"
            style={getButtonStyle('start', hoveredButton === 'start')}
            onMouseEnter={() => { setHoveredButton('new'); playHover(); }}
            onMouseLeave={() => setHoveredButton(null)}
            onClick={() => {
              playClick();
              resetGame();
              onStartGame();
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {atmosphere === 'horror' ? 'BEGIN THE DESCENT' : 
             atmosphere === 'dark_transition' ? 'Start New Journey' : 
             'New Game'}
          </motion.button>

          {/* Enter Home (PKM) Button */}
          {onEnterHome && (
            <motion.button
              className="w-full py-3 px-6 rounded-xl font-semibold text-lg transition-all duration-200 border-2"
              style={getButtonStyle('home', hoveredButton === 'home')}
              onMouseEnter={() => { setHoveredButton('home'); playHover(); }}
              onMouseLeave={() => setHoveredButton(null)}
              onClick={() => { playClick(); onEnterHome?.(); }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              {atmosphere === 'horror' ? 'RETREAT TO SANCTUARY' : 'Enter Home (PKM)'}
            </motion.button>
          )}

          {/* Settings Button */}
          {onShowSettings && (
            <motion.button
              className="w-full py-3 px-6 rounded-xl font-medium text-lg transition-all duration-200 border-2"
              style={getButtonStyle('settings', hoveredButton === 'settings')}
              onMouseEnter={() => { setHoveredButton('settings'); playHover(); }}
              onMouseLeave={() => setHoveredButton(null)}
              onClick={() => { playClick(); onShowSettings?.(); }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {atmosphere === 'horror' ? 'CONFIGURATION' : 'Settings'}
            </motion.button>
          )}

          {/* Credits Button */}
          {onShowCredits && (
            <motion.button
              className="w-full py-3 px-6 rounded-xl font-medium text-lg transition-all duration-200 border-2"
              style={getButtonStyle('credits', hoveredButton === 'credits')}
              onMouseEnter={() => { setHoveredButton('credits'); playHover(); }}
              onMouseLeave={() => setHoveredButton(null)}
              onClick={() => { playClick(); onShowCredits?.(); }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {atmosphere === 'horror' ? 'THE CREATORS' : 'Credits'}
            </motion.button>
          )}
        </motion.div>

        {/* Atmospheric flavor text */}
        {(atmosphere === 'unsettling' || atmosphere === 'dark_transition' || atmosphere === 'horror') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="mt-8 text-center"
          >
            <p 
              className="text-sm italic opacity-60"
              style={{ color: textColor }}
            >
              {atmosphere === 'horror' ? 
                'The abyss gazes also into you...' : 
               atmosphere === 'dark_transition' ? 
                'Some doors should never be opened...' : 
                'Something watches from the shadows...'}
            </p>
          </motion.div>
        )}
      </div>

      {/* Version info */}
      <div className="absolute bottom-4 right-4 text-xs opacity-50" style={{ color: textColor }}>
        v1.0.0
      </div>
    </div>
  );
};

export default MainMenu;