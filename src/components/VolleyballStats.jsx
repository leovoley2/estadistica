import React, { useState, useRef, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ArrowUpCircle, ArrowDownCircle, RotateCcw, Download, TrendingUp, CalendarIcon } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "../lib/utils";
import { useNavigate } from 'react-router-dom';

const VolleyballStats = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef(null);
  const [name, setName] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const chartRef = useRef(null);
  const [stats, setStats] = useState({
    doublePositive: 0,
    positive: 0,
    regular: 0,
    negative: 0,
    doubleNegative: 0
  });

  const skills = ['K1', 'K2', 'Recepción', 'Armado', 'Ataque'];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const generateCalendarDays = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const startingDay = firstDay.getDay();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < startingDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8"/>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(today.getFullYear(), today.getMonth(), day);
      const formattedDate = format(currentDate, 'yyyy-MM-dd');
      days.push(
        <button
          key={day}
          type="button"
          onClick={() => {
            setDate(formattedDate);
            setShowCalendar(false);
          }}
          className={cn(
            "h-8 w-8 rounded-full flex items-center justify-center text-sm",
            date === formattedDate ? "bg-blue-500 text-white" : "hover:bg-gray-100"
          )}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setDate(newDate);
  };

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

  const handleReset = (e) => {
    e?.preventDefault();
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
  };

  const handleDownload = async (e) => {
    e?.preventDefault();
    if (!name || !date || !selectedSkill) {
      alert('Por favor, complete todos los campos antes de descargar el PDF');
      return;
    }

    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      
      doc.setFontSize(20);
      doc.text('Estadísticas de Voleibol de Playa', 20, 20);
      
      doc.setFontSize(12);
      doc.text(`Fecha: ${date}`, 20, 40);
      doc.text(`Nombre/Equipo: ${name}`, 20, 50);
      doc.text(`Fundamento: ${selectedSkill}`, 20, 60);
      
      doc.text('Estadísticas:', 20, 80);
      doc.text(`Total de Acciones: ${calculateTotalActions()}`, 30, 90);
      doc.text(`Doble Positivo (##): ${stats.doublePositive}`, 30, 100);
      doc.text(`Positivo (+): ${stats.positive}`, 30, 110);
      doc.text(`Regular (!): ${stats.regular}`, 30, 120);
      doc.text(`Negativo (-): ${stats.negative}`, 30, 130);
      doc.text(`Doble Negativo (=): ${stats.doubleNegative}`, 30, 140);
      
      doc.text('Resultados:', 20, 160);
      doc.text(`Eficiencia: ${calculateEfficiency()}%`, 30, 170);
      doc.text(`Eficacia: ${calculateEffectiveness()}%`, 30, 180);

      if (chartRef.current) {
        try {
          const canvas = await html2canvas(chartRef.current);
          const imgData = canvas.toDataURL('image/png');
          doc.addImage(imgData, 'PNG', 20, 190, 170, 80);
        } catch (error) {
          console.error('Error al generar la gráfica:', error);
        }
      }
      
      doc.save(`estadisticas-voleibol-${name}-${date}.pdf`);
    } catch (error) {
      console.error('Error al generar el PDF:', error);
      alert('Error al generar el PDF. Por favor, intente nuevamente.');
    }
  };

  const handleStatChange = (key, increment) => (e) => {
    e.preventDefault();
    setStats(prev => ({
      ...prev,
      [key]: Math.max(0, prev[key] + (increment ? 1 : -1))
    }));
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-center mb-8 text-red-600">
          Estadísticas de Voleibol de Playa
        </h1>
        <img className='h-24 min-w-24' src="/logo.png" alt="" />

        <form onSubmit={(e) => e.preventDefault()}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Fecha</label>
              <div className="relative" ref={calendarRef}>
                <input
                  type="date"
                  value={date}
                  onChange={handleDateChange}
                  className="w-full p-2 pr-10 border rounded-md"
                />
                <button
                  type="button"
                  onClick={() => setShowCalendar(!showCalendar)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <CalendarIcon className="h-5 w-5" />
                </button>
                {showCalendar && (
                  <div className="absolute z-50 mt-1 bg-white border rounded-lg shadow-lg p-4">
                    <div className="text-center mb-4">
                      <h3 className="font-medium">
                        {format(new Date(), 'MMMM yyyy', { locale: es })}
                      </h3>
                    </div>
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'].map(day => (
                        <div key={day} className="text-center text-xs font-medium text-gray-500">
                          {day}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {generateCalendarDays()}
                    </div>
                  </div>
                )}
              </div>
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

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {[
              { key: 'doublePositive', label: '## (Doble Positivo)', color: '#22c55e' },
              { key: 'positive', label: '+ (Positivo)', color: '#3b82f6' },
              { key: 'regular', label: '! (Regular)', color: '#f59e0b' },
              { key: 'negative', label: '- (Negativo)', color: '#ef4444' },
              { key: 'doubleNegative', label: '= (Doble Negativo)', color: '#7f1d1d' }
            ].map(({ key, label, color }) => (
              <div key={key} className="flex flex-col items-center space-y-2">
                <span className="text-sm font-medium">{label}</span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleStatChange(key, false)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                    style={{ color }}
                  >
                    <ArrowDownCircle className="h-6 w-6" />
                  </button>
                  <span className="w-12 text-center font-bold" style={{ color }}>
                    {stats[key]}
                  </span>
                  <button
                    type="button"
                    onClick={handleStatChange(key, true)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                    style={{ color }}
                  >
                    <ArrowUpCircle className="h-6 w-6" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div ref={chartRef} className="bg-white p-4 rounded-lg">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'white', borderRadius: '8px' }}
                    cursor={{ fill: 'transparent' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

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

                  <div className="bg-white p-3 rounded-md shadow-sm">
                    <p className="text-sm text-gray-600 mb-2">Resumen de Acciones</p>
                    <div className="grid grid-cols-5 gap-2 text-center">
                      <div>
                        <p className="text-xs text-gray-500">##</p>
                        <p className="font-medium text-green-600">{stats.doublePositive}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">+</p>
                        <p className="font-medium text-blue-600">{stats.positive}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">!</p>
                        <p className="font-medium text-yellow-600">{stats.regular}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">-</p>
                        <p className="font-medium text-red-600">{stats.negative}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">=</p>
                        <p className="font-medium text-red-800">{stats.doubleNegative}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
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
              onClick={handleDownload}
              disabled={!name || !date || !selectedSkill}
              className={`flex items-center px-4 py-2 rounded-md ${
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
  );
};

export default VolleyballStats;