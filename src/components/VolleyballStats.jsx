import React, { useState, useRef, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ArrowUpCircle, ArrowDownCircle, RotateCcw, Download, TrendingUp } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useNavigate } from 'react-router-dom';
import { useVolleyball } from '../context/VolleyballContext';
import { useDeviceSize } from '../hooks/useDeviceSize';
import { setupHighDPI } from '../utils/canvas-utils';

const HEATMAP_COLORS = {
  red: [
    'rgba(255, 0, 0, 0.3)',
    'rgba(255, 0, 0, 0.4)',
    'rgba(255, 0, 0, 0.5)',
    'rgba(255, 0, 0, 0.6)'
  ],
  blue: [
    'rgba(0, 0, 255, 0.3)',
    'rgba(0, 0, 255, 0.4)',
    'rgba(0, 0, 255, 0.5)',
    'rgba(0, 0, 255, 0.6)'
  ]
};

const getHeatMapColor = (intensity, colorType) => {
  const colors = HEATMAP_COLORS[colorType];
  const index = Math.min(Math.floor(intensity * colors.length), colors.length - 1);
  return colors[index];
};

const VolleyballStats = () => {
  const navigate = useNavigate();
  const { statsData, setStatsData } = useVolleyball();
  const deviceSize = useDeviceSize();
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const [heatmap, setHeatmap] = useState(new Map());
  const [heatmapColor, setHeatmapColor] = useState('red');
  const [date, setDate] = useState(statsData.date || '');
  const [name, setName] = useState(statsData.name || '');
  const [selectedSkill, setSelectedSkill] = useState(statsData.selectedSkill || '');
  const [stats, setStats] = useState(statsData.stats || {
    doublePositive: 0,
    positive: 0,
    regular: 0,
    negative: 0,
    doubleNegative: 0
  });

  const skills = ['K1', 'K2', 'Recepción', 'Armado', 'Ataque'];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const container = canvas.parentElement;
      if (deviceSize.isMobile) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientWidth * 1.5;
      } else if (deviceSize.isTablet) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientWidth * 0.6;
      } else {
        canvas.width = container.clientWidth;
        canvas.height = container.clientWidth * 0.5625;
      }
      
      setupHighDPI(canvas, canvas.getContext('2d'));
      drawCourt();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [deviceSize, heatmap, heatmapColor]);

  const drawCourt = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    const isMobile = deviceSize.isMobile;
    
    const courtWidth = isMobile ? canvas.width * 0.8 : canvas.width * 0.85;
    const courtHeight = isMobile ? canvas.height * 0.85 : canvas.height * 0.8;
    
    const startX = (canvas.width - courtWidth) / 2;
    const startY = (canvas.height - courtHeight) / 2;

    context.clearRect(0, 0, canvas.width, canvas.height);

    const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#f4d03f');
    gradient.addColorStop(1, '#f4c778');
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = '#e6c88e';
    for (let i = 0; i < canvas.width; i += 4) {
      for (let j = 0; j < canvas.height; j += 4) {
        if (Math.random() > 0.5) context.fillRect(i, j, 2, 2);
      }
    }

    context.strokeStyle = '#000080';
    context.lineWidth = Math.max(2, canvas.width * 0.004);
    context.strokeRect(startX, startY, courtWidth, courtHeight);

    // Dibujar red según orientación
    if (isMobile) {
      const netY = startY + courtHeight / 2;
      context.beginPath();
      context.strokeStyle = '#666666';
      context.lineWidth = Math.max(3, canvas.width * 0.006);
      context.moveTo(startX - 10, netY);
      context.lineTo(startX + courtWidth + 10, netY);
      context.stroke();

      // Detalles de la red vertical
      context.lineWidth = 1;
      for (let x = startX; x < startX + courtWidth; x += 15) {
        context.beginPath();
        context.moveTo(x, netY - 3);
        context.lineTo(x, netY + 3);
        context.stroke();
      }
    } else {
      const netX = startX + courtWidth / 2;
      context.beginPath();
      context.strokeStyle = '#666666';
      context.lineWidth = Math.max(3, canvas.width * 0.006);
      context.moveTo(netX, startY - 10);
      context.lineTo(netX, startY + courtHeight + 10);
      context.stroke();

      // Detalles de la red horizontal
      context.lineWidth = 1;
      for (let y = startY; y < startY + courtHeight; y += 15) {
        context.beginPath();
        context.moveTo(netX - 3, y);
        context.lineTo(netX + 3, y);
        context.stroke();
      }
    }

    // Dibujar mapa de calor
    heatmap.forEach((value, key) => {
      const [x, y] = key.split(',').map(Number);
      const radius = Math.min(30, canvas.width * 0.05);
      const heatGradient = context.createRadialGradient(x, y, 0, x, y, radius);
      // Usamos el color guardado para cada punto
      heatGradient.addColorStop(0, getHeatMapColor(value.intensity, value.color));
      heatGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      context.fillStyle = heatGradient;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    });
  };
  const handleCanvasClick = (event) => {
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
  
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = ((event.touches ? event.touches[0].clientX : event.clientX) - rect.left) * scaleX;
    const y = ((event.touches ? event.touches[0].clientY : event.clientY) - rect.top) * scaleY;
  
    const key = `${x},${y}`;
    const newHeatmap = new Map(heatmap);
    const currentValue = heatmap.get(key);
    
    newHeatmap.set(key, {
      intensity: Math.min((currentValue?.intensity || 0) + 0.25, 1),
      color: heatmapColor // Guardamos el color actual
    });
    
    setHeatmap(newHeatmap);
    drawCourt();
  };

  const handleReset = () => {
    if (window.confirm('¿Está seguro de que desea reiniciar las estadísticas y el mapa de calor?')) {
      setHeatmap(new Map());
      setStats({
        doublePositive: 0,
        positive: 0,
        regular: 0,
        negative: 0,
        doubleNegative: 0
      });
      drawCourt();
    }
  };

  const calculateTotalActions = () => Object.values(stats).reduce((a, b) => a + b, 0);

  const calculateEfficiency = () => {
    const total = calculateTotalActions();
    if (total === 0) return 0;
    const weightedSum = (
      stats.doublePositive * 4 +
      stats.positive * 2 +
      stats.regular * 0 +
      stats.negative * -2 +
      stats.doubleNegative * -4
    );
    return ((weightedSum / (total * 4)) * 100).toFixed(2);
  };

  const calculateEffectiveness = () => {
    const total = calculateTotalActions();
    if (total === 0) return 0;
    return (((stats.doublePositive + stats.positive) / total) * 100).toFixed(2);
  };

  const handleDownloadPDF = async () => {
    if (!name || !date || !selectedSkill) {
      alert('Por favor, complete todos los campos antes de descargar el PDF');
      return;
    }
  
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Título
      doc.setFontSize(24);
      doc.setTextColor(0, 0, 255);
      doc.text('Estadísticas de Voleibol de Playa', pageWidth/2, 20, { align: 'center' });
      
      // División del espacio: Lado izquierdo para estadísticas y gráfico, lado derecho para la cancha
      const leftWidth = pageWidth * 0.5;
      
      // Información básica
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text([
        `Fecha: ${format(new Date(date), "PPP", { locale: es })}`,
        `Nombre/Equipo: ${name}`,
        `Fundamento: ${selectedSkill}`
      ], 20, 35);
  
      // Estadísticas
      doc.setFontSize(14);
      doc.text('Estadísticas:', 20, 55);
      doc.setFontSize(12);
      
      const stats_text = [
        `Total de Acciones: ${calculateTotalActions()}`,
        `Doble Positivo (##): ${stats.doublePositive}`,
        `Positivo (+): ${stats.positive}`,
        `Regular (!): ${stats.regular}`,
        `Negativo (-): ${stats.negative}`,
        `Doble Negativo (=): ${stats.doubleNegative}`,
        '',
        `Eficiencia: ${calculateEfficiency()}%`,
        `Eficacia: ${calculateEffectiveness()}%`
      ];
      
      doc.text(stats_text, 20, 65);
  
      // Gráfico de barras
      const chartDiv = chartRef.current;
      if (chartDiv) {
        const chartImage = await html2canvas(chartDiv);
        const chartData = chartImage.toDataURL('image/png');
        doc.addImage(chartData, 'PNG', 20, 120, leftWidth - 30, 60);
      }
  
      // Cancha con mapa de calor - mantener proporción cuadrada
      const canvas = canvasRef.current;
      if (canvas) {
        const canvasImage = canvas.toDataURL('image/png');
        const maxHeight = pageHeight - 40; // Margen superior e inferior
        const maxWidth = (pageWidth - leftWidth) - 30; // Ancho disponible menos margen
        const size = Math.min(maxHeight, maxWidth); // Usar el menor valor para mantener proporción
  
        // Calcular posición para centrar verticalmente
        const yPos = (pageHeight - size) / 2;
        doc.addImage(
          canvasImage, 
          'PNG', 
          leftWidth + 10, // X: justo después de la sección izquierda
          yPos, // Y: centrado verticalmente
          size, // Ancho: cuadrado
          size // Alto: igual al ancho para mantener proporción
        );
      }
  
      // Leyenda de colores en la parte inferior
      doc.setFontSize(10);
      doc.text('Leyenda de colores:', 20, pageHeight - 25);
      
      const colors = [
        { label: 'Doble Positivo (##)', color: '#22c55e' },
        { label: 'Positivo (+)', color: '#3b82f6' },
        { label: 'Regular (!)', color: '#f59e0b' },
        { label: 'Negativo (-)', color: '#ef4444' },
        { label: 'Doble Negativo (=)', color: '#7f1d1d' }
      ];
  
      let xOffset = 20;
      colors.forEach((item) => {
        doc.setFillColor(item.color);
        doc.rect(xOffset, pageHeight - 20, 5, 5, 'F');
        doc.text(item.label, xOffset + 7, pageHeight - 16);
        xOffset += 50;
      });
  
      // Pie de página
      doc.setFontSize(8);
      doc.text(
        `Generado el ${format(new Date(), "PPP 'a las' HH:mm", { locale: es })}`, 
        pageWidth - 60, 
        pageHeight - 5
      );
  
      doc.save(`estadisticas-${name}-${date}.pdf`);
    } catch (error) {
      console.error('Error al generar el PDF:', error);
      alert('Error al generar el PDF. Por favor, intente nuevamente.');
    }
  };
  // En el VolleyballStats.jsx, añade esta función después de las constantes iniciales
const getCourtDimensions = () => {
  const isMobile = window.innerWidth < 768;
  const container = canvasRef.current?.parentElement;
  
  if (!container) return { width: 0, height: 0 };

  if (isMobile) {
    // En móviles, la cancha es vertical
    const width = container.clientWidth * 0.9;
    return {
      width: width,
      height: width * (4/3), // Proporción vertical 4:3
      isMobile: true
    };
  } else {
    // En desktop, la cancha es horizontal
    const width = container.clientWidth * 0.9;
    const height = width * (3/4); // Proporción horizontal 3:4
    return {
      width: width,
      height: height,
      isMobile: false
    };
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 to-blue-600 p-2 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white bg-opacity-90 rounded-lg shadow-lg p-3 sm:p-4 md:p-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-4 sm:mb-6 md:mb-8 text-blue-600">
            Estadísticas de Voleibol de Playa
          </h1>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Fecha</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-2 border rounded-md"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Nombre/Equipo</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  placeholder="Ingrese nombre o equipo"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Fundamento</label>
                <select
                  value={selectedSkill}
                  onChange={(e) => setSelectedSkill(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Seleccione fundamento</option>
                  {skills.map((skill) => (
                    <option key={skill} value={skill}>{skill}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {[
                { key: 'doublePositive', label: '## (Doble Positivo)', color: '#22c55e' },
                { key: 'positive', label: '+ (Positivo)', color: '#3b82f6' },
                { key: 'regular', label: '! (Regular)', color: '#f59e0b' },
                { key: 'negative', label: '- (Negativo)', color: '#ef4444' },
                { key: 'doubleNegative', label: '= (Doble Negativo)', color: '#7f1d1d' }
              ].map(({ key, label, color }) => (
                <div key={key} className="flex flex-col items-center space-y-2 p-2 bg-gray-50 rounded-lg">
                  <span className="text-xs sm:text-sm font-medium text-center">{label}</span>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setStats(prev => ({
                        ...prev,
                        [key]: Math.max(0, prev[key] - 1)
                      }))}
                      className="p-1 sm:p-2 hover:bg-gray-100 rounded-full"
                      style={{ color }}
                    >
                      <ArrowDownCircle className="h-4 w-4 sm:h-6 sm:w-6" />
                    </button>
                    <span className="w-8 sm:w-12 text-center font-bold" style={{ color }}>
                      {stats[key]}
                    </span>
                    <button
                      type="button"
                      onClick={() => setStats(prev => ({
                        ...prev,
                        [key]: prev[key] + 1
                      }))}
                      className="p-1 sm:p-2 hover:bg-gray-100 rounded-full"
                      style={{ color }}
                    >
                      <ArrowUpCircle className="h-4 w-4 sm:h-6 sm:w-6" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                {/* Selector de color para el mapa de calor */}
                <div className="flex items-center space-x-4 mb-4">
                  <span className="text-sm font-medium">Color del mapa de calor:</span>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setHeatmapColor('red')}
                      className={`w-8 h-8 rounded-full ${
                        heatmapColor === 'red' 
                          ? 'ring-2 ring-offset-2 ring-red-500' 
                          : ''
                      } bg-red-500`}
                    />
                    <button
                      type="button"
                      onClick={() => setHeatmapColor('blue')}
                      className={`w-8 h-8 rounded-full ${
                        heatmapColor === 'blue' 
                          ? 'ring-2 ring-offset-2 ring-blue-500' 
                          : ''
                      } bg-blue-500`}
                    />
                  </div>
                </div>

                <div className={`aspect-${deviceSize.isMobile ? '[2/3]' : '[16/9]'} w-full`}>
                  <canvas
                    ref={canvasRef}
                    onClick={handleCanvasClick}
                    onTouchStart={handleCanvasClick}
                    className="w-full h-full border border-gray-300 rounded-lg touch-none"
                    style={{ touchAction: 'none' }}
                  />
                </div>
              </div>

              <div ref={chartRef} className="bg-white p-4 rounded-lg">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { name: '##', value: stats.doublePositive, color: '#22c55e' },
                    { name: '+', value: stats.positive, color: '#3b82f6' },
                    { name: '!', value: stats.regular, color: '#f59e0b' },
                    { name: '-', value: stats.negative, color: '#ef4444' },
                    { name: '=', value: stats.doubleNegative, color: '#7f1d1d' }
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

            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Resultados</h3>
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
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                <RotateCcw className="h-5 w-5 mr-2" />
                Resetear
              </button>
              <button
                type="button"
                onClick={() => navigate('/tendencias')}
                className="flex items-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
              >
                <TrendingUp className="h-5 w-5 mr-2" />
                Tendencias
              </button>
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={!name || !date || !selectedSkill}
                className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                  !name || !date || !selectedSkill
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                <Download className="h-5 w-5 mr-2" />
                Descargar PDF
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VolleyballStats;