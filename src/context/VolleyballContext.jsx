// src/context/VolleyballContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

const VolleyballContext = createContext();

export const VolleyballProvider = ({ children }) => {
  // Estructura de datos para estadísticas por jugador
  const initialPlayerStatsState = {
    doublePositive: 0,
    positive: 0,
    overpass: 0,
    negative: 0,
    doubleNegative: 0
  };

  const [statsData, setStatsData] = useState({
    date: '',
    name: '',
    selectedSkill: '',
    // Ahora tenemos estadísticas totales y por jugador
    stats: {
      doublePositive: 0,
      positive: 0,
      overpass: 0,
      negative: 0,
      doubleNegative: 0
    },
    // Estadísticas por jugador
    player1Stats: { ...initialPlayerStatsState },
    player2Stats: { ...initialPlayerStatsState },
    // Registro cronológico de acciones
    timeline: []
  });

  // Nuevo estado para el control del marcador
  const [matchData, setMatchData] = useState({
    currentSet: 1,
    teamScore: 0,
    opponentScore: 0,
    sets: [
      { teamScore: 0, opponentScore: 0, completed: false, actions: [] }
    ]
  });

  const [trendsData, setTrendsData] = useState({
    teamName: '',
    selectedSkill: '',
    canvasImage: null
  });

  // Métodos auxiliares para actualizar estadísticas

  // Actualizar estadística de un jugador y el total
  const updatePlayerStat = (player, statType, value) => {
    setStatsData(prev => {
      const playerStatsKey = player === 1 ? 'player1Stats' : 'player2Stats';
      const newPlayerStats = {
        ...prev[playerStatsKey],
        [statType]: Math.max(0, prev[playerStatsKey][statType] + value)
      };

      // Recalcular el total basado en ambos jugadores
      const totalStats = { ...prev.stats };
      totalStats[statType] = newPlayerStats[statType] + 
        (player === 1 ? prev.player2Stats[statType] : prev.player1Stats[statType]);

      return {
        ...prev,
        stats: totalStats,
        [playerStatsKey]: newPlayerStats
      };
    });
  };

  // Registrar una acción en la línea de tiempo
  const addTimelineAction = (player, statType, skillType) => {
    setStatsData(prev => {
      const newAction = {
        id: Date.now(),
        player,
        statType,
        skillType,
        timestamp: new Date(),
        teamScore: matchData.teamScore,
        opponentScore: matchData.opponentScore
      };

      // Añadir al historial general y al set actual
      const updatedTimeline = [...prev.timeline, newAction];

      return {
        ...prev,
        timeline: updatedTimeline
      };
    });

    // También añadir a las acciones del set actual
    setMatchData(prev => {
      const currentSetIndex = prev.currentSet - 1;
      const updatedSets = [...prev.sets];
      
      const newAction = {
        id: Date.now(),
        player,
        statType,
        skillType: statsData.selectedSkill,
        timestamp: new Date(),
        teamScore: prev.teamScore,
        opponentScore: prev.opponentScore
      };

      updatedSets[currentSetIndex] = {
        ...updatedSets[currentSetIndex],
        actions: [...updatedSets[currentSetIndex].actions, newAction]
      };

      return {
        ...prev,
        sets: updatedSets
      };
    });
  };

  // Actualizar el marcador
  const updateScore = (team, value) => {
    setMatchData(prev => {
      let newTeamScore = team === 'team' ? prev.teamScore + value : prev.teamScore;
      let newOpponentScore = team === 'opponent' ? prev.opponentScore + value : prev.opponentScore;
      
      // Asegurar que no sean negativos
      newTeamScore = Math.max(0, newTeamScore);
      newOpponentScore = Math.max(0, newOpponentScore);

      // Actualizar el set actual
      const currentSetIndex = prev.currentSet - 1;
      const updatedSets = [...prev.sets];
      updatedSets[currentSetIndex] = {
        ...updatedSets[currentSetIndex],
        teamScore: newTeamScore,
        opponentScore: newOpponentScore
      };

      return {
        ...prev,
        teamScore: newTeamScore,
        opponentScore: newOpponentScore,
        sets: updatedSets
      };
    });
  };

  // Iniciar un nuevo set
  const startNewSet = () => {
    setMatchData(prev => {
      // Marcar el set actual como completado
      const updatedSets = [...prev.sets];
      updatedSets[prev.currentSet - 1] = {
        ...updatedSets[prev.currentSet - 1],
        completed: true
      };

      // Añadir nuevo set
      updatedSets.push({
        teamScore: 0, 
        opponentScore: 0, 
        completed: false,
        actions: []
      });

      return {
        ...prev,
        currentSet: prev.currentSet + 1,
        teamScore: 0,
        opponentScore: 0,
        sets: updatedSets
      };
    });
  };

  // Cargar datos del localStorage al iniciar
  useEffect(() => {
    const savedData = localStorage.getItem('volleyballData');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        
        // Migrar datos antiguos si es necesario
        if (parsed.statsData) {
          // Verificar si necesitamos actualizar de regular a overpass
          if (parsed.statsData.stats && 'regular' in parsed.statsData.stats) {
            parsed.statsData.stats.overpass = parsed.statsData.stats.regular || 0;
            delete parsed.statsData.stats.regular;
          }
          
          // Si no existe la estructura de jugadores, crearla
          if (!parsed.statsData.player1Stats) {
            parsed.statsData.player1Stats = { ...initialPlayerStatsState };
            parsed.statsData.player2Stats = { ...initialPlayerStatsState };
            parsed.statsData.timeline = [];
          }
          
          setStatsData(parsed.statsData);
        }
        
        if (parsed.matchData) {
          setMatchData(parsed.matchData);
        }
        
        if (parsed.trendsData) {
          setTrendsData(parsed.trendsData);
        }
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
        matchData,
        trendsData
      }));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }, [statsData, matchData, trendsData]);

  const clearAllData = () => {
    setStatsData({
      date: '',
      name: '',
      selectedSkill: '',
      stats: { ...initialPlayerStatsState },
      player1Stats: { ...initialPlayerStatsState },
      player2Stats: { ...initialPlayerStatsState },
      timeline: []
    });
    
    setMatchData({
      currentSet: 1,
      teamScore: 0,
      opponentScore: 0,
      sets: [
        { teamScore: 0, opponentScore: 0, completed: false, actions: [] }
      ]
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
        matchData,
        updatePlayerStat,
        addTimelineAction,
        updateScore,
        startNewSet,
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