import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate, formatDateShort } from './utils';

interface ExportPdfParams {
  filterInfo: {
    campaignName?: string;
    advisorName?: string;
    planName?: string;
    dateRange?: string;
  };
  summary: {
    totalSalesCount: number;
    approvedSalesCount: number;
    pendingSalesCount: number;
    returnedSalesCount: number;
    rejectedSalesCount: number;
    totalSoldAmountApproved: number;
    totalSoldAmountOverall: number;
    uniqueClientsCount: number;
    approvalRate: number;
  };
  byAdvisor: Array<{
    id: string;
    name: string;
    count: number;
    approvedCount: number;
    totalValue: number;
  }>;
  sales: Array<{
    id: string;
    createdAt: string;
    clientCedula: string;
    clientName: string;
    saleValue: number;
    stage: string;
    campaign: { name: string };
    plan: { name: string };
    advisor: { name: string };
  }>;
}

export function generateSalesReportPdf({
  filterInfo,
  summary,
  byAdvisor,
  sales,
}: ExportPdfParams) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 15;

  // Header band
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('CRM DE VENTAS - REPORTE EJECUTIVO COMERCIAL', 14, 12);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(
    `Fecha de Emisión: ${formatDate(new Date())}  |  Sistema de Control por Campaña`,
    14,
    20
  );

  currentY = 36;

  // Filter badges/info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text('Parámetros de Filtro Aplicados:', 14, currentY);

  currentY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);

  const filtersText = [
    `Campaña: ${filterInfo.campaignName || 'Todas'}`,
    `Asesor: ${filterInfo.advisorName || 'Todos'}`,
    `Plan: ${filterInfo.planName || 'Todos'}`,
    `Período: ${filterInfo.dateRange || 'Histórico Completo'}`,
  ].join('   |   ');

  doc.text(filtersText, 14, currentY);
  currentY += 8;

  // Summary Metrics Box (KPIs)
  doc.setFillColor(241, 245, 249); // slate-100
  doc.roundedRect(14, currentY, pageWidth - 28, 26, 3, 3, 'F');

  const colWidth = (pageWidth - 28) / 4;

  // KPI 1: Total Vendido Aprobado
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL APROBADO', 18, currentY + 7);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(16, 185, 129); // green
  doc.text(formatCurrency(summary.totalSoldAmountApproved), 18, currentY + 16);
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`Total Radicado: ${formatCurrency(summary.totalSoldAmountOverall)}`, 18, currentY + 22);

  // KPI 2: Cantidad de Ventas
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL VENTAS', 18 + colWidth, currentY + 7);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(summary.totalSalesCount.toString(), 18 + colWidth, currentY + 16);
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`${summary.approvedSalesCount} aprobadas | ${summary.pendingSalesCount} pendientes`, 18 + colWidth, currentY + 22);

  // KPI 3: Clientes Únicos
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('CLIENTES ÚNICOS', 18 + colWidth * 2, currentY + 7);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(summary.uniqueClientsCount.toString(), 18 + colWidth * 2, currentY + 16);
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Identificados por cédula', 18 + colWidth * 2, currentY + 22);

  // KPI 4: Tasa de Aprobación
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('TASA APROBACIÓN', 18 + colWidth * 3, currentY + 7);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(2, 132, 199); // sky-600
  doc.text(`${summary.approvalRate}%`, 18 + colWidth * 3, currentY + 16);
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`${summary.returnedSalesCount} devueltas | ${summary.rejectedSalesCount} rechazadas`, 18 + colWidth * 3, currentY + 22);

  currentY += 34;

  // Section 1: Breakdown by Advisor
  if (byAdvisor.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text('Rendimiento por Asesor de Ventas', 14, currentY);
    currentY += 4;

    const advisorRows = byAdvisor.map((adv) => [
      adv.name,
      adv.count.toString(),
      adv.approvedCount.toString(),
      formatCurrency(adv.totalValue),
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Asesor de Ventas', 'Ventas Totales', 'Ventas Aprobadas', 'Valor Total Radicado']],
      body: advisorRows,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: 255,
        fontSize: 8,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 35, halign: 'center' },
        2: { cellWidth: 35, halign: 'center' },
        3: { cellWidth: 42, halign: 'right' },
      },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // Section 2: Detailed Sales List
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('Detalle Consolidado de Ventas y Clientes', 14, currentY);
  currentY += 4;

  const stageLabels: Record<string, string> = {
    APROBADO: 'Aprobado',
    PENDIENTE_BACKOFFICE: 'Pendiente BO',
    DEVUELTO: 'Devuelto',
    RECHAZADO: 'Rechazado',
  };

  const salesRows = sales.map((s) => [
    formatDateShort(s.createdAt),
    s.clientCedula,
    s.clientName,
    s.campaign.name,
    s.plan.name,
    formatCurrency(s.saleValue),
    s.advisor.name,
    stageLabels[s.stage] || s.stage,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Fecha', 'Cédula', 'Cliente', 'Campaña', 'Plan', 'Valor', 'Asesor', 'Estado']],
    body: salesRows,
    theme: 'striped',
    headStyles: {
      fillColor: [2, 132, 199], // sky-600
      textColor: 255,
      fontSize: 7.5,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 7,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 16 },
      1: { cellWidth: 22 },
      2: { cellWidth: 38 },
      3: { cellWidth: 26 },
      4: { cellWidth: 32 },
      5: { cellWidth: 20, halign: 'right' },
      6: { cellWidth: 28 },
      7: { cellWidth: 0 },
    },
    margin: { left: 14, right: 14 },
  });

  // Footer on each page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `CRM de Ventas - Generado automáticamente el ${formatDate(new Date())}`,
      14,
      doc.internal.pageSize.getHeight() - 8
    );
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth - 28,
      doc.internal.pageSize.getHeight() - 8
    );
  }

  // Trigger browser download
  const filename = `Reporte_Ventas_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
