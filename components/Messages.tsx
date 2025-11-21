
import React, { useState } from 'react';
import { EvolutionConfig, Student, AutomationConfig } from '../types';
import { evolutionService } from '../services/evolutionService';
import { QrCode, RefreshCw, Send, Users, Zap, MessageCircle } from 'lucide-react';
import { ToastType } from './Toast';

interface MessagesProps {
  config: EvolutionConfig;
  automations: AutomationConfig;
  students: Student[];
  onSaveConfig: (c: EvolutionConfig) => void;
  onSaveAutomations: (a: AutomationConfig) => void;
  onShowToast: (msg: string, type: ToastType) => void;
}

const Messages: React.FC<MessagesProps> = ({ config, automations, students, onSaveConfig, onSaveAutomations, onShowToast }) => {
  const [activeTab, setActiveTab] = useState<'connect' | 'automation' | 'bulk'>('connect');

  // --- CONNECT TAB STATES ---
  const [apiUrl, setApiUrl] = useState(config.apiUrl || '');
  const [apiKey, setApiKey] = useState(config.apiKey || '');
  const [instanceName, setInstanceName] = useState(config.instanceName || '');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // --- BULK TAB STATES ---
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [bulkMessage, setBulkMessage] = useState('');
  const [bulkFilter, setBulkFilter] = useState('');

  // --- CONNECT LOGIC ---
  const handleSaveCreds = () => {
    onSaveConfig({ ...config, apiUrl, apiKey });
    onShowToast('Credenciais salvas!', 'success');
  };

  const handleCreateInstance = async () => {
    if (!instanceName) return onShowToast('Nome da instância obrigatório', 'error');
    setLoading(true);
    try {
        const res = await evolutionService.createInstance({ ...config, apiUrl, apiKey }, instanceName);
        if (res.base64 || res.qrcode?.base64) {
            setQrCode(res.base64 || res.qrcode.base64);
            onSaveConfig({ ...config, apiUrl, apiKey, instanceName });
        }
    } catch (e) {
        onShowToast('Erro ao criar instância', 'error');
    } finally {
        setLoading(false);
    }
  };

  const handleConnect = async () => {
     setLoading(true);
     try {
        const res = await evolutionService.connectInstance(config);
        if (res.base64 || res.qrcode?.base64) {
             setQrCode(res.base64 || res.qrcode.base64);
        }
     } catch (e) {
         onShowToast('Erro ao conectar', 'error');
     } finally {
         setLoading(false);
     }
  };

  const handleDeleteInstance = async () => {
     if(window.confirm('Tem certeza? Isso desconectará o WhatsApp.')) {
        setLoading(true);
        await evolutionService.deleteInstance(config);
        onSaveConfig({ ...config, instanceName: '' });
        setQrCode(null);
        setLoading(false);
     }
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

  const handleSendBulk = async () => {
      if (!bulkMessage) return onShowToast('Escreva uma mensagem', 'error');
      if (selectedStudents.length === 0) return onShowToast('Selecione alunas', 'error');
      
      if (!config.instanceName) {
          onShowToast('WhatsApp não conectado. Configure na aba Conexão.', 'error');
          return;
      }

      let successCount = 0;
      setLoading(true);
      
      for (const studentId of selectedStudents) {
          const student = students.find(s => s.id === studentId);
          if (student) {
              const msg = bulkMessage.replace('{nome}', student.name);
              const sent = await evolutionService.sendMessage(config, student.phone, msg);
              if (sent) successCount++;
          }
      }
      
      setLoading(false);
      onShowToast(`${successCount} mensagens enviadas!`, 'success');
      setBulkMessage('');
      setSelectedStudents([]);
  };

  return (
    <div className="h-full flex flex-col animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text">Central de Mensagens</h2>
            <div className="flex bg-white dark:bg-dark-surface p-1 rounded-xl border border-gray-100 dark:border-dark-border">
                <button 
                  onClick={() => setActiveTab('connect')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${activeTab === 'connect' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-dark-textMuted'}`}
                >
                    <QrCode size={16}/> Conexão
                </button>
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
            
            {/* TAB: CONNECTION */}
            {activeTab === 'connect' && (
                <div className="max-w-2xl mx-auto space-y-8">
                    <div className="bg-gray-50 dark:bg-white/5 p-6 rounded-xl border border-gray-100 dark:border-dark-border">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-dark-text mb-4">Configuração API Evolution</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-dark-textMuted mb-1">URL da API</label>
                                <input type="url" value={apiUrl} onChange={e => setApiUrl(e.target.value)} placeholder="https://api.seusite.com" className="w-full p-3 rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface dark:text-dark-text" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-dark-textMuted mb-1">API Key</label>
                                <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="Sua chave de API Global" className="w-full p-3 rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface dark:text-dark-text" />
                            </div>
                            <button onClick={handleSaveCreds} className="bg-gray-800 dark:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-bold">Salvar Credenciais</button>
                        </div>
                    </div>

                    <div className={`space-y-6 transition-opacity ${!apiKey ? 'opacity-50 pointer-events-none' : ''}`}>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-dark-text">Gerenciar Instância</h3>
                        
                        {!config.instanceName ? (
                             <div className="flex gap-3">
                                 <input type="text" value={instanceName} onChange={e => setInstanceName(e.target.value)} placeholder="Nome da Instância (ex: estetica-pro)" className="flex-1 p-3 rounded-lg border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-white/5 dark:text-dark-text" />
                                 <button onClick={handleCreateInstance} disabled={loading} className="bg-primary-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-primary-700 disabled:opacity-50">
                                     {loading ? 'Criando...' : 'Criar Instância'}
                                 </button>
                             </div>
                        ) : (
                            <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-xl border border-blue-100 dark:border-blue-800/30">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-dark-textMuted">Instância Conectada</p>
                                        <h4 className="text-xl font-bold text-blue-800 dark:text-blue-300">{config.instanceName}</h4>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={handleConnect} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700">Ler QR Code</button>
                                        <button onClick={handleDeleteInstance} className="bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-200">Deletar</button>
                                    </div>
                                </div>

                                {qrCode && (
                                    <div className="flex flex-col items-center bg-white dark:bg-white/5 p-4 rounded-xl shadow-sm">
                                        <p className="text-sm font-bold mb-2 text-gray-600 dark:text-gray-300">Escaneie com seu WhatsApp</p>
                                        <img src={qrCode.startsWith('data') ? qrCode : `data:image/png;base64,${qrCode}`} alt="QR Code" className="w-64 h-64 object-contain" />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB: AUTOMATIONS */}
            {activeTab === 'automation' && (
                <div className="max-w-3xl mx-auto space-y-6">
                    <div className="bg-gray-50 dark:bg-white/5 p-6 rounded-xl border border-gray-100 dark:border-dark-border flex items-start gap-4">
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                            <MessageCircle size={24}/>
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold text-gray-800 dark:text-dark-text">Boas-vindas Automática</h3>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={automations.welcomeMessage} onChange={e => onSaveAutomations({...automations, welcomeMessage: e.target.checked})} />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                                </label>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-dark-textMuted mb-3">Envia uma mensagem assim que você cadastrar uma nova aluna no sistema.</p>
                            {automations.welcomeMessage && (
                                <>
                                    <textarea 
                                        value={automations.welcomeMessageText}
                                        onChange={e => onSaveAutomations({...automations, welcomeMessageText: e.target.value})}
                                        className="w-full p-3 rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface text-sm dark:text-dark-text"
                                        rows={3}
                                    />
                                    <p className="text-xs text-primary-600 dark:text-primary-400 mt-1">
                                        Dica: Use <strong>{'{nome}'}</strong> para o primeiro nome ou <strong>{'{nome_completo}'}</strong> para o nome todo.
                                    </p>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-white/5 p-6 rounded-xl border border-gray-100 dark:border-dark-border flex items-start gap-4">
                        <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
                            <RefreshCw size={24}/>
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold text-gray-800 dark:text-dark-text">Reengajamento de Inativos</h3>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={automations.inactiveFollowUp} onChange={e => onSaveAutomations({...automations, inactiveFollowUp: e.target.checked})} />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                </label>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-dark-textMuted mb-3">Envia mensagem para alunas que não compram há X dias.</p>
                            {automations.inactiveFollowUp && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm dark:text-dark-text">Considerar inativo após</span>
                                        <input 
                                            type="number" 
                                            value={automations.inactiveDays}
                                            onChange={e => onSaveAutomations({...automations, inactiveDays: parseInt(e.target.value)})}
                                            className="w-20 p-1 rounded border border-gray-200 dark:border-dark-border text-center bg-white dark:bg-dark-surface dark:text-dark-text"
                                        />
                                        <span className="text-sm dark:text-dark-text">dias.</span>
                                    </div>
                                    <textarea 
                                        value={automations.inactiveMessageText}
                                        onChange={e => onSaveAutomations({...automations, inactiveMessageText: e.target.value})}
                                        className="w-full p-3 rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface text-sm dark:text-dark-text"
                                        rows={3}
                                    />
                                    <p className="text-xs text-primary-600 dark:text-primary-400 mt-1">
                                        Dica: Use <strong>{'{nome}'}</strong> para substituir pelo nome da aluna.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: BULK SENDING */}
            {activeTab === 'bulk' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                    <div className="lg:col-span-1 flex flex-col gap-4 border-r border-gray-100 dark:border-dark-border pr-4">
                        <input 
                            type="text" 
                            placeholder="Filtrar alunas..." 
                            value={bulkFilter}
                            onChange={e => setBulkFilter(e.target.value)}
                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-white/5 dark:text-dark-text"
                        />
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-500 dark:text-dark-textMuted">{selectedStudents.length} selecionadas</span>
                            <button onClick={selectAll} className="text-xs text-primary-600 font-bold hover:underline">Selecionar Todas</button>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                            {filteredStudents.map(s => (
                                <div 
                                    key={s.id} 
                                    onClick={() => toggleSelectStudent(s.id)}
                                    className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center gap-3 ${selectedStudents.includes(s.id) ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800' : 'bg-white dark:bg-white/5 border-gray-100 dark:border-dark-border'}`}
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
                            className="flex-1 w-full p-4 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-dark-text resize-none focus:ring-2 focus:ring-primary-100 mb-4"
                         />
                         <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg mb-4">
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Dica: Use <strong>{'{nome}'}</strong> para substituir pelo nome da aluna automaticamente.</p>
                         </div>
                         <button 
                            onClick={handleSendBulk}
                            disabled={loading || selectedStudents.length === 0}
                            className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                         >
                            {loading ? 'Enviando...' : <><Send size={18}/> Enviar para {selectedStudents.length} alunas</>}
                         </button>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default Messages;
