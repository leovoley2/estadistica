import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  RotateCcw, 
  Download, 
  TrendingUp, 
  CalendarIcon
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useVolleyball } from '../context/VolleyballContext';

const VolleyballStats = () => {
  const navigate = useNavigate();
  const { statsData, setStatsData } = useVolleyball();
  const chartRef = useRef(null);

  // Estados inicializados desde el contexto
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

  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef(null);

  const skills = ['K1', 'K2', 'Recepción', 'Armado', 'Ataque'];

  // Efecto para manejar clics fuera del calendario
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Guardar en el contexto cuando los datos cambien
  useEffect(() => {
    setStatsData({
      date,
      name,
      selectedSkill,
      stats
    });
  }, [date, name, selectedSkill, stats, setStatsData]);

  const calculateTotalActions = () => {
    return Object.values(stats).reduce((a, b) => a + b, 0);
  };

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

  const chartData = [
    { name: '##', value: stats.doublePositive, color: '#22c55e' },
    { name: '+', value: stats.positive, color: '#3b82f6' },
    { name: '!', value: stats.regular, color: '#f59e0b' },
    { name: '-', value: stats.negative, color: '#ef4444' },
    { name: '=', value: stats.doubleNegative, color: '#7f1d1d' }
  ];

  const handleStatChange = (key, increment) => (e) => {
    e.preventDefault();
    setStats(prev => ({
      ...prev,
      [key]: Math.max(0, prev[key] + (increment ? 1 : -1))
    }));
  };

  const handleReset = () => {
    if (window.confirm('¿Estás seguro de que deseas reiniciar todas las estadísticas?')) {
      setStats({
        doublePositive: 0,
        positive: 0,
        regular: 0,
        negative: 0,
        doubleNegative: 0
      });
      setSelectedSkill('');
      setName('');
      setDate('');
    }
  };

  const handleNavigation = () => {
    navigate('/tendencias');
  };

  const handleDownloadPDF = async () => {
    if (!name || !date || !selectedSkill) {
      alert('Por favor, complete todos los campos antes de descargar el PDF');
      return;
    }

    try {
      const doc = new jsPDF();
      
      // Título
      doc.setFontSize(20);
      doc.setTextColor(0, 0, 255);
      doc.text('Estadísticas de Voleibol de Playa', 20, 20);
      
      // Información básica
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Fecha: ${format(new Date(date), "PPP", { locale: es })}`, 20, 40);
      doc.text(`Nombre/Equipo: ${name}`, 20, 50);
      doc.text(`Fundamento: ${selectedSkill}`, 20, 60);
      
      // Estadísticas
      doc.text('Estadísticas:', 20, 80);
      doc.text(`Total de Acciones: ${calculateTotalActions()}`, 30, 90);
      doc.text(`Doble Positivo (##): ${stats.doublePositive}`, 30, 100);
      doc.text(`Positivo (+): ${stats.positive}`, 30, 110);
      doc.text(`Regular (!): ${stats.regular}`, 30, 120);
      doc.text(`Negativo (-): ${stats.negative}`, 30, 130);
      doc.text(`Doble Negativo (=): ${stats.doubleNegative}`, 30, 140);
      
      // Resultados
      doc.text('Resultados:', 20, 160);
      doc.text(`Eficiencia: ${calculateEfficiency()}%`, 30, 170);
      doc.text(`Eficacia: ${calculateEffectiveness()}%`, 30, 180);

      // Gráfica
      if (chartRef.current) {
        const canvas = await html2canvas(chartRef.current);
        const imgData = canvas.toDataURL('image/png');
        doc.addImage(imgData, 'PNG', 20, 190, 170, 80);
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
            {/* Grid de datos básicos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {/* Selector de fecha */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Fecha</label>
                <div className="relative" ref={calendarRef}>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2 pr-10 border rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <CalendarIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Input de nombre/equipo */}
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

              {/* Selector de fundamento */}
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

            {/* Contadores de estadísticas */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
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
                      onClick={handleStatChange(key, false)}
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
                      onClick={handleStatChange(key, true)}
                      className="p-1 sm:p-2 hover:bg-gray-100 rounded-full"
                      style={{ color }}
                    >
                      <ArrowUpCircle className="h-4 w-4 sm:h-6 sm:w-6" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Gráfico y resultados */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
              {/* Gráfico */}
              <div ref={chartRef} className="bg-white p-2 sm:p-4 rounded-lg shadow-sm">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Resultados */}
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Resultados</h3>
                  <div className="space-y-4">
                    <div className="bg-white p-3 rounded-md shadow-sm">
                      <p className="text-sm text-gray-600">Total de Acciones</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {calculateTotalActions()}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-3 rounded-md shadow-sm">
                        <p className="text-sm text-gray-600">Eficiencia</p>
                        <p className="text-xl font-bold text-blue-600">
                          {calculateEfficiency()}%
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded-md shadow-sm">
                        <p className="text-sm text-gray-600">Eficacia</p>
                        <p className="text-xl font-bold text-blue-600">
                          {calculateEffectiveness()}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-wrap justify-end gap-2 sm:gap-4">
              <button
                type="button"
                onClick={handleReset}
                className="btn-secondary flex items-center text-sm sm:text-base"
              >
                <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Resetear
              </button>
              <button
                type="button"
                onClick={handleNavigation}
                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors flex items-center text-sm sm:text-base"
              >
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Tendencias
              </button>
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={!name || !date || !selectedSkill}
                className={`flex items-center text-sm sm:text-base px-4 py-2 rounded-md ${
                  !name || !date || !selectedSkill
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                <Download className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Descargar PDF
              </button>
            </div>
          </form>

          {/* Mensajes de error/validación */}
          {(!name || !date || !selectedSkill) && (
            <div className="mt-4 text-sm text-gray-500 text-center">
              Complete todos los campos para habilitar la descarga del PDF
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VolleyballStats;