
export enum StudentStatus {
  INTERESTED = 'Interessado',
  ACTIVE = 'Ativo',
  ALUMNI = 'Ex-Aluno',
}

export interface Course {
  id: string;
  name: string;
  price: number;
  duration: string;
  description: string;
}

export interface CourseClass {
  id: string;
  courseId: string;
  startDate: string;
  endDate?: string;
  schedule?: string[]; // Array of ISO date strings for specific class days
  maxStudents: number;
  enrolledStudentIds: string[];
  status: 'open' | 'ongoing' | 'completed';
}

export interface PipelineStage {
  id: string;
  name: string;
  color: string;
  order: number;
}

export interface PipelineDefinition {
  id: string;
  name: string;
  isSystem: boolean;
  stages: PipelineStage[];
}

export interface Student {
  id: string;
  name: string;
  phone: string;
  email?: string;
  photo?: string; // URL da foto
  status: StudentStatus;
  pipelineId?: string;
  stageId?: string;
  interestedIn: string[];
  history: {
    courseId: string;
    date: string;
    paid: number;
  }[];
  lastContact: string;
  nextFollowUp: string;
  lastPurchase?: string; // Data da última compra de produto
  notes: string;
}

export interface Product {
  id: string;
  name: string;
  costPrice: number;
  sellPrice: number;
  quantity: number;
  minStock: number;
}

export interface Sale {
  id: string;
  studentId?: string;
  date: string;
  items: {
    productId: string;
    qty: number;
    priceAtSale: number;
  }[];
  discount: number;
  total: number;
}

export interface PublicFormConfig {
  title: string;
  subtitle: string;
  primaryColor: string;
  backgroundColor: string;
  logoUrl?: string;
  buttonText: string;
}

export interface EvolutionConfig {
  instanceName: string;
  apiKey: string;
  apiUrl: string;
  isConnected: boolean;
}

export interface AutomationConfig {
  welcomeMessage: boolean;
  welcomeMessageText: string;
  inactiveFollowUp: boolean;
  inactiveDays: number;
  inactiveMessageText: string;
}

export type Theme = 'light' | 'dark';

export interface AppState {
  students: Student[];
  courses: Course[];
  classes: CourseClass[];
  products: Product[];
  sales: Sale[];
  pipelines: PipelineDefinition[];
  defaultPipelineId: string;
  formConfig: PublicFormConfig;
  evolutionConfig: EvolutionConfig;
  automations: AutomationConfig;
  theme: Theme;
}

export type View = 'dashboard' | 'students' | 'pipeline' | 'courses' | 'inventory' | 'agenda' | 'form-builder' | 'public-form' | 'messages';
