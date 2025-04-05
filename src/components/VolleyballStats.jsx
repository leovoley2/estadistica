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
import PlayerSelector from './PlayerSelector';
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
  };

  // Función para actualizar las estadísticas de un jugador específico
  const handleStatChange = (statType, value) => {
    if (selectedPlayer === null) {
      // Actualizar ambos jugadores
      updatePlayerStat(1, statType, value);
      updatePlayerStat(2, statType, value);
      
      // Registrar acción para ambos jugadores
      if (value > 0) {
        addTimelineAction(1, statType, selectedSkill);
        addTimelineAction(2, statType, selectedSkill);
      }
    } else {
      // Actualizar solo el jugador seleccionado
      updatePlayerStat(selectedPlayer, statType, value);
      
      // Registrar acción solo si estamos añadiendo (no restando)
      if (value > 0) {
        addTimelineAction(selectedPlayer, statType, selectedSkill);
      }
    }
  };

  const calculateTotalActions = () => Object.values(currentStats).reduce((a, b) => a + b, 0);

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
      
      // Título
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
        `Set: ${matchData.currentSet}`,
        `Marcador: ${matchData.teamScore} - ${matchData.opponentScore}`
      ], 15, 25);
  
      // Estadísticas globales
      doc.setFontSize(12);
      doc.text('Estadísticas Totales del Equipo:', 15, 45);
      doc.setFontSize(10);
      
      const stats_text = [
        `Total de Acciones: ${Object.values(statsData.stats).reduce((a, b) => a + b, 0)}`,
        `Doble Positivo (##): ${statsData.stats.doublePositive}`,
        `Positivo (+): ${statsData.stats.positive}`,
        `Overpass (/): ${statsData.stats.overpass}`,
        `Negativo (-): ${statsData.stats.negative}`,
        `Doble Negativo (=): ${statsData.stats.doubleNegative}`,
      ];
      
      doc.text(stats_text, 15, 55);
      
      // Estadísticas por sets
      let yPos = 75;
      
      // Título de la sección
      doc.setFontSize(12);
      doc.text('Estadísticas por Set:', 15, yPos);
      doc.setFontSize(10);
      yPos += 8;
      
      statsData.setStats.forEach((set, index) => {
        if (index < 3) { // Solo mostrar máximo 3 sets
          doc.setFillColor(240, 240, 240);
          doc.rect(15, yPos - 4, 180, 7, 'F');
          doc.text(`Set ${index + 1} - Marcador: ${matchData.sets[index]?.teamScore || 0}-${matchData.sets[index]?.opponentScore || 0}`, 17, yPos);
          yPos += 8;
          
          // Tabla para jugador 1
          doc.text(`Jugador 1:`, 15, yPos);
          yPos += 5;
          
          const setDataP1 = [
            `Doble Positivo (##): ${set.player1Stats.doublePositive}`,
            `Positivo (+): ${set.player1Stats.positive}`,
            `Overpass (/): ${set.player1Stats.overpass}`,
            `Negativo (-): ${set.player1Stats.negative}`,
            `Doble Negativo (=): ${set.player1Stats.doubleNegative}`,
          ];
          
          doc.text(setDataP1, 15, yPos);
          yPos += 15;
          
          // Tabla para jugador 2
          doc.text(`Jugador 2:`, 15, yPos);
          yPos += 5;
          
          const setDataP2 = [
            `Doble Positivo (##): ${set.player2Stats.doublePositive}`,
            `Positivo (+): ${set.player2Stats.positive}`,
            `Overpass (/): ${set.player2Stats.overpass}`,
            `Negativo (-): ${set.player2Stats.negative}`,
            `Doble Negativo (=): ${set.player2Stats.doubleNegative}`,
          ];
          
          doc.text(setDataP2, 15, yPos);
          yPos += 20;
        }
      });

      // Gráfico de barras
      const chartDiv = chartRef.current;
      if (chartDiv) {
        const chartImage = await html2canvas(chartDiv);
        const chartData = chartImage.toDataURL('image/png');
        doc.addImage(chartData, 'PNG', 15, yPos, pageWidth - 30, pageHeight * 0.25);
      }
      
      // Agregar segunda página con gráficos
      doc.addPage();
      
      // Gráfico de comparación por sets
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 255);
      doc.text('Comparación de Eficiencia por Sets', pageWidth/2, 15, { align: 'center' });
      
      // Capturar y agregar el gráfico de comparación
      const setChartDiv = setChartRef.current;
      if (setChartDiv) {
        const setChartImage = await html2canvas(setChartDiv);
        const setChartData = setChartImage.toDataURL('image/png');
        doc.addImage(setChartData, 'PNG', 15, 25, pageWidth - 30, pageHeight * 0.3);
      }
      
      // Criterios de evaluación
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 255);
      doc.text('Criterios de Evaluación', pageWidth/2, pageHeight * 0.4, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Fundamento: ${selectedSkill}`, 15, pageHeight * 0.4 + 10);

      // Tabla de criterios (simplificada para el PDF)
      const criterioPosY = pageHeight * 0.4 + 20;
      const lineHeight = 7;
      
      // Encabezado de tabla
      doc.setFillColor(230, 230, 230);
      doc.rect(15, criterioPosY, 180, 7, 'F');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text("Símbolo", 17, criterioPosY + 5);
      doc.text("Tipo", 47, criterioPosY + 5);
      doc.text("Descripción", 97, criterioPosY + 5);
      
      // Filas de la tabla
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
  
      doc.save(`estadisticas-${name}-${date}.pdf`);
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
  }, [date, name, selectedSkill]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 to-blue-600 p-2 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white bg-opacity-90 rounded-lg shadow-lg p-3 sm:p-4 md:p-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-4 sm:mb-6 md:mb-8 text-blue-600">
            Estadísticas de Voleibol de Playa
          </h1>
          
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4 sm:space-y-6">
            {/* Fila de información básica más compacta */}
            <div className="flex flex-wrap gap-2 sm:gap-4">
              <div className="flex-grow min-w-[120px] max-w-[200px]">
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
            <ScoreKeeper />

            {/* Selector de Jugador y Vista de Estadísticas */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 py-2 px-3 bg-gray-50 rounded-lg">
              <PlayerSelector 
                selectedPlayer={selectedPlayer} 
                onSelectPlayer={setSelectedPlayer} 
              />
              
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <div className="flex rounded overflow-hidden border">
                  <button
                    onClick={() => setStatView('total')}
                    className={`px-3 py-1.5 text-xs ${
                      statView === 'total' 
                        ? 'bg-purple-500 text-white' 
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Users className="h-3 w-3 inline mr-1" />
                    Equipo
                  </button>
                  <button
                    onClick={() => setStatView('player1')}
                    className={`px-3 py-1.5 text-xs ${
                      statView === 'player1' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <User className="h-3 w-3 inline mr-1" />
                    Jugador 1
                  </button>
                  <button
                    onClick={() => setStatView('player2')}
                    className={`px-3 py-1.5 text-xs ${
                      statView === 'player2' 
                        ? 'bg-green-500 text-white' 
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <User className="h-3 w-3 inline mr-1" />
                    Jugador 2
                  </button>
                </div>
                
                <div className="flex rounded overflow-hidden border">
                  <button
                    onClick={() => setShowCurrentSetStats(true)}
                    className={`px-3 py-1.5 text-xs ${
                      showCurrentSetStats
                        ? 'bg-blue-500 text-white' 
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Set Actual
                  </button>
                  <button
                    onClick={() => setShowCurrentSetStats(false)}
                    className={`px-3 py-1.5 text-xs ${
                      !showCurrentSetStats 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Total Partido
                  </button>
                </div>
              </div>
            </div>

            {/* Botones para estadísticas */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-4">
              {[
                { key: 'doublePositive', label: '## (Doble Positivo)', color: '#22c55e' },
                { key: 'positive', label: '+ (Positivo)', color: '#3b82f6' },
                { key: 'overpass', label: '/ (Overpass)', color: '#f59e0b' },
                { key: 'negative', label: '- (Negativo)', color: '#ef4444' },
                { key: 'doubleNegative', label: '= (Doble Negativo)', color: '#7f1d1d' }
              ].map(({ key, label, color }) => (
                <div key={key} className="flex flex-col items-center space-y-1 p-1 sm:p-2 bg-gray-50 rounded-lg">
                  <span className="text-xs sm:text-sm font-medium text-center">{label}</span>
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <button
                      type="button"
                      onClick={() => handleStatChange(key, -1)}
                      className="p-1 hover:bg-gray-100 rounded-full"
                      style={{ color }}
                    >
                      <ArrowDownCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                    <span className="w-6 sm:w-8 text-center font-bold text-sm sm:text-base" style={{ color }}>
                      {currentStats[key]}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleStatChange(key, 1)}
                      className="p-1 hover:bg-gray-100 rounded-full"
                      style={{ color }}
                    >
                      <ArrowUpCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Gráfico de estadísticas */}
            <div className="w-full" ref={chartRef}>
              <div className="bg-white p-4 rounded-lg h-[300px] sm:h-[400px]">
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

            {/* Resultados */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">
                Resultados {statView === 'player1' ? '(Jugador 1)' : statView === 'player2' ? '(Jugador 2)' : '(Equipo)'} - {showCurrentSetStats ? `Set ${matchData.currentSet}` : 'Partido Completo'}
              </h3>
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Total de Acciones: <span className="text-blue-600">{calculateTotalActions()}</span>
                </p>
                <div className="border-t pt-2">
                  <p className="text-sm">Eficiencia: <span className="font-medium">{calculateEfficiency()}%</span></p>
                  <p className="text-sm">Eficacia: <span className="font-medium">{calculateEffectiveness()}%</span></p>
                </div>
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