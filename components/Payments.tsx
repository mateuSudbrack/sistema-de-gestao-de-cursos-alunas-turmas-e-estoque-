import React, { useState } from 'react';
import { PaymentLink, Course } from '../types';
import { CreditCard, QrCode, Plus, Copy, Trash2, ExternalLink, Smartphone, CheckCircle, Lock } from 'lucide-react';
import { ToastType } from './Toast';

interface PaymentsProps {
  links: PaymentLink[];
  courses: Course[];
  onAddLink: (link: PaymentLink) => void;
  onDeleteLink: (id: string) => void;
  onSimulatePayment: (linkId: string, customerName: string, customerPhone: string) => void;
  onShowToast: (msg: string, type: ToastType) => void;
}

const Payments: React.FC<PaymentsProps> = ({ links, courses, onAddLink, onDeleteLink, onSimulatePayment, onShowToast }) => {
  const [showCreator, setShowCreator] = useState(false);
  const [newLink, setNewLink] = useState<Partial<PaymentLink>>({ methods: ['pix', 'credit'], active: true });
  
  // Checkout "Real" State
  const [activeCheckoutLink, setActiveCheckoutLink] = useState<PaymentLink | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<'details' | 'payment' | 'success'>('details');
  const [customerData, setCustomerData] = useState({ name: '', phone: '' });
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit'>('pix');

  const handleCreate = () => {
    if(!newLink.title || !newLink.amount) return onShowToast('Preencha título e valor.', 'error');
    
    const link: PaymentLink = {
        id: crypto.randomUUID(),
        title: newLink.title,
        description: newLink.description || '',
        amount: newLink.amount,
        courseId: newLink.courseId,
        methods: newLink.methods || ['pix'],
        active: true,
        clicks: 0
    };
    onAddLink(link);
    setShowCreator(false);
    setNewLink({ methods: ['pix', 'credit'], active: true });
    onShowToast('Link de pagamento criado!', 'success');
  };

  const handleProcessPayment = () => {
     if(!activeCheckoutLink) return;
     if(!customerData.name || !customerData.phone) return alert("Preencha os dados");
     
     setCheckoutStep('success');
     setTimeout(() => {
         onSimulatePayment(activeCheckoutLink.id, customerData.name, customerData.phone);
         setActiveCheckoutLink(null);
         setCheckoutStep('details');
         setCustomerData({ name: '', phone: '' });
     }, 3000);
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

       {/* Links Grid */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {links.map(link => (
               <div key={link.id} className="bg-white dark:bg-dark-surface rounded-2xl p-5 border border-gray-100 dark:border-dark-border shadow-sm hover:shadow-md transition-all relative group">
                   <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                       <button onClick={() => onDeleteLink(link.id)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100"><Trash2 size={16}/></button>
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
                         onClick={() => setActiveCheckoutLink(link)}
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
                   <select 
                      className="w-full p-3 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-800 dark:text-dark-text"
                      value={newLink.courseId || ''}
                      onChange={e => setNewLink({...newLink, courseId: e.target.value || undefined})}
                   >
                       <option value="">Vincular a um curso (Opcional)</option>
                       {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </select>
                   <p className="text-xs text-gray-400">Ao pagar, o aluno será matriculado automaticamente neste curso.</p>
                   
                   <div className="flex justify-end gap-2 pt-4">
                       <button onClick={() => setShowCreator(false)} className="px-4 py-2 text-gray-500 dark:text-gray-400">Cancelar</button>
                       <button onClick={handleCreate} className="px-6 py-2 bg-primary-600 text-white rounded-lg font-bold">Criar Link</button>
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
                               <input 
                                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" placeholder="WhatsApp / Celular"
                                  value={customerData.phone} onChange={e => setCustomerData({...customerData, phone: e.target.value})}
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
                                      onClick={() => setPaymentMethod('pix')}
                                      className={`flex-1 py-2 rounded-md font-bold text-sm transition-all ${paymentMethod === 'pix' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                   >
                                       Pix
                                   </button>
                                   <button 
                                      onClick={() => setPaymentMethod('credit')}
                                      className={`flex-1 py-2 rounded-md font-bold text-sm transition-all ${paymentMethod === 'credit' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                   >
                                       Cartão de Crédito
                                   </button>
                               </div>

                               {paymentMethod === 'pix' ? (
                                   <div className="text-center space-y-4 animate-in fade-in">
                                       <div className="w-52 h-52 mx-auto flex items-center justify-center rounded-lg border-2 border-gray-100 p-2">
                                           {/* Real QR Code Generator API for visual realism */}
                                           <img 
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=pagamento-${activeCheckoutLink.id}-${Date.now()}`} 
                                            alt="QR Code Pix"
                                            className="w-full h-full object-contain"
                                           />
                                       </div>
                                       <div className="space-y-1">
                                            <p className="text-sm font-bold text-gray-800">Escaneie o QR Code</p>
                                            <p className="text-xs text-gray-500">Abra o app do seu banco e escolha Pagar com Pix.</p>
                                       </div>
                                       <div className="bg-gray-100 p-3 rounded-lg flex justify-between items-center text-xs text-gray-600 cursor-pointer hover:bg-gray-200">
                                           <span className="truncate pr-4">00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-426614174000...</span>
                                           <Copy size={14}/>
                                       </div>
                                   </div>
                               ) : (
                                   <div className="space-y-3 animate-in fade-in">
                                       <div className="relative">
                                           <CreditCard className="absolute left-3 top-3.5 text-gray-400" size={18}/>
                                           <input className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:border-green-500 outline-none" placeholder="Número do Cartão"/>
                                       </div>
                                       <div className="flex gap-3">
                                           <input className="flex-1 p-3 border border-gray-300 rounded-lg focus:border-green-500 outline-none" placeholder="MM/AA"/>
                                           <input className="w-24 p-3 border border-gray-300 rounded-lg focus:border-green-500 outline-none" placeholder="CVC"/>
                                       </div>
                                       <input className="w-full p-3 border border-gray-300 rounded-lg focus:border-green-500 outline-none" placeholder="Nome no Cartão"/>
                                   </div>
                               )}

                               <button 
                                  onClick={handleProcessPayment}
                                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3.5 rounded-lg font-bold mt-6 shadow-lg shadow-green-200 transition-all"
                               >
                                   {paymentMethod === 'pix' ? 'Já fiz o pagamento' : `Pagar ${formatCurrency(activeCheckoutLink.amount)}`}
                               </button>
                           </div>
                       )}

                       {checkoutStep === 'success' && (
                           <div className="text-center py-10 animate-in zoom-in-95">
                               <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                   <CheckCircle size={40}/>
                               </div>
                               <h3 className="text-2xl font-bold text-gray-800">Sucesso!</h3>
                               <p className="text-gray-500 mt-2">Pagamento aprovado.</p>
                               <p className="text-sm text-gray-400 mt-6">Redirecionando...</p>
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