import {
  ArrowLeftRight,
  BarChart3,
  CreditCard,
  Gift,
  Home,
  Landmark,
  MessageCircle,
  Receipt,
  Users,
} from 'lucide-react';
export const navigation = [
  { title: 'Inicio', icon: Home },
  { title: 'Chat', icon: MessageCircle },
  { title: 'Tarjetas', icon: CreditCard },
  { title: 'Transferencias', icon: ArrowLeftRight },
  { title: 'Cuentas', icon: Landmark },
  { title: 'Gastos', icon: Receipt },
  { title: 'Perfil', icon: Users },
  { title: 'Beneficios', icon: Gift },
  { title: 'Análisis', icon: BarChart3 },
];
export const emptyCopy: Record<string, [string, string]> = {
  Transferencias: [
    'Tus transferencias, en un solo lugar',
    'Aquí aparecerían los pagos enviados y recibidos. Esta demo no realiza transferencias.',
  ],
  Cuentas: [
    'Una visión clara de tus cuentas',
    'Aquí se organizarían las cuentas personales. El saldo del inicio es ficticio; no contiene fondos reales.',
  ],
  Gastos: [
    'Cada gasto, bajo control',
    'Aquí aparecerían los comprobantes y gastos personales. El resumen de inicio muestra movimientos ficticios.',
  ],
  Beneficios: [
    'Más para tu dinero',
    'Este espacio está reservado para beneficios. No hay promociones contratables en esta demostración.',
  ],
  Análisis: [
    'Tu dinero, en perspectiva',
    'Consulta las gráficas de ejemplo en Inicio o pide una vista al asistente simulado.',
  ],
};
