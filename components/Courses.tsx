import React, { useState } from 'react';
import { Course, Student, CourseClass } from '../types';
import { Clock, DollarSign, Plus, Users, BookOpen, X, TrendingUp, Calendar, CheckCircle, AlertCircle, Edit2, Save } from 'lucide-react';
import { ToastType } from './Toast';

interface CoursesProps {
  courses: Course[];
  students: Student[];
  classes: CourseClass[];
  onAddCourse: (c: Course) => void;
  onUpdateCourse: (c: Course) => void;
  onAddClass: (c: CourseClass) => void;
  onShowToast: (message: string, type: ToastType) => void;
}

export default function Courses({ courses, students, classes, onAddCourse, onUpdateCourse, onAddClass, onShowToast }: CoursesProps) {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Partial<Course>>({});
  const [showNewClassForm, setShowNewClassForm] = useState(false);
  const [newClassData, setNewClassData] = useState({ date: '', endDate: '', max: 4 });

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const getCourseStats = (courseId: string) => {
    const alumni = students.filter(s => s.history.some(h => h.courseId === courseId));
    const interested = students.filter(s => s.interestedIn.includes(courseId));
    const revenue = alumni.reduce((acc, s) => {
      const record = s.history.find(h => h.courseId === courseId);
      return acc + (record ? record.paid : 0);
    }, 0);
    
    const courseClasses = classes.filter(c => c.courseId === courseId);
    const openClasses = courseClasses.filter(c => c.status === 'open');

    return { alumni, interested, revenue, courseClasses, openClasses };
  };

  const handleNewCourse = () => {
    setEditingCourse({
        id: crypto.randomUUID(),
        name: '',
        price: 0,
        duration: '',
        description: ''
    });
    setIsEditorOpen(true);
  };

  const handleEditCourse = (e: React.MouseEvent, course: Course) => {
    e.stopPropagation();
    setEditingCourse({ ...course });
    setIsEditorOpen(true);
  };

  const handleSaveCourse = () => {
      if (!editingCourse.name || !editingCourse.price) {
          onShowToast('Preencha nome e preço do curso.', 'error');
          return;
      }
      
      if (courses.find(c => c.id === editingCourse.id)) {
          onUpdateCourse(editingCourse as Course);
          onShowToast('Curso atualizado com sucesso!', 'success');
      } else {
          onAddCourse(editingCourse as Course);
          onShowToast('Curso criado com sucesso!', 'success');
      }
      setIsEditorOpen(false);
  };

  const handleCreateClass = () => {
    if (!selectedCourse) return;
    if (!newClassData.date || !newClassData.max) {
        onShowToast("Preencha a data de início e o número de vagas.", "error");
        return;
    }
    
    const newClass: CourseClass = {
      id: crypto.randomUUID(),
      courseId: selectedCourse.id,
      startDate: newClassData.date,
      endDate: newClassData.endDate || newClassData.date,
      maxStudents: Number(newClassData.max),
      enrolledStudentIds: [],
      status: 'open'
    };

    onAddClass(newClass);
    setShowNewClassForm(false);
    setNewClassData({ date: '', endDate: '', max: 4 });
    onShowToast("Turma criada com sucesso!", "success");
  };

  return (
    <div className="pb-20 md:pb-0 space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text">Cursos Oferecidos</h2>
        <button 
          onClick={handleNewCourse}
          className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-md shadow-primary-200 active:scale-95 transition-all"
        >
          <Plus size={20} /> Novo Curso
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map(course => {
          const stats = getCourseStats(course.id);
          const nextClass = stats.openClasses.sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];

          return (
            <div key={course.id} className="bg-white dark:bg-dark-surface rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-dark-border group hover:shadow-lg transition-all flex flex-col h-full hover:-translate-y-1 duration-300 relative">
              <button 
                onClick={(e) => handleEditCourse(e, course)}
                className="absolute top-4 right-4 z-10 bg-white/90 dark:bg-black/50 hover:bg-primary-50 dark:hover:bg-primary-900/50 text-gray-400 hover:text-primary-600 dark:text-gray-300 p-2 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 transition-colors"
                title="Editar Curso"
              >
                <Edit2 size={16} />
              </button>

              <div className="h-2 bg-gradient-to-r from-primary-400 to-gold-400"></div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4 pr-10">
                  <h3 className="font-bold text-xl text-gray-800 dark:text-dark-text leading-tight">{course.name}</h3>
                </div>
                
                <p className="text-gray-500 dark:text-dark-textMuted text-sm mb-6 line-clamp-2 min-h-[40px]">
                  {course.description}
                </p>

                <div className="space-y-3 mt-auto">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2 text-gray-600 dark:text-dark-textMuted text-sm">
                        <Clock size={16} className="text-amber-500" /> {course.duration}
                     </div>
                     <div className="flex items-center gap-2 text-gray-600 dark:text-dark-textMuted text-sm">
                        <Users size={16} className="text-blue-500" /> {stats.alumni.length} formadas
                     </div>
                  </div>
                  
                  {nextClass ? (
                     <div className="flex items-center gap-2 text-sm bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-3 py-2 rounded-lg border border-green-100 dark:border-green-800/30">
                       <Calendar size={16} /> 
                       Próxima: <strong>{new Date(nextClass.startDate).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'})}</strong>
                     </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-dark-textMuted px-3 py-2 rounded-lg border border-gray-100 dark:border-dark-border">
                       <AlertCircle size={16} /> Sem turmas abertas
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-white/5 p-3 rounded-xl">
                    <DollarSign size={20} className="text-green-600 dark:text-green-400" />
                    <span className="text-lg font-bold text-gray-800 dark:text-dark-text">{formatCurrency(course.price)}</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-dark-border">
                  <button 
                    onClick={() => setSelectedCourse(course)}
                    className="w-full py-2.5 text-primary-600 dark:text-primary-400 font-semibold hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <BookOpen size={16} /> Gerenciar Turmas
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Course Editor Modal */}
      {isEditorOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-dark-surface rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
               <div className="bg-primary-500 p-4 flex justify-between items-center text-white">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                     {courses.find(c => c.id === editingCourse.id) ? 'Editar Curso' : 'Novo Curso'}
                  </h3>
                  <button onClick={() => setIsEditorOpen(false)} className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors">
                     <X size={20} />
                  </button>
               </div>
               <div className="p-6 space-y-4 bg-white dark:bg-dark-surface">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-dark-textMuted mb-1">Nome do Curso</label>
                    <input 
                      type="text" 
                      className="w-full border border-gray-200 dark:border-dark-border bg-white dark:bg-white/5 text-gray-800 dark:text-dark-text rounded-lg p-3 focus:ring-2 focus:ring-primary-200 outline-none"
                      placeholder="Ex: Micropigmentação Labial"
                      value={editingCourse.name}
                      onChange={e => setEditingCourse({...editingCourse, name: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-dark-textMuted mb-1">Preço (R$)</label>
                        <input 
                        type="number" 
                        className="w-full border border-gray-200 dark:border-dark-border bg-white dark:bg-white/5 text-gray-800 dark:text-dark-text rounded-lg p-3 focus:ring-2 focus:ring-primary-200 outline-none"
                        placeholder="0.00"
                        value={editingCourse.price}
                        onChange={e => setEditingCourse({...editingCourse, price: parseFloat(e.target.value)})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-dark-textMuted mb-1">Duração</label>
                        <input 
                        type="text" 
                        className="w-full border border-gray-200 dark:border-dark-border bg-white dark:bg-white/5 text-gray-800 dark:text-dark-text rounded-lg p-3 focus:ring-2 focus:ring-primary-200 outline-none"
                        placeholder="Ex: 3 Dias"
                        value={editingCourse.duration}
                        onChange={e => setEditingCourse({...editingCourse, duration: e.target.value})}
                        />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-dark-textMuted mb-1">Descrição Breve</label>
                    <textarea 
                      className="w-full border border-gray-200 dark:border-dark-border bg-white dark:bg-white/5 text-gray-800 dark:text-dark-text rounded-lg p-3 focus:ring-2 focus:ring-primary-200 outline-none resize-none"
                      rows={3}
                      placeholder="O que a aluna vai aprender..."
                      value={editingCourse.description}
                      onChange={e => setEditingCourse({...editingCourse, description: e.target.value})}
                    />
                  </div>
               </div>
               <div className="p-4 border-t border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-dark-surface flex justify-end gap-3">
                  <button onClick={() => setIsEditorOpen(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg font-medium transition-colors">Cancelar</button>
                  <button onClick={handleSaveCourse} className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium shadow-md flex items-center gap-2 transition-colors">
                     <Save size={18} /> Salvar Curso
                  </button>
               </div>
            </div>
          </div>
      )}

      {/* Course Details / Classes Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-dark-surface rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="bg-primary-600 p-6 text-white relative shrink-0">
              <button 
                onClick={() => { setSelectedCourse(null); setShowNewClassForm(false); }}
                className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
              <h2 className="text-2xl font-bold mb-1">{selectedCourse.name}</h2>
              <p className="text-primary-100">{selectedCourse.description}</p>
              
              <div className="flex gap-4 mt-4">
                 <span className="bg-white/20 px-3 py-1 rounded-lg text-sm font-medium flex items-center gap-2 backdrop-blur-sm">
                    <Clock size={14}/> {selectedCourse.duration}
                 </span>
                 <span className="bg-white/20 px-3 py-1 rounded-lg text-sm font-medium flex items-center gap-2 backdrop-blur-sm">
                    <DollarSign size={14}/> {formatCurrency(selectedCourse.price)}
                 </span>
              </div>
            </div>

            <div className="p-0 overflow-hidden flex flex-col flex-1 bg-white dark:bg-dark-surface">
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                
                {/* Metrics Row */}
                {(() => {
                  const stats = getCourseStats(selectedCourse.id);
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-800/30">
                        <div className="text-green-600 dark:text-green-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                          <TrendingUp size={12} /> Faturamento Total
                        </div>
                        <div className="text-xl font-bold text-green-800 dark:text-green-300">{formatCurrency(stats.revenue)}</div>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30">
                        <div className="text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                          <Users size={12} /> Alunas Formadas
                        </div>
                        <div className="text-xl font-bold text-blue-800 dark:text-blue-300">{stats.alumni.length}</div>
                      </div>
                      <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-100 dark:border-amber-800/30">
                        <div className="text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                          <Users size={12} /> Leads/Interessadas
                        </div>
                        <div className="text-xl font-bold text-amber-800 dark:text-amber-300">{stats.interested.length}</div>
                      </div>
                    </div>
                  );
                })()}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Col: Class Management */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-gray-800 dark:text-dark-text flex items-center gap-2">
                        <Calendar size={20} className="text-primary-500"/> Gestão de Turmas
                      </h3>
                      <button 
                         onClick={() => setShowNewClassForm(!showNewClassForm)}
                         className={`text-sm font-bold px-3 py-1.5 rounded-lg transition-colors ${showNewClassForm ? 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-dark-textMuted' : 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/30'}`}
                      >
                        {showNewClassForm ? 'Cancelar' : '+ Criar Nova Turma'}
                      </button>
                    </div>

                    {/* New Class Form */}
                    {showNewClassForm && (
                      <div className="bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-800/30 p-5 rounded-xl animate-in slide-in-from-top-2 shadow-inner">
                         <h4 className="text-sm font-bold text-primary-800 dark:text-primary-300 mb-3">Nova Turma</h4>
                         <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-xs font-bold text-gray-500 dark:text-dark-textMuted mb-1">Data de Início</label>
                              <input 
                                type="date" 
                                className="w-full p-2 rounded-lg border border-gray-200 dark:border-dark-border dark:bg-white/5 dark:text-dark-text focus:ring-2 focus:ring-primary-200 outline-none"
                                value={newClassData.date}
                                onChange={e => setNewClassData({...newClassData, date: e.target.value})}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-500 dark:text-dark-textMuted mb-1">Data de Fim</label>
                              <input 
                                type="date" 
                                className="w-full p-2 rounded-lg border border-gray-200 dark:border-dark-border dark:bg-white/5 dark:text-dark-text focus:ring-2 focus:ring-primary-200 outline-none"
                                value={newClassData.endDate}
                                onChange={e => setNewClassData({...newClassData, endDate: e.target.value})}
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="block text-xs font-bold text-gray-500 dark:text-dark-textMuted mb-1">Vagas</label>
                              <input 
                                type="number" 
                                className="w-full p-2 rounded-lg border border-gray-200 dark:border-dark-border dark:bg-white/5 dark:text-dark-text focus:ring-2 focus:ring-primary-200 outline-none"
                                value={newClassData.max}
                                onChange={e => setNewClassData({...newClassData, max: Number(e.target.value)})}
                              />
                            </div>
                         </div>
                         <button 
                            onClick={handleCreateClass}
                            className="w-full bg-primary-500 text-white font-bold py-2 rounded-lg hover:bg-primary-600 transition-colors shadow-sm"
                         >
                           Confirmar Criação
                         </button>
                      </div>
                    )}

                    {/* Active/Open Classes List */}
                    <div className="space-y-3">
                      {getCourseStats(selectedCourse.id).courseClasses.length === 0 ? (
                        <div className="text-center py-10 bg-gray-50 dark:bg-white/5 rounded-xl border border-dashed border-gray-200 dark:border-dark-border">
                          <Calendar size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-2"/>
                          <p className="text-gray-400 dark:text-dark-textMuted text-sm">Nenhuma turma cadastrada para este curso.</p>
                        </div>
                      ) : (
                        getCourseStats(selectedCourse.id).courseClasses
                          .sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()) // Newest first
                          .map(c => {
                            const filled = c.enrolledStudentIds.length;
                            const percent = (filled / c.maxStudents) * 100;
                            const isPast = new Date(c.startDate) < new Date();

                            return (
                              <div key={c.id} className={`border rounded-xl p-4 transition-all ${isPast ? 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-dark-border' : 'bg-white dark:bg-dark-surface border-gray-200 dark:border-dark-border hover:border-primary-300 dark:hover:border-primary-700 shadow-sm'}`}>
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className={`text-sm font-bold ${isPast ? 'text-gray-600 dark:text-gray-400' : 'text-primary-700 dark:text-primary-400'}`}>
                                        Turma {new Date(c.startDate).toLocaleDateString('pt-BR')}
                                      </span>
                                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                                        c.status === 'completed' ? 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300' :
                                        isPast ? 'bg-amber-100 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/30 text-amber-700 dark:text-amber-400' :
                                        'bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800/30 text-green-700 dark:text-green-400'
                                      }`}>
                                        {c.status === 'completed' ? 'Concluída' : isPast ? 'Em Andamento' : 'Aberta'}
                                      </span>
                                    </div>
                                    {c.endDate && c.endDate !== c.startDate && (
                                        <div className="text-xs text-gray-400 mt-0.5">
                                            Até {new Date(c.endDate).toLocaleDateString('pt-BR')}
                                        </div>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <span className="text-xs font-bold text-gray-600 dark:text-dark-textMuted">{filled} / {c.maxStudents} Vagas</span>
                                  </div>
                                </div>
                                
                                {/* Progress Bar */}
                                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mb-3">
                                  <div 
                                    className={`h-2 rounded-full ${isPast ? 'bg-gray-400 dark:bg-gray-500' : 'bg-primary-500'}`} 
                                    style={{ width: `${percent}%` }}
                                  ></div>
                                </div>

                                {/* Enrolled Students Preview */}
                                {filled > 0 && (
                                  <div className="flex -space-x-2 overflow-hidden py-1">
                                    {c.enrolledStudentIds.slice(0, 5).map(sid => {
                                      const st = students.find(s => s.id === sid);
                                      return (
                                        <div key={sid} className="inline-block h-7 w-7 rounded-full ring-2 ring-white dark:ring-dark-surface bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 flex items-center justify-center text-[10px] font-bold uppercase" title={st?.name}>
                                          {st?.name.substring(0,2)}
                                        </div>
                                      )
                                    })}
                                    {filled > 5 && (
                                      <div className="inline-block h-7 w-7 rounded-full ring-2 ring-white dark:ring-dark-surface bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-[10px] text-gray-500 dark:text-gray-300 font-bold">
                                        +{filled - 5}
                                      </div>
                                    )}
                                  </div>
                                )}
                                {filled === 0 && <p className="text-xs text-gray-400 dark:text-dark-textMuted italic">Nenhuma matrícula ainda.</p>}
                              </div>
                            );
                          })
                      )}
                    </div>
                  </div>

                  {/* Right Col: Lists */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-bold text-gray-800 dark:text-dark-text mb-3 text-sm uppercase tracking-wide">Pipeline de Interesse</h3>
                      <div className="bg-amber-50/50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-800/30 p-3 max-h-[200px] overflow-y-auto custom-scrollbar">
                        <ul className="space-y-2">
                          {getCourseStats(selectedCourse.id).interested.map(s => (
                            <li key={s.id} className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-dark-surface border border-amber-100 dark:border-amber-800/30 shadow-sm">
                              <span className="text-sm font-medium text-gray-700 dark:text-dark-text truncate max-w-[120px]">{s.name}</span>
                              <a href={`https://wa.me/55${s.phone}`} target="_blank" rel="noreferrer" className="text-[10px] bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded text-amber-700 dark:text-amber-400 font-bold hover:bg-amber-200 transition-colors">
                                Zap
                              </a>
                            </li>
                          ))}
                          {getCourseStats(selectedCourse.id).interested.length === 0 && (
                            <li className="text-sm text-gray-400 dark:text-dark-textMuted italic text-center py-4">Nenhuma interessada registrada.</li>
                          )}
                        </ul>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-gray-800 dark:text-dark-text mb-3 text-sm uppercase tracking-wide">Formadas Recentemente</h3>
                      <div className="bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-dark-border p-3 max-h-[200px] overflow-y-auto custom-scrollbar">
                        <ul className="space-y-2">
                          {getCourseStats(selectedCourse.id).alumni.slice(0, 5).map(s => (
                            <li key={s.id} className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border">
                              <span className="text-sm font-medium text-gray-700 dark:text-dark-text">{s.name}</span>
                              <CheckCircle size={14} className="text-green-500"/>
                            </li>
                          ))}
                          {getCourseStats(selectedCourse.id).alumni.length === 0 && (
                            <li className="text-sm text-gray-400 dark:text-dark-textMuted italic text-center py-4">Nenhuma aluna formada ainda.</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}