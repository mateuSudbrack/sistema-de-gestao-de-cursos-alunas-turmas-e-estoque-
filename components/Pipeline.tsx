
import React, { useState, useEffect } from 'react';
import { Student, StudentStatus, Course, PipelineDefinition, PipelineStage } from '../types';
import { Phone, MessageCircle, GripVertical, Settings, Plus, Trash2, X, Check, Edit2, ArrowLeft } from 'lucide-react';
import { ToastType } from './Toast';

interface PipelineProps {
  students: Student[];
  courses: Course[];
  pipelines: PipelineDefinition[];
  defaultPipelineId: string;
  onUpdateStudent: (s: Student) => void;
  onUpdatePipeline: (p: PipelineDefinition) => void;
  onAddPipeline: (p: PipelineDefinition) => void;
  onSetDefaultPipeline: (id: string) => void;
  onShowToast: (message: string, type: ToastType) => void;
}

const Pipeline: React.FC<PipelineProps> = ({ 
  students, 
  courses, 
  pipelines, 
  defaultPipelineId,
  onUpdateStudent, 
  onUpdatePipeline,
  onAddPipeline,
  onSetDefaultPipeline,
  onShowToast 
}) => {
  const [currentPipelineId, setCurrentPipelineId] = useState(defaultPipelineId);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  
  // Editor States
  const [editingPipelineId, setEditingPipelineId] = useState<string | null>(null);
  const [editingPipelineName, setEditingPipelineName] = useState('');
  const [editingStages, setEditingStages] = useState<PipelineStage[]>([]);

  useEffect(() => {
      if (!pipelines.find(p => p.id === currentPipelineId)) {
          setCurrentPipelineId(defaultPipelineId);
      }
  }, [pipelines, defaultPipelineId, currentPipelineId]);

  const currentPipeline = pipelines.find(p => p.id === currentPipelineId) || pipelines[0];

  // Filter students for current pipeline
  const filteredStudents = students.filter(s => {
    // If system pipeline, show everyone (or filter by logic if needed). 
    // If custom pipeline, show only those assigned to it
    const belongsToPipeline = currentPipeline.isSystem 
        ? true // System pipeline shows everyone typically, or we could filter s.pipelineId === systemId
        : s.pipelineId === currentPipeline.id;

    if (!belongsToPipeline) return false;

    return s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.phone.includes(searchTerm);
  });

  // Drag and Drop Handlers
  const handleDragStart = (id: string) => {
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    if (!draggedId) return;
    
    const student = students.find(s => s.id === draggedId);
    if (student) {
      let updatedStudent = { ...student };
      
      if (currentPipeline.isSystem) {
          // For system pipeline, stageId IS the status (e.g. 'active', 'interested')
          // We cast to StudentStatus assuming stageId matches
          if (student.status !== stageId) {
              updatedStudent.status = stageId as StudentStatus;
              updatedStudent.pipelineId = currentPipeline.id; // Ensure they are "in" this pipeline context
              onUpdateStudent(updatedStudent);
              onShowToast(`Status de ${student.name} atualizado!`, 'success');
          }
      } else {
          // Custom pipeline
          // If student was not in this pipeline, move them in
          const isMove = student.pipelineId !== currentPipeline.id;
          const isStageChange = student.stageId !== stageId;

          if (isMove || isStageChange) {
              updatedStudent.pipelineId = currentPipeline.id;
              updatedStudent.stageId = stageId;
              onUpdateStudent(updatedStudent);
              onShowToast(`Aluna movida para ${currentPipeline.stages.find(s => s.id === stageId)?.name}`, 'success');
          }
      }
    }
    setDraggedId(null);
  };

  // Manager Logic
  const handleCreatePipeline = () => {
      const newId = crypto.randomUUID();
      const newPipeline: PipelineDefinition = {
          id: newId,
          name: 'Novo Pipeline',
          isSystem: false,
          stages: [
              { id: crypto.randomUUID(), name: 'Triagem', color: '#9ca3af', order: 1 },
              { id: crypto.randomUUID(), name: 'Em Andamento', color: '#3b82f6', order: 2 },
              { id: crypto.randomUUID(), name: 'Concluído', color: '#22c55e', order: 3 }
          ]
      };
      onAddPipeline(newPipeline);
      setEditingPipelineId(newId);
      setEditingPipelineName(newPipeline.name);
      setEditingStages(newPipeline.stages);
  };

  const handleStartEdit = (p: PipelineDefinition) => {
      setEditingPipelineId(p.id);
      setEditingPipelineName(p.name);
      setEditingStages([...p.stages]);
  };

  const handleSavePipeline = () => {
      if (!editingPipelineId) return;
      const pipeline = pipelines.find(p => p.id === editingPipelineId);
      if (pipeline) {
          const updated: PipelineDefinition = {
              ...pipeline,
              name: editingPipelineName,
              stages: editingStages
          };
          onUpdatePipeline(updated);
          onShowToast('Pipeline salvo com sucesso!', 'success');
          setEditingPipelineId(null);
      }
  };

  const renderStudentCard = (student: Student) => (
    <div 
      key={student.id} 
      draggable
      onDragStart={() => handleDragStart(student.id)}
      className={`bg-white dark:bg-dark-surface rounded-xl border border-gray-100 dark:border-dark-border shadow-sm hover:shadow-md transition-all group relative p-3 mb-3 cursor-grab active:cursor-grabbing hover:-translate-y-1 ${draggedId === student.id ? 'opacity-50 ring-2 ring-primary-300' : ''}`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-start gap-2">
          <GripVertical size={14} className="text-gray-300 mt-1" />
          <div>
            <h3 className="font-bold text-gray-800 dark:text-dark-text text-sm">{student.name}</h3>
          </div>
        </div>
      </div>

      <div className="space-y-1 text-gray-500 dark:text-dark-textMuted text-xs mb-3 pl-5">
        <div className="flex items-center gap-2">
          <Phone size={12} /> {student.phone}
        </div>
        {student.interestedIn.length > 0 && (
          <div className="flex items-start gap-2 mt-1">
            <span className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded text-[10px] border border-amber-100 dark:border-amber-800/30 font-medium">
               {courses.find(c => c.id === student.interestedIn[0])?.name || 'Curso'}
            </span>
          </div>
        )}
      </div>

      <div className="flex gap-2 border-t border-gray-50 dark:border-dark-border pt-2 pl-5">
        <a 
          href={`https://wa.me/55${student.phone.replace(/\D/g,'')}`} 
          target="_blank" 
          rel="noreferrer"
          className="flex-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 rounded-lg flex items-center justify-center gap-1.5 font-medium transition-colors py-1.5 text-xs"
          title="Abrir WhatsApp"
        >
          <MessageCircle size={14} /> Zap
        </a>
      </div>
    </div>
  );

  return (
    <div className="pb-20 md:pb-0 space-y-6 animate-fade-in h-[calc(100vh-100px)] flex flex-col">
       
       {/* Header Controls */}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
         <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text">Pipeline</h2>
            <div className="relative group">
                <select 
                    value={currentPipelineId}
                    onChange={(e) => setCurrentPipelineId(e.target.value)}
                    className="appearance-none pl-4 pr-10 py-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl text-sm font-bold text-gray-700 dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary-200 cursor-pointer shadow-sm hover:border-primary-300 transition-colors"
                >
                    {pipelines.map(p => (
                        <option key={p.id} value={p.id}>{p.name} {p.isSystem ? '(Sistema)' : ''} {p.id === defaultPipelineId ? '★' : ''}</option>
                    ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Settings size={14} className="text-gray-400" />
                </div>
            </div>
            <button 
                onClick={() => setIsManagerOpen(true)}
                className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                title="Gerenciar Pipelines"
            >
                <Settings size={20}/>
            </button>
         </div>
         
         <input
            type="text"
            placeholder="Buscar aluna..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64 pl-4 pr-4 py-2 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-800 dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-900"
          />
      </div>

      {/* Board Columns */}
      <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
          <div className="flex gap-4 min-w-[900px] h-full">
            {currentPipeline.stages.sort((a,b) => a.order - b.order).map(stage => {
                // Count items in this stage
                const itemsInStage = filteredStudents.filter(s => {
                    if (currentPipeline.isSystem) return s.status === stage.id;
                    return s.pipelineId === currentPipeline.id && s.stageId === stage.id;
                });

                return (
                    <div 
                        key={stage.id}
                        className="flex-1 bg-gray-50 dark:bg-white/5 rounded-2xl p-3 flex flex-col h-full border border-gray-100 dark:border-dark-border min-w-[280px]"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, stage.id)}
                    >
                        <div className="flex justify-between items-center mb-3 px-1" style={{ color: stage.color }}>
                            <h3 className="font-bold flex items-center gap-2 uppercase text-sm tracking-wide">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }}></span>
                                {stage.name}
                            </h3>
                            <span className="bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded-md text-xs font-bold shadow-sm text-gray-600 dark:text-gray-300">
                                {itemsInStage.length}
                            </span>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2">
                        {itemsInStage.map(student => renderStudentCard(student))}
                            
                        {itemsInStage.length === 0 && (
                            <div className="h-24 border-2 border-dashed border-gray-200 dark:border-gray-700/50 rounded-xl flex items-center justify-center text-gray-400 text-sm">
                                Arraste aqui
                            </div>
                        )}
                        </div>
                    </div>
                )
            })}
          </div>
        </div>

        {/* Pipeline Manager Modal */}
        {isManagerOpen && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white dark:bg-dark-surface rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="bg-primary-600 p-4 text-white flex justify-between items-center shrink-0">
                        <h3 className="font-bold text-lg flex items-center gap-2"><Settings size={20}/> Gerenciar Pipelines</h3>
                        <button onClick={() => setIsManagerOpen(false)} className="hover:bg-white/10 p-1 rounded-full"><X size={20}/></button>
                    </div>
                    
                    <div className="flex-1 overflow-hidden flex">
                        {/* List of Pipelines */}
                        <div className="w-1/3 border-r border-gray-100 dark:border-dark-border overflow-y-auto custom-scrollbar bg-gray-50 dark:bg-white/5">
                            <button onClick={handleCreatePipeline} className="w-full p-3 flex items-center gap-2 text-primary-600 dark:text-primary-400 font-bold text-sm hover:bg-gray-100 dark:hover:bg-white/10 border-b border-gray-100 dark:border-dark-border">
                                <Plus size={16}/> Novo Pipeline
                            </button>
                            {pipelines.map(p => (
                                <div 
                                    key={p.id} 
                                    onClick={() => !editingPipelineId && handleStartEdit(p)}
                                    className={`p-3 border-b border-gray-100 dark:border-dark-border cursor-pointer hover:bg-white dark:hover:bg-white/10 transition-colors ${editingPipelineId === p.id ? 'bg-white dark:bg-white/10 border-l-4 border-l-primary-500' : ''}`}
                                >
                                    <div className="font-bold text-gray-800 dark:text-dark-text text-sm">{p.name}</div>
                                    <div className="flex items-center justify-between mt-1">
                                        <span className="text-xs text-gray-400">{p.stages.length} estágios</span>
                                        {p.id === defaultPipelineId && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">Padrão</span>}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Editor Area */}
                        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-white dark:bg-dark-surface">
                            {editingPipelineId ? (
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-dark-textMuted mb-1">Nome do Pipeline</label>
                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                className="flex-1 p-2 border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-white/5 text-gray-800 dark:text-dark-text"
                                                value={editingPipelineName}
                                                onChange={e => setEditingPipelineName(e.target.value)}
                                            />
                                            {editingPipelineId !== defaultPipelineId && (
                                                <button 
                                                    onClick={() => onSetDefaultPipeline(editingPipelineId)}
                                                    className="text-xs bg-gray-100 dark:bg-white/10 hover:bg-amber-50 hover:text-amber-600 px-3 rounded-lg font-medium transition-colors"
                                                    title="Tornar Padrão"
                                                >
                                                    Definir Padrão
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="block text-xs font-bold text-gray-500 dark:text-dark-textMuted">Estágios</label>
                                            {!pipelines.find(p => p.id === editingPipelineId)?.isSystem && (
                                                <button 
                                                    onClick={() => setEditingStages([...editingStages, { id: crypto.randomUUID(), name: 'Novo Estágio', color: '#9ca3af', order: editingStages.length + 1 }])}
                                                    className="text-xs flex items-center gap-1 text-primary-600 hover:text-primary-700"
                                                >
                                                    <Plus size={12}/> Adicionar
                                                </button>
                                            )}
                                        </div>
                                        
                                        <div className="space-y-2">
                                            {editingStages.map((stage, idx) => (
                                                <div key={stage.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-dark-border">
                                                    <input 
                                                        type="color" 
                                                        value={stage.color}
                                                        disabled={pipelines.find(p => p.id === editingPipelineId)?.isSystem}
                                                        onChange={e => {
                                                            const newStages = [...editingStages];
                                                            newStages[idx].color = e.target.value;
                                                            setEditingStages(newStages);
                                                        }}
                                                        className="w-8 h-8 rounded border-none cursor-pointer"
                                                    />
                                                    <input 
                                                        type="text"
                                                        value={stage.name}
                                                        disabled={pipelines.find(p => p.id === editingPipelineId)?.isSystem}
                                                        onChange={e => {
                                                            const newStages = [...editingStages];
                                                            newStages[idx].name = e.target.value;
                                                            setEditingStages(newStages);
                                                        }}
                                                        className="flex-1 bg-transparent text-sm font-medium outline-none text-gray-800 dark:text-dark-text disabled:text-gray-500"
                                                    />
                                                    {!pipelines.find(p => p.id === editingPipelineId)?.isSystem && (
                                                        <button 
                                                            onClick={() => setEditingStages(editingStages.filter(s => s.id !== stage.id))}
                                                            className="text-gray-400 hover:text-red-500 p-1"
                                                        >
                                                            <Trash2 size={14}/>
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        {pipelines.find(p => p.id === editingPipelineId)?.isSystem && (
                                            <p className="text-[10px] text-amber-500 mt-2 flex items-center gap-1"><Settings size={10}/> Estágios do sistema não podem ser removidos.</p>
                                        )}
                                    </div>

                                    <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-dark-border">
                                        <button onClick={handleSavePipeline} className="bg-primary-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-primary-700">Salvar Alterações</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-400 text-sm italic">
                                    Selecione um pipeline para editar
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default Pipeline;
