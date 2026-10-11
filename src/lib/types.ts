export type Role = 'CLIENTE' | 'ADMIN';

export interface Address {
  id: string;
  label: string;
  cep: string;
  street: string;
  number: string;
  complement?: string;
  district: string;
  city: string;
  state: string;
  reference?: string;
}

export interface User {
  id: string;
  name?: string;
  email: string;
  phone: string;
  /** Somente no mock. Em produção a senha nunca sai do servidor. */
  password: string;
  role: Role;
  twoFactor: boolean;
  addresses: Address[];
  createdAt: string;
}

export type CategoryKind = 'grid' | 'compact' | 'pizza';
export interface Category {
  id: string;
  name: string;
  kind: CategoryKind;
  note?: string;
}

export interface OptionItem {
  id: string;
  name: string;
  price: number;
}
export interface OptionGroup {
  id: string;
  name: string;
  min: number;
  max: number;
  options: OptionItem[];
}

export type PizzaSize = 'broto' | 'grande';
export type PizzaFamily = 'tradicional' | 'especial' | 'novidade' | 'doce';

export interface Product {
  id: string;
  code?: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  available: boolean;
  image: string;
  groups: string[];
  tag?: string;
  featured?: boolean;
  /** Dias da semana em que o item é vendido (0 = domingo). Vazio = todos. */
  weekdays?: number[];
  /** Horário limite do dia, "HH:MM". */
  until?: string;
  sizes?: Record<PizzaSize, number>;
  family?: PizzaFamily;
}

export interface CartItem {
  uid: string;
  productId: string;
  name: string;
  image: string;
  unitPrice: number;
  qty: number;
  details: string[];
  notes?: string;
}

export type OrderStatus = 'recebido' | 'preparo' | 'entrega' | 'entregue' | 'cancelado';
export type PaymentMethod = 'pix' | 'cartao' | 'dinheiro' | 'maquininha';

export interface OrderItem {
  productId: string;
  name: string;
  qty: number;
  unitPrice: number;
  details: string[];
  image: string;
  notes?: string;
}

export interface Payment {
  method: PaymentMethod;
  status: string;
  brand?: string;
  last4?: string;
  changeFor?: number;
  installments?: number;
  gatewayId?: string;
}

export interface Order {
  id: string;
  number: number;
  customerId: string;
  customerName: string;
  phone: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  mode: 'entrega' | 'retirada';
  address: Address | null;
  payment: Payment;
  status: OrderStatus;
  createdAt: string;
  history: { status: OrderStatus; at: string }[];
  notes?: string;
}
