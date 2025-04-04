// src/context/VolleyballContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

const VolleyballContext = createContext();

export const VolleyballProvider = ({ children }) => {
  const [statsData, setStatsData] = useState({
    date: '',
    name: '',
    selectedSkill: '',
    stats: {
      doublePositive: 0,
      positive: 0,
      overpass: 0,
      negative: 0,
      doubleNegative: 0
    }
  });

  const [trendsData, setTrendsData] = useState({
    teamName: '',
    selectedSkill: '',
    canvasImage: null
  });

  // Cargar datos del localStorage al iniciar
  useEffect(() => {
    const savedData = localStorage.getItem('volleyballData');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        
        // Migrar datos antiguos si es necesario (cambiar regular a overpass)
        if (parsed.statsData && parsed.statsData.stats && 'regular' in parsed.statsData.stats) {
          parsed.statsData.stats.overpass = parsed.statsData.stats.regular || 0;
          delete parsed.statsData.stats.regular;
        }
        
        setStatsData(parsed.statsData);
        setTrendsData(parsed.trendsData);
      } catch (error) {
        console.error('Error parsing saved data:', error);
      }
    }
  }, []);

  // Guardar datos en localStorage cuando cambien
  useEffect(() => {
    try {
      localStorage.setItem('volleyballData', JSON.stringify({
        statsData,
        trendsData
      }));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }, [statsData, trendsData]);

  const clearAllData = () => {
    setStatsData({
      date: '',
      name: '',
      selectedSkill: '',
      stats: {
        doublePositive: 0,
        positive: 0,
        overpass: 0,
        negative: 0,
        doubleNegative: 0
      }
    });
    setTrendsData({
      teamName: '',
      selectedSkill: '',
      canvasImage: null
    });
    localStorage.removeItem('volleyballData');
  };

  return (
    <VolleyballContext.Provider 
      value={{
        statsData,
        setStatsData,
        trendsData,
        setTrendsData,
        clearAllData
      }}
    >
      {children}
    </VolleyballContext.Provider>
  );
};

export const useVolleyball = () => {
  const context = useContext(VolleyballContext);
  if (!context) {
    throw new Error('useVolleyball debe ser usado dentro de un VolleyballProvider');
  }
  return context;
};