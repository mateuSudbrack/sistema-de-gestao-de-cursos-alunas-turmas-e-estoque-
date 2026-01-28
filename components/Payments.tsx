import React, { useState } from 'react';
import { PaymentLink, Course } from '../types';
import { CreditCard, QrCode, Plus, Copy, Trash2, ExternalLink, Smartphone, CheckCircle, Lock, AlertTriangle } from 'lucide-react';
import { ToastType } from './Toast';
import { v4 } from 'uuid';

interface PaymentsProps {
  links: PaymentLink[];
  courses: Course[];
  students: Student[];
  onAddLink: (link: PaymentLink) => void;
  onDeleteLink: (id: string) => void;
  onSimulatePayment: (linkId: string, customerName: string, customerPhone: string) => void;
  onShowToast: (msg: string, type: ToastType) => void;
  preSelectedStudentId?: string | null;
  onClearPreSelection?: () => void;
}

const Payments: React.FC<PaymentsProps> = ({ links, courses, students, onAddLink, onDeleteLink, onSimulatePayment, onShowToast, preSelectedStudentId, onClearPreSelection }) => {
  const [showCreator, setShowCreator] = useState(false);
  const [newLink, setNewLink] = useState<Partial<PaymentLink>>({ methods: ['pix', 'credit'], active: true });
  const [studentSearch, setStudentSearch] = useState('');
  
  // Checkout "Real" State
  const [activeCheckoutLink, setActiveCheckoutLink] = useState<PaymentLink | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<'details' | 'payment' | 'success'>('details');
  const [customerData, setCustomerData] = useState({ name: '', phone: '', email: '', cpf: '' });
  const [cardData, setCardData] = useState({ number: '', expiry: '', cvc: '', holder: '' });
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit' | 'boleto' | 'manual'>('pix');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pixData, setPixData] = useState<{ qrCode: string, key: string } | null>(null);
  const [boletoData, setBoletoData] = useState<{ url: string, barcode: string } | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);

  // Carregar pagamentos pendentes ao iniciar
  React.useEffect(() => {
      fetch(`${(import.meta as any).env?.VITE_API_URL || 'https://certificados.digiyou.com.br/api/service'}/payments/pending`)
        .then(res => res.json())
        .then(data => setPendingPayments(Array.isArray(data) ? data : []))
        .catch(console.error);
  }, []);

  const handleApprovePayment = async (id: string) => {
      if (!window.confirm('Confirma o recebimento deste pagamento?')) return;
      try {
          const res = await fetch(`${(import.meta as any).env?.VITE_API_URL || 'https://certificados.digiyou.com.br/api/service'}/payments/${id}/approve`, { method: 'POST' });
          const data = await res.json();
          if (data.success) {
              onShowToast('Pagamento aprovado e aluna matriculada!', 'success');
              setPendingPayments(prev => prev.filter(p => p.id !== id));
          } else {
              onShowToast(data.error || 'Erro ao aprovar', 'error');
          }
      } catch (e) {
          onShowToast('Erro de conexão', 'error');
      }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatPhone(e.target.value);
      setCustomerData({ ...customerData, phone: formatted });
  };

  React.useEffect(() => {
    if (preSelectedStudentId) {
        const student = students.find(s => s.id === preSelectedStudentId);
        if (student) {
            setNewLink(prev => ({ ...prev, studentId: student.id }));
            setStudentSearch(student.name);
            setShowCreator(true);
        }
        onClearPreSelection?.();
    }
  }, [preSelectedStudentId, students, onClearPreSelection]);

  const openCheckout = (link: PaymentLink) => {
      setActiveCheckoutLink(link);
      setCheckoutStep('details');
      setPixData(null);
      setBoletoData(null);
      
      // Se o link for para um aluno específico, preenche os dados
      if (link.studentId) {
          const student = students.find(s => s.id === link.studentId);
          if (student) {
              setCustomerData({
                  name: student.name,
                  phone: formatPhone(student.phone),
                  email: student.email || '',
                  cpf: student.cpf || ''
              });
          }
      } else {
          setCustomerData({ name: '', phone: '', email: '', cpf: '' });
      }
      setCardData({ number: '', expiry: '', cvc: '', holder: '' });
  };

  const handleDeleteLinkWithConfirm = (id: string, title: string) => {
      if (window.confirm(`Tem certeza que deseja excluir o link "${title}"?`)) {
          onDeleteLink(id);
      }
  };

  const handleCreate = () => {
    if(!newLink.title || !newLink.amount) return onShowToast('Preencha título e valor.', 'error');
    
    const link: PaymentLink = {
        id: v4(),
        title: newLink.title,
        description: newLink.description || '',
        amount: newLink.amount,
        courseId: newLink.courseId,
        studentId: newLink.studentId,
        methods: newLink.methods || ['pix'],
        active: true,
        clicks: 0
    };
    onAddLink(link);
    setShowCreator(false);
    setNewLink({ methods: ['pix', 'credit'], active: true });
    setStudentSearch('');
    onShowToast('Link de pagamento criado!', 'success');
    return link;
  };

  const handleCreateAndOpen = () => {
    const link = handleCreate();
    if (link) {
        openCheckout(link);
    }
  };

  const handleProcessPayment = async () => {
     if(!activeCheckoutLink) return;
     if(!customerData.name || !customerData.phone || !customerData.email || !customerData.cpf) {
         return onShowToast("Preencha todos os dados do comprador", 'error');
     }

     const cleanPhone = customerData.phone.replace(/\D/g, '');
     if (cleanPhone.length !== 11) {
         return onShowToast("Telefone inválido. Use o formato: 11988887777", 'error');
     }

     const cleanCPF = customerData.cpf.replace(/\D/g, '');
     if (cleanCPF.length !== 11 && cleanCPF.length !== 14) {
         return onShowToast("Documento (CPF/CNPJ) inválido", 'error');
     }

     if (paymentMethod === 'manual' && !proofFile) {
         return onShowToast("Por favor, anexe o comprovante.", 'error');
     }
     
     setIsProcessing(true);
     setPixData(null); // Limpar dados de PIX anterior
     
     try {
         let response;
         if (paymentMethod === 'manual') {
             const formData = new FormData();
             formData.append('data', JSON.stringify({
                 link: activeCheckoutLink,
                 customer: {
                     ...customerData,
                     cardNumber: cardData.number,
                     cardExpiry: cardData.expiry,
                     cardCVC: cardData.cvc,
                     cardHolder: cardData.holder
                 }
             }));
             if (proofFile) formData.append('proof', proofFile);

             response = await fetch(`${(import.meta as any).env?.VITE_API_URL || 'https://certificados.digiyou.com.br/api/service'}/payments/manual`, {
                 method: 'POST',
                 body: formData
             });
         } else {
             response = await fetch(`${(import.meta as any).env?.VITE_API_URL || 'https://certificados.digiyou.com.br/api/service'}/payments/create`, {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({
                     link: activeCheckoutLink,
                     customer: {
                         ...customerData,
                         cardNumber: cardData.number,
                         cardExpiry: cardData.expiry,
                         cardCVC: cardData.cvc,
                         cardHolder: cardData.holder
                     },
                     method: paymentMethod
                 })
             });
         }

         const result = await response.json();

         if (result.success) {
             if (paymentMethod === 'pix') {
                 setPixData({ qrCode: result.pix, key: result.pixKey });
             } else if (paymentMethod === 'boleto') {
                 setBoletoData({ url: result.boletoUrl, barcode: result.boletoBarcode });
                 setCheckoutStep('success');
             } else {
                 setCheckoutStep('success');
                 setTimeout(() => {
                    setActiveCheckoutLink(null);
                    setCheckoutStep('details');
                    setCustomerData({ name: '', phone: '', email: '', cpf: '' });
                    setCardData({ number: '', expiry: '', cvc: '', holder: '' });
                    setProofFile(null);
                 }, 4000);
             }
         } else {
             onShowToast(result.error || "Erro ao processar pagamento", 'error');
         }
     } catch (error) {
         console.error(error);
         onShowToast("Erro de conexão com o servidor", 'error');
     } finally {
         setIsProcessing(false);
     }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="h-full flex flex-col animate-fade-in pb-20 md:pb-0">
       <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text">Links de Pagamento</h2>
          <button 
             onClick={() => setShowCreator(true)}
             className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-md transition-all"
          >
             <Plus size={20}/> Criar Link
          </button>
       </div>

       {/* Pending Payments (Admin) */}
       {pendingPayments.length > 0 && (
           <div className="mb-8 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-2xl p-6">
               <h3 className="text-lg font-bold text-amber-800 dark:text-amber-400 mb-4 flex items-center gap-2">
                   <AlertTriangle size={20}/> Pagamentos Pendentes de Aprovação
               </h3>
               <div className="grid gap-4">
                   {pendingPayments.map(p => {
                       const customer = typeof p.customerData === 'string' ? JSON.parse(p.customerData) : p.customerData;
                       return (
                           <div key={p.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-amber-100 dark:border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
                               <div>
                                   <div className="font-bold text-gray-800 dark:text-dark-text">{customer.name}</div>
                                   <div className="text-sm text-gray-500">{customer.email} • {customer.phone}</div>
                                   <div className="text-xs text-amber-600 font-medium mt-1">Valor: {formatCurrency(parseFloat(p.amount))}</div>
                               </div>
                               <div className="flex gap-2 w-full md:w-auto">
                                   {p.proofUrl && (
                                       <a 
                                         href={p.proofUrl} 
                                         target="_blank" 
                                         rel="noreferrer"
                                         className="flex-1 md:flex-none px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-bold hover:bg-blue-100 flex items-center justify-center gap-2"
                                       >
                                           <ExternalLink size={16}/> Ver Comprovante
                                       </a>
                                   )}
                                   <button 
                                     onClick={() => handleApprovePayment(p.id)}
                                     className="flex-1 md:flex-none px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 shadow-sm flex items-center justify-center gap-2"
                                   >
                                       <CheckCircle size={16}/> Aprovar
                                   </button>
                               </div>
                           </div>
                       )
                   })}
               </div>
           </div>
       )}

       {/* Links Grid */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {links.map(link => (
               <div key={link.id} className="bg-white dark:bg-dark-surface rounded-2xl p-5 border border-gray-100 dark:border-dark-border shadow-sm hover:shadow-md transition-all relative group">
                   <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                       <button onClick={() => handleDeleteLinkWithConfirm(link.id, link.title)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100"><Trash2 size={16}/></button>
                   </div>
                   
                   <div className="flex items-center gap-3 mb-3">
                       <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                           <CreditCard size={20}/>
                       </div>
                       <div>
                           <h3 className="font-bold text-gray-800 dark:text-dark-text">{link.title}</h3>
                           <p className="text-sm text-primary-600 font-bold">{formatCurrency(link.amount)}</p>
                       </div>
                   </div>
                   
                   <p className="text-sm text-gray-500 dark:text-dark-textMuted mb-4 line-clamp-2">{link.description}</p>
                   
                   <div className="flex items-center gap-2 mb-4 text-xs text-gray-400">
                       <span className="flex items-center gap-1"><Smartphone size={12}/> {link.clicks} visualizações</span>
                   </div>

                   <div className="flex gap-2">
                       <button 
                         onClick={() => {
                             navigator.clipboard.writeText(`https://pay.esteticapro.com/${link.id}`);
                             onShowToast('Link copiado!', 'success');
                         }}
                         className="flex-1 py-2 rounded-lg border border-gray-200 dark:border-dark-border text-gray-600 dark:text-dark-text hover:bg-gray-50 dark:hover:bg-white/5 flex items-center justify-center gap-2 text-sm font-medium"
                       >
                           <Copy size={16}/> Copiar
                       </button>
                       <button 
                         onClick={() => openCheckout(link)}
                         className="flex-1 py-2 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/30 flex items-center justify-center gap-2 text-sm font-medium"
                       >
                           <ExternalLink size={16}/> Abrir
                       </button>
                   </div>
               </div>
           ))}
       </div>

       {/* Creator Modal */}
       {showCreator && (
           <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
               <div className="bg-white dark:bg-dark-surface rounded-2xl w-full max-w-md p-6 space-y-4 animate-in zoom-in-95">
                   <h3 className="font-bold text-lg text-gray-800 dark:text-dark-text">Novo Link de Pagamento</h3>
                   <input 
                      type="text" placeholder="Título do Produto/Serviço"
                      className="w-full p-3 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-800 dark:text-dark-text"
                      value={newLink.title} onChange={e => setNewLink({...newLink, title: e.target.value})}
                   />
                   <input 
                      type="number" placeholder="Valor (R$)"
                      className="w-full p-3 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-800 dark:text-dark-text"
                      value={newLink.amount} onChange={e => setNewLink({...newLink, amount: parseFloat(e.target.value)})}
                   />
                   <textarea 
                      placeholder="Descrição"
                      className="w-full p-3 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-800 dark:text-dark-text resize-none"
                      rows={3}
                      value={newLink.description} onChange={e => setNewLink({...newLink, description: e.target.value})}
                   />
                   <div className="space-y-2">
                       <select 
                          className="w-full p-3 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-800 dark:text-dark-text"
                          value={newLink.courseId || ''}
                          onChange={e => {
                              const courseId = e.target.value;
                              const course = courses.find(c => c.id === courseId);
                              setNewLink({
                                  ...newLink, 
                                  courseId: courseId || undefined,
                                  title: course ? course.name : newLink.title,
                                  amount: course ? course.price : newLink.amount
                              });
                          }}
                       >
                           <option value="">Vincular a um curso (Opcional)</option>
                           {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                       </select>
                       
                       <div className="relative">
                           <input 
                                type="text"
                                placeholder="Pesquisar Aluna..."
                                className="w-full p-3 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-800 dark:text-dark-text"
                                value={studentSearch}
                                onChange={e => {
                                    setStudentSearch(e.target.value);
                                    if (!e.target.value) setNewLink({...newLink, studentId: undefined});
                                }}
                           />
                           {studentSearch && !newLink.studentId && (
                               <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-xl max-h-40 overflow-y-auto">
                                   {students
                                     .filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase()) || s.phone.includes(studentSearch))
                                     .map(s => (
                                       <button 
                                         key={s.id}
                                         className="w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-white/5 text-sm dark:text-dark-text border-b last:border-0 border-gray-100 dark:border-dark-border"
                                         onClick={() => {
                                             setNewLink({...newLink, studentId: s.id});
                                             setStudentSearch(s.name);
                                         }}
                                       >
                                           <div className="font-bold">{s.name}</div>
                                           <div className="text-xs text-gray-500">{s.phone}</div>
                                       </button>
                                   ))}
                               </div>
                           )}
                           {newLink.studentId && (
                               <button 
                                 onClick={() => {
                                     setNewLink({...newLink, studentId: undefined});
                                     setStudentSearch('');
                                 }}
                                 className="absolute right-3 top-3.5 text-xs text-red-500 hover:text-red-700"
                               >
                                   Limpar
                               </button>
                           )}
                       </div>
                   </div>
                   <p className="text-xs text-gray-400">Ao pagar, o aluno será matriculado automaticamente no curso selecionado.</p>
                   
                   <div className="flex justify-end gap-2 pt-4">
                       <button onClick={() => {
                           setShowCreator(false);
                           setNewLink({ methods: ['pix', 'credit'], active: true });
                           setStudentSearch('');
                       }} className="px-4 py-2 text-gray-500 dark:text-gray-400">Cancelar</button>
                       <button onClick={() => handleCreate()} className="px-4 py-2 border border-primary-500 text-primary-600 rounded-lg font-bold hover:bg-primary-50">Criar Link</button>
                       <button onClick={handleCreateAndOpen} className="px-6 py-2 bg-primary-600 text-white rounded-lg font-bold shadow-md hover:bg-primary-700">Criar e Pagar Agora</button>
                   </div>
               </div>
           </div>
       )}

       {/* Realistic Checkout Modal */}
       {activeCheckoutLink && (
           <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
               <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 flex flex-col max-h-[90vh]">
                   
                   {/* Header resembling a real payment gateway */}
                   <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
                       <div className="flex items-center gap-2 text-gray-600">
                           <Lock size={14}/> <span className="text-xs font-bold">Pagamento Seguro</span>
                       </div>
                       <button onClick={() => setActiveCheckoutLink(null)} className="text-gray-400 hover:text-gray-600">Fechar</button>
                   </div>

                   <div className="p-6 border-b text-center bg-white">
                       <h3 className="font-bold text-lg text-gray-800">{activeCheckoutLink.title}</h3>
                       <p className="text-gray-500 text-sm mb-2">{activeCheckoutLink.description}</p>
                       <p className="text-3xl font-black text-gray-800 mt-2">{formatCurrency(activeCheckoutLink.amount)}</p>
                   </div>

                   <div className="p-6 overflow-y-auto">
                       {checkoutStep === 'details' && (
                           <div className="space-y-4">
                               <h4 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Dados do Comprador</h4>
                               <input 
                                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" placeholder="Nome Completo"
                                  value={customerData.name} onChange={e => setCustomerData({...customerData, name: e.target.value})}
                               />
                               <div className="flex gap-2">
                                   <input 
                                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" placeholder="WhatsApp"
                                      value={customerData.phone} onChange={handlePhoneChange}
                                   />
                                   <input 
                                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" placeholder="CPF"
                                      value={customerData.cpf} onChange={e => setCustomerData({...customerData, cpf: e.target.value})}
                                   />
                               </div>
                               <input 
                                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" placeholder="E-mail"
                                  type="email"
                                  value={customerData.email} onChange={e => setCustomerData({...customerData, email: e.target.value})}
                               />
                               <button 
                                  onClick={() => setCheckoutStep('payment')}
                                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3.5 rounded-lg font-bold mt-4 shadow-lg shadow-green-200 transition-all"
                               >
                                   Continuar para Pagamento
                               </button>
                           </div>
                       )}

                       {checkoutStep === 'payment' && (
                           <div className="space-y-4">
                               <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-lg">
                                   <button 
                                      onClick={() => { setPaymentMethod('pix'); setPixData(null); setBoletoData(null); }}
                                      className={`flex-1 py-2 rounded-md font-bold text-sm transition-all ${paymentMethod === 'pix' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                   >
                                       Pix
                                   </button>
                                   <button 
                                      onClick={() => { setPaymentMethod('credit'); setPixData(null); setBoletoData(null); }}
                                      className={`flex-1 py-2 rounded-md font-bold text-sm transition-all ${paymentMethod === 'credit' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                   >
                                       Cartão
                                   </button>
                                   <button 
                                      onClick={() => { setPaymentMethod('boleto'); setPixData(null); setBoletoData(null); setProofFile(null); }}
                                      className={`flex-1 py-2 rounded-md font-bold text-sm transition-all ${paymentMethod === 'boleto' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                   >
                                       Boleto
                                   </button>
                                   <button 
                                      onClick={() => { setPaymentMethod('manual'); setPixData(null); setBoletoData(null); }}
                                      className={`flex-1 py-2 rounded-md font-bold text-sm transition-all ${paymentMethod === 'manual' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                   >
                                       Manual
                                   </button>
                               </div>

                               {paymentMethod === 'pix' ? (
                                   <div className="text-center space-y-4 animate-in fade-in">
                                       {pixData ? (
                                           <>
                                               <div className="w-52 h-52 mx-auto flex items-center justify-center rounded-lg border-2 border-gray-100 p-2">
                                                   <img 
                                                    src={pixData.qrCode.startsWith('http') ? pixData.qrCode : (pixData.qrCode.startsWith('data:') ? pixData.qrCode : `data:image/png;base64,${pixData.qrCode}`)} 
                                                    alt="QR Code Pix"
                                                    className="w-full h-full object-contain"
                                                   />
                                               </div>
                                               <div className="space-y-1">
                                                    <p className="text-sm font-bold text-gray-800">Escaneie o QR Code</p>
                                                    <p className="text-xs text-gray-500">Abra o app do seu banco e escolha Pagar com Pix.</p>
                                               </div>
                                               <div 
                                                 onClick={() => {
                                                     navigator.clipboard.writeText(pixData.key);
                                                     onShowToast('Copia e Cola copiado!', 'success');
                                                 }}
                                                 className="bg-gray-100 p-3 rounded-lg flex justify-between items-center text-xs text-gray-600 cursor-pointer hover:bg-gray-200"
                                               >
                                                   <span className="truncate pr-4">{pixData.key}</span>
                                                   <Copy size={14}/>
                                               </div>
                                               <p className="text-xs text-blue-600 font-medium animate-pulse">Aguardando confirmação do pagamento...</p>
                                           </>
                                       ) : (
                                           <div className="py-8 space-y-4">
                                               <QrCode size={48} className="mx-auto text-gray-300"/>
                                               <p className="text-sm text-gray-500">Clique no botão abaixo para gerar seu QR Code Pix.</p>
                                           </div>
                                       )}
                                   </div>
                               ) : paymentMethod === 'credit' ? (
                                   <div className="space-y-3 animate-in fade-in">
                                       <div className="relative">
                                           <CreditCard className="absolute left-3 top-3.5 text-gray-400" size={18}/>
                                           <input 
                                              className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:border-green-500 outline-none" placeholder="Número do Cartão"
                                              value={cardData.number} onChange={e => setCardData({...cardData, number: e.target.value})}
                                           />
                                       </div>
                                       <div className="flex gap-3">
                                           <input 
                                              className="flex-1 p-3 border border-gray-300 rounded-lg focus:border-green-500 outline-none" placeholder="MM/AAAA"
                                              value={cardData.expiry} onChange={e => setCardData({...cardData, expiry: e.target.value})}
                                           />
                                           <input 
                                              className="w-24 p-3 border border-gray-300 rounded-lg focus:border-green-500 outline-none" placeholder="CVC"
                                              value={cardData.cvc} onChange={e => setCardData({...cardData, cvc: e.target.value})}
                                           />
                                       </div>
                                       <input 
                                          className="w-full p-3 border border-gray-300 rounded-lg focus:border-green-500 outline-none" placeholder="Nome no Cartão"
                                          value={cardData.holder} onChange={e => setCardData({...cardData, holder: e.target.value})}
                                       />
                                   </div>
                               ) : (
                                   <div className="text-center py-8 space-y-4 animate-in fade-in">
                                       <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                                            <Copy size={32} />
                                       </div>
                                       <p className="text-sm text-gray-500">O boleto será gerado com vencimento para 3 dias.</p>
                                   </div>
                               ) : (
                                   <div className="space-y-4 animate-in fade-in">
                                       <div className="bg-orange-50 border border-orange-100 p-4 rounded-lg">
                                           <p className="text-xs text-orange-800 font-medium mb-2">Dados para Transferência:</p>
                                           <p className="text-sm text-gray-700">Banco: <strong>Nubank</strong></p>
                                           <p className="text-sm text-gray-700">Agência: <strong>0001</strong></p>
                                           <p className="text-sm text-gray-700">Conta: <strong>123456-7</strong></p>
                                           <p className="text-sm text-gray-700">Pix: <strong>pix@esteticapro.com</strong></p>
                                       </div>
                                       <div>
                                           <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Anexar Comprovante</label>
                                           <input 
                                              type="file" 
                                              accept="image/*,.pdf"
                                              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                                              onChange={e => setProofFile(e.target.files ? e.target.files[0] : null)}
                                           />
                                       </div>
                                   </div>
                               )}

                               {(!pixData || (paymentMethod !== 'pix' && paymentMethod !== 'boleto')) && (
                                   <button 
                                      onClick={handleProcessPayment}
                                      disabled={isProcessing}
                                      className={`w-full bg-green-600 hover:bg-green-700 text-white py-3.5 rounded-lg font-bold mt-6 shadow-lg shadow-green-200 transition-all flex items-center justify-center gap-2 ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}
                                   >
                                       {isProcessing ? 'Processando...' : (paymentMethod === 'pix' ? 'Gerar QR Code Pix' : (paymentMethod === 'boleto' ? 'Gerar Boleto' : (paymentMethod === 'manual' ? 'Enviar Comprovante' : `Pagar ${formatCurrency(activeCheckoutLink.amount)}`)))}
                                   </button>
                               )}
                               
                               {pixData && (
                                    <button 
                                        onClick={() => setActiveCheckoutLink(null)}
                                        className="w-full text-gray-500 py-3 text-sm font-medium hover:text-gray-700"
                                    >
                                        Fechar e pagar depois
                                    </button>
                               )}
                           </div>
                       )}

                       {checkoutStep === 'success' && (
                           <div className="text-center py-10 animate-in zoom-in-95">
                               <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                   <CheckCircle size={40}/>
                               </div>
                               <h3 className="text-2xl font-bold text-gray-800">Sucesso!</h3>
                               {boletoData ? (
                                   <div className="mt-4 space-y-4">
                                       <p className="text-gray-500">Boleto gerado com sucesso.</p>
                                       <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs font-mono break-all text-gray-600">
                                           {boletoData.barcode}
                                       </div>
                                       <div className="flex flex-col gap-2">
                                           <a 
                                                href={boletoData.url} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2"
                                            >
                                                <ExternalLink size={18}/> Visualizar Boleto
                                            </a>
                                            <button 
                                                onClick={() => {
                                                    navigator.clipboard.writeText(boletoData.barcode);
                                                    onShowToast('Código de barras copiado!', 'success');
                                                }}
                                                className="w-full border border-gray-300 py-3 rounded-lg font-bold text-gray-600"
                                            >
                                                Copiar Código
                                            </button>
                                       </div>
                                   </div>
                               ) : (
                                   <>
                                       <p className="text-gray-500 mt-2">Pagamento aprovado.</p>
                                       <p className="text-sm text-gray-400 mt-6">Redirecionando...</p>
                                   </>
                               )}
                           </div>
                       )}
                   </div>
               </div>
           </div>
       )}
    </div>
  );
};

export default Payments;