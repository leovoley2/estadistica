import React, { useState, useRef, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ComposedChart, Line, Legend } from 'recharts';
import { ArrowUpCircle, ArrowDownCircle, RotateCcw, Download, TrendingUp, User, Users } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useNavigate } from 'react-router-dom';
import { useVolleyball } from '../context/VolleyballContext';
import EvaluationCriteria from './EvaluatioinCriteria';
import ScoreKeeper from './ScoreKeeper';
import ActionTimeline from './ActionTimeline';

const VolleyballStats = () => {
  const navigate = useNavigate();
  const { 
    statsData, 
    setStatsData, 
    matchData,
    updatePlayerStat,
    addTimelineAction,
    getCurrentSetStats
  } = useVolleyball();
  
  const chartRef = useRef(null);
  const setChartRef = useRef(null);
  
  const [date, setDate] = useState(statsData.date || '');
  const [name, setName] = useState(statsData.name || '');
  const [activeTab, setActiveTab] = useState('fundamentos');
  const [selectedSkill, setSelectedSkill] = useState(statsData.selectedSkill || '');
  const [selectedPlayer, setSelectedPlayer] = useState(1); // Por defecto, jugador 1
  const [statView, setStatView] = useState('total'); // 'total', 'player1', 'player2'
  const [showCurrentSetStats, setShowCurrentSetStats] = useState(true); // Toggle entre estadísticas del set actual o totales
  
  // Obtener estadísticas del set actual
  const currentSetData = getCurrentSetStats();
  
  // Estadísticas basadas en la vista actual y la configuración de set
  const currentStats = showCurrentSetStats ? 
    (statView === 'player1' ? currentSetData.player1Stats :
     statView === 'player2' ? currentSetData.player2Stats :
     currentSetData.stats) :
    (statView === 'player1' ? statsData.player1Stats :
     statView === 'player2' ? statsData.player2Stats :
     statsData.stats);

  // Definir las categorías disponibles por tipo de tab
  const skillCategories = {
    fundamentos: ['Recepción', 'Armado', 'Defensa', 'Ataque', 'Bloqueo', 'Saque'],
    fases: ['K1', 'K2']
  };

  // Función para manejar incrementos y decrementos de estadísticas
  const handleStatChange = (statType, value) => {
    // Obtener el jugador seleccionado actualmente
    const targetPlayer = selectedPlayer;
    
    console.log(`Actualizando estadística ${statType} por ${value} para ${
      targetPlayer === 1 ? 'Jugador 1' : 
      targetPlayer === 2 ? 'Jugador 2' : 
      'Ambos'
    }`);
    
    // Llamar a la función de actualización con el jugador correcto
    updatePlayerStat(targetPlayer, statType, value);
    
    // Registrar en la línea de tiempo (solo para incrementos)
    if (value > 0) {
      if (targetPlayer === null) {
        // Si se seleccionaron ambos jugadores, registrar para ambos
        addTimelineAction(1, statType, selectedSkill);
        addTimelineAction(2, statType, selectedSkill);
      } else {
        // Registrar solo para el jugador específico
        addTimelineAction(targetPlayer, statType, selectedSkill);
      }
    }
  };

  const handleReset = () => {
    if (window.confirm(`¿Está seguro de que desea reiniciar las estadísticas ${showCurrentSetStats ? 'del set actual' : 'totales'}?`)) {
      // Resetear las estadísticas del jugador seleccionado o totales
      if (statView === 'player1' || statView === 'player2') {
        const playerKey = statView === 'player1' ? 'player1Stats' : 'player2Stats';
        
        if (showCurrentSetStats) {
          // Reset solo para el set actual
          setStatsData(prev => {
            const updatedSetStats = [...prev.setStats];
            const currentSetIndex = matchData.currentSet - 1;
            
            if (updatedSetStats[currentSetIndex]) {
              updatedSetStats[currentSetIndex] = {
                ...updatedSetStats[currentSetIndex],
                [playerKey]: {
                  doublePositive: 0,
                  positive: 0,
                  overpass: 0,
                  negative: 0,
                  doubleNegative: 0
                }
              };
              
              // Recalcular estadísticas totales del set
              const player1 = playerKey === 'player1Stats' ? 
                { doublePositive: 0, positive: 0, overpass: 0, negative: 0, doubleNegative: 0 } : 
                updatedSetStats[currentSetIndex].player1Stats;
                
              const player2 = playerKey === 'player2Stats' ? 
                { doublePositive: 0, positive: 0, overpass: 0, negative: 0, doubleNegative: 0 } : 
                updatedSetStats[currentSetIndex].player2Stats;
              
              updatedSetStats[currentSetIndex].stats = {
                doublePositive: player1.doublePositive + player2.doublePositive,
                positive: player1.positive + player2.positive,
                overpass: player1.overpass + player2.overpass,
                negative: player1.negative + player2.negative,
                doubleNegative: player1.doubleNegative + player2.doubleNegative
              };
            }
            
            return {
              ...prev,
              setStats: updatedSetStats
            };
          });
          
        } else {
          // Reset de las estadísticas totales del jugador
          setStatsData(prev => ({
            ...prev,
            [playerKey]: {
              doublePositive: 0,
              positive: 0,
              overpass: 0,
              negative: 0,
              doubleNegative: 0
            }
          }));
        }
      } else {
        // Resetear estadísticas totales de ambos jugadores
        if (showCurrentSetStats) {
          // Solo para el set actual
          setStatsData(prev => {
            const updatedSetStats = [...prev.setStats];
            const currentSetIndex = matchData.currentSet - 1;
            
            if (updatedSetStats[currentSetIndex]) {
              updatedSetStats[currentSetIndex] = {
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
              };
            }
            
            return {
              ...prev,
              setStats: updatedSetStats
            };
          });
        } else {
          // Reset de todas las estadísticas
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
            }
          }));
        }
      }
    }
  };const calculateTotalActions = () => Object.values(currentStats).reduce((a, b) => a + b, 0);

  const calculateEfficiency = () => {
    const total = calculateTotalActions();
    if (total === 0) return 0;
    const weightedSum = (
      currentStats.doublePositive * 4 +
      currentStats.positive * 2 +
      currentStats.overpass * 0 +
      currentStats.negative * -2 +
      currentStats.doubleNegative * -4
    );
    return ((weightedSum / (total * 4)) * 100).toFixed(2);
  };

  const calculateEffectiveness = () => {
    const total = calculateTotalActions();
    if (total === 0) return 0;
    return (((currentStats.doublePositive + currentStats.positive) / total) * 100).toFixed(2);
  };

  // Preparar datos para el gráfico de comparación de sets
  const prepareSetComparisonData = () => {
    return statsData.setStats.map((setData, index) => {
      const setNum = index + 1;
      // Calcular eficiencia para cada jugador
      const p1Total = Object.values(setData.player1Stats).reduce((a, b) => a + b, 0) || 1;
      const p2Total = Object.values(setData.player2Stats).reduce((a, b) => a + b, 0) || 1;
      
      const p1WeightedSum = (
        setData.player1Stats.doublePositive * 4 +
        setData.player1Stats.positive * 2 +
        setData.player1Stats.overpass * 0 +
        setData.player1Stats.negative * -2 +
        setData.player1Stats.doubleNegative * -4
      );
      
      const p2WeightedSum = (
        setData.player2Stats.doublePositive * 4 +
        setData.player2Stats.positive * 2 +
        setData.player2Stats.overpass * 0 +
        setData.player2Stats.negative * -2 +
        setData.player2Stats.doubleNegative * -4
      );
      
      const p1Efficiency = ((p1WeightedSum / (p1Total * 4)) * 100) || 0;
      const p2Efficiency = ((p2WeightedSum / (p2Total * 4)) * 100) || 0;
      
      return {
        name: `Set ${setNum}`,
        'Jugador 1': p1Efficiency,
        'Jugador 2': p2Efficiency,
        'Marcador': `${matchData.sets[index]?.teamScore || 0}-${matchData.sets[index]?.opponentScore || 0}`
      };
    });
  };

  // Componente para los botones de estadísticas
  const StatButton = ({ statType, label, color }) => {
    return (
      <div className={`flex flex-col items-center p-2 rounded-lg border-2 ${
        selectedPlayer === 1 ? 'border-blue-200' :
        selectedPlayer === 2 ? 'border-green-200' :
        'border-purple-200'
      } bg-white hover:bg-gray-50`}>
        <span className="text-sm font-medium mb-1 text-center">{label}</span>
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => handleStatChange(statType, -1)}
            className={`p-2 rounded-l-lg ${
              selectedPlayer === 1 ? 'hover:bg-blue-100' :
              selectedPlayer === 2 ? 'hover:bg-green-100' :
              'hover:bg-purple-100'
            }`}
            style={{ color }}
          >
            <ArrowDownCircle className="h-5 w-5" />
          </button>
          <div className="px-3 py-1 font-bold text-base" style={{ color }}>
            {currentStats[statType]}
          </div>
          <button
            type="button"
            onClick={() => handleStatChange(statType, 1)}
            className={`p-2 rounded-r-lg ${
              selectedPlayer === 1 ? 'hover:bg-blue-100' :
              selectedPlayer === 2 ? 'hover:bg-green-100' :
              'hover:bg-purple-100'
            }`}
            style={{ color }}
          >
            <ArrowUpCircle className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  };

 // Actualización de la función handleDownloadPDF en VolleyballStats.jsx

const handleDownloadPDF = async () => {
  if (!name || !date || !selectedSkill) {
    alert('Por favor, complete todos los campos antes de descargar el PDF');
    return;
  }

  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // ===== PÁGINA 1: RESUMEN GENERAL =====
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 255);
    doc.text('Estadísticas de Voleibol de Playa', pageWidth/2, 15, { align: 'center' });
    
    // Información básica
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text([
      `Fecha: ${format(new Date(date), "PPP", { locale: es })}`,
      `Nombre/Equipo: ${name}`,
      `Fundamento: ${selectedSkill}`,
      `Marcador Final: ${matchData.sets.map((set, i) => 
        `Set ${i+1}: ${set.teamScore}-${set.opponentScore}`).join(' | ')}`
    ], 15, 25);

    // Estadísticas globales resumidas
    doc.setFontSize(12);
    doc.text('Resumen General del Partido:', 15, 45);
    doc.setFontSize(10);
    
    const globalStats = [
      `Total de Acciones: ${Object.values(statsData.stats).reduce((a, b) => a + b, 0)}`,
      `Eficiencia General: ${((
        (statsData.stats.doublePositive * 4 + statsData.stats.positive * 2 + 
         statsData.stats.overpass * 0 + statsData.stats.negative * -2 + 
         statsData.stats.doubleNegative * -4) / 
        (Object.values(statsData.stats).reduce((a, b) => a + b, 0) * 4)
      ) * 100).toFixed(2)}%`,
    ];
    
    doc.text(globalStats, 15, 55);

    // Tabla comparativa de jugadores
    doc.setFontSize(11);
    doc.text('Comparación por Jugador:', 15, 70);
    
    // Crear tabla simple
    const tableY = 80;
    const rowHeight = 8;
    
    // Encabezados
    doc.setFillColor(240, 240, 240);
    doc.rect(15, tableY, 170, rowHeight, 'F');
    doc.setFontSize(9);
    doc.text('Estadística', 17, tableY + 5);
    doc.text('Jugador 1', 70, tableY + 5);
    doc.text('Jugador 2', 120, tableY + 5);
    doc.text('Total', 160, tableY + 5);
    
    // Filas de datos
    const statsRows = [
      ['Doble Positivo (##)', statsData.player1Stats.doublePositive, statsData.player2Stats.doublePositive, statsData.stats.doublePositive],
      ['Positivo (+)', statsData.player1Stats.positive, statsData.player2Stats.positive, statsData.stats.positive],
      ['Overpass (/)', statsData.player1Stats.overpass, statsData.player2Stats.overpass, statsData.stats.overpass],
      ['Negativo (-)', statsData.player1Stats.negative, statsData.player2Stats.negative, statsData.stats.negative],
      ['Doble Negativo (=)', statsData.player1Stats.doubleNegative, statsData.player2Stats.doubleNegative, statsData.stats.doubleNegative]
    ];
    
    statsRows.forEach((row, index) => {
      const y = tableY + (index + 1) * rowHeight;
      if (index % 2 === 0) {
        doc.setFillColor(248, 248, 248);
        doc.rect(15, y, 170, rowHeight, 'F');
      }
      doc.text(row[0], 17, y + 5);
      doc.text(row[1].toString(), 75, y + 5);
      doc.text(row[2].toString(), 125, y + 5);
      doc.text(row[3].toString(), 165, y + 5);
    });

    // ===== PÁGINAS POR SET CON GRÁFICOS =====
    statsData.setCharts.forEach((setChart, index) => {
      doc.addPage();
      
      // Título del set
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 255);
      doc.text(`Set ${setChart.setNumber} - Análisis Detallado`, pageWidth/2, 15, { align: 'center' });
      
      // Marcador del set
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Marcador: ${setChart.teamScore} - ${setChart.opponentScore}`, pageWidth/2, 25, { align: 'center' });
      
      // Gráfico del set
      if (setChart.chartImage) {
        const imgWidth = pageWidth - 30;
        const imgHeight = 80;
        doc.addImage(setChart.chartImage, 'PNG', 15, 35, imgWidth, imgHeight);
      }
      
      // Estadísticas detalladas del set
      doc.setFontSize(11);
      doc.text(`Estadísticas del Set ${setChart.setNumber}:`, 15, 125);
      doc.setFontSize(9);
      
      const setStatsData = setChart.setStats;
      const setStatsText = [
        `Jugador 1 - Total: ${Object.values(setStatsData.player1Stats).reduce((a, b) => a + b, 0)} acciones`,
        `  ## ${setStatsData.player1Stats.doublePositive}, + ${setStatsData.player1Stats.positive}, / ${setStatsData.player1Stats.overpass}, - ${setStatsData.player1Stats.negative}, = ${setStatsData.player1Stats.doubleNegative}`,
        '',
        `Jugador 2 - Total: ${Object.values(setStatsData.player2Stats).reduce((a, b) => a + b, 0)} acciones`,
        `  ## ${setStatsData.player2Stats.doublePositive}, + ${setStatsData.player2Stats.positive}, / ${setStatsData.player2Stats.overpass}, - ${setStatsData.player2Stats.negative}, = ${setStatsData.player2Stats.doubleNegative}`,
        '',
        `Total del Set: ${Object.values(setStatsData.stats).reduce((a, b) => a + b, 0)} acciones`,
        `  ## ${setStatsData.stats.doublePositive}, + ${setStatsData.stats.positive}, / ${setStatsData.stats.overpass}, - ${setStatsData.stats.negative}, = ${setStatsData.stats.doubleNegative}`
      ];
      
      doc.text(setStatsText, 15, 135);
      
      // Calcular eficiencia del set
      const setTotal = Object.values(setStatsData.stats).reduce((a, b) => a + b, 0);
      if (setTotal > 0) {
        const setEfficiency = ((
          (setStatsData.stats.doublePositive * 4 + setStatsData.stats.positive * 2 + 
           setStatsData.stats.overpass * 0 + setStatsData.stats.negative * -2 + 
           setStatsData.stats.doubleNegative * -4) / (setTotal * 4)
        ) * 100).toFixed(2);
        
        doc.setFontSize(10);
        doc.text(`Eficiencia del Set: ${setEfficiency}%`, 15, 170);
      }
      
      // Timestamp
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Guardado: ${format(new Date(setChart.timestamp), "PPpp", { locale: es })}`, 15, pageHeight - 10);
    });
    
    // ===== PÁGINA FINAL: CRITERIOS DE EVALUACIÓN =====
    doc.addPage();
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 255);
    doc.text('Criterios de Evaluación', pageWidth/2, 15, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Fundamento: ${selectedSkill}`, 15, 25);

    // Tabla de criterios
    const criterioPosY = 35;
    const lineHeight = 7;
    
    doc.setFillColor(230, 230, 230);
    doc.rect(15, criterioPosY, 180, 7, 'F');
    doc.setFontSize(10);
    doc.text("Símbolo", 17, criterioPosY + 5);
    doc.text("Tipo", 47, criterioPosY + 5);
    doc.text("Descripción", 97, criterioPosY + 5);
    
    const criterios = [
      { symbol: "##", tipo: "Doble Positivo", desc: "Acción perfecta o punto directo" },
      { symbol: "+", tipo: "Positivo", desc: "Acción que genera ventaja para el equipo" },
      { symbol: "/", tipo: "Overpass", desc: "Acción que resulta en pase al campo contrario" },
      { symbol: "-", tipo: "Negativo", desc: "Acción que genera desventaja para el equipo" },
      { symbol: "=", tipo: "Doble Negativo", desc: "Error" }
    ];
    
    criterios.forEach((criterio, idx) => {
      const y = criterioPosY + ((idx + 1) * lineHeight);
      if (idx % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(15, y, 180, lineHeight, 'F');
      }
      doc.text(criterio.symbol, 17, y + 5);
      doc.text(criterio.tipo, 47, y + 5);
      doc.text(criterio.desc, 97, y + 5);
    });

    doc.save(`estadisticas-completas-${name}-${date}.pdf`);
    
  } catch (error) {
    console.error('Error al generar el PDF:', error);
    alert('Error al generar el PDF. Por favor, intente nuevamente.');
  }
};

  // Guardar el estado en el contexto
  useEffect(() => {
    setStatsData(prev => ({
      ...prev,
      date,
      name,
      selectedSkill
    }));
  }, [date, name, selectedSkill]);return (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 to-blue-600 p-2 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white bg-opacity-90 rounded-lg shadow-lg p-3 sm:p-4 md:p-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-4 sm:mb-6 md:mb-8 text-blue-600">
            Estadísticas de Voleibol de Playa
          </h1>
          
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4 sm:space-y-6">
            {/* Fila de información básica más compacta */}
            <div className="flex flex-wrap gap-2 sm:gap-4">
              <div className="flex-grow min-w-[120px] max-w-[150px]">
                <label className="block text-xs font-medium text-gray-700 mb-1">Fecha</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-1.5 border rounded-md text-sm"
                />
              </div>

              <div className="flex-grow min-w-[150px]">
                <label className="block text-xs font-medium text-gray-700 mb-1">Nombre/Equipo</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-1.5 border rounded-md text-sm"
                  placeholder="Ingrese nombre o equipo"
                />
              </div>

              {/* Pestañas para tipo de fundamento */}
              <div className="flex-grow min-w-[300px]">
                <div className="flex mb-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('fundamentos')}
                    className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-t-md transition-colors ${
                      activeTab === 'fundamentos'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    Fundamentos
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('fases')}
                    className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-t-md transition-colors ${
                      activeTab === 'fases'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    Fases
                  </button>
                </div>

                <div className="flex gap-1 p-1 border rounded-md bg-white">
                  {skillCategories[activeTab].map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => setSelectedSkill(skill)}
                      className={`flex-1 px-2 py-1.5 text-xs font-medium rounded transition-colors ${
                        selectedSkill === skill
                          ? 'bg-blue-100 text-blue-800 font-semibold'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Marcador y Sets */}
            <ScoreKeeper chartRef={chartRef} />

            {/* Selector de Jugador y Vista de Estadísticas con indicador mejorado */}
            <div className="space-y-4">
              {/* Selector de jugador */}
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Seleccionar Jugador para Estadísticas:</h3>
                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedPlayer(1)}
                    className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg transition-all ${
                      selectedPlayer === 1
                        ? 'bg-blue-600 text-white shadow-md transform scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <User className="h-5 w-5 mr-2" />
                    <span className="text-sm font-medium">Jugador 1</span>
                  </button>
                  
                  <button
                    onClick={() => setSelectedPlayer(2)}
                    className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg transition-all ${
                      selectedPlayer === 2
                        ? 'bg-green-600 text-white shadow-md transform scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <User className="h-5 w-5 mr-2" />
                    <span className="text-sm font-medium">Jugador 2</span>
                  </button>
                  
                  <button
                    onClick={() => setSelectedPlayer(null)}
                    className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg transition-all ${
                      selectedPlayer === null
                        ? 'bg-purple-600 text-white shadow-md transform scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Users className="h-5 w-5 mr-2" />
                    <span className="text-sm font-medium">Ambos</span>
                  </button>
                </div>
              </div>{/* Indicador de jugador activo */}
              <div className={`p-3 rounded-lg ${
                selectedPlayer === 1 ? 'bg-blue-50 border-l-4 border-blue-500' :
                selectedPlayer === 2 ? 'bg-green-50 border-l-4 border-green-500' :
                'bg-purple-50 border-l-4 border-purple-500'
              }`}>
                <div className="flex items-center">
                  {selectedPlayer === 1 && (
                    <>
                      <User className="h-6 w-6 mr-2 text-blue-600" />
                      <div>
                        <p className="font-medium text-blue-600">Registrando para Jugador 1</p>
                        <p className="text-xs text-gray-600">Los botones de estadísticas se aplicarán solo al Jugador 1</p>
                      </div>
                    </>
                  )}
                  
                  {selectedPlayer === 2 && (
                    <>
                      <User className="h-6 w-6 mr-2 text-green-600" />
                      <div>
                        <p className="font-medium text-green-600">Registrando para Jugador 2</p>
                        <p className="text-xs text-gray-600">Los botones de estadísticas se aplicarán solo al Jugador 2</p>
                      </div>
                    </>
                  )}
                  
                  {selectedPlayer === null && (
                    <>
                      <Users className="h-6 w-6 mr-2 text-purple-600" />
                      <div>
                        <p className="font-medium text-purple-600">Registrando para ambos jugadores</p>
                        <p className="text-xs text-gray-600">Los botones de estadísticas se aplicarán a ambos jugadores</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {/* Selector de vista de estadísticas (total o set actual) */}
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Vista de estadísticas:</h3>
                <div className="flex rounded overflow-hidden border">
                  <button
                    onClick={() => setShowCurrentSetStats(true)}
                    className={`flex-1 px-3 py-1.5 text-sm ${
                      showCurrentSetStats
                        ? 'bg-blue-500 text-white font-medium' 
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Set Actual ({matchData.currentSet})
                  </button>
                  <button
                    onClick={() => setShowCurrentSetStats(false)}
                    className={`flex-1 px-3 py-1.5 text-sm ${
                      !showCurrentSetStats 
                        ? 'bg-blue-500 text-white font-medium' 
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Total Partido
                  </button>
                </div>
              </div>
            </div>

            {/* Botones para estadísticas */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <StatButton statType="doublePositive" label="## (Doble Positivo)" color="#22c55e" />
              <StatButton statType="positive" label="+ (Positivo)" color="#3b82f6" />
              <StatButton statType="overpass" label="/ (Overpass)" color="#f59e0b" />
              <StatButton statType="negative" label="- (Negativo)" color="#ef4444" />
              <StatButton statType="doubleNegative" label="= (Doble Negativo)" color="#7f1d1d" />
            </div>

            {/* Gráfico de estadísticas */}
            <div className="w-full" ref={chartRef}>
                <div className="bg-white p-4 rounded-lg h-[300px] sm:h-[400px]">
                  <h4 className="text-sm font-medium mb-2 text-center">
                    Estadísticas {showCurrentSetStats ? `Set ${matchData.currentSet}` : 'Totales'} - {
                      statView === 'player1' ? 'Jugador 1' :
                      statView === 'player2' ? 'Jugador 2' :
                      'Equipo'
                    }
                  </h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: '##', value: currentStats.doublePositive, color: '#22c55e' },
                      { name: '+', value: currentStats.positive, color: '#3b82f6' },
                      { name: '/', value: currentStats.overpass, color: '#f59e0b' },
                      { name: '-', value: currentStats.negative, color: '#ef4444' },
                      { name: '=', value: currentStats.doubleNegative, color: '#7f1d1d' }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value}`, 'Cantidad']} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {[
                          { color: '#22c55e' },
                          { color: '#3b82f6' },
                          { color: '#f59e0b' },
                          { color: '#ef4444' },
                          { color: '#7f1d1d' }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            
            {/* Gráfico comparativo por sets */}
            <div className="w-full" ref={setChartRef}>
              <div className="bg-white p-4 rounded-lg h-[300px] sm:h-[400px]">
                <h3 className="text-sm font-medium mb-2">Comparación de Eficiencia por Set</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={prepareSetComparisonData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis 
                      label={{ value: 'Eficiencia %', angle: -90, position: 'insideLeft' }} 
                      domain={[0, 100]}
                    />
                    <Tooltip formatter={(value) => [`${value.toFixed(2)}%`, '']} />
                    <Legend />
                    <Bar dataKey="Jugador 1" fill="#3b82f6" />
                    <Bar dataKey="Jugador 2" fill="#22c55e" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Vista de estadísticas por jugador */}
            <div className="bg-white p-4 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-semibold">
                  Estadísticas {showCurrentSetStats ? `Set ${matchData.currentSet}` : 'Totales'}
                </h3>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => setStatView('total')}
                    className={`px-3 py-1 text-xs rounded-full ${
                      statView === 'total' 
                        ? 'bg-purple-100 text-purple-800 font-medium' 
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <Users className="h-3 w-3 inline mr-1" />
                    Equipo
                  </button>
                  <button
                    onClick={() => setStatView('player1')}
                    className={`px-3 py-1 text-xs rounded-full ${
                      statView === 'player1' 
                        ? 'bg-blue-100 text-blue-800 font-medium' 
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <User className="h-3 w-3 inline mr-1" />
                    Jugador 1
                  </button>
                  <button
                    onClick={() => setStatView('player2')}
                    className={`px-3 py-1 text-xs rounded-full ${
                      statView === 'player2' 
                        ? 'bg-green-100 text-green-800 font-medium' 
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <User className="h-3 w-3 inline mr-1" />
                    Jugador 2
                  </button>
                </div>
              </div>
              
              {/* Tabla de estadísticas */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Símbolo
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cantidad
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Doble Positivo</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">##</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">{currentStats.doublePositive}</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Positivo</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">+</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold">{currentStats.positive}</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Overpass</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">/</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 font-semibold">{currentStats.overpass}</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Negativo</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">-</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">{currentStats.negative}</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Doble Negativo</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">=</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-800 font-semibold">{currentStats.doubleNegative}</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Total Acciones</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"></td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">{calculateTotalActions()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>{/* Resultados */}
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h4 className="font-medium text-sm text-blue-800 mb-1">Eficiencia</h4>
                  <p className="text-2xl font-bold text-blue-600">{calculateEfficiency()}%</p>
                  <p className="text-xs text-blue-500 mt-1">Basado en ponderación de acciones</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <h4 className="font-medium text-sm text-green-800 mb-1">Eficacia</h4>
                  <p className="text-2xl font-bold text-green-600">{calculateEffectiveness()}%</p>
                  <p className="text-xs text-green-500 mt-1">Acciones positivas / total</p>
                </div>
              </div>
              
              {/* Leyenda de jugador actual */}
              <div className={`mt-4 p-3 rounded-lg text-sm ${
                statView === 'player1' ? 'bg-blue-50 text-blue-800' :
                statView === 'player2' ? 'bg-green-50 text-green-800' :
                'bg-purple-50 text-purple-800'
              }`}>
                Visualizando estadísticas para: <span className="font-medium">
                  {statView === 'player1' ? 'Jugador 1' :
                  statView === 'player2' ? 'Jugador 2' :
                  'Equipo completo'}
                </span>
              </div>
            </div>
            
            {/* Línea de tiempo de acciones */}
            <ActionTimeline />
            
            {/* Criterios de Evaluación */}
            <div className="mt-4">
              <EvaluationCriteria />
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4">
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center justify-center px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm sm:text-base"
              >
                <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                <span>Resetear</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/tendencias')}
                className="flex items-center justify-center px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm sm:text-base"
              >
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                <span>Mapa de Calor</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={!name || !date || !selectedSkill}
                className={`flex items-center justify-center px-3 py-2 rounded-md transition-colors text-sm sm:text-base ${
                  !name || !date || !selectedSkill
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                <Download className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                <span>Descargar PDF</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VolleyballStats;