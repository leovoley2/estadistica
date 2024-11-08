import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};

const VolleyballTrends = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#ff0000');
  const [lineWidth, setLineWidth] = useState(3);
  const [teamName, setTeamName] = useState('');
  const windowSize = useWindowSize();
  const isMobile = windowSize.width < 768;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const setCanvasSize = () => {
      if (isMobile) {
        canvas.width = window.innerWidth * 0.95;
        canvas.height = window.innerHeight * 0.7;
      } else {
        canvas.width = window.innerWidth * 0.85;
        canvas.height = window.innerHeight * 0.5;
      }
    };

    setCanvasSize();
    const context = canvas.getContext('2d');
    context.lineCap = 'round';
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
    contextRef.current = context;

    drawCourt();

    const handleResize = () => {
      setCanvasSize();
      drawCourt();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile, windowSize, color, lineWidth]);

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
      courtHeight = canvas.height * 0.8;
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

    // Líneas de la cancha
    context.strokeStyle = '#000080';
    context.lineWidth = 4;

    // Rectángulo exterior
    context.beginPath();
    context.rect(startX, startY, courtWidth, courtHeight);
    context.stroke();

    // Red y detalles
    if (isMobile) {
      // Red horizontal para móviles
      const netY = startY + courtHeight/2;
      
      // Sombra de la red
      context.shadowColor = 'rgba(0, 0, 0, 0.2)';
      context.shadowBlur = 5;
      context.shadowOffsetY = 2;

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
      
      // Sombra de la red
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

    // Quitar sombras
    context.shadowColor = 'transparent';
    context.shadowBlur = 0;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;

    // Restaurar estilo para dibujo
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
  };

  const startDrawing = (event) => {
    event.preventDefault();
    const { offsetX, offsetY } = getCoordinates(event);
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const finishDrawing = () => {
    contextRef.current.closePath();
    setIsDrawing(false);
  };

  const draw = (event) => {
    event.preventDefault();
    if (!isDrawing) return;
    const { offsetX, offsetY } = getCoordinates(event);
    contextRef.current.lineTo(offsetX, offsetY);
    contextRef.current.stroke();
  };

  const getCoordinates = (event) => {
    if (!canvasRef.current) return { offsetX: 0, offsetY: 0 };

    if (event.touches) {
      const rect = canvasRef.current.getBoundingClientRect();
      return {
        offsetX: event.touches[0].clientX - rect.left,
        offsetY: event.touches[0].clientY - rect.top
      };
    }
    return {
      offsetX: event.nativeEvent.offsetX,
      offsetY: event.nativeEvent.offsetY
    };
  };
  const clearCanvas = () => {
    if (contextRef.current) {
      drawCourt();
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

      const imageData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Agregar título
      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 255);
      pdf.text('Análisis de Tendencias - Voleibol de Playa', 15, 15);

      // Agregar información del equipo
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Equipo: ${teamName}`, 15, 25);
      pdf.text(`Fecha: ${format(new Date(), "PPP", { locale: es })}`, 15, 32);

      // Calcular dimensiones para mantener la proporción
      const imgWidth = 270;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Agregar la imagen
      pdf.addImage(imageData, 'PNG', 15, 40, imgWidth, imgHeight);

      // Descargar PDF
      pdf.save(`tendencias-${teamName.replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
      console.error('Error al generar el PDF:', error);
      alert('Error al generar el PDF. Por favor, intente nuevamente.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 to-blue-600 p-2 md:p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white bg-opacity-90 rounded-lg shadow-lg p-2 md:p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 mb-2 md:mb-4">
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
              <h1 className="text-xl md:text-2xl font-bold text-red-600">
                Tendencias de Juego - Voleibol de Playa
              </h1>
    
            </div>

            <div className="flex justify-end items-center space-x-2">
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Nombre del equipo"
                className="px-3 py-2 border rounded-md flex-grow"
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

          <div className="flex flex-wrap gap-2 mb-2 md:mb-4 p-2 bg-white bg-opacity-50 rounded-md">
            <select
              value={color}
              onChange={(e) => {
                setColor(e.target.value);
                if (contextRef.current) {
                  contextRef.current.strokeStyle = e.target.value;
                }
              }}
              className="px-3 py-2 border rounded-md"
            >
              <option value="#ff0000">Rojo</option>
              <option value="#0000ff">Azul</option>
              <option value="#000000">Negro</option>
              <option value="#ffff00">Amarillo</option>
              <option value="#ffffff">Blanco</option>
            </select>
            <select
              value={lineWidth}
              onChange={(e) => {
                const newWidth = Number(e.target.value);
                setLineWidth(newWidth);
                if (contextRef.current) {
                  contextRef.current.lineWidth = newWidth;
                }
              }}
              className="px-3 py-2 border rounded-md"
            >
              <option value="2">Muy delgada</option>
              <option value="3">Delgada</option>
              <option value="5">Media</option>
              <option value="8">Gruesa</option>
            </select>
            <button
              type="button"
              onClick={clearCanvas}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            >
              Limpiar
            </button>
          </div>
          
          <div className="flex justify-center bg-white bg-opacity-50 p-2 md:p-4 rounded-lg shadow-inner">
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
                height: isMobile ? '70vh' : '50vh'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolleyballTrends;