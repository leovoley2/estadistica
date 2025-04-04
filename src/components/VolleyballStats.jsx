import React, { useState, useRef, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ArrowUpCircle, ArrowDownCircle, RotateCcw, Download, TrendingUp, User, Users } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useNavigate } from 'react-router-dom';
import { useVolleyball } from '../context/VolleyballContext';
import EvaluationCriteria from './EvaluationCriteria';
import ScoreKeeper from './ScoreKeeper';
import PlayerSelector from './PlayerSelector';
import ActionTimeline from './Timeline';

const VolleyballStats = () => {
  const navigate = useNavigate();
  const { 
    statsData, 
    setStatsData, 
    matchData,
    updatePlayerStat,
    addTimelineAction
  } = useVolleyball();
  
  const chartRef = useRef(null);
  
  const [date, setDate] = useState(statsData.date || '');
  const [name, setName] = useState(statsData.name || '');
  const [activeTab, setActiveTab] = useState('fundamentos');
  const [selectedSkill, setSelectedSkill] = useState(statsData.selectedSkill || '');
  const [selectedPlayer, setSelectedPlayer] = useState(1); // Por defecto, jugador 1
  const [statView, setStatView] = useState('total'); // 'total', 'player1', 'player2'
  
  // Referencia corta a las estadísticas según la vista seleccionada
  const currentStats = 
    statView === 'player1' ? statsData.player1Stats :
    statView === 'player2' ? statsData.player2Stats :
    statsData.stats;

  // Definir las categorías disponibles por tipo de tab
  const skillCategories = {
    fundamentos: ['Recepción', 'Armado', 'Defensa', 'Ataque', 'Bloqueo', 'Saque'],
    fases: ['K1', 'K2']
  };

  const handleReset = () => {
    if (window.confirm('¿Está seguro de que desea reiniciar las estadísticas?')) {
      // Resetear las estadísticas del jugador seleccionado o totales
      if (statView === 'player1' || statView === 'player2') {
        const playerKey = statView === 'player1' ? 'player1Stats' : 'player2Stats';
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
      } else {
        // Resetear totales
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
  
      // Estadísticas totales
      doc.setFontSize(12);
      doc.text('Estadísticas del Equipo:', 15, 45);
      doc.setFontSize(10);
      
      const stats_text = [
        `Total de Acciones: ${calculateTotalActions()}`,
        `Doble Positivo (##): ${statsData.stats.doublePositive}`,
        `Positivo (+): ${statsData.stats.positive}`,
        `Overpass (/): ${statsData.stats.overpass}`,
        `Negativo (-): ${statsData.stats.negative}`,
        `Doble Negativo (=): ${statsData.stats.doubleNegative}`,
        '',
        `Eficiencia: ${calculateEfficiency()}%`,
        `Eficacia: ${calculateEffectiveness()}%`
      ];
      
      doc.text(stats_text, 15, 55);
  
      // Estadísticas por jugador
      doc.setFontSize(12);
      doc.text('Jugador 1:', 15, 85);
      doc.setFontSize(10);
      
      const player1_stats = [
        `Total de Acciones: ${Object.values(statsData.player1Stats).reduce((a, b) => a + b, 0)}`,
        `Doble Positivo (##): ${statsData.player1Stats.doublePositive}`,
        `Positivo (+): ${statsData.player1Stats.positive}`,
        `Overpass (/): ${statsData.player1Stats.overpass}`,
        `Negativo (-): ${statsData.player1Stats.negative}`,
        `Doble Negativo (=): ${statsData.player1Stats.doubleNegative}`
      ];
      
      doc.text(player1_stats, 15, 95);
      
      doc.setFontSize(12);
      doc.text('Jugador 2:', 15, 115);
      doc.setFontSize(10);
      
      const player2_stats = [
        `Total de Acciones: ${Object.values(statsData.player2Stats).reduce((a, b) => a + b, 0)}`,
        `Doble Positivo (##): ${statsData.player2Stats.doublePositive}`,
        `Positivo (+): ${statsData.player2Stats.positive}`,
        `Overpass (/): ${statsData.player2Stats.overpass}`,
        `Negativo (-): ${statsData.player2Stats.negative}`,
        `Doble Negativo (=): ${statsData.player2Stats.doubleNegative}`
      ];
      
      doc.text(player2_stats, 15, 125);
      
      // Gráfico de barras
      const chartDiv = chartRef.current;
      if (chartDiv) {
        const chartImage = await html2canvas(chartDiv);
        const chartData = chartImage.toDataURL('image/png');
        doc.addImage(chartData, 'PNG', 15, 145, pageWidth - 30, pageHeight * 0.25);
      }

      // Criterios de evaluación según el fundamento seleccionado
      doc.addPage();
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 255);
      doc.text('Criterios de Evaluación', pageWidth/2, 15, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Fundamento: ${selectedSkill}`, 15, 25);

      // Tabla de criterios (simplificada para el PDF)
      const criterioPosY = 35;
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
            <div className="flex flex-wrap items-center justify-between gap-2 py-2 px-3 bg-gray-50 rounded-lg">
              <PlayerSelector 
                selectedPlayer={selectedPlayer} 
                onSelectPlayer={setSelectedPlayer} 
              />
              
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
                    <Tooltip />
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

            {/* Resultados */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">
                Resultados {statView === 'player1' ? '(Jugador 1)' : statView === 'player2' ? '(Jugador 2)' : '(Equipo)'}
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