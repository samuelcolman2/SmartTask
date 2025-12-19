
import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-[#162033] p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-6 border border-[#EAE0D5]/10 max-w-sm w-full relative animate-in zoom-in-95 duration-300">
        <button onClick={onCancel} className="absolute top-4 right-4 text-[#EAE0D5]/40 hover:text-[#EAE0D5] transition-colors" aria-label="Fechar modal">
          <X className="w-6 h-6" />
        </button>
        <div className="bg-rose-500/10 p-4 rounded-full border border-rose-500/20">
          <AlertTriangle className="w-10 h-10 text-rose-400" />
        </div>
        
        <div className="text-center">
          <h2 id="modal-title" className="font-bold text-xl text-[#EAE0D5]">Confirmar Exclusão</h2>
          <p className="text-sm text-[#EAE0D5]/50 mt-2">
            Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full">
          <button
            onClick={onCancel}
            className="bg-[#EAE0D5]/5 text-[#EAE0D5] py-3 rounded-xl font-bold text-base hover:bg-[#EAE0D5]/10 transition-all active:scale-[0.98]"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="bg-rose-600 text-white py-3 rounded-xl font-bold text-base hover:bg-rose-500 transition-all active:scale-[0.98] shadow-lg shadow-rose-600/20"
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
