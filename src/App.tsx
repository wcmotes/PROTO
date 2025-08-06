import React, { useState, useEffect } from 'react';
import { useGameStore } from './game/engine/gameStore';
import MainMenu from './components/MainMenu';
import GameBoard from './game/engine/GameBoard';
import { AudioManager } from './game/audio';
import { AtmosphereType } from './types/game';

type AppState = 'menu' | 'game' | 'settings' | 'credits';

export default function App() {
  const [appState, setAppState] = useState<AppState>('menu');
  const { atmosphere, playerProgress } = useGameStore();

  // Update document title based on atmosphere
  useEffect(() => {
    const titles = {
      cheerful: 'Puzzle Paradise',
      neutral: 'Mind Bender',
      unsettling: 'The Shifting Maze',
      dark_transition: 'Echoes in the Dark',
      horror: 'DESCENT INTO MADNESS'
    };
    
    document.title = titles[atmosphere];
  }, [atmosphere]);

  // Update favicon based on atmosphere (if needed)
  useEffect(() => {
    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (favicon) {
      // You could change favicon based on atmosphere here
      // For now, we'll keep the default
    }
  }, [atmosphere]);

  const handleStartGame = () => {
    setAppState('game');
  };

  const handleMenuReturn = () => {
    setAppState('menu');
  };

  const handleShowSettings = () => {
    setAppState('settings');
  };

  const handleShowCredits = () => {
    setAppState('credits');
  };

  const renderSettingsScreen = () => {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{
          background: atmosphere === 'horror' ? 'linear-gradient(135deg, #0F0F0F 0%, #1A1A2E 50%, #000000 100%)' :
                     atmosphere === 'dark_transition' ? 'linear-gradient(135deg, #2D3748 0%, #1A202C 50%, #171923 100%)' :
                     'linear-gradient(135deg, #F7FAFC 0%, #EDF2F7 50%, #E2E8F0 100%)'
        }}
      >
        <div className="text-center p-8 rounded-2xl" style={{
          backgroundColor: atmosphere === 'horror' || atmosphere === 'dark_transition' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.1)',
          border: '2px solid #E2E8F0',
          color: atmosphere === 'horror' || atmosphere === 'dark_transition' ? '#E2E8F0' : '#1A202C'
        }}>
          <h2 className="text-3xl font-bold mb-6">
            {atmosphere === 'horror' ? 'CONFIGURATION' : 'Settings'}
          </h2>
          <p className="text-lg mb-8">
            {atmosphere === 'horror' ? 'The void offers no options...' : 'Settings coming soon!'}
          </p>
          <button
            onClick={handleMenuReturn}
            className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105"
            style={{
              backgroundColor: atmosphere === 'horror' ? '#2C1810' : 
                             atmosphere === 'dark_transition' ? '#4A5568' : '#3182CE',
              color: '#E2E8F0',
              border: '2px solid #2D3748'
            }}
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  };

  const renderCreditsScreen = () => {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{
          background: atmosphere === 'horror' ? 'linear-gradient(135deg, #0F0F0F 0%, #1A1A2E 50%, #000000 100%)' :
                     atmosphere === 'dark_transition' ? 'linear-gradient(135deg, #2D3748 0%, #1A202C 50%, #171923 100%)' :
                     'linear-gradient(135deg, #F7FAFC 0%, #EDF2F7 50%, #E2E8F0 100%)'
        }}
      >
        <div className="text-center p-8 rounded-2xl max-w-2xl" style={{
          backgroundColor: atmosphere === 'horror' || atmosphere === 'dark_transition' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.1)',
          border: '2px solid #E2E8F0',
          color: atmosphere === 'horror' || atmosphere === 'dark_transition' ? '#E2E8F0' : '#1A202C'
        }}>
          <h2 className="text-3xl font-bold mb-6">
            {atmosphere === 'horror' ? 'THE CREATORS' : 'Credits'}
          </h2>
          <div className="space-y-4 text-lg">
            <p>
              <strong>Game Design & Development:</strong><br />
              {atmosphere === 'horror' ? 'The Architect of Nightmares' : 'SOLO Coding AI'}
            </p>
            <p>
              <strong>Atmospheric Progression:</strong><br />
              {atmosphere === 'horror' ? 'The Whispering Shadows' : 'Dynamic Theme System'}
            </p>
            <p>
              <strong>Puzzle Mechanics:</strong><br />
              {atmosphere === 'horror' ? 'The Tormented Minds' : 'Multi-Type Puzzle Engine'}
            </p>
            <p>
              <strong>Built with:</strong><br />
              React, TypeScript, Framer Motion, Zustand
            </p>
            {atmosphere === 'horror' && (
              <p className="text-red-400 italic mt-6">
                "In the end, we are all just puzzles waiting to be solved..."
              </p>
            )}
          </div>
          <button
            onClick={handleMenuReturn}
            className="mt-8 px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105"
            style={{
              backgroundColor: atmosphere === 'horror' ? '#2C1810' : 
                             atmosphere === 'dark_transition' ? '#4A5568' : '#3182CE',
              color: '#E2E8F0',
              border: '2px solid #2D3748'
            }}
          >
            {atmosphere === 'horror' ? 'ESCAPE' : 'Back to Menu'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <AudioManager>
      <div className="app">
        {appState === 'menu' && (
          <MainMenu
            onStartGame={handleStartGame}
            onShowSettings={handleShowSettings}
            onShowCredits={handleShowCredits}
          />
        )}
        
        {appState === 'game' && (
          <GameBoard onMenuReturn={handleMenuReturn} />
        )}
        
        {appState === 'settings' && renderSettingsScreen()}
        
        {appState === 'credits' && renderCreditsScreen()}
      </div>
    </AudioManager>
  );
}
