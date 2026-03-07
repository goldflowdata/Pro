import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Voucher, VoucherItem } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class PdfExportService {
  /**
   * Generate voucher PDF receipt
   */
  generateVoucherPdf(
    voucherNumber: string,
    clientName: string,
    date: string,
    items: VoucherItem[],
    totals: any,
    customDetails?: { [key: string]: string }
  ): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 10;

    // Header
    doc.setFontSize(16);
    doc.setTextColor(30, 27, 75); // Primary color
    doc.text('GOLDFLOW PRO', pageWidth / 2, yPos, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Gold Ledger & Inventory Management', pageWidth / 2, yPos + 6, { align: 'center' });

    yPos += 15;
    doc.setDrawColor(245, 158, 11); // Accent color
    doc.line(10, yPos, pageWidth - 10, yPos);

    yPos += 5;

    // Receipt Info
    doc.setFontSize(9);
    doc.setTextColor(30, 27, 75);
    doc.text(`Voucher #: ${voucherNumber}`, 15, yPos);
    doc.text(`Date: ${new Date(date).toLocaleDateString()}`, pageWidth - 50, yPos);

    yPos += 7;
    doc.text(`Client: ${clientName}`, 15, yPos);

    yPos += 12;
    doc.setDrawColor(200);
    doc.line(10, yPos, pageWidth - 10, yPos);

    // Items Table
    yPos += 5;
    const tableData: any[] = [];
    items.forEach(item => {
      tableData.push([
        item.description,
        item.stamp,
        item.gross.toFixed(2),
        item.less.toFixed(2),
        item.tunch.toFixed(1),
        item.wastage.toFixed(1),
        item.pieces.toString(),
        item.finalWeight.toFixed(3)
      ]);
    });

    autoTable(doc, {
      startY: yPos,
      head: [['Description', 'Stamp', 'Gross', 'Less', 'Tunch %', 'Wastage %', 'Pcs', 'Fine Weight']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 27, 75],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [30, 27, 75]
      },
      columnStyles: {
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'center' },
        5: { halign: 'center' },
        6: { halign: 'center' },
        7: { halign: 'right' }
      },
      margin: { left: 15, right: 15 }
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Totals Section
    doc.setFontSize(9);
    doc.setTextColor(30, 27, 75);
    doc.setFont('', 'bold');

    const totalsX = pageWidth - 70;
    const labelX = pageWidth - 90;

    doc.text('TOTALS:', labelX, yPos);

    yPos += 7;
    doc.setFont('', 'normal');
    doc.text(`Fine Weight: ${totals.fineWeight.toFixed(3)} gm`, labelX, yPos);
    yPos += 5;
    doc.text(`Gross Weight: ${totals.grossWeight.toFixed(3)} gm`, labelX, yPos);
    yPos += 5;
    doc.text(`Net Weight: ${totals.netWeight.toFixed(3)} gm`, labelX, yPos);

    yPos += 8;
    doc.setDrawColor(245, 158, 11);
    doc.line(labelX - 5, yPos, pageWidth - 10, yPos);

    yPos += 5;
    doc.setFont('', 'bold');
    doc.text(`Opening Balance: ${totals.openingBalance.toFixed(3)} gm`, labelX, yPos);
    yPos += 5;
    doc.text(`Closing Balance: ${totals.closingBalance.toFixed(3)} gm`, labelX, yPos);

    // MP Deduction
    if (totals.mpGross > 0) {
      yPos += 8;
      doc.setFont('', 'normal');
      doc.text(`MP Deduction: ${totals.mpGross.toFixed(2)} gm @ ${totals.mpTunch.toFixed(1)}%`, labelX, yPos);
      yPos += 5;
      doc.text(`MP Fine: ${totals.mpFine.toFixed(3)} gm`, labelX, yPos);
    }

    // Footer
    yPos = pageHeight - 15;
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('This is an auto-generated receipt from GoldFlow Pro', pageWidth / 2, yPos, { align: 'center' });
    doc.text(`Generated on ${new Date().toLocaleString()}`, pageWidth / 2, yPos + 4, { align: 'center' });

    // Save PDF
    doc.save(`Voucher_${voucherNumber}_${date}.pdf`);
  }

  /**
   * Generate voucher receipt using persisted DB rows
   * (legacy index.html print behavior for report screen)
   */
  generateVoucherReceiptFromDb(v: any, items: any[], clientName: string, customerName = ''): void {
    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('GOLD RECEIPT STATEMENT', 105, 15, { align: 'center' });

    doc.setFontSize(11);
    doc.text(`Account: ${String(clientName || '').toUpperCase()}`, 15, 25);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${v?.date || ''}`, 195, 25, { align: 'right' });

    if (customerName) {
      doc.setFontSize(9);
      doc.text(`Customer: ${customerName}`, 15, 30);
    }

    const rows: any[] = (items || []).map((item: any, idx: number) => {
      const gross = Number(item.gross_weight ?? item.gross ?? 0);
      const less = Number(item.less_weight ?? item.less ?? 0);
      const net = gross - less;
      const tunch = Number(item.tunch ?? 0);
      const wastage = Number(item.wastage ?? 0);
      const pcs = Number(item.pcs ?? item.pieces ?? 0);
      const fine = Number(item.final_weight ?? item.finalWeight ?? 0);

      return [
        idx + 1,
        String(item.description ?? ''),
        String(item.stamp ?? ''),
        gross.toFixed(3),
        less.toFixed(3),
        net.toFixed(3),
        tunch.toFixed(2),
        wastage.toFixed(2),
        pcs,
        fine.toFixed(3)
      ];
    });

    const totals = {
      gross: rows.reduce((sum, row) => sum + Number(row[3] || 0), 0),
      net: rows.reduce((sum, row) => sum + Number(row[5] || 0), 0),
      fine: rows.reduce((sum, row) => sum + Number(row[9] || 0), 0)
    };

    const mpGross = Number(v?.mp_gross ?? 0);
    const mpTunch = Number(v?.mp_tunch ?? 100);
    const mpFine = Number(v?.mp_fine ?? (mpGross * (mpTunch / 100)));
    const opening = Number(v?.opening_balance ?? 0);
    const closing = Number(v?.closing_balance ?? 0);

    rows.push([
      { content: 'TOTAL', colSpan: 3, styles: { fontStyle: 'bold', halign: 'right' } },
      { content: totals.gross.toFixed(3), styles: { fontStyle: 'bold' } },
      '',
      { content: totals.net.toFixed(3), styles: { fontStyle: 'bold' } },
      '',
      '',
      '',
      { content: totals.fine.toFixed(3), styles: { fontStyle: 'bold' } }
    ]);

    rows.push([
      { content: 'MP DEDUCTION FINE', colSpan: 3, styles: { fontStyle: 'bold', halign: 'right' } },
      { content: mpGross.toFixed(3), styles: { fontStyle: 'bold' } },
      '',
      '',
      { content: `${mpTunch.toFixed(2)}%`, styles: { fontStyle: 'bold' } },
      '',
      '',
      { content: `(-) ${mpFine.toFixed(3)}`, styles: { fontStyle: 'bold', textColor: [200, 0, 0] } }
    ]);

    rows.push([
      { content: 'OPENING STOCK BALANCE', colSpan: 9, styles: { fontStyle: 'bold', halign: 'right' } },
      { content: opening.toFixed(3), styles: { fontStyle: 'bold' } }
    ]);

    rows.push([
      { content: 'NET CLOSING BALANCE', colSpan: 9, styles: { fontStyle: 'bold', halign: 'right', fillColor: [245, 245, 245] } },
      { content: closing.toFixed(3), styles: { fontStyle: 'bold', fillColor: [230, 230, 230] } }
    ]);

    autoTable(doc, {
      startY: customerName ? 36 : 32,
      head: [['#', 'Description', 'Stamp', 'Gross', 'Less', 'Net Wt', 'Tunch', 'Wstg', 'Pcs', 'Fine']],
      body: rows,
      theme: 'grid',
      styles: {
        textColor: 20,
        lineColor: 0,
        lineWidth: 0.1,
        fontSize: 8,
        cellPadding: 3
      },
      headStyles: {
        fillColor: 255,
        textColor: 0,
        fontStyle: 'bold',
        lineWidth: 0.2
      },
      alternateRowStyles: {
        fillColor: 255
      }
    });

    const safeClient = String(clientName || 'Client').replace(/\s+/g, '_');
    doc.save(`Voucher_${safeClient}_${v?.date || ''}.pdf`);
  }

  /**
   * Generate report PDF
   */
  generateReportPdf(
    title: string,
    startDate: string,
    endDate: string,
    reportData: any[],
    columns: string[]
  ): void {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 10;

    // Header
    doc.setFontSize(16);
    doc.setTextColor(30, 27, 75);
    doc.text(title, pageWidth / 2, yPos, { align: 'center' });

    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(
      `Period: ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`,
      pageWidth / 2,
      yPos + 6,
      { align: 'center' }
    );

    yPos += 12;
    doc.setDrawColor(245, 158, 11);
    doc.line(10, yPos, pageWidth - 10, yPos);

    // Report Table
    yPos += 5;
    const tableData = reportData.map(row => columns.map(col => row[col] || ''));

    autoTable(doc, {
      startY: yPos,
      head: [columns],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 27, 75],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [30, 27, 75]
      },
      margin: { left: 10, right: 10 }
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 5,
        { align: 'center' }
      );
    }

    doc.save(`Report_${startDate}_to_${endDate}.pdf`);
  }
}
