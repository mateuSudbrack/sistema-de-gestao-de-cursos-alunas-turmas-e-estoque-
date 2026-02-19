
import { AppState, StudentStatus } from './types';

export const SYSTEM_PIPELINE_ID = 'default-system-pipeline';

export const INITIAL_DATA: AppState = {
  theme: 'light',
  forms: [
    {
      id: 'default-form',
      title: 'Inscrição - Sistema Unic',
      subtitle: 'Preencha seus dados para iniciar sua jornada na beleza.',
      primaryColor: '#f43f5e',
      backgroundColor: '#ffffff',
      buttonText: 'Quero me Inscrever!'
    }
  ],
  evolutionConfig: {
    instanceName: '',
    apiKey: '',
    apiUrl: '',
    isConnected: false
  },
  automations: {
    rules: [
      { id: '1', name: 'Boas-vindas (Novo Lead)', trigger: 'lead_created', active: true, message: 'Olá {nome}! Bem-vinda à Sistema Unic. Como podemos ajudar?' },
      { id: '2', name: 'Confirmação de Matrícula', trigger: 'enrollment_created', active: true, message: 'Parabéns {nome}! Sua matrícula no curso foi confirmada. Nos vemos na aula!' }
    ],
    inactiveFollowUp: false,
    inactiveDays: 30,
    inactiveMessageText: 'Olá! Sentimos sua falta. Temos novidades em cursos e produtos, confira!'
  },
  paymentLinks: [
    {
      id: 'pl1',
      title: 'Curso VIP Sobrancelhas',
      description: 'Garanta sua vaga com desconto especial.',
      amount: 1500,
      courseId: 'c1',
      methods: ['pix', 'credit'],
      active: true,
      clicks: 12
    }
  ],
  pipelines: [
    {
      id: SYSTEM_PIPELINE_ID,
      name: 'Fluxo Geral (Contatos)',
      isSystem: true,
      stages: [
        { id: StudentStatus.INTERESTED, name: 'Interesse / Leads', color: '#3b82f6', order: 1 },
        { id: StudentStatus.ACTIVE, name: 'Em Negociação', color: '#f59e0b', order: 2 }, // Mudado conceito para Leads
        { id: StudentStatus.ALUMNI, name: 'Arquivado/Perdido', color: '#6b7280', order: 3 },
      ]
    }
  ],
  defaultPipelineId: SYSTEM_PIPELINE_ID,
  courses: [
    { id: 'c1', name: 'Micropigmentação de Sobrancelhas', price: 1500, duration: '30 Horas', description: 'Técnicas de shadow e fio a fio.' },
    { id: 'c2', name: 'Design de Sobrancelhas com Henna', price: 450, duration: '1 Dia', description: 'Mapeamento facial e aplicação.' },
    { id: 'c3', name: 'Limpeza de Pele Profunda', price: 800, duration: '2 Dias', description: 'Extração, peeling ultrassônico e máscaras.' },
    { id: 'c4', name: 'Extensão de Cílios (Lash)', price: 1200, duration: '16 Horas', description: 'Técnicas clássica e volume russo.' },
  ],
  classes: [],
  students: [],
  products: [],
  sales: [],
  logoUrl: ''
};
