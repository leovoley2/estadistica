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
    timeline: [],
    // Gráficos guardados por set
    setCharts: []
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

  // Actualizar estadística de un jugador específico
  const updatePlayerStat = (player, statType, value) => {
    console.log(`Actualizando jugador ${player} con ${statType} por ${value}`);
    
    setStatsData(prev => {
      // 1. Crear copias de todos los objetos para evitar problemas de referencia
      const newStats = { ...prev };
      const currentSetIndex = matchData.currentSet - 1;
      
      // 2. Actualizar estadísticas según el jugador seleccionado
      if (player === 1 || player === null) {
        // Actualizar jugador 1
        newStats.player1Stats = { 
          ...newStats.player1Stats, 
          [statType]: Math.max(0, newStats.player1Stats[statType] + value) 
        };
        
        // Actualizar estadísticas del set actual para jugador 1
        if (!newStats.setStats[currentSetIndex]) {
          newStats.setStats[currentSetIndex] = {
            stats: { ...initialStatsState },
            player1Stats: { ...initialStatsState },
            player2Stats: { ...initialStatsState }
          };
        }
        
        newStats.setStats[currentSetIndex] = {
          ...newStats.setStats[currentSetIndex],
          player1Stats: {
            ...newStats.setStats[currentSetIndex].player1Stats,
            [statType]: Math.max(0, newStats.setStats[currentSetIndex].player1Stats[statType] + value)
          }
        };
      }
      
      if (player === 2 || player === null) {
        // Actualizar jugador 2
        newStats.player2Stats = { 
          ...newStats.player2Stats, 
          [statType]: Math.max(0, newStats.player2Stats[statType] + value) 
        };
        
        // Actualizar estadísticas del set actual para jugador 2
        if (!newStats.setStats[currentSetIndex]) {
          newStats.setStats[currentSetIndex] = {
            stats: { ...initialStatsState },
            player1Stats: { ...initialStatsState },
            player2Stats: { ...initialStatsState }
          };
        }
        
        newStats.setStats[currentSetIndex] = {
          ...newStats.setStats[currentSetIndex],
          player2Stats: {
            ...newStats.setStats[currentSetIndex].player2Stats,
            [statType]: Math.max(0, newStats.setStats[currentSetIndex].player2Stats[statType] + value)
          }
        };
      }
      
      // 3. Recalcular las estadísticas totales
      newStats.stats = {
        doublePositive: newStats.player1Stats.doublePositive + newStats.player2Stats.doublePositive,
        positive: newStats.player1Stats.positive + newStats.player2Stats.positive,
        overpass: newStats.player1Stats.overpass + newStats.player2Stats.overpass,
        negative: newStats.player1Stats.negative + newStats.player2Stats.negative,
        doubleNegative: newStats.player1Stats.doubleNegative + newStats.player2Stats.doubleNegative
      };
      
      // 4. Recalcular las estadísticas totales del set actual
      newStats.setStats[currentSetIndex].stats = {
        doublePositive: newStats.setStats[currentSetIndex].player1Stats.doublePositive + 
                       newStats.setStats[currentSetIndex].player2Stats.doublePositive,
        positive: newStats.setStats[currentSetIndex].player1Stats.positive + 
                 newStats.setStats[currentSetIndex].player2Stats.positive,
        overpass: newStats.setStats[currentSetIndex].player1Stats.overpass + 
                 newStats.setStats[currentSetIndex].player2Stats.overpass,
        negative: newStats.setStats[currentSetIndex].player1Stats.negative + 
                 newStats.setStats[currentSetIndex].player2Stats.negative,
        doubleNegative: newStats.setStats[currentSetIndex].player1Stats.doubleNegative + 
                       newStats.setStats[currentSetIndex].player2Stats.doubleNegative
      };
      
      console.log(`Estadísticas actualizadas para jugador ${player} - ${statType}: `, 
        player === 1 ? newStats.player1Stats[statType] : newStats.player2Stats[statType]);
      
      return newStats;
    });
  };

  // Función para guardar el gráfico del set actual
  const saveSetChart = async (chartRef) => {
    if (!chartRef?.current) {
      console.warn('No se encontró referencia del gráfico para guardar');
      return null;
    }
    
    try {
      // Importar html2canvas dinámicamente
      const html2canvas = (await import('html2canvas')).default;
      
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#ffffff',
        scale: 2, // Mayor resolución para mejor calidad
        useCORS: true,
        allowTaint: true,
        logging: false
      });
      
      const chartImage = canvas.toDataURL('image/png', 0.95);
      const currentSetIndex = matchData.currentSet - 1;
      
      setStatsData(prev => {
        const updatedSetCharts = [...prev.setCharts];
        updatedSetCharts[currentSetIndex] = {
          setNumber: matchData.currentSet,
          chartImage: chartImage,
          timestamp: new Date().toISOString(),
          teamScore: matchData.teamScore,
          opponentScore: matchData.opponentScore,
          setStats: prev.setStats[currentSetIndex] || {
            stats: { ...initialStatsState },
            player1Stats: { ...initialStatsState },
            player2Stats: { ...initialStatsState }
          }
        };
        
        return {
          ...prev,
          setCharts: updatedSetCharts
        };
      });
      
      console.log(`Gráfico del Set ${matchData.currentSet} guardado exitosamente`);
      return chartImage;
      
    } catch (error) {
      console.error('Error al guardar el gráfico del set:', error);
      return null;
    }
  };

  // Registrar una acción en la línea de tiempo
  const addTimelineAction = (player, statType, skillType) => {
    setStatsData(prev => {
      const newAction = {
        id: Date.now() + Math.random(),
        player,
        statType,
        skillType,
        set: matchData.currentSet,
        timestamp: new Date().toISOString(),
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
        id: Date.now() + Math.random(),
        player,
        statType,
        skillType: statsData.selectedSkill,
        timestamp: new Date().toISOString(),
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

  // Finalizar set actual con guardado automático de gráfico
  const finishCurrentSet = async (chartRef) => {
    if (window.confirm(`¿Desea finalizar el set ${matchData.currentSet}?`)) {
      
      // Guardar el gráfico del set antes de finalizarlo
      if (chartRef) {
        await saveSetChart(chartRef);
      }
      
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

  // Resetear completamente el partido y las estadísticas
  const resetMatchAndStats = () => {
    // Reiniciar las estadísticas para un nuevo partido
    setStatsData({
      date: '',
      name: '',
      selectedSkill: '',
      stats: { ...initialStatsState },
      player1Stats: { ...initialStatsState },
      player2Stats: { ...initialStatsState },
      // Reiniciar solo el primer set
      setStats: [{
        stats: { ...initialStatsState },
        player1Stats: { ...initialStatsState },
        player2Stats: { ...initialStatsState }
      }],
      timeline: [],
      // Limpiar gráficos guardados
      setCharts: []
    });

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

  // Función para obtener eficiencia de un set específico
  const getSetEfficiency = (setIndex) => {
    if (!statsData.setStats[setIndex]) return 0;
    
    const setData = statsData.setStats[setIndex].stats;
    const total = Object.values(setData).reduce((a, b) => a + b, 0);
    
    if (total === 0) return 0;
    
    const weightedSum = (
      setData.doublePositive * 4 +
      setData.positive * 2 +
      setData.overpass * 0 +
      setData.negative * -2 +
      setData.doubleNegative * -4
    );
    
    return ((weightedSum / (total * 4)) * 100);
  };

  // Función para obtener eficacia de un set específico
  const getSetEffectiveness = (setIndex) => {
    if (!statsData.setStats[setIndex]) return 0;
    
    const setData = statsData.setStats[setIndex].stats;
    const total = Object.values(setData).reduce((a, b) => a + b, 0);
    
    if (total === 0) return 0;
    
    return (((setData.doublePositive + setData.positive) / total) * 100);
  };

  // Función para obtener estadísticas resumidas del partido
  const getMatchSummary = () => {
    const totalActions = Object.values(statsData.stats).reduce((a, b) => a + b, 0);
    const player1Actions = Object.values(statsData.player1Stats).reduce((a, b) => a + b, 0);
    const player2Actions = Object.values(statsData.player2Stats).reduce((a, b) => a + b, 0);
    
    // Calcular eficiencias
    const overallEfficiency = totalActions > 0 ? (
      (statsData.stats.doublePositive * 4 + statsData.stats.positive * 2 + 
       statsData.stats.overpass * 0 + statsData.stats.negative * -2 + 
       statsData.stats.doubleNegative * -4) / (totalActions * 4)
    ) * 100 : 0;
    
    const player1Efficiency = player1Actions > 0 ? (
      (statsData.player1Stats.doublePositive * 4 + statsData.player1Stats.positive * 2 + 
       statsData.player1Stats.overpass * 0 + statsData.player1Stats.negative * -2 + 
       statsData.player1Stats.doubleNegative * -4) / (player1Actions * 4)
    ) * 100 : 0;
    
    const player2Efficiency = player2Actions > 0 ? (
      (statsData.player2Stats.doublePositive * 4 + statsData.player2Stats.positive * 2 + 
       statsData.player2Stats.overpass * 0 + statsData.player2Stats.negative * -2 + 
       statsData.player2Stats.doubleNegative * -4) / (player2Actions * 4)
    ) * 100 : 0;
    
    return {
      totalActions,
      player1Actions,
      player2Actions,
      overallEfficiency: parseFloat(overallEfficiency.toFixed(2)),
      player1Efficiency: parseFloat(player1Efficiency.toFixed(2)),
      player2Efficiency: parseFloat(player2Efficiency.toFixed(2)),
      setsPlayed: matchData.sets.filter(set => set.completed).length,
      currentSet: matchData.currentSet,
      setsWon: matchData.sets.filter(set => set.completed && set.teamScore > set.opponentScore).length,
      setsLost: matchData.sets.filter(set => set.completed && set.teamScore < set.opponentScore).length
    };
  };

  // Función para validar la integridad de los datos
  const validateDataIntegrity = () => {
    try {
      // Verificar que las estadísticas totales coincidan con la suma de jugadores
      const calculatedTotal = {
        doublePositive: statsData.player1Stats.doublePositive + statsData.player2Stats.doublePositive,
        positive: statsData.player1Stats.positive + statsData.player2Stats.positive,
        overpass: statsData.player1Stats.overpass + statsData.player2Stats.overpass,
        negative: statsData.player1Stats.negative + statsData.player2Stats.negative,
        doubleNegative: statsData.player1Stats.doubleNegative + statsData.player2Stats.doubleNegative
      };
      
      // Verificar discrepancias
      const hasDiscrepancies = Object.keys(calculatedTotal).some(key => 
        calculatedTotal[key] !== statsData.stats[key]
      );
      
      if (hasDiscrepancies) {
        console.warn('Discrepancia detectada en estadísticas totales, recalculando...');
        
        setStatsData(prev => ({
          ...prev,
          stats: calculatedTotal
        }));
      }
      
      return !hasDiscrepancies;
    } catch (error) {
      console.error('Error en validación de integridad:', error);
      return false;
    }
  };

  // Función para exportar datos en formato JSON
  const exportData = () => {
    try {
      const exportData = {
        version: '2.0',
        exportDate: new Date().toISOString(),
        matchInfo: {
          date: statsData.date,
          team: statsData.name,
          skill: statsData.selectedSkill
        },
        matchData,
        statsData,
        trendsData,
        summary: getMatchSummary()
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `volleyball-data-${statsData.name || 'partido'}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Error al exportar datos:', error);
      return false;
    }
  };

  // Función para importar datos desde JSON
  const importData = (jsonData) => {
    try {
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      
      // Validar estructura básica
      if (!data.statsData || !data.matchData) {
        throw new Error('Estructura de datos inválida');
      }
      
      // Migrar datos si es necesario
      if (data.version !== '2.0') {
        console.log('Migrando datos de versión anterior...');
        // Aquí se pueden agregar migraciones específicas
      }
      
      setStatsData(data.statsData);
      setMatchData(data.matchData);
      
      if (data.trendsData) {
        setTrendsData(data.trendsData);
      }
      
      console.log('Datos importados exitosamente');
      return true;
    } catch (error) {
      console.error('Error al importar datos:', error);
      return false;
    }
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
          
          // Migrar player stats si tienen 'regular'
          if (parsed.statsData.player1Stats && 'regular' in parsed.statsData.player1Stats) {
            parsed.statsData.player1Stats.overpass = parsed.statsData.player1Stats.regular || 0;
            delete parsed.statsData.player1Stats.regular;
          }
          
          if (parsed.statsData.player2Stats && 'regular' in parsed.statsData.player2Stats) {
            parsed.statsData.player2Stats.overpass = parsed.statsData.player2Stats.regular || 0;
            delete parsed.statsData.player2Stats.regular;
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
          
          // Si no existe setCharts, crearlo
          if (!parsed.statsData.setCharts) {
            parsed.statsData.setCharts = [];
          }
          
          // Si no existe timeline, crearlo
          if (!parsed.statsData.timeline) {
            parsed.statsData.timeline = [];
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
        
        console.log('Datos cargados exitosamente desde localStorage');
      } catch (error) {
        console.error('Error parsing saved data:', error);
        // En caso de error, inicializar con datos por defecto
        console.log('Inicializando con datos por defecto...');
      }
    }
  }, []);

  // Guardar datos en localStorage cuando cambien
  useEffect(() => {
    try {
      const dataToSave = {
        statsData,
        matchData,
        trendsData,
        version: '2.0',
        lastSaved: new Date().toISOString()
      };
      
      localStorage.setItem('volleyballData', JSON.stringify(dataToSave));
      
      // Validar integridad después de guardar
      setTimeout(() => {
        validateDataIntegrity();
      }, 100);
      
    } catch (error) {
      console.error('Error saving data:', error);
      
      // Si hay error por espacio, intentar limpiar datos antiguos
      if (error.name === 'QuotaExceededError') {
        try {
          // Limpiar gráficos más antiguos si hay muchos
          const updatedStatsData = { ...statsData };
          if (updatedStatsData.setCharts.length > 5) {
            updatedStatsData.setCharts = updatedStatsData.setCharts.slice(-3); // Mantener solo los últimos 3
            setStatsData(updatedStatsData);
          }
        } catch (cleanupError) {
          console.error('Error en limpieza de datos:', cleanupError);
        }
      }
    }
  }, [statsData, matchData, trendsData]);

  const clearAllData = () => {
    const initialData = {
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
      timeline: [],
      setCharts: []
    };
    
    setStatsData(initialData);
    
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
    
    try {
      localStorage.removeItem('volleyballData');
      console.log('Todos los datos han sido limpiados exitosamente');
    } catch (error) {
      console.error('Error al limpiar localStorage:', error);
    }
  };

  return (
    <VolleyballContext.Provider 
      value={{
        // Datos principales
        statsData,
        setStatsData,
        matchData,
        trendsData,
        setTrendsData,
        
        // Funciones de actualización de estadísticas
        updatePlayerStat,
        addTimelineAction,
        
        // Funciones de control de partido
        updateScore,
        startNewSet,
        finishCurrentSet,
        resetMatchAndStats,
        
        // Funciones de gráficos
        saveSetChart,
        
        // Funciones de consulta
        getCurrentSetStats,
        getSetEfficiency,
        getSetEffectiveness,
        getMatchSummary,
        
        // Funciones de utilidad
        validateDataIntegrity,
        exportData,
        importData,
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