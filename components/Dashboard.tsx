
import React from 'react';
import { CheckCircle, CalendarClock, Target } from 'lucide-react';

interface KpiCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  description?: string;
  colorClass: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ icon, title, value, description, colorClass }) => (
  <div className={`bg-[#162033] rounded-3xl p-6 border border-[#EAE0D5]/5 shadow-2xl flex flex-col gap-4`}>
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClass}`}>
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-medium text-[#EAE0D5]/60">{title}</h3>
      </div>
    </div>
    <div>
      <p className="text-4xl font-bold text-white">{value}</p>
      {description && <p className="text-xs text-[#EAE0D5]/40 mt-1">{description}</p>}
    </div>
  </div>
);


interface DashboardProps {
  completedTodayCount: number;
  totalTodayCount: number;
  completedThisWeekCount: number;
  weeklyGoalCompletionPercentage: number;
  weeklyGoalCompletions: number;
  weeklyGoalTargets: number;
}

const Dashboard: React.FC<DashboardProps> = ({
  completedTodayCount,
  totalTodayCount,
  completedThisWeekCount,
  weeklyGoalCompletionPercentage,
  weeklyGoalCompletions,
  weeklyGoalTargets,
}) => {

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white">Seu Desempenho</h2>
        <p className="text-[#EAE0D5]/50">Métricas de produtividade e progresso.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <KpiCard
          icon={<CheckCircle className="w-6 h-6 text-emerald-300" />}
          title="Concluídas Hoje"
          value={completedTodayCount.toString()}
          description={`de ${totalTodayCount} tarefas`}
          colorClass="from-emerald-900/50 to-emerald-800/50"
        />
        <KpiCard
          icon={<CalendarClock className="w-6 h-6 text-indigo-300" />}
          title="Concluídas na Semana"
          value={completedThisWeekCount.toString()}
          description="Total da semana atual"
          colorClass="from-indigo-900/50 to-indigo-800/50"
        />
        
        {/* Weekly Goal Progress Card */}
        <div className="md:col-span-2 bg-[#162033] rounded-3xl p-6 border border-[#EAE0D5]/5 shadow-2xl flex flex-col gap-4">
          <div className="flex items-center gap-4">
             <div className="p-3 rounded-xl bg-gradient-to-br from-sky-900/50 to-sky-800/50">
                <Target className="w-6 h-6 text-sky-300" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-[#EAE0D5]/60">Progresso das Metas Semanais</h3>
            </div>
          </div>
          <div>
            <div className="flex justify-between items-baseline mb-2">
              <p className="text-4xl font-bold text-white">{Math.round(weeklyGoalCompletionPercentage)}%</p>
              <span className="text-sm font-medium text-[#EAE0D5]/40">{weeklyGoalCompletions} de {weeklyGoalTargets} metas</span>
            </div>
            <div className="w-full bg-[#0F172A] h-3 rounded-full overflow-hidden border border-[#EAE0D5]/5">
              <div 
                className="bg-sky-400 h-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(56,189,248,0.3)]"
                style={{ width: `${weeklyGoalCompletionPercentage}%` }}
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
