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
import { Lock, Mail, Key } from 'lucide-react';

// URL da API Backend
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'https://certificados.digiyou.com.br/api/service';

const App: React.FC = () => {
  console.log('Rendering App component');
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [paymentStudentId, setPaymentStudentId] = useState<string | null>(null);
  
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [publicFormId, setPublicFormId] = useState<string | null>(null);

  // Estado Inicial
  const [data, setData] = useState<AppState>(INITIAL_DATA);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'form') {
      setCurrentView('public-form');
      setPublicFormId(params.get('id'));
    } else {
        const storedAuth = localStorage.getItem('app_auth');
        if (storedAuth === 'true') setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      if (emailInput === 'vitoriaraqueeel@gmail.com' && passwordInput === 'And.2099@') {
          setIsAuthenticated(true);
          localStorage.setItem('app_auth', 'true');
          addToast('Login realizado com sucesso!', 'success');
      } else {
          addToast('Credenciais inválidas.', 'error');
      }
  };

  const handleLogout = () => {
      setIsAuthenticated(false);
      localStorage.removeItem('app_auth');
      window.location.href = '/';
  };

  const handleOpenPaymentForStudent = (studentId: string) => {
      setPaymentStudentId(studentId);
      setCurrentView('payments');
  };

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
             cpf: s.cpf,
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

          // Migração de FormConfig antigo para Forms Array
          let loadedForms = globalData.forms || [];
          if (!loadedForms.length && globalData.formConfig) {
              loadedForms = [{ ...globalData.formConfig, id: 'default-legacy' }];
          }
          if (!loadedForms.length) loadedForms = INITIAL_DATA.forms;

          // Atualizar Estado com Dados Reais
          setData(prev => ({
             ...prev,
             students: processedStudents.length > 0 ? processedStudents : prev.students,
             courses: globalData.courses || prev.courses,
             classes: globalData.classes || prev.classes,
             products: globalData.products || prev.products,
             sales: globalData.sales || prev.sales,
             pipelines: globalData.pipelines || prev.pipelines,
             automations: globalData.automations || prev.automations,
             paymentLinks: globalData.paymentLinks || prev.paymentLinks,
             evolutionConfig: globalData.evolutionConfig || prev.evolutionConfig,
             forms: loadedForms
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

  const saveGlobalState = async (state: any) => {
    setIsSaving(true);
    try {
       await fetch(`${API_BASE_URL}/sync/global`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(state)
       });
    } catch (e) {
       console.warn("Erro ao salvar estado global", e);
    } finally {
       setTimeout(() => setIsSaving(false), 500);
    }
  };

  useEffect(() => {
    if (loading) return; 

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
       const globalState = {
          courses: data.courses,
          classes: data.classes,
          products: data.products,
          sales: data.sales,
          pipelines: data.pipelines,
          automations: data.automations,
          paymentLinks: data.paymentLinks,
          evolutionConfig: data.evolutionConfig,
          forms: data.forms
       };
       saveGlobalState(globalState);
    }, 800) as unknown as number;

  }, [data.courses, data.classes, data.products, data.sales, data.pipelines, data.automations, data.paymentLinks, data.evolutionConfig, data.forms, loading]);


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

  const deleteStudent = async (id: string) => {
    try {
       const res = await fetch(`${API_BASE_URL}/students/${id}`, {
          method: 'DELETE'
       });
       if (res.ok) {
          setData(prev => ({
             ...prev,
             students: prev.students.filter(s => s.id !== id)
          }));
          addToast('Contato removido!', 'success');
       } else {
          addToast('Erro ao remover contato.', 'error');
       }
    } catch (e) {
       console.error("Erro ao apagar aluno", e);
       addToast('Erro de conexão.', 'error');
    }
  };

  const handleDeleteCourse = (id: string) => {
    setData(prev => ({
      ...prev,
      courses: prev.courses.filter(c => c.id !== id),
      classes: prev.classes.filter(cl => cl.courseId !== id)
    }));
    addToast('Curso removido!', 'success');
  };

  const handleDeleteProduct = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
        setData(prev => ({
        ...prev,
        products: prev.products.filter(p => p.id !== id)
        }));
        // Forçar salvamento imediato
        setTimeout(() => {
            const globalState = {
                courses: data.courses,
                classes: data.classes,
                products: data.products.filter(p => p.id !== id),
                sales: data.sales,
                pipelines: data.pipelines,
                automations: data.automations,
                paymentLinks: data.paymentLinks,
                evolutionConfig: data.evolutionConfig,
                forms: data.forms
            };
            saveGlobalState(globalState);
        }, 100);
        addToast('Item removido do estoque!', 'success');
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

  const handleSaveForms = (forms: PublicFormConfig[]) => {
    setData(prev => ({ ...prev, forms }));
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
      // Forçar salvamento imediato para deletar
      setTimeout(() => {
          const globalState = {
              courses: data.courses,
              classes: data.classes,
              products: data.products,
              sales: data.sales,
              pipelines: data.pipelines,
              automations: data.automations,
              paymentLinks: data.paymentLinks.filter(l => l.id !== id),
              evolutionConfig: data.evolutionConfig,
              forms: data.forms
          };
          saveGlobalState(globalState);
      }, 100);
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

  // --- PUBLIC FORM VIEW ---
  if (currentView === 'public-form') {
      const activeForm = data.forms.find(f => f.id === publicFormId) || data.forms[0];
      
      if (!activeForm) return <div className="p-10 text-center">Formulário não encontrado.</div>;

      return (
        <div className="min-h-screen flex items-center justify-center p-4 font-sans transition-colors" style={{ backgroundColor: activeForm.backgroundColor }}>
           <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
               <div className="h-2 w-full" style={{ backgroundColor: activeForm.primaryColor }}></div>
               <div className="p-8 space-y-6">
                   <div className="text-center space-y-2">
                       <h1 className="text-3xl font-bold text-gray-800">{activeForm.title}</h1>
                       <p className="text-gray-500">{activeForm.subtitle}</p>
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
                           <input required name="name" type="text" className="w-full p-3 rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-opacity-50" style={{ '--tw-ring-color': activeForm.primaryColor } as any} />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">WhatsApp</label>
                           <input required name="phone" type="tel" className="w-full p-3 rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-opacity-50" style={{ '--tw-ring-color': activeForm.primaryColor } as any} />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Curso de Interesse</label>
                           <select required name="course" className="w-full p-3 rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-opacity-50" style={{ '--tw-ring-color': activeForm.primaryColor } as any}>
                               <option value="">Selecione...</option>
                               {data.courses.map(c => (
                                   <option key={c.id} value={c.id}>{c.name}</option>
                               ))}
                           </select>
                       </div>
                       <button 
                         type="submit"
                         className="w-full py-3.5 rounded-lg text-white font-bold text-center shadow-lg hover:opacity-90 transition-opacity mt-6"
                         style={{ backgroundColor: activeForm.primaryColor }}
                       >
                         {activeForm.buttonText}
                       </button>
                   </form>
               </div>
           </div>
           <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
      )
  }

  // --- LOGIN VIEW ---
  if (!isAuthenticated) {
      return (
          <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
              <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm animate-in fade-in zoom-in-95">
                  <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4 text-primary-600">
                          <Lock size={32}/>
                      </div>
                      <h1 className="text-2xl font-bold text-gray-800">Acesso Restrito</h1>
                      <p className="text-gray-500 text-sm">Faça login para gerenciar o sistema.</p>
                  </div>
                  <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">E-mail</label>
                          <div className="relative">
                              <Mail className="absolute left-3 top-3 text-gray-400" size={18}/>
                              <input 
                                type="email" 
                                className="w-full pl-10 p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                placeholder="seu@email.com"
                                value={emailInput}
                                onChange={e => setEmailInput(e.target.value)}
                              />
                          </div>
                      </div>
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">Senha</label>
                          <div className="relative">
                              <Key className="absolute left-3 top-3 text-gray-400" size={18}/>
                              <input 
                                type="password" 
                                className="w-full pl-10 p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                placeholder="••••••••"
                                value={passwordInput}
                                onChange={e => setPasswordInput(e.target.value)}
                              />
                          </div>
                      </div>
                      <button className="w-full bg-primary-600 text-white py-3 rounded-lg font-bold hover:bg-primary-700 transition-all shadow-md mt-2">
                          Entrar
                      </button>
                  </form>
              </div>
              <ToastContainer toasts={toasts} removeToast={removeToast} />
          </div>
      );
  }

  // --- MAIN APP VIEW ---
  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-dark-bg text-gray-800 dark:text-dark-text font-sans transition-colors duration-300">
      {isSaving && (
          <div className="fixed top-0 left-0 right-0 h-1 bg-primary-500 z-[100] animate-pulse"></div>
      )}
      
      <Navigation 
         currentView={currentView} 
         setCurrentView={setCurrentView} 
         currentTheme={data.theme}
         toggleTheme={toggleTheme}
         onLogout={handleLogout}
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
            onDeleteStudent={deleteStudent}
            onEnrollStudent={handleEnrollStudent}
            onShowToast={addToast}
            onGeneratePayment={handleOpenPaymentForStudent}
          />
        )}
        
        {currentView === 'courses' && (
          <Courses 
            courses={data.courses} 
            students={data.students}
            classes={data.classes}
            onAddCourse={handleAddCourse} 
            onUpdateCourse={handleUpdateCourse}
            onDeleteCourse={handleDeleteCourse}
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
            onDeleteProduct={handleDeleteProduct}
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
                students={data.students}
                onAddLink={handleAddLink}
                onDeleteLink={handleDeleteLink}
                onSimulatePayment={handleSimulatePayment}
                onShowToast={addToast}
                preSelectedStudentId={paymentStudentId}
                onClearPreSelection={() => setPaymentStudentId(null)}
            />
        )}

        {currentView === 'form-builder' && (
            <FormBuilder 
              forms={data.forms} 
              onSaveForms={handleSaveForms}
              onOpenPublic={(id) => {
                  window.open(`${window.location.origin}${window.location.pathname}?view=form&id=${id}`, '_blank');
              }}
              onShowToast={addToast}
            />
        )}
      </main>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default App;
