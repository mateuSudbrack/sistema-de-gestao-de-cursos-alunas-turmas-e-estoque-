import React, { useState, useEffect, useRef } from 'react';
import { INITIAL_DATA } from './constants';
import { AppState, View, Student, CourseClass, StudentStatus, Course, PublicFormConfig, PipelineDefinition, EvolutionConfig, AutomationConfig, PaymentLink, AutomationTrigger, StudentType } from './types';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import Students from './components/Students';
import Pipeline from './components/Pipeline';
import Courses from './components/Courses';
import Inventory from './components/Inventory';
import Agenda from './components/Agenda';
import FormBuilder from './components/FormBuilder';
import Messages from './components/Messages';
import Payments from './components/Payments';
import ToastContainer, { ToastMessage, ToastType } from './components/Toast';
import { evolutionService } from './services/evolutionService';
import { v4 } from 'uuid';

// URL da API Backend
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'httpS://certificados.digiyou.com.br/api/service';

const App: React.FC = () => {
  console.log('Rendering App component');
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [loading, setLoading] = useState(true);
  
  // Estado Inicial
  const [data, setData] = useState<AppState>(INITIAL_DATA);

  console.log('Current state:', { loading, currentView, theme: data.theme });

  // --- 1. CARREGAR DADOS DO SERVIDOR AO INICIAR ---
  useEffect(() => {
    const fetchData = async () => {
      console.log('Calling fetchData');
      try {
        console.log(`📡 Conectando ao servidor ${API_BASE_URL}...`);
        const res = await fetch(`${API_BASE_URL}/sync`);
        
        if (res.ok) {
          console.log('Fetch successful');
          const json = await res.json();
          const dbStudents = json.students || [];
          const globalData = json.global || {};

          // Processar Alunos do Banco
          const processedStudents: Student[] = dbStudents.map((s: any) => ({
             id: s.id,
             name: s.name,
             phone: s.phone,
             email: s.email,
             photo: s.photo,
             type: (s.type as StudentType) || 'lead',
             status: (s.status as StudentStatus) || StudentStatus.INTERESTED,
             pipelineId: s.pipelineId || INITIAL_DATA.defaultPipelineId,
             stageId: s.stageId,
             interestedIn: s.interestedIn || [],
             history: s.history || [],
             lastContact: s.lastContact ? s.lastContact.split('T')[0] : '',
             nextFollowUp: s.nextFollowUp ? s.nextFollowUp.split('T')[0] : '',
             lastPurchase: s.lastPurchase ? s.lastPurchase.split('T')[0] : undefined,
             notes: s.notes || ''
          }));

          // Atualizar Estado com Dados Reais
          setData(prev => ({
             ...prev,
             students: processedStudents.length > 0 ? processedStudents : prev.students,
             // Se houver dados globais salvos, usa eles. Se não, usa o inicial.
             courses: globalData.courses || prev.courses,
             classes: globalData.classes || prev.classes,
             products: globalData.products || prev.products,
             sales: globalData.sales || prev.sales,
             pipelines: globalData.pipelines || prev.pipelines,
             automations: globalData.automations || prev.automations,
             paymentLinks: globalData.paymentLinks || prev.paymentLinks,
             evolutionConfig: globalData.evolutionConfig || prev.evolutionConfig
          }));
          console.log("✅ Dados sincronizados com sucesso!");
        } else {
          console.error("❌ Erro ao baixar dados do servidor");
        }
      } catch (e) {
        console.error("⚠️ Falha de conexão. Servidor offline ou CORS bloqueado.", e);
      } finally {
        console.log('Setting loading to false');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- 2. SALVAR ESTADO GLOBAL NO SERVIDOR ---
  const saveTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (loading) return; 

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
       const globalState = {
          courses: data.courses,
          classes: data.classes,
          products: data.products,
          sales: data.sales,
          pipelines: data.pipelines,
          automations: data.automations,
          paymentLinks: data.paymentLinks,
          evolutionConfig: data.evolutionConfig
       };

       try {
          await fetch(`${API_BASE_URL}/sync/global`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify(globalState)
          });
       } catch (e) {
          console.warn("Erro ao salvar estado global", e);
       }
    }, 2000) as unknown as number;

  }, [data.courses, data.classes, data.products, data.sales, data.pipelines, data.automations, data.paymentLinks, data.evolutionConfig, loading]);


  // --- 3. FUNÇÕES DE SYNC INDIVIDUAL (ALUNOS) ---
  const syncStudent = async (student: Student) => {
     try {
        await fetch(`${API_BASE_URL}/students`, {
           method: 'POST',
           headers: {'Content-Type': 'application/json'},
           body: JSON.stringify(student)
        });
     } catch (e) {
        console.error("Erro ao salvar aluno no banco", e);
     }
  };

  // --- RESTO DO CÓDIGO (HANDLERS) ---
  
  // Theme
  useEffect(() => {
    if (data.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [data.theme]);

  // Toast System
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const addToast = (message: string, type: ToastType = 'info') => {
    const id = v4();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };
  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  // --- Automation Processor ---
  const triggerAutomation = async (trigger: AutomationTrigger, student: Student, extraData?: any) => {
      const rules = data.automations.rules?.filter(r => r.active && r.trigger === trigger);
      if (!rules || rules.length === 0 || !data.evolutionConfig.isConnected) return;

      for (const rule of rules) {
          const rawText = rule.message;
          const formattedText = rawText
            .replace('{nome}', student.name.split(' ')[0])
            .replace('{nome_completo}', student.name)
            .replace('{telefone}', student.phone);
          
          try {
              await evolutionService.sendMessage(data.evolutionConfig, student.phone, formattedText);
              console.log(`Automation "${rule.name}" executed for ${student.name}`);
          } catch (e) {
              console.error("Automation error", e);
          }
      }
  };

  // Handlers
  const toggleTheme = () => {
    setData(prev => ({ ...prev, theme: prev.theme === 'light' ? 'dark' : 'light' }));
  };

  const handleAddStudent = async (student: Student) => {
    const s = { ...student };
    if (!s.pipelineId) s.pipelineId = data.defaultPipelineId;
    
    setData(prev => ({ ...prev, students: [s, ...prev.students] }));
    addToast('Contato salvo!', 'success');
    triggerAutomation('lead_created', s);
    syncStudent(s);
  };

  const handleUpdateStudent = async (student: Student) => {
    setData(prev => ({
      ...prev,
      students: prev.students.map(s => s.id === student.id ? student : s)
    }));
    syncStudent(student);
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
      id: v4(),
      studentId,
      date: new Date().toISOString().split('T')[0],
      items: items.map(i => ({ ...i, priceAtSale: data.products.find(p => p.id === i.productId)?.sellPrice || 0 })),
      discount,
      total: finalTotal
    };

    const updatedProducts = data.products.map(p => {
      const soldItem = items.find(i => i.productId === p.id);
      if (soldItem) return { ...p, quantity: p.quantity - soldItem.qty };
      return p;
    });
    
    let studentToUpdate: Student | undefined;
    const updatedStudents = data.students.map(s => {
        if (s.id === studentId) {
            studentToUpdate = { ...s, lastPurchase: newSale.date };
            return studentToUpdate;
        }
        return s;
    });

    setData(prev => ({
      ...prev,
      sales: [newSale, ...prev.sales],
      products: updatedProducts,
      students: updatedStudents
    }));

    if(studentToUpdate) handleUpdateStudent(studentToUpdate);
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
          id: v4(),
          name,
          phone,
          type: 'lead',
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

  const handleEnrollStudent = (studentId: string, classId: string, paidAmount: number, isPaid: boolean) => {
    const updatedClasses = data.classes.map(c => {
      if (c.id === classId && !c.enrolledStudentIds.includes(studentId)) {
        return { ...c, enrolledStudentIds: [...c.enrolledStudentIds, studentId] };
      }
      return c;
    });

    const targetClass = data.classes.find(c => c.id === classId);
    let updatedStudentRef: Student | null = null;

    const updatedStudents = data.students.map(s => {
      if (s.id === studentId) {
        const newHistoryItem = targetClass ? {
            courseId: targetClass.courseId,
            classId: targetClass.id,
            date: new Date().toISOString().split('T')[0],
            paid: paidAmount,
            status: isPaid ? 'paid' : 'pending' as 'paid'|'pending'
        } : null;

        const updatedStudent = {
          ...s,
          type: isPaid ? 'student' as const : s.type, 
          status: StudentStatus.ACTIVE,
          interestedIn: targetClass ? s.interestedIn.filter(id => id !== targetClass.courseId) : s.interestedIn,
          history: newHistoryItem ? [...s.history, newHistoryItem] : s.history
        };
        updatedStudentRef = updatedStudent;
        return updatedStudent;
      }
      return s;
    });

    setData(prev => ({ ...prev, classes: updatedClasses, students: updatedStudents }));
    
    if(updatedStudentRef) {
        handleUpdateStudent(updatedStudentRef);
        triggerAutomation('enrollment_created', updatedStudentRef);
        if (isPaid) triggerAutomation('payment_confirmed', updatedStudentRef);
    }
  };

  const handleUnenrollStudent = (studentId: string, classId: string) => {
      const updatedClasses = data.classes.map(c => {
          if (c.id === classId) {
              return { ...c, enrolledStudentIds: c.enrolledStudentIds.filter(id => id !== studentId) };
          }
          return c;
      });
      setData(prev => ({ ...prev, classes: updatedClasses }));
      addToast('Aluna removida da turma.', 'info');
  };

  // --- Payment Links Logic ---
  const handleAddLink = (link: PaymentLink) => {
      setData(prev => ({ ...prev, paymentLinks: [...prev.paymentLinks, link] }));
  };

  const handleDeleteLink = (id: string) => {
      setData(prev => ({ ...prev, paymentLinks: prev.paymentLinks.filter(l => l.id !== id) }));
  };

  const handleGeneratePaymentLink = (courseId: string) => {
      const course = data.courses.find(c => c.id === courseId);
      if(!course) return;

      const link: PaymentLink = {
          id: v4(),
          title: course.name,
          description: `Matrícula para ${course.name}`,
          amount: course.price,
          courseId: course.id,
          methods: ['pix', 'credit'],
          active: true,
          clicks: 0
      };
      handleAddLink(link);
      addToast('Link gerado e copiado!', 'success');
      setCurrentView('payments');
  };

  const handleSimulatePayment = (linkId: string, customerName: string, customerPhone: string) => {
      const link = data.paymentLinks.find(l => l.id === linkId);
      if (!link) return;

      let student = data.students.find(s => s.phone.replace(/\D/g,'') === customerPhone.replace(/\D/g,''));
      let studentId = student?.id;
      let isNew = false;

      if (!student) {
          isNew = true;
          student = {
              id: v4(),
              name: customerName,
              phone: customerPhone,
              type: 'lead' as StudentType,
              status: StudentStatus.INTERESTED,
              interestedIn: link.courseId ? [link.courseId] : [],
              history: [],
              lastContact: new Date().toISOString().split('T')[0],
              nextFollowUp: '',
              notes: 'Criado via Link de Pagamento'
          } as Student;
          studentId = student.id;
      }

      let newHistoryItem = null;
      let targetClassId = '';

      if (link.courseId) {
          const openClass = data.classes
             .filter(c => c.courseId === link.courseId && c.status === 'open' && c.enrolledStudentIds.length < c.maxStudents)
             .sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];
          
          if (openClass) {
              targetClassId = openClass.id;
              newHistoryItem = {
                  courseId: link.courseId,
                  classId: openClass.id,
                  date: new Date().toISOString().split('T')[0],
                  paid: link.amount,
                  status: 'paid' as const
              };
          }
      }

      let updatedStudentRef: Student | null = null;
      
      setData(prev => {
          let updatedStudents = [...prev.students];
          
          if (isNew && student) {
              updatedStudents.push(student);
          }

          updatedStudents = updatedStudents.map(s => {
              if (s.id === studentId) {
                  const updated = {
                      ...s,
                      type: 'student' as StudentType, 
                      status: targetClassId ? StudentStatus.ACTIVE : s.status,
                      history: newHistoryItem ? [...s.history, newHistoryItem] : s.history
                  };
                  updatedStudentRef = updated;
                  return updated;
              }
              return s;
          });

          let updatedClasses = prev.classes;
          if (targetClassId) {
              updatedClasses = prev.classes.map(c => {
                  if (c.id === targetClassId && !c.enrolledStudentIds.includes(studentId!)) {
                      return { ...c, enrolledStudentIds: [...c.enrolledStudentIds, studentId!] };
                  }
                  return c;
              });
          }

          return {
              ...prev,
              students: updatedStudents,
              classes: updatedClasses
          };
      });

      addToast('Pagamento confirmado e matrícula realizada!', 'success');
      
      if (updatedStudentRef) {
          handleUpdateStudent(updatedStudentRef); 
          triggerAutomation('payment_confirmed', updatedStudentRef);
          if (targetClassId) triggerAutomation('enrollment_created', updatedStudentRef);
      }
  };

  if (currentView === 'public-form') {
      const { formConfig } = data;
      return (
        <div className="min-h-screen flex items-center justify-center p-4 font-sans transition-colors" style={{ backgroundColor: formConfig.backgroundColor }}>
           <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
               <div className="h-2 w-full" style={{ backgroundColor: formConfig.primaryColor }}></div>
               <div className="p-8 space-y-6">
                    <button onClick={() => setCurrentView('form-builder')} className="mb-4 text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">← Voltar</button>

                   <div className="text-center space-y-2">
                       <h1 className="text-3xl font-bold text-gray-800">{formConfig.title}</h1>
                       <p className="text-gray-500">{formConfig.subtitle}</p>
                   </div>

                   <form className="space-y-4" onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        handlePublicFormSubmit(
                            formData.get('name') as string,
                            formData.get('phone') as string,
                            formData.get('course') as string
                        );
                   }}>
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
            onGeneratePaymentLink={handleGeneratePaymentLink}
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

        {currentView === 'payments' && (
            <Payments 
                links={data.paymentLinks}
                courses={data.courses}
                onAddLink={handleAddLink}
                onDeleteLink={handleDeleteLink}
                onSimulatePayment={handleSimulatePayment}
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
