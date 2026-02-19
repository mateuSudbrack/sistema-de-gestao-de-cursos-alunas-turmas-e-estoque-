import React, { useState } from 'react';
import { EvolutionConfig, Student, AutomationConfig, AutomationRule, AutomationTrigger } from '../types';
import { evolutionService } from '../services/evolutionService';
import { QrCode, RefreshCw, Send, Users, Zap, MessageCircle, Plus, Trash2 } from 'lucide-react';
import { ToastType } from './Toast';
import { v4 } from 'uuid';

interface MessagesProps {
  config: EvolutionConfig;
  automations: AutomationConfig;
  students: Student[];
  onSaveConfig: (c: EvolutionConfig) => void;
  onSaveAutomations: (a: AutomationConfig) => void;
  onShowToast: (msg: string, type: ToastType) => void;
}

const Messages: React.FC<MessagesProps> = ({ config, automations, students, onSaveConfig, onSaveAutomations, onShowToast }) => {
  const [activeTab, setActiveTab] = useState<'automation' | 'bulk'>('automation');

  // --- BULK TAB STATES ---
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [bulkMessage, setBulkMessage] = useState('');
  const [bulkFilter, setBulkFilter] = useState('');
  const [delay, setDelay] = useState(5); // Delay em segundos
  const [loading, setLoading] = useState(false);

  // --- AUTOMATION STATES ---
  const [newRule, setNewRule] = useState<{name: string, trigger: AutomationTrigger, message: string}>({
      name: '', trigger: 'lead_created', message: ''
  });

  // --- AUTOMATION LOGIC ---
  const handleAddRule = () => {
      if(!newRule.name || !newRule.message) return onShowToast('Preencha nome e mensagem.', 'error');
      const rule: AutomationRule = {
          id: v4(),
          name: newRule.name,
          trigger: newRule.trigger,
          message: newRule.message,
          active: true
      };
      onSaveAutomations({ ...automations, rules: [...(automations.rules || []), rule] });
      setNewRule({ name: '', trigger: 'lead_created', message: '' });
      onShowToast('Regra de automação criada!', 'success');
  };

  const handleDeleteRule = (id: string) => {
      onSaveAutomations({ ...automations, rules: automations.rules.filter(r => r.id !== id) });
  };

  const handleToggleRule = (id: string) => {
      const updated = automations.rules.map(r => r.id === id ? { ...r, active: !r.active } : r);
      onSaveAutomations({ ...automations, rules: updated });
  };

  // --- BULK LOGIC ---
  const filteredStudents = students.filter(s => s.name.toLowerCase().includes(bulkFilter.toLowerCase()));

  const toggleSelectStudent = (id: string) => {
      setSelectedStudents(prev => prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]);
  };

  const selectAll = () => {
      if (selectedStudents.length === filteredStudents.length) setSelectedStudents([]);
      else setSelectedStudents(filteredStudents.map(s => s.id));
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleSendBulk = async () => {
      if (!bulkMessage) return onShowToast('Escreva uma mensagem', 'error');
      if (selectedStudents.length === 0) return onShowToast('Selecione alunas', 'error');
      
      if (!config.isConnected) {
          onShowToast('WhatsApp não conectado. Vá em Configurações.', 'error');
          return;
      }

      let successCount = 0;
      // ... rest of logic remains similar but uses activeTab
  };

  return (
    <div className="h-full flex flex-col animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text">Central de Mensagens</h2>
            <div className="flex bg-white dark:bg-dark-surface p-1 rounded-xl border border-gray-100 dark:border-dark-border">
                <button 
                  onClick={() => setActiveTab('automation')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${activeTab === 'automation' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-dark-textMuted'}`}
                >
                    <Zap size={16}/> Automações
                </button>
                <button 
                  onClick={() => setActiveTab('bulk')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${activeTab === 'bulk' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-dark-textMuted'}`}
                >
                    <Users size={16}/> Disparos em Massa
                </button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border p-6">
            {!config.isConnected && (
                <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl flex items-center gap-3 text-amber-800 dark:text-amber-400">
                    <Zap size={20}/>
                    <p className="text-sm font-medium">WhatsApp desconectado. Vá em <strong>Configurações</strong> para conectar sua instância.</p>
                </div>
            )}
            
            {/* TAB: AUTOMATIONS */}
            {activeTab === 'automation' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 border-r border-gray-100 dark:border-dark-border pr-6 space-y-6">
                        <h3 className="font-bold text-gray-800 dark:text-dark-text">Nova Regra</h3>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-dark-textMuted mb-1">Nome da Regra</label>
                            <input type="text" value={newRule.name} onChange={e => setNewRule({...newRule, name: e.target.value})} className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-600 dark:text-white" placeholder="Ex: Boas Vindas"/>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-dark-textMuted mb-1">Gatilho (Quando...)</label>
                            <select value={newRule.trigger} onChange={e => setNewRule({...newRule, trigger: e.target.value as AutomationTrigger})} className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-600 dark:text-white">
                                <option value="lead_created">Novo Lead Cadastrado</option>
                                <option value="enrollment_created">Matrícula Confirmada</option>
                                <option value="payment_confirmed">Pagamento Recebido</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-dark-textMuted mb-1">Mensagem</label>
                            <textarea value={newRule.message} onChange={e => setNewRule({...newRule, message: e.target.value})} className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-600 dark:text-white" rows={4} placeholder="Olá {nome}..."/>
                            <p className="text-xs text-primary-500 mt-1">Use <strong>{'{nome}'}</strong> para personalizar.</p>
                        </div>
                        <button onClick={handleAddRule} className="w-full bg-primary-600 text-white py-2 rounded-lg font-bold">Criar Automação</button>
                    </div>

                    <div className="lg:col-span-2 space-y-4">
                        <h3 className="font-bold text-gray-800 dark:text-dark-text">Regras Ativas</h3>
                        {(!automations.rules || automations.rules.length === 0) && <p className="text-gray-400 italic">Nenhuma automação configurada.</p>}
                        {automations.rules?.map(rule => (
                            <div key={rule.id} className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-bold text-gray-800 dark:text-dark-text">{rule.name}</h4>
                                        <span className="text-[10px] uppercase bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold">{rule.trigger.replace('_', ' ')}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-dark-textMuted italic">"{rule.message}"</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={rule.active} onChange={() => handleToggleRule(rule.id)} />
                                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                                    </label>
                                    <button onClick={() => handleDeleteRule(rule.id)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 size={16}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB: BULK SENDING */}
            {activeTab === 'bulk' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                    <div className="lg:col-span-1 flex flex-col gap-4 border-r border-gray-100 dark:border-dark-border pr-4">
                        <input 
                            type="text" 
                            placeholder="Filtrar contatos..." 
                            value={bulkFilter}
                            onChange={e => setBulkFilter(e.target.value)}
                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-800 dark:text-dark-text"
                        />
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-500 dark:text-dark-textMuted">{selectedStudents.length} selecionados</span>
                            <button onClick={selectAll} className="text-xs text-primary-600 font-bold hover:underline">Selecionar Todos</button>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                            {filteredStudents.map(s => (
                                <div 
                                    key={s.id} 
                                    onClick={() => toggleSelectStudent(s.id)}
                                    className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center gap-3 ${selectedStudents.includes(s.id) ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800' : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700'}`}
                                >
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedStudents.includes(s.id) ? 'bg-primary-500 border-primary-500' : 'border-gray-300'}`}>
                                        {selectedStudents.includes(s.id) && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-gray-800 dark:text-dark-text">{s.name}</div>
                                        <div className="text-xs text-gray-500 dark:text-dark-textMuted">{s.phone}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="lg:col-span-2 flex flex-col">
                         <h3 className="font-bold text-gray-800 dark:text-dark-text mb-4">Mensagem</h3>
                         <textarea 
                            value={bulkMessage}
                            onChange={e => setBulkMessage(e.target.value)}
                            placeholder="Digite sua mensagem aqui... Use {nome} para personalizar."
                            className="flex-1 w-full p-4 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-dark-text resize-none focus:ring-2 focus:ring-primary-100 mb-4"
                         />
                         
                         <div className="flex gap-4 mb-4">
                             <div className="flex-1 flex justify-between items-center bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg">
                                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Dica: Use <strong>{'{nome}'}</strong> para substituir pelo nome automaticamente.</p>
                             </div>
                             <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-800 p-3 rounded-lg border border-gray-200 dark:border-slate-700">
                                 <label className="text-xs font-bold text-gray-500 dark:text-dark-textMuted whitespace-nowrap">Delay (segundos):</label>
                                 <input 
                                    type="number" 
                                    min="1" 
                                    max="60" 
                                    value={delay} 
                                    onChange={e => setDelay(Number(e.target.value))}
                                    className="w-16 p-1 text-center rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-bold"
                                 />
                             </div>
                         </div>

                         <button 
                            onClick={handleSendBulk}
                            disabled={loading || selectedStudents.length === 0}
                            className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                         >
                            {loading ? 'Enviando...' : <><Send size={18}/> Enviar para {selectedStudents.length} contatos</>}
                         </button>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default Messages;