
import React from 'react';
import { Todo, Priority } from '../types';
import { CheckCircle, Circle, Trash2, ChevronDown, ChevronUp, Sparkles, Target } from 'lucide-react';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleSubtask: (todoId: string, subtaskId: string) => void;
  weeklyGoalProgress: { current: number; target: number; } | null;
}

const TodoItem: React.FC<TodoItemProps> = ({ 
  todo, 
  onToggle, 
  onDelete, 
  onToggleSubtask, 
  weeklyGoalProgress
}) => {
  const [expanded, setExpanded] = React.useState(false);

  const priorityColors = {
    [Priority.LOW]: 'bg-blue-900/40 text-blue-300 border border-blue-800/50',
    [Priority.MEDIUM]: 'bg-yellow-900/40 text-yellow-300 border border-yellow-800/50',
    [Priority.HIGH]: 'bg-red-900/40 text-red-300 border border-red-800/50',
  };

  return (
    <div className={`group bg-[#162033] rounded-xl border border-[#EAE0D5]/5 transition-all duration-300 hover:border-[#EAE0D5]/20 ${todo.completed ? 'opacity-60' : ''}`}>
      <div className="p-4 flex items-center gap-4">
        <button 
          onClick={() => onToggle(todo.id)}
          className="text-[#EAE0D5]/40 hover:text-[#EAE0D5] transition-colors"
        >
          {todo.completed ? (
            <CheckCircle className="w-6 h-6 text-emerald-400 fill-emerald-400/10" />
          ) : (
            <Circle className="w-6 h-6" />
          )}
        </button>

        <div className="flex-1 overflow-hidden">
          <p className={`text-[#EAE0D5] font-medium truncate ${todo.completed ? 'line-through text-[#EAE0D5]/30' : ''}`}>
            {todo.text}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${priorityColors[todo.priority]}`}>
              {todo.priority}
            </span>
            {weeklyGoalProgress && (
              <span className="flex items-center gap-1 text-[10px] text-sky-300 font-medium bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
                <Target className="w-2.5 h-2.5" />
                Meta: {weeklyGoalProgress.current}/{weeklyGoalProgress.target}
              </span>
            )}
            {todo.subtasks && todo.subtasks.length > 0 && (
              <span className="text-[10px] text-[#EAE0D5]/50 font-medium">
                {todo.subtasks.filter(s => s.completed).length}/{todo.subtasks.length} sub-tarefas
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button 
            onClick={() => onDelete(todo.id)}
            className="p-2 text-rose-400/60 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          {todo.subtasks && todo.subtasks.length > 0 && (
            <button 
              onClick={() => setExpanded(!expanded)}
              className="p-2 text-[#EAE0D5]/40 hover:text-[#EAE0D5] hover:bg-white/5 rounded-lg transition-colors"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {expanded && todo.subtasks && todo.subtasks.length > 0 && (
        <div className="px-14 pb-4 space-y-2 border-t border-[#EAE0D5]/5 pt-3">
          {todo.subtasks.map((sub) => (
            <div key={sub.id} className="flex items-center gap-3">
              <button 
                onClick={() => onToggleSubtask(todo.id, sub.id)}
                className="text-[#EAE0D5]/30 hover:text-[#EAE0D5]"
              >
                {sub.completed ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Circle className="w-4 h-4" />
                )}
              </button>
              <span className={`text-sm text-[#EAE0D5]/70 ${sub.completed ? 'line-through text-[#EAE0D5]/30' : ''}`}>
                {sub.text}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TodoItem;
