import React, { createContext, useState, useContext } from 'react';

type PlayerProfile = {
  xp: number;
  level: number;
  rating: number;
  wins: number;
  unlockedThemes: string[];
};

const defaultProfile: PlayerProfile = {
  xp: 0, level: 1, rating: 1200, wins: 0, unlockedThemes: ['classic']
};

export const ProgressionContext = createContext<any>(null);

export const ProgressionProvider = ({ children }: { children: React.ReactNode }) => {
  const [profile, setProfile] = useState<PlayerProfile>(defaultProfile);

  const registerWin = () => {
    setProfile(prev => {
      const newWins = prev.wins + 1;
      const newXp = prev.xp + 150;
      const newLevel = Math.floor(newXp / 1000) + 1;
      
      // Example Quest Unlock System
      const newThemes = [...prev.unlockedThemes];
      if (newWins >= 10 && !newThemes.includes('neon')) {
        newThemes.push('neon');
        alert("Quest Complete: Win 10 Matches! 'Neon' theme unlocked.");
      }

      return { ...prev, wins: newWins, xp: newXp, level: newLevel, unlockedThemes: newThemes };
    });
  };

  return (
    <ProgressionContext.Provider value={{ profile, registerWin }}>
      {children}
    </ProgressionContext.Provider>
  );
};
