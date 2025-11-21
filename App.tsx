
import React, { useState, useEffect } from 'react';
import { INITIAL_DATA } from './constants';
import { AppState, View, Student, CourseClass, StudentStatus, Course, PublicFormConfig, PipelineDefinition, EvolutionConfig, AutomationConfig } from './types';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import Students from './components/Students';
import Pipeline from './components/Pipeline';
import Courses from './components/Courses';
import Inventory from './components/Inventory';
import Agenda from './components/Agenda';
import FormBuilder from './components/FormBuilder';
import Messages from './components/Messages';
import ToastContainer, { ToastMessage, ToastType } from './components/Toast';
import { evolutionService } from './services/evolutionService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  
  // Persistence: Load from localStorage or fallback to INITIAL_DATA
  const [data, setData] = useState<AppState>(() => {
    const saved = localStorage.getItem('estetica-pro-data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { 
            ...INITIAL_DATA, 
            ...parsed,
            pipelines: parsed.pipelines || INITIAL_DATA.pipelines,
            defaultPipelineId: parsed.defaultPipelineId || INITIAL_DATA.defaultPipelineId,
            evolutionConfig: parsed.evolutionConfig || INITIAL_DATA.evolutionConfig,
            automations: parsed.automations || INITIAL_DATA.automations,
            // Ensure classes have schedule array if loading form old data
            classes: parsed.classes?.map((c: any) => ({ ...c, schedule: c.schedule || [] })) || INITIAL_DATA.classes
        }; 
      } catch (e) {
        console.error("Failed to parse saved data", e);
        return INITIAL_DATA;
      }
    }
    return INITIAL_DATA;
  });

  // Apply Theme
  useEffect(() => {
    if (data.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [data.theme]);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('estetica-pro-data', JSON.stringify(data));
  }, [data]);

  // Toast System
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: ToastType = 'info') => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Handlers
  const toggleTheme = () => {
    setData(prev => ({ ...prev, theme: prev.theme === 'light' ? 'dark' : 'light' }));
  };

  const handleAddStudent = async (student: Student) => {
    const s = { ...student };
    if (!s.pipelineId) s.pipelineId = data.defaultPipelineId;
    
    setData(prev => ({ ...prev, students: [s, ...prev.students] }));
    
    // Automation: Welcome Message
    if (data.automations.welcomeMessage && data.evolutionConfig.instanceName) {
         try {
            const rawText = data.automations.welcomeMessageText || '';
            // Replace placeholders
            const formattedText = rawText
                .replace('{nome}', s.name.split(' ')[0]) // First name usually better for welcome
                .replace('{nome_completo}', s.name)
                .replace('{telefone}', s.phone);

            await evolutionService.sendMessage(data.evolutionConfig, s.phone, formattedText);
            addToast(`Mensagem de boas-vindas enviada para ${s.name}!`, 'success');
         } catch (e) {
            console.error("Erro ao enviar automação de boas-vindas", e);
            addToast("Erro ao enviar mensagem automática de boas-vindas.", 'error');
         }
    }
  };

  const handleUpdateStudent = (student: Student) => {
    setData(prev => ({
      ...prev,
      students: prev.students.map(s => s.id === student.id ? student : s)
    }));
  };

  const handleUpdateStock = (id: string, qty: number) => {
    setData(prev => ({
      ...prev,
      products: prev.products.map(p => p.id === id ? { ...p, quantity: qty } : p)
    }));
  };

  const handleRecordSale = (studentId: string, items: {productId: string, qty: number}[], discount: number) => {
    const saleSubtotal = items.reduce((acc, item) => {
      const prod = data.products.find(p => p.id === item.productId);
      return acc + (prod ? prod.sellPrice * item.qty : 0);
    }, 0);

    const finalTotal = Math.max(0, saleSubtotal - discount);

    const newSale = {
      id: crypto.randomUUID(),
      studentId,
      date: new Date().toISOString().split('T')[0],
      items: items.map(i => ({ ...i, priceAtSale: data.products.find(p => p.id === i.productId)?.sellPrice || 0 })),
      discount,
      total: finalTotal
    };

    // Update Stock
    const updatedProducts = data.products.map(p => {
      const soldItem = items.find(i => i.productId === p.id);
      if (soldItem) {
        return { ...p, quantity: p.quantity - soldItem.qty };
      }
      return p;
    });
    
    // Update Student Last Purchase
    const updatedStudents = data.students.map(s => {
        if (s.id === studentId) {
            return { ...s, lastPurchase: newSale.date };
        }
        return s;
    });

    setData(prev => ({
      ...prev,
      sales: [newSale, ...prev.sales],
      products: updatedProducts,
      students: updatedStudents
    }));
  };

  const handleAddClass = (newClass: CourseClass) => {
    setData(prev => ({ ...prev, classes: [...prev.classes, newClass] }));
  };

  const handleAddCourse = (course: Course) => {
    setData(prev => ({ ...prev, courses: [...prev.courses, course] }));
  };

  const handleUpdateCourse = (course: Course) => {
    setData(prev => ({
      ...prev,
      courses: prev.courses.map(c => c.id === course.id ? course : c)
    }));
  };

  const handleSaveFormConfig = (config: PublicFormConfig) => {
    setData(prev => ({ ...prev, formConfig: config }));
  };

  const handleSaveEvolutionConfig = (config: EvolutionConfig) => {
      setData(prev => ({ ...prev, evolutionConfig: config }));
  };

  const handleSaveAutomations = (config: AutomationConfig) => {
      setData(prev => ({ ...prev, automations: config }));
  };

  const handleAddPipeline = (pipeline: PipelineDefinition) => {
      setData(prev => ({ ...prev, pipelines: [...prev.pipelines, pipeline] }));
  };

  const handleUpdatePipeline = (pipeline: PipelineDefinition) => {
      setData(prev => ({ 
          ...prev, 
          pipelines: prev.pipelines.map(p => p.id === pipeline.id ? pipeline : p) 
      }));
  };

  const handleSetDefaultPipeline = (id: string) => {
      setData(prev => ({ ...prev, defaultPipelineId: id }));
  };

  const handlePublicFormSubmit = (name: string, phone: string, courseId: string) => {
      const newStudent: Student = {
          id: crypto.randomUUID(),
          name,
          phone,
          status: StudentStatus.INTERESTED,
          pipelineId: data.defaultPipelineId,
          interestedIn: [courseId],
          history: [],
          lastContact: new Date().toISOString().split('T')[0],
          nextFollowUp: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          notes: 'Cadastrada via Formulário Online'
      };
      handleAddStudent(newStudent);
      addToast('Inscrição recebida com sucesso! Entraremos em contato.', 'success');
  };

  const handleEnrollStudent = (studentId: string, classId: string, paidAmount: number) => {
    const updatedClasses = data.classes.map(c => {
      if (c.id === classId && !c.enrolledStudentIds.includes(studentId)) {
        return { ...c, enrolledStudentIds: [...c.enrolledStudentIds, studentId] };
      }
      return c;
    });

    const targetClass = data.classes.find(c => c.id === classId);
    const updatedStudents = data.students.map(s => {
      if (s.id === studentId) {
        const newHistoryItem = targetClass ? {
            courseId: targetClass.courseId,
            date: new Date().toISOString().split('T')[0],
            paid: paidAmount
        } : null;

        return {
          ...s,
          status: StudentStatus.ACTIVE,
          interestedIn: targetClass ? s.interestedIn.filter(id => id !== targetClass.courseId) : s.interestedIn,
          history: newHistoryItem ? [...s.history, newHistoryItem] : s.history
        };
      }
      return s;
    });

    setData(prev => ({ ...prev, classes: updatedClasses, students: updatedStudents }));
  };

  const handleUnenrollStudent = (studentId: string, classId: string) => {
      const updatedClasses = data.classes.map(c => {
          if (c.id === classId) {
              return { ...c, enrolledStudentIds: c.enrolledStudentIds.filter(id => id !== studentId) };
          }
          return c;
      });
      // Note: We don't remove history or revert status automatically to preserve financial records
      // unless explicitly requested.
      setData(prev => ({ ...prev, classes: updatedClasses }));
      addToast('Aluna removida da turma.', 'info');
  };

  if (currentView === 'public-form') {
      const { formConfig } = data;
      return (
        <div className="min-h-screen flex items-center justify-center p-4 font-sans transition-colors" style={{ backgroundColor: formConfig.backgroundColor }}>
           <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
               <div className="h-2 w-full" style={{ backgroundColor: formConfig.primaryColor }}></div>
               <div className="p-8 space-y-6">
                    <button 
                      onClick={() => setCurrentView('form-builder')}
                      className="mb-4 text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                    >
                        ← Voltar ao Sistema
                    </button>

                   <div className="text-center space-y-2">
                       <h1 className="text-3xl font-bold text-gray-800">{formConfig.title}</h1>
                       <p className="text-gray-500">{formConfig.subtitle}</p>
                   </div>

                   <form 
                     className="space-y-4"
                     onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        handlePublicFormSubmit(
                            formData.get('name') as string,
                            formData.get('phone') as string,
                            formData.get('course') as string
                        );
                     }}
                   >
                       <div>
                           <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Nome Completo</label>
                           <input required name="name" type="text" className="w-full p-3 rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-opacity-50" style={{ '--tw-ring-color': formConfig.primaryColor } as any} />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">WhatsApp</label>
                           <input required name="phone" type="tel" className="w-full p-3 rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-opacity-50" style={{ '--tw-ring-color': formConfig.primaryColor } as any} />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Curso de Interesse</label>
                           <select required name="course" className="w-full p-3 rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-opacity-50" style={{ '--tw-ring-color': formConfig.primaryColor } as any}>
                               <option value="">Selecione...</option>
                               {data.courses.map(c => (
                                   <option key={c.id} value={c.id}>{c.name}</option>
                               ))}
                           </select>
                       </div>
                       <button 
                         type="submit"
                         className="w-full py-3.5 rounded-lg text-white font-bold text-center shadow-lg hover:opacity-90 transition-opacity mt-6"
                         style={{ backgroundColor: formConfig.primaryColor }}
                       >
                         {formConfig.buttonText}
                       </button>
                   </form>
               </div>
           </div>
           <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
      )
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-dark-bg text-gray-800 dark:text-dark-text font-sans transition-colors duration-300">
      <Navigation 
         currentView={currentView} 
         setCurrentView={setCurrentView} 
         currentTheme={data.theme}
         toggleTheme={toggleTheme}
      />
      
      <main className="md:pl-64 p-4 md:p-8 max-w-[1920px] mx-auto min-h-screen transition-all duration-300 ease-in-out">
        {currentView === 'dashboard' && (
          <Dashboard data={data} onChangeView={setCurrentView} />
        )}
        
        {currentView === 'agenda' && (
           <Agenda classes={data.classes} students={data.students} courses={data.courses} />
        )}

        {currentView === 'pipeline' && (
          <Pipeline 
            students={data.students}
            courses={data.courses}
            pipelines={data.pipelines}
            defaultPipelineId={data.defaultPipelineId}
            onUpdateStudent={handleUpdateStudent}
            onUpdatePipeline={handleUpdatePipeline}
            onAddPipeline={handleAddPipeline}
            onSetDefaultPipeline={handleSetDefaultPipeline}
            onShowToast={addToast}
          />
        )}

        {currentView === 'students' && (
          <Students 
            students={data.students} 
            courses={data.courses}
            classes={data.classes}
            onAddStudent={handleAddStudent}
            onUpdateStudent={handleUpdateStudent}
            onEnrollStudent={handleEnrollStudent}
            onShowToast={addToast}
          />
        )}
        
        {currentView === 'courses' && (
          <Courses 
            courses={data.courses} 
            students={data.students}
            classes={data.classes}
            onAddCourse={handleAddCourse} 
            onUpdateCourse={handleUpdateCourse}
            onAddClass={handleAddClass}
            onShowToast={addToast}
            onEnrollStudent={handleEnrollStudent}
            onUnenrollStudent={handleUnenrollStudent}
          />
        )}
        
        {currentView === 'inventory' && (
          <Inventory 
            products={data.products} 
            students={data.students}
            onUpdateStock={handleUpdateStock}
            onRecordSale={handleRecordSale}
            onShowToast={addToast}
          />
        )}

        {currentView === 'messages' && (
            <Messages 
                config={data.evolutionConfig}
                automations={data.automations}
                students={data.students}
                onSaveConfig={handleSaveEvolutionConfig}
                onSaveAutomations={handleSaveAutomations}
                onShowToast={addToast}
            />
        )}

        {currentView === 'form-builder' && (
            <FormBuilder 
              config={data.formConfig} 
              onSave={handleSaveFormConfig}
              onOpenPublic={() => setCurrentView('public-form')}
              onShowToast={addToast}
            />
        )}
      </main>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default App;
