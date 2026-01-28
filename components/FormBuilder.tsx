import React, { useState, useEffect } from 'react';
import { PublicFormConfig } from '../types';
import { Save, ExternalLink, Layout, Type, Palette, Copy, Link as LinkIcon, Plus, Trash2 } from 'lucide-react';
import { ToastType } from './Toast';
import { v4 } from 'uuid';

interface FormBuilderProps {
  forms: PublicFormConfig[];
  onSaveForms: (forms: PublicFormConfig[]) => void;
  onOpenPublic: (id: string) => void;
  onShowToast: (message: string, type: ToastType) => void;
}

const FormBuilder: React.FC<FormBuilderProps> = ({ forms, onSaveForms, onOpenPublic, onShowToast }) => {
  const [activeFormId, setActiveFormId] = useState<string>(forms[0]?.id || '');
  const [activeForm, setActiveForm] = useState<PublicFormConfig | null>(null);

  useEffect(() => {
      const found = forms.find(f => f.id === activeFormId);
      if (found) setActiveForm(found);
      else if (forms.length > 0) {
          setActiveFormId(forms[0].id);
          setActiveForm(forms[0]);
      }
  }, [activeFormId, forms]);

  const handleUpdateActiveForm = (updated: Partial<PublicFormConfig>) => {
      if (!activeForm) return;
      const newForm = { ...activeForm, ...updated };
      setActiveForm(newForm);
      onSaveForms(forms.map(f => f.id === activeForm.id ? newForm : f));
  };

  const handleCreateForm = () => {
      const newForm: PublicFormConfig = {
          id: v4(),
          title: 'Novo Formulário',
          subtitle: 'Descrição do formulário...',
          primaryColor: '#f43f5e',
          backgroundColor: '#ffffff',
          buttonText: 'Enviar'
      };
      onSaveForms([...forms, newForm]);
      setActiveFormId(newForm.id);
      onShowToast('Novo formulário criado!', 'success');
  };

  const handleDeleteForm = () => {
      if (forms.length <= 1) {
          onShowToast('Você precisa ter pelo menos um formulário.', 'error');
          return;
      }
      if (window.confirm('Tem certeza que deseja excluir este formulário?')) {
          const newForms = forms.filter(f => f.id !== activeFormId);
          onSaveForms(newForms);
          setActiveFormId(newForms[0].id);
          onShowToast('Formulário excluído!', 'success');
      }
  };

  if (!activeForm) return <div className="p-10">Carregando...</div>;

  const publicLink = `${window.location.origin}${window.location.pathname}?view=form&id=${activeForm.id}`;

  const copyLink = () => {
    navigator.clipboard.writeText(publicLink);
    onShowToast('Link do formulário copiado!', 'success');
  };

  return (
    <div className="pb-20 md:pb-0 h-[calc(100vh-100px)] flex flex-col md:flex-row gap-6 animate-fade-in">
      
      {/* Editor Sidebar */}
      <div className="w-full md:w-1/3 bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border p-6 overflow-y-auto custom-scrollbar flex flex-col">
        <div className="mb-6 pb-4 border-b border-gray-100 dark:border-dark-border">
           <h2 className="text-xl font-bold text-gray-800 dark:text-dark-text flex items-center gap-2">
             <Layout size={20} className="text-primary-500"/> Construtor de Formulários
           </h2>
           <p className="text-sm text-gray-500 dark:text-dark-textMuted mt-1">
             Crie páginas de captura personalizadas.
           </p>
        </div>

        {/* Form Selector */}
        <div className="mb-6 space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Selecione o Formulário</label>
            <div className="flex gap-2">
                <select 
                    className="flex-1 p-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                    value={activeFormId}
                    onChange={(e) => setActiveFormId(e.target.value)}
                >
                    {forms.map(f => (
                        <option key={f.id} value={f.id}>{f.title}</option>
                    ))}
                </select>
                <button onClick={handleCreateForm} className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors" title="Criar Novo">
                    <Plus size={18}/>
                </button>
                <button onClick={handleDeleteForm} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors" title="Excluir Atual">
                    <Trash2 size={18}/>
                </button>
            </div>
        </div>

        <div className="space-y-6 flex-1 overflow-y-auto pr-2">
          {/* Link Section */}
          <div className="p-4 bg-primary-50 dark:bg-primary-900/10 rounded-xl border border-primary-100 dark:border-primary-800/30">
             <h3 className="text-sm font-bold text-primary-700 dark:text-primary-400 flex items-center gap-2 mb-2">
               <LinkIcon size={16}/> Link Direto
             </h3>
             <div className="flex gap-2">
                <input 
                  readOnly
                  type="text" 
                  className="flex-1 p-2 text-xs rounded-lg border border-primary-200 bg-white dark:bg-slate-900 text-gray-500 outline-none"
                  value={publicLink}
                />
                <button 
                  onClick={copyLink}
                  className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all"
                  title="Copiar Link"
                >
                  <Copy size={16}/>
                </button>
             </div>
          </div>

          {/* Texts */}
          <div className="space-y-3">
             <h3 className="text-sm font-bold text-gray-700 dark:text-dark-text flex items-center gap-2">
               <Type size={16}/> Conteúdo
             </h3>
             <div>
               <label className="block text-xs text-gray-500 dark:text-dark-textMuted mb-1">Título Principal</label>
               <input 
                 type="text" 
                 className="w-full p-2 rounded-lg border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-dark-text focus:ring-2 focus:ring-primary-200 outline-none"
                 value={activeForm.title}
                 onChange={e => handleUpdateActiveForm({ title: e.target.value })}
               />
             </div>
             <div>
               <label className="block text-xs text-gray-500 dark:text-dark-textMuted mb-1">Subtítulo</label>
               <textarea 
                 className="w-full p-2 rounded-lg border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-dark-text focus:ring-2 focus:ring-primary-200 outline-none resize-none"
                 rows={3}
                 value={activeForm.subtitle}
                 onChange={e => handleUpdateActiveForm({ subtitle: e.target.value })}
               />
             </div>
             <div>
               <label className="block text-xs text-gray-500 dark:text-dark-textMuted mb-1">Texto do Botão</label>
               <input 
                 type="text" 
                 className="w-full p-2 rounded-lg border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-dark-text focus:ring-2 focus:ring-primary-200 outline-none"
                 value={activeForm.buttonText}
                 onChange={e => handleUpdateActiveForm({ buttonText: e.target.value })}
               />
             </div>
          </div>

          {/* Colors */}
          <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-dark-border">
             <h3 className="text-sm font-bold text-gray-700 dark:text-dark-text flex items-center gap-2">
               <Palette size={16}/> Aparência
             </h3>
             <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-dark-textMuted mb-1">Cor Primária</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      className="h-8 w-8 rounded cursor-pointer border-none"
                      value={activeForm.primaryColor}
                      onChange={e => handleUpdateActiveForm({ primaryColor: e.target.value })}
                    />
                    <span className="text-xs font-mono text-gray-600 dark:text-dark-textMuted">{activeForm.primaryColor}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-dark-textMuted mb-1">Cor de Fundo</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      className="h-8 w-8 rounded cursor-pointer border-none"
                      value={activeForm.backgroundColor}
                      onChange={e => handleUpdateActiveForm({ backgroundColor: e.target.value })}
                    />
                    <span className="text-xs font-mono text-gray-600 dark:text-dark-textMuted">{activeForm.backgroundColor}</span>
                  </div>
                </div>
             </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-dark-border flex flex-col gap-3">
           <button 
             onClick={() => onOpenPublic(activeForm.id)}
             className="w-full py-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-dark-border text-gray-700 dark:text-dark-text hover:bg-gray-50 dark:hover:bg-white/10 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
           >
             <ExternalLink size={18}/> Testar Página
           </button>
        </div>
      </div>

      {/* Live Preview */}
      <div className="flex-1 bg-gray-100 dark:bg-gray-900 rounded-2xl p-8 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-dark-border relative">
         <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
            Preview: {activeForm.title}
         </div>

         <div className="w-full max-w-md shadow-2xl rounded-2xl overflow-hidden transition-all duration-500" style={{ backgroundColor: activeForm.backgroundColor }}>
            <div className="h-2 w-full" style={{ backgroundColor: activeForm.primaryColor }}></div>
            <div className="p-8 space-y-6">
               <div className="text-center space-y-2">
                  <h1 className="text-3xl font-bold" style={{ color: '#1f2937' }}>{activeForm.title}</h1>
                  <p style={{ color: '#6b7280' }}>{activeForm.subtitle}</p>
               </div>

               <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Nome Completo</label>
                    <div className="h-10 bg-gray-100 rounded border border-gray-200"></div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">WhatsApp</label>
                    <div className="h-10 bg-gray-100 rounded border border-gray-200"></div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Curso de Interesse</label>
                    <div className="h-10 bg-gray-100 rounded border border-gray-200"></div>
                  </div>
               </div>

               <div 
                 className="w-full py-3 rounded-lg text-white font-bold text-center shadow-lg mt-4"
                 style={{ backgroundColor: activeForm.primaryColor }}
               >
                 {activeForm.buttonText}
               </div>
               
               <p className="text-center text-xs text-gray-400 mt-4">🔒 Seus dados estão seguros</p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default FormBuilder;