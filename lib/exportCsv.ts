import { getStageLabel } from '@/components/BackofficeView';

export function exportSalesToCsv(sales: any[], filename = 'reporte_ventas_tiempo_real.csv') {
  if (!sales || sales.length === 0) return;

  const esc = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;

  const headers = [
    // 28 Campos del Consultor
    'Fecha de Venta',
    'Mes de Venta',
    'Cédula Consultor',
    'Consultor',
    'Campaña',
    'Plan Seleccionado',
    'Tipo de Documento',
    'Número de Documento',
    'Nombre Cliente',
    'Cédula Representante Legal',
    'Dirección',
    'Barrio',
    'Departamento',
    'Ciudad',
    'Contacto',
    'Número de Contacto 1',
    'Número de Contacto 2',
    'Correo Electrónico',
    'OT/MIN',
    'Servicios Adquiridos',
    'Recurrente',
    'CFM con IVA ($)',
    'NIP',
    'Número de Contrato',
    'Tipo de Contrato',
    'Método de Validación',
    'Fecha Validación Identidad',
    'Línea OTP Realizada',
    'Número OTP Confirmado',
    'Tipo de Venta',
    'Operador de Origen',
    'Canal de Venta',
    'Nombre de la Base',
    'ID',
    'Observación Consultor',
    // Campos de Gestión Back Office
    'Estado Back Office',
    'Back Office (Gestor del Proceso)',
    'Radicado',
    'Observación Back Office',
    'Fecha de Preactivación',
    'Fecha de Envío de la SIM',
    'Fecha de Activación',
    'Mes de Activación',
    'Estado de Bloqueo en Tiempo Real',
  ];

  const rows = sales.map((s) => {
    const dt = new Date(s.createdAt);
    return [
      esc(dt.toLocaleDateString('es-CO')),
      esc(dt.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })),
      esc(s.advisor?.cedula || ''),
      esc(s.advisor?.name || ''),
      esc(s.campaign?.name || ''),
      esc((s as any).planNameSnapshot || s.plan?.name || s.acquiredServices || ''),
      esc(s.documentType || 'Cédula'),
      esc(s.clientCedula),
      esc(s.clientName),
      esc(s.legalRepCedula),
      esc(s.address),
      esc(s.neighborhood),
      esc(s.department),
      esc(s.city),
      esc(s.contactName),
      esc(s.clientPhone),
      esc(s.contactPhone2),
      esc(s.clientEmail),
      esc(s.otMin),
      esc(s.acquiredServices),
      esc(s.recurrent),
      s.saleValue ?? 0,
      esc(s.nip),
      esc(s.contractNumber),
      esc(s.contractType),
      esc(s.validationMethod),
      esc(s.identityValidationDate),
      esc(s.otpLine),
      esc(s.otpCode),
      esc(s.saleType),
      esc(s.originOperator || ''),
      esc(s.salesChannel || ''),
      esc(s.databaseName),
      esc(s.externalId),
      esc(s.observation),
      // Back Office
      esc(getStageLabel(s.stage)),
      esc(s.backofficeName || s.validator?.name || ''),
      esc(s.radicado),
      esc(s.backofficeObservation || s.returnReason),
      esc(s.preactivationDate),
      esc(s.simSentDate),
      esc(s.activationDate),
      esc(s.activationMonth),
      esc(s.lockedByName ? `En gestión por ${s.lockedByName}` : 'Libre'),
    ];
  });

  const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
