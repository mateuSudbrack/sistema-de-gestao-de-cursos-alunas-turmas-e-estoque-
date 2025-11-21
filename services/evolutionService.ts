
import { EvolutionConfig } from '../types';

// Helper to standardize URL
const normalizeUrl = (url: string) => {
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

export const evolutionService = {
  
  createInstance: async (config: EvolutionConfig, name: string) => {
    if (!config.apiUrl || !config.apiKey) throw new Error("API não configurada");
    
    try {
      const response = await fetch(`${normalizeUrl(config.apiUrl)}/instance/create`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'apikey': config.apiKey 
        },
        body: JSON.stringify({
          instanceName: name,
          token: crypto.randomUUID(), 
          qrcode: true,
          integration: "WHATSAPP-BAILEYS"
        })
      });
      const data = await response.json();
      return data;
    } catch (e) {
      console.error("Failed to create instance", e);
      throw new Error("Falha ao criar instância. Verifique a URL e Chave.");
    }
  },

  fetchInstance: async (config: EvolutionConfig) => {
     if (!config.apiUrl || !config.apiKey || !config.instanceName) return null;
     try {
        const response = await fetch(`${normalizeUrl(config.apiUrl)}/instance/fetchInstances`, {
            method: 'GET',
            headers: { 'apikey': config.apiKey }
        });
        const data = await response.json();
        const instance = Array.isArray(data) ? data.find((i: any) => i.instance.instanceName === config.instanceName) : data;
        return instance;
     } catch (e) {
         return null;
     }
  },

  connectInstance: async (config: EvolutionConfig) => {
    if (!config.apiUrl || !config.apiKey || !config.instanceName) throw new Error("Configuração incompleta");
    try {
        const response = await fetch(`${normalizeUrl(config.apiUrl)}/instance/connect/${config.instanceName}`, {
            method: 'GET',
            headers: { 'apikey': config.apiKey }
        });
        return await response.json();
    } catch (e) {
        throw new Error("Falha ao solicitar conexão");
    }
  },
  
  deleteInstance: async (config: EvolutionConfig) => {
    if (!config.apiUrl || !config.apiKey || !config.instanceName) return;
    try {
        await fetch(`${normalizeUrl(config.apiUrl)}/instance/delete/${config.instanceName}`, {
            method: 'DELETE',
            headers: { 'apikey': config.apiKey }
        });
    } catch (e) {
        console.error("Failed to delete", e);
    }
  },

  sendMessage: async (config: EvolutionConfig, phone: string, text: string) => {
    if (!config.apiUrl || !config.apiKey || !config.instanceName) {
        console.warn("Evolution API not configured");
        return false; 
    }

    try {
        const cleanPhone = phone.replace(/\D/g, '');
        const formattedPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;

        const response = await fetch(`${normalizeUrl(config.apiUrl)}/message/sendText/${config.instanceName}`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'apikey': config.apiKey
            },
            body: JSON.stringify({
                number: formattedPhone,
                text: text,
                options: {
                    delay: 1200,
                    presence: "composing"
                }
            })
        });
        return response.ok;
    } catch (e) {
        console.error("Send message failed", e);
        return false;
    }
  }
};
