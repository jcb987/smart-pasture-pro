export type TermKey =
  | 'palpacion'
  | 'servicio'
  | 'secado'
  | 'celo'
  | 'aforo'
  | 'kardex'
  | 'dias_abiertos'
  | 'fdn'
  | 'mcal'
  | 'materia_seca'
  | 'ccs'
  | 'mastitis'
  | 'metritis'
  | 'retiro'
  | 'persistencia'
  | 'curva_lactancia'
  | 'distocico';

const simple: Record<TermKey, string> = {
  palpacion: 'Revisión de embarazo',
  servicio: 'Monta',
  secado: 'Dejar de ordeñar',
  celo: 'Celo detectado',
  aforo: 'Medición de pasto',
  kardex: 'Historial de entradas/salidas',
  dias_abiertos: 'Días sin quedar en cinta',
  fdn: 'Fibra del alimento (%)',
  mcal: 'Energía por día',
  materia_seca: 'Cantidad total diaria (kg)',
  ccs: 'Calidad de leche',
  mastitis: 'Infección de ubre',
  metritis: 'Infección del útero',
  retiro: 'Días de espera antes de vender',
  persistencia: 'Constancia de producción',
  curva_lactancia: 'Curva de producción de leche',
  distocico: 'Parto difícil',
};

const technical: Record<TermKey, string> = {
  palpacion: 'Palpación / Diagnóstico',
  servicio: 'Servicio (Monta Natural)',
  secado: 'Secado',
  celo: 'Celo Detectado',
  aforo: 'Aforo de Pradera',
  kardex: 'Kardex de Inventario',
  dias_abiertos: 'Días Abiertos',
  fdn: 'FDN Objetivo (%)',
  mcal: 'Energía (Mcal/día)',
  materia_seca: 'Materia Seca (kg/día)',
  ccs: 'Conteo de Células Somáticas (CCS)',
  mastitis: 'Mastitis',
  metritis: 'Metritis',
  retiro: 'Período de Retiro',
  persistencia: 'Persistencia de Lactancia',
  curva_lactancia: 'Curva de Lactancia',
  distocico: 'Parto Distócico',
};

export const getTerms = (isVet: boolean): Record<TermKey, string> =>
  isVet ? technical : simple;
