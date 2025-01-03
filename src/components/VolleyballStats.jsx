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

const HEATMAP_COLORS = [
  'rgba(0, 255, 0, 0.3)',
  'rgba(255, 255, 0, 0.4)',
  'rgba(255, 165, 0, 0.5)',
  'rgba(255, 0, 0, 0.6)'
];

const getHeatMapColor = (intensity) => {
  const index = Math.min(Math.floor(intensity * HEATMAP_COLORS.length), HEATMAP_COLORS.length - 1);
  return HEATMAP_COLORS[index];
};

const VolleyballStats = () => {
  const navigate = useNavigate();
  const { statsData, setStatsData } = useVolleyball();
  const deviceSize = useDeviceSize();
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const [heatmap, setHeatmap] = useState(new Map());
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
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      setupHighDPI(canvas, canvas.getContext('2d'));
      drawCourt();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [deviceSize, heatmap]);

  const drawCourt = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    
    const baseWidth = Math.min(canvas.width * 0.9, 800);
    const baseHeight = baseWidth * (9/16);
    
    const startX = (canvas.width - baseWidth) / 2;
    const startY = (canvas.height - baseHeight) / 2;

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

    const courtWidth = baseWidth * 0.8;
    const courtHeight = baseHeight * 0.8;
    const courtStartX = startX + (baseWidth - courtWidth) / 2;
    const courtStartY = startY + (baseHeight - courtHeight) / 2;

    context.strokeStyle = '#000080';
    context.lineWidth = Math.max(2, canvas.width * 0.004);
    context.strokeRect(courtStartX, courtStartY, courtWidth, courtHeight);

    if (deviceSize.isMobile) {
      const netY = courtStartY + courtHeight/2;
      context.strokeStyle = '#666666';
      context.lineWidth = Math.max(3, canvas.width * 0.006);
      context.beginPath();
      context.moveTo(courtStartX - 10, netY);
      context.lineTo(courtStartX + courtWidth + 10, netY);
      context.stroke();
    } else {
      const netX = courtStartX + courtWidth/2;
      context.strokeStyle = '#666666';
      context.lineWidth = Math.max(3, canvas.width * 0.006);
      context.beginPath();
      context.moveTo(netX, courtStartY - 10);
      context.lineTo(netX, courtStartY + courtHeight + 10);
      context.stroke();
    }

    heatmap.forEach((value, key) => {
      const [x, y] = key.split(',').map(Number);
      const radius = Math.min(30, canvas.width * 0.05);
      const heatGradient = context.createRadialGradient(x, y, 0, x, y, radius);
      heatGradient.addColorStop(0, getHeatMapColor(value));
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
    newHeatmap.set(key, Math.min((heatmap.get(key) || 0) + 0.25, 1));
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
      const canvas = canvasRef.current;
      const doc = new jsPDF(deviceSize.isMobile ? 'p' : 'l', 'mm', 'a4');
      
      doc.setFontSize(16);
      doc.text('Estadísticas de Voleibol de Playa', 15, 15);
      
      doc.setFontSize(12);
      doc.text(`Fecha: ${date}`, 15, 25);
      doc.text(`Nombre/Equipo: ${name}`, 15, 32);
      doc.text(`Fundamento: ${selectedSkill}`, 15, 39);

      doc.text('Estadísticas:', 15, 50);
      doc.text(`Total de Acciones: ${calculateTotalActions()}`, 20, 57);
      Object.entries(stats).forEach(([key, value], index) => {
        doc.text(`${key}: ${value}`, 20, 64 + (index * 7));
      });
      doc.text(`Eficiencia: ${calculateEfficiency()}%`, 20, 99);
      doc.text(`Eficacia: ${calculateEffectiveness()}%`, 20, 106);

      if (canvas) {
        const canvasImage = canvas.toDataURL('image/png');
        const aspectRatio = canvas.height / canvas.width;
        const imgWidth = doc.internal.pageSize.getWidth() * 0.4;
        const imgHeight = imgWidth * aspectRatio;
        doc.addImage(canvasImage, 'PNG', 100, 20, imgWidth, imgHeight);
      }

      const chartDiv = chartRef.current;
      if (chartDiv) {
        const chartImage = await html2canvas(chartDiv);
        const chartData = chartImage.toDataURL('image/png');
        doc.addImage(chartData, 'PNG', 15, 120, 80, 40);
      }

      doc.save(`estadisticas-${name}-${date}.pdf`);
    } catch (error) {
      console.error('Error al generar el PDF:', error);
      alert('Error al generar el PDF. Por favor, intente nuevamente.');
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
              <div className="aspect-[16/9] w-full mx-auto">
                  <canvas
                  ref={canvasRef}
                  onClick={handleCanvasClick}
                  onTouchStart={handleCanvasClick}
                  className="w-full h-full border border-gray-300 rounded-lg touch-none"
                  style={{ touchAction: 'none' }}
                />
              </div>

              <div ref={chartRef} className="bg-white p-4 rounded-lg">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { name: '#', value: stats.doublePositive, color: '#22c55e' },
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