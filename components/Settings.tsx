import React, { useState } from 'react';
import { EvolutionConfig, Theme } from '../types';
import { Settings as SettingsIcon, Upload, Moon, Sun, QrCode, RefreshCw, CheckCircle, Zap, Shield, Link, Save } from 'lucide-react';
import { evolutionService } from '../services/evolutionService';
import { ToastType } from './Toast';

interface SettingsProps {
  config: EvolutionConfig;
  currentTheme: Theme;
  logoUrl?: string;
  onSaveConfig: (config: EvolutionConfig) => void;
  onUpdateTheme: (theme: Theme) => void;
  onUpdateLogo: (url: string) => void;
  onShowToast: (msg: string, type: ToastType) => void;
}

const Settings: React.FC<SettingsProps> = ({ config, currentTheme, logoUrl, onSaveConfig, onUpdateTheme, onUpdateLogo, onShowToast }) => {
  const [localConfig, setLocalConfig] = useState<EvolutionConfig>(config || { apiUrl: '', apiKey: '', instanceName: '', isConnected: false });
  const [isProcessing, setIsProcessing] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);

  if (!config) return <div className="p-10 text-center">Carregando configurações...</div>;

  const handleSaveConfig = () => {
    onSaveConfig(localConfig);
    onShowToast('Instância salva!', 'success');
  };

  const handleCreateInstance = async () => {
    if (!localConfig.instanceName) return onShowToast("Informe o nome da instância", 'error');
    setIsProcessing(true);
    try {
      const data = await evolutionService.createInstance(localConfig, localConfig.instanceName);
      if (data.qrcode?.base64) {
        setQrCode(data.qrcode.base64);
        onShowToast("Instância criada! Escaneie o QR Code.", 'success');
      } else {
        onShowToast("Instância criada com sucesso!", 'success');
      }
    } catch (e: any) {
      onShowToast(e.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckConnection = async () => {
    setIsProcessing(true);
    try {
      const instance = await evolutionService.fetchInstance(localConfig);
      if (instance && instance.instance.status === 'open') {
        onSaveConfig({ ...localConfig, isConnected: true });
        onShowToast("WhatsApp Conectado!", "success");
        setQrCode(null);
      } else {
        onSaveConfig({ ...localConfig, isConnected: false });
        onShowToast("Ainda não conectado.", "info");
      }
    } catch (e) {
      onShowToast("Erro ao verificar.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
          const base64 = evt.target?.result as string;
          onUpdateLogo(base64);
          onShowToast('Logo atualizada!', 'success');
      };
      reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary-100 text-primary-600 rounded-2xl">
          <SettingsIcon size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text">Configurações do Sistema</h2>
          <p className="text-sm text-gray-500">Personalize a aparência e conexões de API.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Aparência */}
        <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border space-y-6 flex flex-col">
          <h3 className="font-bold text-gray-800 dark:text-dark-text flex items-center gap-2">
            <Zap size={18} className="text-amber-500" /> Identidade Visual
          </h3>
          
          <div className="space-y-4 flex-1">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Logo do Sistema</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 dark:border-slate-700 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-slate-800">
                  {logoUrl ? <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" /> : <Upload className="text-gray-300" />}
                </div>
                <label className="cursor-pointer bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors">
                  Alterar Logo
                  <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tema Padrão</label>
              <div className="flex gap-2">
                <button 
                  onClick={() => onUpdateTheme('light')}
                  className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${currentTheme === 'light' ? 'border-primary-500 bg-primary-50 text-primary-700 font-bold' : 'border-gray-100 dark:border-slate-700 text-gray-500'}`}
                >
                  <Sun size={18}/> Claro
                </button>
                <button 
                  onClick={() => onUpdateTheme('dark')}
                  className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${currentTheme === 'dark' ? 'border-primary-500 bg-primary-900/20 text-primary-400 font-bold' : 'border-gray-100 dark:border-slate-700 text-gray-500'}`}
                >
                  <Moon size={18}/> Escuro
                </button>
              </div>
            </div>
          </div>

          <button 
            onClick={() => onShowToast('Configurações aplicadas e salvas!', 'success')}
            className="w-full mt-4 bg-gray-800 dark:bg-slate-700 text-white py-3 rounded-xl font-bold hover:bg-gray-900 transition-all flex items-center justify-center gap-2"
          >
            <Save size={18}/> Salvar Configurações
          </button>
        </div>

        {/* Status da Conexão */}
        <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border">
          <h3 className="font-bold text-gray-800 dark:text-dark-text flex items-center gap-2 mb-6">
            <Shield size={18} className="text-green-500" /> Status da Integração
          </h3>
          <div className="flex flex-col items-center justify-center py-4 space-y-4">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center ${config.isConnected ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
              <CheckCircle size={40} />
            </div>
            <div className="text-center">
              <p className="font-bold dark:text-white">{config.isConnected ? 'WhatsApp Conectado' : 'WhatsApp Desconectado'}</p>
              <p className="text-xs text-gray-500">{config.instanceName || 'Nenhuma instância configurada'}</p>
            </div>
            {!config.isConnected && (
              <button 
                onClick={handleCheckConnection}
                className="text-primary-600 text-sm font-bold hover:underline flex items-center gap-1"
              >
                <RefreshCw size={14}/> Tentar Reconectar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Configuração da API Evolution */}
      <div className="bg-white dark:bg-dark-surface p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border">
        <h3 className="font-bold text-lg text-gray-800 dark:text-dark-text mb-6 flex items-center gap-2">
          <Link size={20} className="text-primary-500"/> Configuração Evolution API
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">URL da API</label>
              <input 
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary-200"
                value={localConfig.apiUrl}
                onChange={e => setLocalConfig({...localConfig, apiUrl: e.target.value})}
                placeholder="https://sua-api.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">ApiKey (Global)</label>
              <input 
                type="password"
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary-200"
                value={localConfig.apiKey}
                onChange={e => setLocalConfig({...localConfig, apiKey: e.target.value})}
                placeholder="Sua chave secreta"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome da Instância</label>
              <input 
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary-200"
                value={localConfig.instanceName}
                onChange={e => setLocalConfig({...localConfig, instanceName: e.target.value})}
                placeholder="ex: escola-unic"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button 
                onClick={handleSaveConfig}
                className="flex-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all"
              >
                Salvar Dados
              </button>
              <button 
                onClick={handleCreateInstance}
                disabled={isProcessing}
                className="flex-1 bg-primary-600 text-white py-3 rounded-xl font-bold hover:bg-primary-700 shadow-lg shadow-primary-200 dark:shadow-none transition-all disabled:opacity-50"
              >
                {isProcessing ? 'Processando...' : 'Conectar/Criar'}
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center border-l border-gray-100 dark:border-slate-700 pl-6">
            {qrCode ? (
              <div className="space-y-4 text-center">
                <div className="bg-white p-4 rounded-2xl shadow-xl border border-gray-100">
                  <img src={qrCode} alt="WhatsApp QR Code" className="w-48 h-48" />
                </div>
                <p className="text-sm font-bold text-gray-600 animate-pulse">Aguardando leitura do QR Code...</p>
                <button onClick={handleCheckConnection} className="bg-green-100 text-green-700 px-4 py-2 rounded-lg text-xs font-bold hover:bg-green-200 transition-all flex items-center gap-2 mx-auto">
                  <RefreshCw size={14}/> Já escaneei
                </button>
              </div>
            ) : (
              <div className="text-center space-y-3 opacity-40">
                <QrCode size={80} className="mx-auto text-gray-300" />
                <p className="text-sm font-medium text-gray-400">QR Code aparecerá aqui<br/>após clicar em Conectar</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;