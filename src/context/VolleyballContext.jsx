// src/context/VolleyballContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

const VolleyballContext = createContext();

// Estructura inicial de estadísticas
const initialStatsState = {
  doublePositive: 0,
  positive: 0,
  overpass: 0,
  negative: 0,
  doubleNegative: 0
};

export const VolleyballProvider = ({ children }) => {
  // Estructura de datos para estadísticas por jugador y por set
  const [statsData, setStatsData] = useState({
    date: '',
    name: '',
    selectedSkill: '',
    // Estadísticas totales del partido
    stats: { ...initialStatsState },
    // Estadísticas por jugador
    player1Stats: { ...initialStatsState },
    player2Stats: { ...initialStatsState },
    // Estadísticas por set
    setStats: [
      {
        stats: { ...initialStatsState },
        player1Stats: { ...initialStatsState },
        player2Stats: { ...initialStatsState }
      }
    ],
    // Registro cronológico de acciones
    timeline: []
  });

  // Estado para el control del marcador
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
 // Reemplazo completo de la función updatePlayerStat

const updatePlayerStat = (player, statType, value) => {
  console.log(`Intentando actualizar para jugador ${player}, estadística ${statType} con valor ${value}`);
  
  if (player !== 1 && player !== 2 && player !== null) {
    console.error("Error: Jugador inválido", player);
    return;
  }
  
  setStatsData(prev => {
    // Crear copias profundas de todos los objetos de estadísticas para evitar problemas de referencia
    const currentSetIndex = matchData.currentSet - 1;
    
    // 1. Crear copias de las estadísticas actuales
    const newPlayerStats1 = {...prev.player1Stats};
    const newPlayerStats2 = {...prev.player2Stats};
    
    // Crear una copia de todos los sets
    const newSetStats = prev.setStats.map(set => ({
      stats: {...set.stats},
      player1Stats: {...set.player1Stats},
      player2Stats: {...set.player2Stats}
    }));
    
    // Asegurarse de que existe el set actual
    if (!newSetStats[currentSetIndex]) {
      newSetStats[currentSetIndex] = {
        stats: {...initialStatsState},
        player1Stats: {...initialStatsState},
        player2Stats: {...initialStatsState}
      };
    }
    
    // 2. Actualizar las estadísticas específicas
    if (player === 1 || player === null) {
      // Actualizar stats del jugador 1
      newPlayerStats1[statType] = Math.max(0, newPlayerStats1[statType] + value);
      newSetStats[currentSetIndex].player1Stats[statType] = Math.max(
        0, 
        newSetStats[currentSetIndex].player1Stats[statType] + value
      );
      console.log(`Actualizando Jugador 1 - ${statType}: ${newPlayerStats1[statType]}`);
    }
    
    if (player === 2 || player === null) {
      // Actualizar stats del jugador 2
      newPlayerStats2[statType] = Math.max(0, newPlayerStats2[statType] + value);
      newSetStats[currentSetIndex].player2Stats[statType] = Math.max(
        0, 
        newSetStats[currentSetIndex].player2Stats[statType] + value
      );
      console.log(`Actualizando Jugador 2 - ${statType}: ${newPlayerStats2[statType]}`);
    }
    
    // 3. Recalcular las estadísticas totales para el set actual
    const setTotalStats = {
      doublePositive: newSetStats[currentSetIndex].player1Stats.doublePositive + 
                     newSetStats[currentSetIndex].player2Stats.doublePositive,
      positive: newSetStats[currentSetIndex].player1Stats.positive + 
               newSetStats[currentSetIndex].player2Stats.positive,
      overpass: newSetStats[currentSetIndex].player1Stats.overpass + 
               newSetStats[currentSetIndex].player2Stats.overpass,
      negative: newSetStats[currentSetIndex].player1Stats.negative + 
               newSetStats[currentSetIndex].player2Stats.negative,
      doubleNegative: newSetStats[currentSetIndex].player1Stats.doubleNegative + 
                     newSetStats[currentSetIndex].player2Stats.doubleNegative
    };
    
    newSetStats[currentSetIndex].stats = setTotalStats;
    
    // 4. Recalcular las estadísticas totales del partido
    const totalStats = {
      doublePositive: newPlayerStats1.doublePositive + newPlayerStats2.doublePositive,
      positive: newPlayerStats1.positive + newPlayerStats2.positive,
      overpass: newPlayerStats1.overpass + newPlayerStats2.overpass,
      negative: newPlayerStats1.negative + newPlayerStats2.negative,
      doubleNegative: newPlayerStats1.doubleNegative + newPlayerStats2.doubleNegative
    };
    
    // 5. Devolver el estado actualizado
    return {
      ...prev,
      stats: totalStats,
      player1Stats: newPlayerStats1,
      player2Stats: newPlayerStats2,
      setStats: newSetStats
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
        set: matchData.currentSet,
        timestamp: new Date(),
        teamScore: matchData.teamScore,
        opponentScore: matchData.opponentScore
      };

      // Añadir al historial general
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

      if (updatedSets[currentSetIndex]) {
        updatedSets[currentSetIndex] = {
          ...updatedSets[currentSetIndex],
          actions: [...updatedSets[currentSetIndex].actions, newAction]
        };
      }

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
      
      if (updatedSets[currentSetIndex]) {
        updatedSets[currentSetIndex] = {
          ...updatedSets[currentSetIndex],
          teamScore: newTeamScore,
          opponentScore: newOpponentScore
        };
      }

      return {
        ...prev,
        teamScore: newTeamScore,
        opponentScore: newOpponentScore,
        sets: updatedSets
      };
    });
  };

  // Iniciar un nuevo set (máximo 3 sets)
  const startNewSet = () => {
    setMatchData(prev => {
      // No permitir más de 3 sets
      if (prev.currentSet >= 3) {
        alert("El voleibol de playa tiene un máximo de 3 sets");
        return prev;
      }

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

    // Añadir nuevos stats para el set
    setStatsData(prev => {
      const updatedSetStats = [...prev.setStats];
      updatedSetStats.push({
        stats: { ...initialStatsState },
        player1Stats: { ...initialStatsState },
        player2Stats: { ...initialStatsState }
      });

      return {
        ...prev,
        setStats: updatedSetStats
      };
    });
  };

  // Finalizar set actual
  const finishCurrentSet = () => {
    if (window.confirm(`¿Desea finalizar el set ${matchData.currentSet}?`)) {
      setMatchData(prev => {
        // Marcar el set actual como completado
        const updatedSets = [...prev.sets];
        updatedSets[prev.currentSet - 1] = {
          ...updatedSets[prev.currentSet - 1],
          completed: true
        };
        
        // Si aún no hemos alcanzado el máximo de sets, preparar el siguiente
        if (prev.currentSet < 3) {
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
        } 
        
        // Si ya estamos en el set 3, solo marcar como completado
        return {
          ...prev,
          sets: updatedSets
        };
      });

      // Preparar stats para el nuevo set si no hemos alcanzado el máximo
      setStatsData(prev => {
        if (matchData.currentSet < 3) {
          const updatedSetStats = [...prev.setStats];
          updatedSetStats.push({
            stats: { ...initialStatsState },
            player1Stats: { ...initialStatsState },
            player2Stats: { ...initialStatsState }
          });

          return {
            ...prev,
            setStats: updatedSetStats
          };
        }
        return prev;
      });
    }
  };

  // Obtener estadísticas del set actual
  const getCurrentSetStats = () => {
    const currentSetIndex = matchData.currentSet - 1;
    if (statsData.setStats && statsData.setStats[currentSetIndex]) {
      return statsData.setStats[currentSetIndex];
    }
    return {
      stats: { ...initialStatsState },
      player1Stats: { ...initialStatsState },
      player2Stats: { ...initialStatsState }
    };
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
          
          // Si existe player1Stats pero no existe setStats, crear setStats
          if (parsed.statsData.player1Stats && !parsed.statsData.setStats) {
            parsed.statsData.setStats = [{
              stats: { ...parsed.statsData.stats },
              player1Stats: { ...parsed.statsData.player1Stats },
              player2Stats: { ...parsed.statsData.player2Stats }
            }];
          }
          
          // Si no existe la estructura de jugadores, crearla
          if (!parsed.statsData.player1Stats) {
            parsed.statsData.player1Stats = { ...initialStatsState };
            parsed.statsData.player2Stats = { ...initialStatsState };
            parsed.statsData.timeline = [];
            parsed.statsData.setStats = [{
              stats: { ...initialStatsState },
              player1Stats: { ...initialStatsState },
              player2Stats: { ...initialStatsState }
            }];
          }
          
          setStatsData(parsed.statsData);
        }
        
        if (parsed.matchData) {
          // Limitar a 3 sets máximo si hay más
          if (parsed.matchData.sets && parsed.matchData.sets.length > 3) {
            parsed.matchData.sets = parsed.matchData.sets.slice(0, 3);
            if (parsed.matchData.currentSet > 3) {
              parsed.matchData.currentSet = 3;
            }
          }
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
      stats: { ...initialStatsState },
      player1Stats: { ...initialStatsState },
      player2Stats: { ...initialStatsState },
      setStats: [{
        stats: { ...initialStatsState },
        player1Stats: { ...initialStatsState },
        player2Stats: { ...initialStatsState }
      }],
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

  // Función para resetear completamente el partido y las estadísticas
const resetMatchAndStats = () => {
  // Reiniciar las estadísticas para un nuevo partido
  setStatsData(prev => ({
    ...prev,
    stats: {
      doublePositive: 0,
      positive: 0,
      overpass: 0,
      negative: 0,
      doubleNegative: 0
    },
    player1Stats: {
      doublePositive: 0,
      positive: 0,
      overpass: 0,
      negative: 0,
      doubleNegative: 0
    },
    player2Stats: {
      doublePositive: 0,
      positive: 0,
      overpass: 0,
      negative: 0,
      doubleNegative: 0
    },
    // Reiniciar solo el primer set
    setStats: [{
      stats: {
        doublePositive: 0,
        positive: 0,
        overpass: 0,
        negative: 0,
        doubleNegative: 0
      },
      player1Stats: {
        doublePositive: 0,
        positive: 0,
        overpass: 0,
        negative: 0,
        doubleNegative: 0
      },
      player2Stats: {
        doublePositive: 0,
        positive: 0,
        overpass: 0,
        negative: 0,
        doubleNegative: 0
      }
    }]
  }));

  // Reiniciar el estado del partido
  setMatchData({
    currentSet: 1,
    teamScore: 0,
    opponentScore: 0,
    sets: [
      { teamScore: 0, opponentScore: 0, completed: false, actions: [] }
    ]
  });
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
      finishCurrentSet,
      resetMatchAndStats,
      getCurrentSetStats,
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