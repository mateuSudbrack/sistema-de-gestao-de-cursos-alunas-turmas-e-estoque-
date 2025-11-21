
import { AppState, StudentStatus } from './types';

export const SYSTEM_PIPELINE_ID = 'default-system-pipeline';

export const INITIAL_DATA: AppState = {
  theme: 'light',
  formConfig: {
    title: 'Inscrição - Estética Pro',
    subtitle: 'Preencha seus dados para iniciar sua jornada na beleza.',
    primaryColor: '#f43f5e',
    backgroundColor: '#ffffff',
    buttonText: 'Quero me Inscrever!'
  },
  evolutionConfig: {
    instanceName: '',
    apiKey: '',
    apiUrl: '',
    isConnected: false
  },
  automations: {
    welcomeMessage: false,
    welcomeMessageText: 'Olá! Bem-vinda à Estética Pro. Estamos felizes em ter você conosco!',
    inactiveFollowUp: false,
    inactiveDays: 30,
    inactiveMessageText: 'Olá! Sentimos sua falta. Temos novidades em cursos e produtos, confira!'
  },
  pipelines: [
    {
      id: SYSTEM_PIPELINE_ID,
      name: 'Fluxo Geral (Matrículas)',
      isSystem: true,
      stages: [
        { id: StudentStatus.INTERESTED, name: 'Interesse / Leads', color: '#3b82f6', order: 1 },
        { id: StudentStatus.ACTIVE, name: 'Em Curso / Ativas', color: '#22c55e', order: 2 },
        { id: StudentStatus.ALUMNI, name: 'Formadas / Ex-Alunas', color: '#6b7280', order: 3 },
      ]
    }
  ],
  defaultPipelineId: SYSTEM_PIPELINE_ID,
  courses: [
    { id: 'c1', name: 'Micropigmentação de Sobrancelhas', price: 1500, duration: '3 Dias', description: 'Técnicas de shadow e fio a fio.' },
    { id: 'c2', name: 'Design de Sobrancelhas com Henna', price: 450, duration: '1 Dia', description: 'Mapeamento facial e aplicação.' },
    { id: 'c3', name: 'Limpeza de Pele Profunda', price: 800, duration: '2 Dias', description: 'Extração, peeling ultrassônico e máscaras.' },
    { id: 'c4', name: 'Extensão de Cílios (Lash)', price: 1200, duration: '2 Dias', description: 'Técnicas clássica e volume russo.' },
  ],
  classes: [
    { 
      id: 't1', courseId: 'c1', startDate: '2023-11-10', endDate: '2023-11-13', 
      schedule: ['2023-11-10', '2023-11-11', '2023-11-12', '2023-11-13'],
      maxStudents: 4, enrolledStudentIds: ['s1'], status: 'open' 
    },
    { 
      id: 't2', courseId: 'c2', startDate: '2023-11-15', endDate: '2023-11-15', 
      schedule: ['2023-11-15'],
      maxStudents: 6, enrolledStudentIds: [], status: 'open' 
    },
    { 
      id: 't3', courseId: 'c1', startDate: '2023-10-01', endDate: '2023-10-04', 
      schedule: ['2023-10-01', '2023-10-02', '2023-10-03', '2023-10-04'],
      maxStudents: 4, enrolledStudentIds: ['s3'], status: 'completed' 
    },
  ],
  students: [
    {
      id: 's1',
      name: 'Ana Silva',
      phone: '11999998888',
      photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      status: StudentStatus.ACTIVE,
      pipelineId: SYSTEM_PIPELINE_ID,
      interestedIn: [],
      history: [{ courseId: 'c2', date: '2023-10-15', paid: 450 }],
      lastContact: '2023-10-20',
      nextFollowUp: '2023-11-05',
      lastPurchase: '2023-10-15',
      notes: 'Gostou muito do design, quer fazer micro em breve.',
    },
    {
      id: 's2',
      name: 'Beatriz Costa',
      phone: '11977776666',
      status: StudentStatus.INTERESTED,
      pipelineId: SYSTEM_PIPELINE_ID,
      interestedIn: ['c1', 'c4'],
      history: [],
      lastContact: '2023-10-25',
      nextFollowUp: '2023-10-28',
      notes: 'Perguntou sobre parcelamento no cartão.',
    },
    {
      id: 's3',
      name: 'Carla Dias',
      phone: '11955554444',
      photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      status: StudentStatus.ALUMNI,
      pipelineId: SYSTEM_PIPELINE_ID,
      interestedIn: ['c3'],
      history: [
        { courseId: 'c1', date: '2023-01-10', paid: 1500 },
        { courseId: 'c4', date: '2023-05-20', paid: 1200 }
      ],
      lastContact: '2023-09-01',
      nextFollowUp: '2023-11-10',
      lastPurchase: '2023-10-22',
      notes: 'Profissional atuante, compra produtos recorrentes.',
    }
  ],
  products: [
    { id: 'p1', name: 'Pigmento Castanho Escuro', costPrice: 80, sellPrice: 150, quantity: 5, minStock: 3 },
    { id: 'p2', name: 'Anestésico Tópico', costPrice: 40, sellPrice: 90, quantity: 12, minStock: 5 },
    { id: 'p3', name: 'Kit Pinças Premium', costPrice: 25, sellPrice: 60, quantity: 20, minStock: 5 },
    { id: 'p4', name: 'Lash Box Mix', costPrice: 50, sellPrice: 110, quantity: 2, minStock: 4 },
    { id: 'p5', name: 'Toucas Descartáveis (pct 50)', costPrice: 10, sellPrice: 25, quantity: 30, minStock: 10 },
  ],
  sales: [
    { id: 'sale1', studentId: 's3', date: '2023-10-22', discount: 0, total: 300, items: [{ productId: 'p1', qty: 2, priceAtSale: 150 }] },
    { id: 'sale2', studentId: 's1', date: '2023-10-15', discount: 0, total: 60, items: [{ productId: 'p3', qty: 1, priceAtSale: 60 }] },
  ]
};
