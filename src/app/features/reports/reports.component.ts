import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SupabaseService } from '../../core/services/supabase.service';
import { SessionService } from '../../core/services/session.service';
import { PdfExportService } from '../../core/services/pdf-export.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit {
  startDate = '';
  endDate = '';
  reportCustomers: any[] = [];
  isLoading = false;
  isPrinting = false;
  private activeLoadRequest = 0;

  constructor(
    private supabaseService: SupabaseService,
    private sessionService: SessionService,
    private pdfService: PdfExportService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeDateRange();
  }

  private initializeDateRange(): void {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

    this.startDate = this.formatDate(firstDay);
    this.endDate = this.formatDate(today);

    this.loadReports();
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async loadReports(): Promise<void> {
    const requestId = ++this.activeLoadRequest;
    if (!this.startDate || !this.endDate) {
      this.snackBar.open('Please select both start and end dates', 'Close', { duration: 3000, verticalPosition: 'bottom' });
      return;
    }

    this.isLoading = true;
    try {
      const session = this.sessionService.getSession();
      if (!session) {
        throw new Error('Session not found');
      }

      this.reportCustomers = await this.supabaseService.getReportRange(
        session.id,
        this.startDate,
        this.endDate,
        session.role
      );

      if (this.reportCustomers.length === 0) {
        this.snackBar.open('No records found for the selected date range', 'Close', { duration: 3000, verticalPosition: 'bottom' });
      }
    } catch (error) {
      console.error('Error loading reports:', error);
      this.snackBar.open('Failed to load reports', 'Close', { duration: 3000, verticalPosition: 'bottom' });
    } finally {
      if (requestId === this.activeLoadRequest) {
        this.isLoading = false;
      }
      this.cdr.detectChanges();
    }
  }

  async printReceipt(voucherId: string): Promise<void> {
    if (!voucherId) {
      this.snackBar.open('Voucher id missing', 'Close', { duration: 3000, verticalPosition: 'bottom' });
      return;
    }

    this.isPrinting = true;
    try {
      const payload = await this.supabaseService.getVoucherPrintData(voucherId);
      if (!payload) {
        throw new Error('Unable to load voucher data');
      }

      this.pdfService.generateVoucherReceiptFromDb(
        payload.voucher,
        payload.items,
        payload.clientName,
        payload.customerName
      );
      this.snackBar.open('Receipt printed successfully', 'Close', { duration: 2000, verticalPosition: 'bottom' });
    } catch (error) {
      console.error('Error printing receipt:', error);
      this.snackBar.open('Failed to print receipt', 'Close', { duration: 3000, verticalPosition: 'bottom' });
    } finally {
      this.isPrinting = false;
      this.cdr.detectChanges();
    }
  }
}

