
import React, { useState } from 'react';
import { Student, StudentStatus, Course, CourseClass } from '../types';
import { Search, Plus, Phone, Edit2, MessageCircle, Sparkles, X, Save, Calendar, DollarSign, Trash2, CheckCircle, ShoppingBag, Trophy, User } from 'lucide-react';
import { generateFollowUpMessage } from '../services/geminiService';
import { ToastType } from './Toast';

interface StudentsProps {
  students: Student[];
  courses: Course[];
  classes: CourseClass[];
  onAddStudent: (s: Student) => void;
  onUpdateStudent: (s: Student) => void;
  onEnrollStudent: (studentId: string, classId: string, paidAmount: number) => void;
  onShowToast: (message: string, type: ToastType) => void;
}

const Students: React.FC<StudentsProps> = ({ students, courses, classes, onAddStudent, onUpdateStudent, onEnrollStudent, onShowToast }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'info' | 'history'>('info');
  const [editingStudent, setEditingStudent] = useState<Partial<Student> | null>(null);
  const [aiMessage, setAiMessage] = useState<{ studentId: string, text: string } | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  
  const [selectedClassId, setSelectedClassId] = useState('');
  const [negotiatedPrice, setNegotiatedPrice] = useState<string>('');

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.phone.includes(searchTerm);
    return matchesSearch;
  });

  const handleNewStudent = () => {
    setEditingStudent({
      id: crypto.randomUUID(),
      name: '',
      phone: '',
      photo: '',
      status: StudentStatus.INTERESTED,
      interestedIn: [],
      history: [],
      lastContact: new Date().toISOString().split('T')[0],
      nextFollowUp: '',
      notes: ''
    });
    setModalTab('info');
    setIsModalOpen(true);
    setSelectedClassId('');
    setNegotiatedPrice('');
  };

  const handleEditStudent = (s: Student) => {
    setEditingStudent({ ...s });
    setModalTab('info');
    setIsModalOpen(true);
    setSelectedClassId('');
    setNegotiatedPrice('');
  };

  const handleSave = () => {
    if (!editingStudent || !editingStudent.name || !editingStudent.phone) {
        onShowToast('Preencha nome e telefone!', 'error');
        return;
    }
    
    if (students.find(s => s.id === editingStudent.id)) {
      onUpdateStudent(editingStudent as Student);
      onShowToast('Aluna atualizada com sucesso!', 'success');
    } else {
      onAddStudent(editingStudent as Student);
      onShowToast('Aluna cadastrada com sucesso!', 'success');
    }
    setIsModalOpen(false);
    setEditingStudent(null);
  };

  const handleClassSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const classId = e.target.value;
    setSelectedClassId(classId);
    
    if (classId) {
      const classObj = classes.find(c => c.id === classId);
      if (classObj) {
        const course = courses.find(c => c.id === classObj.courseId);
        if (course) {
          setNegotiatedPrice(course.price.toString());
          return;
        }
      }
    }
    setNegotiatedPrice('');
  };

  const handleEnrollInClass = () => {
    if (!editingStudent || !selectedClassId) return;
    if (!editingStudent.id) {
        onShowToast('Salve a aluna primeiro antes de matricular.', 'error');
        return;
    }
    const finalPrice = parseFloat(negotiatedPrice);
    if (isNaN(finalPrice)) {
        onShowToast('Por favor, insira um valor válido.', 'error');
        return;
    }

    onEnrollStudent(editingStudent.id, selectedClassId, finalPrice);
    onShowToast('Matrícula realizada com sucesso!', 'success');
    setIsModalOpen(false);
  };

  const handleGenerateAiMessage = async (student: Student) => {
    setLoadingAi(true);
    setAiMessage(null);
    
    const interestName = student.interestedIn.length > 0 
      ? courses.find(c => c.id === student.interestedIn[0])?.name || 'nossos cursos'
      : 'nossos cursos';

    const text = await generateFollowUpMessage(student.name, interestName, student.lastContact);
    setAiMessage({ studentId: student.id, text });
    setLoadingAi(false);
  };

  return (
    <div className="pb-20 md:pb-0 space-y-6 animate-fade-in h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text">Alunas e Leads</h2>
        <div className="flex gap-2">
          <button 
            onClick={handleNewStudent}
            className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-md shadow-primary-200 active:scale-95 transition-all"
          >
            <Plus size={20} /> <span className="hidden sm:inline">Nova Aluna</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por nome ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-800 dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-900 focus:border-primary-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredStudents.map(student => (
          <div 
            key={student.id} 
            className="bg-white dark:bg-dark-surface rounded-xl border border-gray-100 dark:border-dark-border shadow-sm hover:shadow-md transition-all group relative p-5"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                {student.photo ? (
                   <img src={student.photo} alt={student.name} className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-dark-border" />
                ) : (
                   <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-lg">
                      {student.name.substring(0,2).toUpperCase()}
                   </div>
                )}
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-dark-text text-lg leading-tight">{student.name}</h3>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        student.status === StudentStatus.ACTIVE ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        student.status === StudentStatus.INTERESTED ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                        {student.status}
                    </span>
                    {student.history.length > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 flex items-center gap-1">
                            <Trophy size={10} /> {student.history.length}
                        </span>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={() => handleEditStudent(student)} className="p-1.5 text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10 rounded-lg hover:text-primary-500 transition-colors">
                <Edit2 size={16} />
              </button>
            </div>

            <div className="space-y-2 text-gray-500 dark:text-dark-textMuted text-sm mb-4">
              <div className="flex items-center gap-2">
                <Phone size={14} /> {student.phone}
              </div>
              {student.lastPurchase && (
                  <div className="flex items-center gap-2 text-xs">
                      <ShoppingBag size={14} className="text-gray-400"/> 
                      Última compra: <span className="font-medium text-gray-700 dark:text-gray-300">{new Date(student.lastPurchase).toLocaleDateString('pt-BR')}</span>
                  </div>
              )}
              {student.interestedIn.length > 0 && (
                <div className="flex items-start gap-2 mt-1">
                  <span className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded text-[10px] border border-amber-100 dark:border-amber-800/30 font-medium">
                    {courses.find(c => c.id === student.interestedIn[0])?.name || 'Curso'}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4 border-t border-gray-50 dark:border-dark-border">
              <a 
                href={`https://wa.me/55${student.phone.replace(/\D/g,'')}`} 
                target="_blank" 
                rel="noreferrer"
                className="flex-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 rounded-lg flex items-center justify-center gap-1.5 font-medium transition-colors py-2 text-sm"
              >
                <MessageCircle size={16} /> WhatsApp
              </a>
              
              <button 
                onClick={() => handleGenerateAiMessage(student)}
                className="flex-1 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 text-indigo-600 dark:text-indigo-400 hover:from-indigo-100 hover:to-purple-100 rounded-lg flex items-center justify-center gap-1.5 font-medium transition-all border border-indigo-100 dark:border-indigo-900/30 py-2 text-sm"
                disabled={loadingAi}
              >
                {loadingAi && aiMessage?.studentId !== student.id ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-600"></div>
                ) : (
                  <Sparkles size={16} />
                )}
                IA Sugestão
              </button>
            </div>

            {/* AI Message Popover */}
            {aiMessage?.studentId === student.id && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-dark-surface border border-indigo-100 dark:border-indigo-900/30 rounded-xl shadow-xl p-3 z-20 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1"><Sparkles size={12}/> Sugestão</h4>
                  <button onClick={() => setAiMessage(null)} className="text-gray-300 hover:text-gray-500"><X size={14}/></button>
                </div>
                <textarea 
                  readOnly 
                  className="w-full text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-white/5 rounded-lg p-2 mb-2 resize-none focus:outline-none"
                  rows={3}
                  value={aiMessage.text}
                />
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(aiMessage.text);
                    setAiMessage(null);
                    window.open(`https://wa.me/55${student.phone.replace(/\D/g,'')}?text=${encodeURIComponent(aiMessage.text)}`, '_blank');
                  }}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-1.5 rounded-lg transition-colors"
                >
                  Copiar e Abrir Zap
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {isModalOpen && editingStudent && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-dark-surface rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="bg-primary-500 p-4 flex justify-between items-center shrink-0 text-white">
              <h3 className="font-bold text-lg flex items-center gap-2">
                {students.find(s => s.id === editingStudent.id) ? <Edit2 size={18}/> : <Plus size={18}/>}
                {students.find(s => s.id === editingStudent.id) ? 'Editar Aluna' : 'Nova Aluna'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex border-b border-gray-100 dark:border-dark-border shrink-0">
               <button 
                className={`flex-1 py-3 text-sm font-semibold transition-colors relative ${modalTab === 'info' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
                onClick={() => setModalTab('info')}
               >
                 Dados Pessoais
                 {modalTab === 'info' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500"></div>}
               </button>
               <button 
                className={`flex-1 py-3 text-sm font-semibold transition-colors relative ${modalTab === 'history' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
                onClick={() => setModalTab('history')}
               >
                 Matrículas e Cursos
                 {modalTab === 'history' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500"></div>}
               </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-white dark:bg-dark-surface">
              {modalTab === 'info' ? (
                <div className="space-y-4 animate-in slide-in-from-left-2 fade-in">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 flex justify-center mb-2">
                         <div className="relative">
                             {editingStudent.photo ? (
                                <img src={editingStudent.photo} className="w-20 h-20 rounded-full object-cover border-2 border-primary-100" />
                             ) : (
                                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-300">
                                   <User size={32}/>
                                </div>
                             )}
                         </div>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-500 dark:text-dark-textMuted mb-1">URL da Foto</label>
                      <input 
                        type="text" 
                        placeholder="https://..."
                        className="w-full border border-gray-200 dark:border-dark-border bg-white dark:bg-white/5 text-gray-800 dark:text-dark-text rounded-lg p-2.5 focus:ring-2 focus:ring-primary-200 outline-none"
                        value={editingStudent.photo || ''}
                        onChange={e => setEditingStudent({...editingStudent, photo: e.target.value})}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-500 dark:text-dark-textMuted mb-1">Nome Completo</label>
                      <input 
                        type="text" 
                        className="w-full border border-gray-200 dark:border-dark-border bg-white dark:bg-white/5 text-gray-800 dark:text-dark-text rounded-lg p-2.5 focus:ring-2 focus:ring-primary-200 outline-none"
                        value={editingStudent.name}
                        onChange={e => setEditingStudent({...editingStudent, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-dark-textMuted mb-1">WhatsApp/Telefone</label>
                      <input 
                        type="text" 
                        className="w-full border border-gray-200 dark:border-dark-border bg-white dark:bg-white/5 text-gray-800 dark:text-dark-text rounded-lg p-2.5 focus:ring-2 focus:ring-primary-200 outline-none"
                        value={editingStudent.phone}
                        onChange={e => setEditingStudent({...editingStudent, phone: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-dark-textMuted mb-1">Status Atual</label>
                      <select 
                        className="w-full border border-gray-200 dark:border-dark-border bg-white dark:bg-white/5 text-gray-800 dark:text-dark-text rounded-lg p-2.5 focus:ring-2 focus:ring-primary-200 outline-none"
                        value={editingStudent.status}
                        onChange={e => setEditingStudent({...editingStudent, status: e.target.value as StudentStatus})}
                      >
                        <option value={StudentStatus.INTERESTED}>Interessada (Lead)</option>
                        <option value={StudentStatus.ACTIVE}>Em Curso (Ativa)</option>
                        <option value={StudentStatus.ALUMNI}>Formada (Ex-Aluna)</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-500 dark:text-dark-textMuted mb-1">Observações</label>
                      <textarea 
                        className="w-full border border-gray-200 dark:border-dark-border bg-white dark:bg-white/5 text-gray-800 dark:text-dark-text rounded-lg p-2.5 focus:ring-2 focus:ring-primary-200 outline-none resize-none"
                        rows={3}
                        value={editingStudent.notes}
                        onChange={e => setEditingStudent({...editingStudent, notes: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 animate-in slide-in-from-right-2 fade-in">
                   <div className="bg-primary-50 dark:bg-primary-900/10 rounded-xl p-4 border border-primary-100 dark:border-primary-800/30">
                      <h4 className="text-xs font-bold text-primary-700 dark:text-primary-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                         <Calendar size={14}/> Matrículas em Turmas
                      </h4>
                      
                      <div className="space-y-2 mb-3">
                        {classes.filter(c => editingStudent.id && c.enrolledStudentIds.includes(editingStudent.id)).length > 0 ? (
                           classes.filter(c => editingStudent.id && c.enrolledStudentIds.includes(editingStudent.id)).map(c => {
                              const courseName = courses.find(course => course.id === c.courseId)?.name;
                              const hist = editingStudent.history?.find(h => h.courseId === c.courseId);
                              return (
                                <div key={c.id} className="bg-white dark:bg-dark-surface p-3 rounded-lg border border-primary-200 dark:border-primary-800/30 flex justify-between items-center shadow-sm">
                                   <div>
                                      <div className="text-sm font-bold text-gray-800 dark:text-dark-text">{courseName}</div>
                                      <div className="text-xs text-gray-500 dark:text-dark-textMuted">Início: {new Date(c.startDate).toLocaleDateString('pt-BR')}</div>
                                      {hist && <div className="text-[10px] text-green-600 dark:text-green-400 font-medium mt-0.5">Pago: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(hist.paid)}</div>}
                                   </div>
                                   <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full font-bold border border-green-200 dark:border-green-800/30">Matriculada</span>
                                </div>
                              )
                           })
                        ) : (
                           <div className="text-center py-2 text-gray-400 text-sm italic bg-white/50 dark:bg-white/5 rounded-lg border border-dashed border-primary-200 dark:border-primary-800/30">
                               Nenhuma matrícula ativa.
                           </div>
                        )}
                      </div>

                      <div className="mt-3 border-t border-primary-200 dark:border-primary-800/30 pt-3">
                         <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">Nova Matrícula</label>
                         <div className="flex flex-col gap-2">
                            <select 
                                className="w-full text-sm border border-gray-300 dark:border-dark-border rounded-lg p-2 outline-none focus:border-primary-400 bg-white dark:bg-dark-surface text-gray-800 dark:text-dark-text"
                                value={selectedClassId}
                                onChange={handleClassSelectionChange}
                            >
                               <option value="">Selecione uma turma...</option>
                               {classes
                                 .filter(c => c.status === 'open' && editingStudent.id && !c.enrolledStudentIds.includes(editingStudent.id))
                                 .map(c => {
                                    const courseName = courses.find(course => course.id === c.courseId)?.name;
                                    return (
                                       <option key={c.id} value={c.id}>
                                          {courseName} - {new Date(c.startDate).toLocaleDateString('pt-BR')} ({c.maxStudents - c.enrolledStudentIds.length} vagas)
                                       </option>
                                    )
                                 })
                               }
                            </select>
                            
                            {selectedClassId && (
                                <div className="flex gap-2 animate-in slide-in-from-top-2 fade-in">
                                    <div className="relative flex-1">
                                        <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={14}/>
                                        <input 
                                            type="number" 
                                            placeholder="Valor Negociado" 
                                            className="w-full pl-7 p-2 text-sm border border-gray-300 dark:border-dark-border rounded-lg outline-none focus:border-primary-400 bg-white dark:bg-dark-surface text-gray-800 dark:text-dark-text"
                                            value={negotiatedPrice}
                                            onChange={e => setNegotiatedPrice(e.target.value)}
                                        />
                                    </div>
                                    <button 
                                      onClick={handleEnrollInClass}
                                      className="bg-primary-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-primary-700 h-[38px] shadow-md"
                                    >
                                      Confirmar
                                    </button>
                                </div>
                            )}
                         </div>
                      </div>
                   </div>

                   <div>
                      <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Interesse (Pipeline)</h4>
                      {editingStudent.interestedIn && editingStudent.interestedIn.length > 0 ? (
                        <div className="space-y-2">
                           {editingStudent.interestedIn.map(courseId => {
                             const c = courses.find(course => course.id === courseId);
                             return (
                               <div key={courseId} className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-800/30">
                                  <span className="text-sm text-blue-800 dark:text-blue-400 font-medium">{c?.name}</span>
                                  <button 
                                    onClick={() => setEditingStudent(prev => ({...prev, interestedIn: prev?.interestedIn?.filter(id => id !== courseId)}))}
                                    className="text-blue-300 hover:text-red-400 transition-colors"
                                  >
                                      <Trash2 size={14}/>
                                  </button>
                               </div>
                             )
                           })}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 dark:text-dark-textMuted italic">Nenhum curso no pipeline.</p>
                      )}
                      
                      <div className="mt-2">
                        <select 
                           className="w-full text-sm border border-gray-200 dark:border-dark-border rounded-lg p-2 bg-white dark:bg-dark-surface text-gray-600 dark:text-dark-text focus:ring-2 focus:ring-primary-200 outline-none"
                           onChange={(e) => {
                             if(e.target.value) {
                               setEditingStudent(prev => ({
                                 ...prev,
                                 interestedIn: [...(prev?.interestedIn || []), e.target.value]
                               }))
                             }
                           }}
                           value=""
                        >
                          <option value="">+ Adicionar interesse...</option>
                          {courses
                            .filter(c => !editingStudent.interestedIn?.includes(c.id))
                            .map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                   </div>

                   <div>
                      <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Histórico Concluído</h4>
                      {editingStudent.history && editingStudent.history.length > 0 ? (
                        <div className="space-y-2">
                          {editingStudent.history.map((record, idx) => {
                            const c = courses.find(course => course.id === record.courseId);
                            return (
                              <div key={idx} className="flex items-center justify-between bg-gray-50 dark:bg-white/5 p-3 rounded-lg border border-gray-200 dark:border-dark-border">
                                 <div className="flex items-center gap-2">
                                   <CheckCircle size={16} className="text-green-500"/>
                                   <div>
                                      <div className="text-sm text-gray-700 dark:text-dark-text font-medium">{c?.name}</div>
                                      <div className="text-xs text-gray-500 dark:text-dark-textMuted">
                                          {new Date(record.date).toLocaleDateString('pt-BR')} • 
                                          Pago: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(record.paid)}
                                      </div>
                                   </div>
                                 </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 dark:text-dark-textMuted italic">Nenhum curso histórico.</p>
                      )}
                   </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-dark-surface flex justify-end gap-3 shrink-0">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg font-medium transition-colors">Cancelar</button>
              <button onClick={handleSave} className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium shadow-md flex items-center gap-2 transition-colors">
                <Save size={18} /> Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
