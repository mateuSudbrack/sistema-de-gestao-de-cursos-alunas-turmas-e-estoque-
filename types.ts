
export enum StudentStatus {
  INTERESTED = 'Interessado', // Lead
  ACTIVE = 'Ativo', // Aluno cursando
  ALUMNI = 'Ex-Aluno', // Aluno formado
}

export type StudentType = 'lead' | 'student';

export interface Course {
  id: string;
  name: string;
  price: number;
  duration: string;
  description: string;
}

export interface ClassSchedule {
  date: string;
  startTime: string;
  endTime: string;
}

export interface CourseClass {
  id: string;
  courseId: string;
  startDate: string;
  endDate?: string;
  schedule: ClassSchedule[]; 
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

export interface EnrollmentHistory {
  courseId: string;
  classId?: string;
  date: string;
  paid: number;
  status: 'paid' | 'pending';
}

export interface Student {
  id: string;
  name: string;
  phone: string;
  email?: string;
  cpf?: string;
  photo?: string;
  type: StudentType; // Lead ou Student
  status: StudentStatus;
  pipelineId?: string;
  stageId?: string;
  interestedIn: string[];
  history: EnrollmentHistory[];
  lastContact: string;
  nextFollowUp: string;
  lastPurchase?: string;
  notes: string;
}

export type ProductCategory = 'retail' | 'internal';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory; // Venda ou Consumo
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

export type AutomationTrigger = 'lead_created' | 'enrollment_created' | 'payment_confirmed';

export interface AutomationRule {
  id: string;
  name: string;
  trigger: AutomationTrigger;
  active: boolean;
  message: string;
}

export interface AutomationConfig {
  rules: AutomationRule[];
  inactiveFollowUp: boolean;
  inactiveDays: number;
  inactiveMessageText: string;
}

export interface PaymentLink {
  id: string;
  title: string;
  description: string;
  amount: number;
  courseId?: string; // Se vinculado a um curso
  studentId?: string; // Se vinculado a uma aluna específica
  photoUrl?: string;
  methods: ('pix' | 'credit')[];
  active: boolean;
  clicks: number;
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
  paymentLinks: PaymentLink[];
  theme: Theme;
}

export type View = 'dashboard' | 'students' | 'pipeline' | 'courses' | 'inventory' | 'agenda' | 'form-builder' | 'public-form' | 'messages' | 'payments';
