
import React from 'react';
import { Calendar, CalendarDays, CalendarCheck } from 'lucide-react';

interface HeaderProps {
  currentWeek: number;
  totalWeeks: number;
  currentDayOfYear: number;
  totalDaysInYear: number;
}

const Header: React.FC<HeaderProps> = ({ 
  currentWeek, 
  totalWeeks, 
  currentDayOfYear, 
  totalDaysInYear 
}) => {
  const today = new Date();
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  };
  const todayString = today.toLocaleDateString('pt-BR', options);

  // Custom formatting to match the screenshot "Sexta-Feira, 19 De Dezembro"
  const formattedToday = todayString
    .split(' ')
    .map(word => {
      if (word === 'de') return 'De';
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ')
    .replace('-feira', '-Feira');

  return (
    <header className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#EAE0D5] tracking-tight">Suas Tarefas</h1>
          <div className="flex items-center gap-2 text-[#EAE0D5]/60 mt-2">
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-medium">{formattedToday}</span>
          </div>
           <div className="flex items-center gap-2 text-sky-400/80 mt-1">
             <CalendarDays className="w-4 h-4" />
             <span className="text-sm font-medium">Semana: {currentWeek}/{totalWeeks}</span>
           </div>
           <div className="flex items-center gap-2 text-emerald-400/80 mt-1">
             <CalendarCheck className="w-4 h-4" />
             <span className="text-sm font-medium">Dia: {currentDayOfYear}/{totalDaysInYear}</span>
           </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
