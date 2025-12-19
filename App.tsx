
import React, { useState, useEffect, useRef } from 'react';
import { Todo, Priority, Subtask } from './types';
import Header from './components/Header';
import TodoItem from './components/TodoItem';
import ConfirmDeleteModal from './components/ConfirmDeleteModal';
import Dashboard from './components/Dashboard';
import { Plus, ListChecks, Loader2, Calendar, ClipboardList, Repeat, Target, LayoutDashboard } from 'lucide-react';
import { breakDownTask } from './services/geminiService';
import { db } from './services/firebase';
import { ref, onValue, set, remove, update } from 'firebase/database';
import { taskTemplates } from './services/templates';

type Tab = 'daily' | 'dashboard' | 'register';

const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('daily');
  const [newTodo, setNewTodo] = useState('');
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0]);
  const [frequencyCount, setFrequencyCount] = useState<string>('');
  const [isBreakingDownId, setIsBreakingDownId] = useState<string | null>(null);
  const [todoIdToDelete, setTodoIdToDelete] = useState<string | null>(null);
  const newTodoInputRef = useRef<HTMLInputElement>(null);

  // Helper to get ISO week number
  const getWeek = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };
  
  const getDayOfYear = (date: Date): number => {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = (date.getTime() - start.getTime()) + ((start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000);
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  };
  
  const getTotalDaysInYear = (date: Date): number => {
    const year = date.getFullYear();
    return ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) ? 366 : 365;
  };
  
  const getTotalWeeksInYear = (year: number): number => {
    const dec28 = new Date(year, 11, 28);
    return getWeek(dec28);
  };

  // Initialize Firebase sync
  useEffect(() => {
    const todosRef = ref(db, 'todos');
    const unsubscribe = onValue(todosRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.values(data) as Todo[];
        setTodos(list.sort((a, b) => b.createdAt - a.createdAt));
      } else {
        setTodos([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    const id = crypto.randomUUID();
    const todo: Todo = {
      id,
      text: newTodo,
      completed: false,
      priority: Priority.MEDIUM,
      createdAt: Date.now(),
      scheduledDate: scheduleDate,
      subtasks: [],
    };
    
    const freqNum = parseInt(frequencyCount);
    if (!isNaN(freqNum) && freqNum > 0) {
      todo.frequency = {
        count: freqNum,
        unit: 'week'
      };
    }

    try {
      await set(ref(db, `todos/${id}`), todo);
      setNewTodo('');
      setFrequencyCount('');
      setActiveTab('daily');
    } catch (err) {
      console.error("Error saving to Firebase:", err);
    }
  };
  
  const handleTemplateClick = (templateText: string) => {
    setNewTodo(templateText);
    newTodoInputRef.current?.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleTodo = async (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    try {
      await update(ref(db, `todos/${id}`), { completed: !todo.completed });
    } catch (err) {
      console.error("Error updating Firebase:", err);
    }
  };

  const requestDeleteTodo = (id: string) => {
    setTodoIdToDelete(id);
  };

  const handleConfirmDelete = async () => {
    if (!todoIdToDelete) return;
    try {
      await remove(ref(db, `todos/${todoIdToDelete}`));
    } catch (err) {
      console.error("Error deleting from Firebase:", err);
    } finally {
      setTodoIdToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setTodoIdToDelete(null);
  };

  const toggleSubtask = async (todoId: string, subtaskId: string) => {
    const todo = todos.find(t => t.id === todoId);
    if (!todo || !todo.subtasks) return;
    
    const updatedSubtasks = todo.subtasks.map(s => 
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    );
    
    try {
      await update(ref(db, `todos/${todoId}`), { subtasks: updatedSubtasks });
    } catch (err) {
      console.error("Error updating subtask in Firebase:", err);
    }
  };

  const handleBreakdown = async (todo: Todo) => {
    if (isBreakingDownId) return;
    setIsBreakingDownId(todo.id);
    
    const analysis = await breakDownTask(todo.text);
    
    if (analysis) {
      const newSubtasks: Subtask[] = analysis.steps.map((s: string) => ({
        id: crypto.randomUUID(),
        text: s,
        completed: false
      }));
      
      try {
        await update(ref(db, `todos/${todo.id}`), {
          priority: analysis.prioritySuggestion,
          subtasks: [...(todo.subtasks || []), ...newSubtasks]
        });
      } catch (err) {
        console.error("Error saving breakdown to Firebase:", err);
      }
    }
    
    setIsBreakingDownId(null);
  };
  
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const dailyTodos = todos.filter(t => t.scheduledDate === todayStr);
  const completedCount = dailyTodos.filter(t => t.completed).length;
  const dailyProgress = dailyTodos.length > 0 ? (completedCount / dailyTodos.length) * 100 : 0;
  
  const currentWeek = getWeek(today);
  const completedThisWeekCount = todos.filter(t =>
    t.completed && getWeek(new Date(t.scheduledDate)) === currentWeek
  ).length;

  // Calculate Weekly Goal Progress
  const goalTasks = todos.filter(t => t.frequency);
  const uniqueGoalTexts = [...new Set(goalTasks.map(t => t.text.toLowerCase().trim()))];

  let totalCompletions = 0;
  let totalTargets = 0;

  uniqueGoalTexts.forEach(text => {
    const goalDefinition = goalTasks.find(t => t.text.toLowerCase().trim() === text && t.frequency);
    if (!goalDefinition || !goalDefinition.frequency) return;

    const completionsThisWeek = todos.filter(t =>
      t.text.toLowerCase().trim() === text &&
      t.completed &&
      getWeek(new Date(t.scheduledDate)) === currentWeek
    ).length;

    totalCompletions += Math.min(completionsThisWeek, goalDefinition.frequency.count);
    totalTargets += goalDefinition.frequency.count;
  });
  
  const weeklyProgress = totalTargets > 0 ? (totalCompletions / totalTargets) * 100 : 0;
  
  const totalWeeks = getTotalWeeksInYear(today.getFullYear());
  const currentDayOfYear = getDayOfYear(today);
  const totalDaysInYear = getTotalDaysInYear(today);


  return (
    <div className="min-h-screen bg-[#0F172A] pb-32 px-4 sm:px-6 text-[#EAE0D5] transition-colors duration-500">
      <div className="max-w-2xl mx-auto py-12">
        <Header 
          currentWeek={currentWeek} 
          totalWeeks={totalWeeks}
          currentDayOfYear={currentDayOfYear}
          totalDaysInYear={totalDaysInYear}
        />

        {activeTab === 'daily' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            {/* Progress Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-[#162033] rounded-3xl p-6 border border-[#EAE0D5]/5 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[#EAE0D5] font-semibold flex items-center gap-2">
                    <ListChecks className="w-5 h-5 text-[#EAE0D5]/60" />
                    Progresso Diário
                  </h2>
                  <span className="text-[#EAE0D5]/40 text-sm font-medium">
                    {completedCount} de {dailyTodos.length}
                  </span>
                </div>
                <div className="w-full bg-[#0F172A] h-3 rounded-full overflow-hidden border border-[#EAE0D5]/5">
                  <div 
                    className="bg-[#EAE0D5] h-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(234,224,213,0.3)]"
                    style={{ width: `${dailyProgress}%` }}
                  />
                </div>
              </div>
              <div className="bg-[#162033] rounded-3xl p-6 border border-[#EAE0D5]/5 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[#EAE0D5] font-semibold flex items-center gap-2">
                    <Target className="w-5 h-5 text-[#EAE0D5]/60" />
                    Metas Semanais
                  </h2>
                  <span className="text-[#EAE0D5]/40 text-sm font-medium">
                    {totalCompletions} de {totalTargets}
                  </span>
                </div>
                <div className="w-full bg-[#0F172A] h-3 rounded-full overflow-hidden border border-[#EAE0D5]/5">
                  <div 
                    className="bg-sky-400 h-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(56,189,248,0.3)]"
                    style={{ width: `${weeklyProgress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Daily Task List */}
            <div className="space-y-4">
              {dailyTodos.length === 0 ? (
                <div className="text-center py-24 opacity-40">
                  <div className="bg-[#162033] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#EAE0D5]/10">
                    <ClipboardList className="text-[#EAE0D5] w-8 h-8" />
                  </div>
                  <h3 className="text-[#EAE0D5] font-medium text-lg">Nada agendado para hoje</h3>
                  <p className="text-[#EAE0D5]/60 text-sm">Vá para a aba de cadastro para adicionar tarefas.</p>
                </div>
              ) : (
                dailyTodos.map(todo => {
                  let weeklyGoalProgress = null;
                  if (todo.frequency) {
                     const completionsThisWeek = todos.filter(t =>
                        t.text.toLowerCase().trim() === todo.text.toLowerCase().trim() &&
                        t.completed &&
                        getWeek(new Date(t.scheduledDate)) === currentWeek
                      ).length;
                      weeklyGoalProgress = {
                        current: completionsThisWeek,
                        target: todo.frequency.count
                      }
                  }
                  return (
                    <TodoItem 
                      key={todo.id} 
                      todo={todo}
                      onToggle={toggleTodo}
                      onDelete={requestDeleteTodo}
                      onToggleSubtask={toggleSubtask}
                      weeklyGoalProgress={weeklyGoalProgress}
                    />
                  )
                })
              )}
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <Dashboard
            completedTodayCount={completedCount}
            totalTodayCount={dailyTodos.length}
            completedThisWeekCount={completedThisWeekCount}
            weeklyGoalCompletionPercentage={weeklyProgress}
            weeklyGoalCompletions={totalCompletions}
            weeklyGoalTargets={totalTargets}
          />
        )}

        {activeTab === 'register' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            <div className="bg-[#162033] rounded-3xl p-8 border border-[#EAE0D5]/5 shadow-2xl">
              <h2 className="text-xl font-bold mb-6 text-[#EAE0D5] flex items-center gap-2">
                <Calendar className="w-6 h-6 text-[#EAE0D5]/60" />
                Nova Tarefa
              </h2>
              <form onSubmit={addTodo} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[#EAE0D5]/40 ml-1">O que precisa ser feito?</label>
                  <input
                    ref={newTodoInputRef}
                    type="text"
                    autoFocus
                    value={newTodo}
                    onChange={(e) => setNewTodo(e.target.value)}
                    placeholder="Ex: Comprar mantimentos"
                    className="w-full bg-[#0F172A] border border-[#EAE0D5]/10 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-[#EAE0D5]/20 focus:border-[#EAE0D5]/40 transition-all text-[#EAE0D5] placeholder:text-[#EAE0D5]/20"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-[#EAE0D5]/40 ml-1">Quando?</label>
                    <input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="w-full bg-[#0F172A] border border-[#EAE0D5]/10 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-[#EAE0D5]/20 focus:border-[#EAE0D5]/40 transition-all text-[#EAE0D5] [color-scheme:dark]"
                    />
                  </div>
                   <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-[#EAE0D5]/40 ml-1">Frequência Semanal</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={frequencyCount}
                        onChange={(e) => setFrequencyCount(e.target.value)}
                        placeholder="Vezes por semana"
                        className="w-full bg-[#0F172A] border border-[#EAE0D5]/10 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-[#EAE0D5]/20 focus:border-[#EAE0D5]/40 transition-all text-[#EAE0D5] placeholder:text-[#EAE0D5]/20"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!newTodo.trim()}
                  className="w-full bg-[#EAE0D5] text-[#0F172A] py-5 rounded-2xl font-bold text-lg hover:bg-[#EAE0D5]/90 transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-5 h-5" />
                  Agendar Tarefa
                </button>
              </form>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-[#EAE0D5]/40 ml-1">
                Ou adicione uma tarefa pré-definida
              </h3>
              <div className="flex flex-wrap gap-2">
                {taskTemplates.map((template, index) => (
                  <button
                    key={index}
                    onClick={() => handleTemplateClick(template)}
                    className="bg-[#162033] border border-[#EAE0D5]/10 rounded-full px-3 py-2 text-xs text-left text-[#EAE0D5]/80 hover:bg-[#EAE0D5]/10 hover:border-[#EAE0D5]/20 transition-all flex items-center gap-2 active:scale-95"
                  >
                    <Plus className="w-3 h-3 flex-shrink-0" />
                    <span>{template}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <ConfirmDeleteModal
          isOpen={!!todoIdToDelete}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />

        {/* Floating Loading Overlay */}
        {isBreakingDownId && (
          <div className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#162033] p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-6 border border-[#EAE0D5]/10 max-w-xs w-full">
              <div className="relative">
                <Loader2 className="w-12 h-12 text-[#EAE0D5] animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="block w-3 h-3 bg-[#EAE0D5] rounded-full animate-ping opacity-75"></span>
                </div>
              </div>
              <div className="text-center">
                <p className="font-bold text-lg text-[#EAE0D5]">IA Analisando...</p>
                <p className="text-sm text-[#EAE0D5]/50 mt-2">Criando passos acionáveis para você.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-6 left-4 right-4 max-w-md mx-auto h-20 bg-[#162033]/90 backdrop-blur-xl border border-[#EAE0D5]/10 rounded-[2.5rem] shadow-2xl flex items-center justify-around px-4 z-40">
        <button
          onClick={() => setActiveTab('daily')}
          className={`flex flex-1 flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'daily' ? 'text-[#EAE0D5]' : 'text-[#EAE0D5]/30 hover:text-[#EAE0D5]/50'}`}
        >
          <div className={`p-2 rounded-2xl transition-all ${activeTab === 'daily' ? 'bg-[#EAE0D5]/10 shadow-lg' : ''}`}>
            <ClipboardList className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest">Tarefas</span>
        </button>

        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-1 flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'dashboard' ? 'text-[#EAE0D5]' : 'text-[#EAE0D5]/30 hover:text-[#EAE0D5]/50'}`}
        >
          <div className={`p-2 rounded-2xl transition-all ${activeTab === 'dashboard' ? 'bg-[#EAE0D5]/10 shadow-lg' : ''}`}>
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest">Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('register')}
          className={`flex flex-1 flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'register' ? 'text-[#EAE0D5]' : 'text-[#EAE0D5]/30 hover:text-[#EAE0D5]/50'}`}
        >
          <div className={`p-2 rounded-2xl transition-all ${activeTab === 'register' ? 'bg-[#EAE0D5]/10 shadow-lg' : ''}`}>
            <Plus className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest">Agendar</span>
        </button>
      </nav>
      
    </div>
  );
};

export default App;
