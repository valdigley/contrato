export interface EventType {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Package {
  id: string;
  event_type_id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContractTemplate {
  id: string;
  event_type_id: string;
  name: string;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContractData {
  id?: string;
  nome_completo: string;
  cpf: string;
  email: string;
  whatsapp: string;
  endereco: string;
  cidade: string;
  data_nascimento: string;
  tipo_evento: string;
  event_type_id?: string;
  package_id?: string;
  package_price?: number;
  local_pre_wedding?: string;
  local_making_of?: string;
  local_cerimonia?: string;
  local_festa: string;
  nome_noivos?: string;
  nome_aniversariante?: string;
  payment_method_id?: string;
  final_price?: number;
  preferred_payment_day?: number;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  discount_percentage: number;
  installments: number;
  payment_schedule: Array<{
    percentage: number;
    description: string;
  }>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PackagePaymentMethod {
  id: string;
  package_id: string;
  payment_method_id: string;
  final_price: number;
  created_at: string;
  payment_method?: PaymentMethod;
}