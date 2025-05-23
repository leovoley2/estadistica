import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Download, User, Users } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useVolleyball } from '../context/VolleyballContext';
import { useDeviceSize } from '../hooks/useDeviceSize';
import PlayerSelector from './PlayerSelector';

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
  ],
  green: [
    'rgba(0, 128, 0, 0.3)', 
    'rgba(0, 128, 0, 0.4)',
    'rgba(0, 128, 0, 0.5)',
    'rgba(0, 128, 0, 0.6)'
  ]
};

const getHeatMapColor = (intensity, colorType) => {
  const colors = HEATMAP_COLORS[colorType];
  const index = Math.min(Math.floor(intensity * colors.length), colors.length - 1);
  return colors[index];
};

const VolleyballTrends = () => {
  const navigate = useNavigate();
  const { statsData, trendsData, setTrendsData, matchData } = useVolleyball();
  const deviceSize = useDeviceSize();
  const canvasRef = useRef(null);
  const [heatmap, setHeatmap] = useState(new Map());
  const [heatmapColor, setHeatmapColor] = useState('red');
  const [teamName, setTeamName] = useState(trendsData.teamName || statsData.name || '');
  const [selectedSkill, setSelectedSkill] = useState(statsData.selectedSkill || '');
  const [selectedPlayer, setSelectedPlayer] = useState(null); // null = equipo completo

  const getCourtDimensions = () => {
    const isMobile = window.innerWidth < 768;
    const container = canvasRef.current?.parentElement;
    
    if (!container) return { width: 0, height: 0 };

    if (isMobile) {
      const width = container.clientWidth * 0.9;
      return {
        width: width,
        height: width * (4/3),
        isMobile: true
      };
    } else {
      const width = container.clientWidth * 0.9;
      const height = width * (3/4);
      return {
        width: width,
        height: height,
        isMobile: false
      };
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const { width, height } = getCourtDimensions();
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      context.lineCap = 'round';
      context.lineJoin = 'round';
      drawCourt();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [deviceSize, heatmap, heatmapColor]);

  // Actualizar color del mapa de calor basado en el jugador seleccionado
  useEffect(() => {
    if (selectedPlayer === 1) {
      setHeatmapColor('blue');
    } else if (selectedPlayer === 2) {
      setHeatmapColor('green');
    } else {
      setHeatmapColor('red');
    }
  }, [selectedPlayer]);

  const drawCourt = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    const { width, height, isMobile } = getCourtDimensions();

    // Limpiar canvas
    context.clearRect(0, 0, width, height);

    // Color de fondo (arena)
    const gradient = context.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#f4d03f');
    gradient.addColorStop(1, '#f4c778');
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    // Textura de arena
    context.fillStyle = '#e6c88e';
    for (let i = 0; i < width; i += 4) {
      for (let j = 0; j < height; j += 4) {
        if (Math.random() > 0.5) {
          context.fillRect(i, j, 2, 2);
        }
      }
    }

    // Calcular dimensiones de la cancha
    const margin = width * 0.1;
    const courtWidth = width - (margin * 2);
    const courtHeight = height - (margin * 2);

    // Dibujar cancha
    context.strokeStyle = '#000080';
    context.lineWidth = Math.max(2, width * 0.004);
    context.strokeRect(margin, margin, courtWidth, courtHeight);

    // Dibujar red
    context.strokeStyle = '#666666';
    context.lineWidth = Math.max(3, width * 0.006);

    if (isMobile) {
      // Red horizontal para móviles
      const netY = height / 2;
      context.beginPath();
      context.moveTo(margin - 5, netY);
      context.lineTo(width - margin + 5, netY);
      context.stroke();

      // Detalles de la red
      const netSpacing = courtWidth / 20;
      for (let x = margin; x <= width - margin; x += netSpacing) {
        context.beginPath();
        context.moveTo(x, netY - 3);
        context.lineTo(x, netY + 3);
        context.stroke();
      }
    } else {
      // Red vertical para desktop
      const netX = width / 2;
      context.beginPath();
      context.moveTo(netX, margin - 5);
      context.lineTo(netX, height - margin + 5);
      context.stroke();

      // Detalles de la red
      const netSpacing = courtHeight / 15;
      for (let y = margin; y <= height - margin; y += netSpacing) {
        context.beginPath();
        context.moveTo(netX - 3, y);
        context.lineTo(netX + 3, y);
        context.stroke();
      }
    }

    // Dibujar zonas de calor
    heatmap.forEach((value, key) => {
      const [x, y] = key.split(',').map(Number);
      const radius = Math.min(30, width * 0.05);
      const heatGradient = context.createRadialGradient(x, y, 0, x, y, radius);
      heatGradient.addColorStop(0, getHeatMapColor(value.intensity, value.color));
      heatGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      context.fillStyle = heatGradient;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    });
    
    // Añadir leyenda
    context.font = `${Math.max(10, width * 0.025)}px Arial`;
    context.fillStyle = '#000';
    const legendY = height - margin * 0.6;
    const legendX = margin;
    
    if (selectedPlayer === null) {
      context.fillText('Equipo Completo', legendX, legendY);
    } else {
      context.fillStyle = selectedPlayer === 1 ? 'blue' : 'green';
      context.fillText(`Jugador ${selectedPlayer}`, legendX, legendY);
    }
    
    // Añadir indicador de set actual
    context.fillStyle = '#000';
    context.fillText(`Set ${matchData.currentSet}`, width - margin - 50, legendY);
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
      color: heatmapColor,
      player: selectedPlayer,
      timestamp: new Date(),
      score: `${matchData.teamScore}-${matchData.opponentScore}`
    });
    
    setHeatmap(newHeatmap);
    drawCourt();
  };

  const handleReset = () => {
    if (window.confirm('¿Está seguro de que desea reiniciar el mapa de calor?')) {
      setHeatmap(new Map());
      drawCourt();
    }
  };

  const handleDownloadPDF = async () => {
    if (!teamName.trim()) {
      alert('Por favor, ingrese el nombre del equipo antes de descargar');
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
      doc.text('Mapa de Calor - Voleibol de Playa', pageWidth/2, 20, { align: 'center' });
      
      // Información del equipo
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text([
        `Equipo: ${teamName}`,
        `Fundamento: ${selectedSkill}`,
        `Set: ${matchData.currentSet} (${matchData.teamScore}-${matchData.opponentScore})`,
        `Fecha: ${format(new Date(), "PPP", { locale: es })}`
      ], 20, 35);

      // Cancha con zonas de calor
      const canvas = canvasRef.current;
      if (canvas) {
        const canvasImage = canvas.toDataURL('image/png');
        const imgWidth = 160;
        const imgHeight = deviceSize.isMobile ? imgWidth * (4/3) : imgWidth * (3/4);
        const xPos = (pageWidth - imgWidth) / 2;
        const yPos = 50;
        
        doc.addImage(canvasImage, 'PNG', xPos, yPos, imgWidth, imgHeight);
      }

      // Leyenda de jugadores
      doc.setFontSize(10);
      doc.setDrawColor(0);
      doc.setFillColor(255, 0, 0);
      doc.circle(20, 130, 3, 'F');
      doc.text('Equipo completo', 25, 132);
      
      doc.setFillColor(0, 0, 255);
      doc.circle(70, 130, 3, 'F');
      doc.text('Jugador 1', 75, 132);
      
      doc.setFillColor(0, 128, 0);
      doc.circle(110, 130, 3, 'F');
      doc.text('Jugador 2', 115, 132);

      doc.save(`mapa-calor-${teamName.replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
      console.error('Error al generar el PDF:', error);
      alert('Error al generar el PDF. Por favor, intente nuevamente.');
    }
  };

  // Guardar estado en el contexto
  useEffect(() => {
    setTrendsData({
      teamName,
      selectedSkill
    });
  }, [teamName, selectedSkill]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 to-blue-600 p-2 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white bg-opacity-90 rounded-lg shadow-lg p-3 sm:p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Volver a Estadísticas
            </button>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600">
              Mapa de Calor
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-4 p-2 bg-white bg-opacity-50 rounded-md">
            <div className="flex-grow">
              <label className="block text-xs font-medium text-gray-700 mb-1">Equipo</label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Nombre del equipo"
                className="flex-grow px-3 py-2 border rounded-md w-full sm:w-64"
              />
            </div>
            
            <div className="flex-grow">
              <label className="block text-xs font-medium text-gray-700 mb-1">Fundamento</label>
              <input
                type="text"
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
                placeholder="Fundamento analizado"
                className="flex-grow px-3 py-2 border rounded-md w-full sm:w-64"
              />
            </div>

            <div className="flex-grow">
              <label className="block text-xs font-medium text-gray-700 mb-1">Jugador</label>
              <PlayerSelector
                selectedPlayer={selectedPlayer}
                onSelectPlayer={setSelectedPlayer}
              />
            </div>

            <div className="flex space-x-2 mt-auto ml-auto">
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                Limpiar
              </button>
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={!teamName.trim()}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  !teamName.trim()
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                <Download className="h-4 w-4 inline mr-1" />
                PDF
              </button>
            </div>
          </div>
          
          <div className={`w-full ${deviceSize.isMobile ? 'h-[75vh]' : 'h-[50vh]'} bg-white rounded-lg shadow-inner p-4`}>
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              onTouchStart={handleCanvasClick}
              className="w-full h-full border border-gray-300 rounded-lg touch-none"
              style={{ touchAction: 'none' }}
            />
          </div>

          <div className="mt-4 text-sm text-gray-600">
            <p className="font-medium">Instrucciones:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Toque la cancha para marcar las zonas</li>
              <li>Seleccione un jugador específico o "Ambos" para registrar sus datos</li>
              <li>Presione varias veces en el mismo lugar para intensificar el color</li>
              <li>Use el botón "Limpiar" para reiniciar el mapa de calor</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolleyballTrends;