import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from "date-fns/locale";
import { useVolleyball } from "../context/VolleyballContext";
import { setupHighDPI, smoothLine } from "../utils/canvas-utils";

const colorOptions = [
  { value: '#ff0000', label: 'Rojo', class: 'bg-red-500' },
  { value: '#0000ff', label: 'Azul', class: 'bg-blue-500' },
  { value: '#000000', label: 'Negro', class: 'bg-black' },
  { value: '#ffff00', label: 'Amarillo', class: 'bg-yellow-500' },
  { value: '#ffffff', label: 'Blanco', class: 'bg-white border border-gray-300' },
  { value: '#00ff00', label: 'Verde', class: 'bg-green-500' }
];

const lineWidthOptions = [
  { value: 2, label: 'Muy delgada' },
  { value: 3, label: 'Delgada' },
  { value: 5, label: 'Media' },
  { value: 8, label: 'Gruesa' }
];

const VolleyballTrends = () => {
  const navigate = useNavigate();
  const { trendsData, setTrendsData } = useVolleyball();
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#ff0000');
  const [lineWidth, setLineWidth] = useState(3);
  const [teamName, setTeamName] = useState(trendsData.teamName || '');
  const lastPoint = useRef({ x: 0, y: 0 });

  const isMobile = window.innerWidth < 768;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d', { willReadFrequently: true });
    setupHighDPI(canvas, context);
    
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
    contextRef.current = context;

    if (trendsData.canvasImage) {
      const img = new Image();
      img.onload = () => {
        context.drawImage(img, 0, 0);
      };
      img.src = trendsData.canvasImage;
    } else {
      drawCourt();
    }

    const handleResize = () => {
      if (canvas) {
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        setupHighDPI(canvas, context);
        drawCourt();
        context.putImageData(imageData, 0, 0);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);

  const drawCourt = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    let courtWidth, courtHeight, startX, startY;

    if (isMobile) {
      courtWidth = canvas.width * 0.9;
      courtHeight = canvas.height * 0.85;
    } else {
      courtWidth = canvas.width * 0.9;
      courtHeight = canvas.height * 0.7;
    }

    startX = (canvas.width - courtWidth) / 2;
    startY = (canvas.height - courtHeight) / 2;

    // Limpiar el canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Fondo color arena
    context.fillStyle = '#f4c778';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Textura de arena
    context.fillStyle = '#e6c88e';
    for (let i = 0; i < canvas.width; i += 4) {
      for (let j = 0; j < canvas.height; j += 4) {
        if (Math.random() > 0.5) {
          context.fillRect(i, j, 2, 2);
        }
      }
    }

    // Configurar estilo para las líneas de la cancha
    context.strokeStyle = '#000080';
    context.lineWidth = 4;

    // Rectángulo exterior
    context.beginPath();
    context.rect(startX, startY, courtWidth, courtHeight);
    context.stroke();

    // Red y detalles según orientación
    if (isMobile) {
      // Red horizontal para móviles
      const netY = startY + courtHeight/2;
      
      context.shadowColor = 'rgba(0, 0, 0, 0.2)';
      context.shadowBlur = 5;
      context.shadowOffsetY = 2;

      // Línea principal de la red
      context.beginPath();
      context.strokeStyle = '#666666';
      context.lineWidth = 6;
      context.moveTo(startX - 10, netY);
      context.lineTo(startX + courtWidth + 10, netY);
      context.stroke();

      // Detalles de la red
      context.lineWidth = 1;
      for (let x = startX; x < startX + courtWidth; x += 15) {
        context.beginPath();
        context.moveTo(x, netY - 3);
        context.lineTo(x, netY + 3);
        context.stroke();
      }
    } else {
      // Red vertical para desktop
      const netX = startX + courtWidth/2;
      
      context.shadowColor = 'rgba(0, 0, 0, 0.2)';
      context.shadowBlur = 5;
      context.shadowOffsetX = 2;

      context.beginPath();
      context.strokeStyle = '#666666';
      context.lineWidth = 6;
      context.moveTo(netX, startY - 10);
      context.lineTo(netX, startY + courtHeight + 10);
      context.stroke();

      // Detalles de la red
      context.lineWidth = 1;
      for (let y = startY; y < startY + courtHeight; y += 15) {
        context.beginPath();
        context.moveTo(netX - 3, y);
        context.lineTo(netX + 3, y);
        context.stroke();
      }
    }

    // Restaurar configuración
    context.shadowColor = 'transparent';
    context.shadowBlur = 0;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
  };

  const getCoordinates = (event) => {
    if (!canvasRef.current) return { offsetX: 0, offsetY: 0 };
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if (event.touches && event.touches[0]) {
      const touch = event.touches[0];
      return {
        offsetX: (touch.clientX - rect.left) * scaleX,
        offsetY: (touch.clientY - rect.top) * scaleY
      };
    }
    
    return {
      offsetX: event.nativeEvent.offsetX * scaleX,
      offsetY: event.nativeEvent.offsetY * scaleY
    };
  };

  const startDrawing = (event) => {
    event.preventDefault();
    const { offsetX, offsetY } = getCoordinates(event);
    if (contextRef.current) {
      contextRef.current.beginPath();
      contextRef.current.moveTo(offsetX, offsetY);
      lastPoint.current = { x: offsetX, y: offsetY };
      setIsDrawing(true);
    }
  };

  const draw = (event) => {
    event.preventDefault();
    if (!isDrawing || !contextRef.current) return;

    const { offsetX, offsetY } = getCoordinates(event);
    const context = contextRef.current;

    context.beginPath();
    context.moveTo(lastPoint.current.x, lastPoint.current.y);
    smoothLine(context, lastPoint.current.x, lastPoint.current.y, offsetX, offsetY);
    context.stroke();

    lastPoint.current = { x: offsetX, y: offsetY };
  };

  const finishDrawing = () => {
    if (contextRef.current) {
      contextRef.current.closePath();
      saveCanvasState();
    }
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (window.confirm('¿Estás seguro de que deseas limpiar el dibujo?')) {
      if (contextRef.current) {
        drawCourt();
        saveCanvasState();
      }
    }
  };

  const saveCanvasState = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const imageData = canvas.toDataURL('image/png');
      setTrendsData(prev => ({
        ...prev,
        teamName,
        canvasImage: imageData
      }));
    }
  };

  const handleDownloadPDF = async () => {
    if (!teamName.trim()) {
      alert('Por favor, ingrese el nombre del equipo antes de descargar');
      return;
    }

    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      saveCanvasState();
      const imageData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 255);
      pdf.text('Análisis de Tendencias - Voleibol de Playa', 15, 15);

      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Equipo: ${teamName}`, 15, 25);
      pdf.text(`Fecha: ${format(new Date(), "PPP", { locale: es })}`, 15, 32);

      const imgWidth = 270;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imageData, 'PNG', 15, 40, imgWidth, imgHeight);

      pdf.save(`tendencias-${teamName.replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
      console.error('Error al generar el PDF:', error);
      alert('Error al generar el PDF. Por favor, intente nuevamente.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 to-blue-600 p-2 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white bg-opacity-90 rounded-lg shadow-lg p-3 sm:p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-4">
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Volver
              </button>
            </div>

            <div className="text-center">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600">
                Tendencias de Juego
              </h1>
            </div>

            <div className="flex justify-end items-center space-x-2">
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Nombre del equipo"
                className="flex-grow px-3 py-2 border rounded-md"
              />
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={!teamName.trim()}
                className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                  !teamName.trim()
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                <Download className="h-5 w-5 mr-2" />
                PDF
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4 p-2 bg-white bg-opacity-50 rounded-md">
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((colorOption) => (
                <button
                  key={colorOption.value}
                  onClick={() => {
                    setColor(colorOption.value);
                    if (contextRef.current) {
                      contextRef.current.strokeStyle = colorOption.value;
                    }
                  }}
                  className={`w-8 h-8 rounded-full shadow-sm ${
                    color === colorOption.value ? 'ring-2 ring-blue-500' : ''
                  } ${colorOption.class} hover:opacity-80 transition-opacity`}
                  title={colorOption.label}
                />
              ))}
            </div>
            <div className="flex gap-2">
              {lineWidthOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setLineWidth(option.value);
                    if (contextRef.current) {
                      contextRef.current.lineWidth = option.value;
                    }
                  }}
                  className={`px-3 py-2 rounded-md border ${
                    lineWidth === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                  title={option.label}
                >
                  <div 
                    className="w-6 bg-current rounded-full mx-auto"
                    style={{ height: `${option.value}px` }}
                  />
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={clearCanvas}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors ml-auto"
            >
              Limpiar
            </button>
          </div>
          
          <div className="flex justify-center bg-white bg-opacity-50 p-2 sm:p-4 rounded-lg shadow-inner">
            <div style={{ 
              position: 'relative', 
              width: '100%',
              touchAction: 'none'
            }}>
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseUp={finishDrawing}
                onMouseMove={draw}
                onMouseLeave={finishDrawing}
                onTouchStart={startDrawing}
                onTouchEnd={finishDrawing}
                onTouchMove={draw}
                className="border border-gray-300 rounded-lg touch-none"
                style={{ 
                  maxWidth: '100%',
                  height: isMobile ? '70vh' : '50vh',
                  touchAction: 'none',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  msUserSelect: 'none',
                  MozUserSelect: 'none',
                }}
              />
            </div>
          </div>

          {/* Guía de uso */}
          <div className="mt-4 p-4 bg-blue-50 rounded-lg text-sm">
            <h3 className="font-semibold text-blue-800 mb-2">Guía de uso:</h3>
            <ul className="space-y-1 text-blue-600">
              <li>• Use los botones de colores para seleccionar el color del trazo</li>
              <li>• Seleccione el grosor de línea deseado</li>
              <li>• Dibuje sobre la cancha usando el mouse o el dedo en dispositivos táctiles</li>
              <li>• Use el botón "Limpiar" para borrar todo el dibujo</li>
              <li>• Ingrese el nombre del equipo para habilitar la descarga del PDF</li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
};

export default VolleyballTrends;