import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SupabaseService, Client, VoucherItem } from '../../core/services/supabase.service';
import { SessionService } from '../../core/services/session.service';
import { PdfExportService } from '../../core/services/pdf-export.service';
import { Subscription } from 'rxjs';

interface CalculatedTotals {
  fineWeight: number;
  grossWeight: number;
  netWeight: number;
  openingBalance: number;
  mpGross: number;
  mpTunch: number;
  mpFine: number;
  closingBalance: number;
}

@Component({
  selector: 'app-ledger',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
    MatTooltipModule
  ],
  templateUrl: './ledger.component.html',
  styleUrls: ['./ledger.component.scss']
})
export class LedgerComponent implements OnInit, OnDestroy {
  private readonly demoClientId = 'demo-client';
  private readonly demoClient: Client = {
    id: this.demoClientId,
    name: 'DEMO ACCOUNT',
    current_stock: 0
  };
  clients: Client[] = [];
  selectedClient: Client | null = null;
  selectedClientId: string | null = null;
  voucherForm!: FormGroup;
  items: VoucherItem[] = [];
  currentItemFineWeight = 0;
  totals: CalculatedTotals = {
    fineWeight: 0,
    grossWeight: 0,
    netWeight: 0,
    openingBalance: 0,
    mpGross: 0,
    mpTunch: 0,
    mpFine: 0,
    closingBalance: 0
  };
  isLoading = false;
  isSaving = false;
  displayedColumns = ['description', 'stamp', 'gross', 'less', 'tunch', 'wastage', 'pieces', 'finalWeight', 'actions'];
  private formChangesSub?: Subscription;

  get availableClients(): Client[] {
    return [this.demoClient, ...this.clients];
  }

  constructor(
    private fb: FormBuilder,
    private supabaseService: SupabaseService,
    private sessionService: SessionService,
    private pdfService: PdfExportService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.setupLiveCalculations();
    this.loadClients();
  }

  ngOnDestroy(): void {
    this.formChangesSub?.unsubscribe();
  }

  private initializeForm(): void {
    this.voucherForm = this.fb.group({
      date: [new Date().toISOString().split('T')[0]],
      description: [''],
      stamp: [''],
      gross: [''],
      less: [''],
      tunch: [92],
      wastage: [0],
      pieces: [1],
      mpGross: [''],
      mpTunch: [100],
      mpFine: ['']
    });
  }

  private setupLiveCalculations(): void {
    this.formChangesSub = this.voucherForm.valueChanges.subscribe(() => {
      this.calculateCurrentItemFineWeight();
      this.calculateMakeupPayment();
      this.cdr.detectChanges();
    });
    this.calculateCurrentItemFineWeight();
    this.calculateMakeupPayment();
  }

  private async loadClients(): Promise<void> {
    this.isLoading = true;
    try {
      const session = this.sessionService.getSession();
      // Render page immediately; load clients in background.
      this.isLoading = false;
      this.cdr.detectChanges();

      if (!session || session.role !== 'customer') {
        return;
      }

      const clientsPromise = this.supabaseService.getCustomerClients(session.id);
      const timeoutPromise = new Promise<Client[]>((resolve) =>
        setTimeout(() => resolve([]), 12000)
      );

      const loadedClients = await Promise.race([clientsPromise, timeoutPromise]);

      this.ngZone.run(() => {
        this.clients = [...(loadedClients || [])];
        // Keep selection empty until user explicitly chooses a client.
        this.selectedClient = null;
        this.selectedClientId = null;
        this.totals.openingBalance = 0;
        this.calculateClosingBalance();
        this.cdr.detectChanges();
      });
    } catch (error) {
      console.error('Error loading clients:', error);
      this.snackBar.open('Failed to load clients', 'Close', { duration: 3000 });
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  selectClientOption(client: Client): void {
    this.selectedClient = client;
    this.selectedClientId = client.id;
    this.totals.openingBalance = client.current_stock;
    this.calculateClosingBalance();
  }

  onClientSelection(clientId: string): void {
    if (!clientId) {
      this.selectedClient = null;
      this.selectedClientId = null;
      this.totals.openingBalance = 0;
      this.calculateClosingBalance();
      return;
    }

    const client = this.availableClients.find(c => c.id === clientId);
    if (client) {
      this.selectClientOption(client);
    }
  }

  addItem(): void {
    const formValue = this.voucherForm.getRawValue();
    const gross = parseFloat(formValue.gross) || 0;
    const less = parseFloat(formValue.less) || 0;
    const tunch = parseFloat(formValue.tunch) || 0;
    const wastage = parseFloat(formValue.wastage) || 0;
    const finalWeight = this.calculateFineWeight(gross, less, tunch, wastage);

    const item: VoucherItem = {
      description: formValue.description,
      stamp: formValue.stamp,
      gross,
      less,
      tunch,
      wastage,
      pieces: parseInt(formValue.pieces) || 0,
      finalWeight
    };

    this.items.push(item);
    this.calculateTotals();
    this.voucherForm.patchValue({
      description: '',
      stamp: '',
      gross: '',
      less: '',
      tunch: 92,
      wastage: 0,
      pieces: 1
    });
    this.calculateCurrentItemFineWeight();

    this.snackBar.open('Item added successfully', 'Close', { duration: 2000 });
  }

  removeItem(index: number): void {
    this.items.splice(index, 1);
    this.calculateTotals();
    this.snackBar.open('Item removed', 'Close', { duration: 2000 });
  }

  private calculateTotals(): void {
    let fineWeight = 0;
    let grossWeight = 0;
    let netWeight = 0;

    this.items.forEach(item => {
      fineWeight += item.finalWeight;
      grossWeight += item.gross;
      netWeight += (item.gross - item.less);
    });

    this.totals.fineWeight = fineWeight;
    this.totals.grossWeight = grossWeight;
    this.totals.netWeight = netWeight;
    this.calculateMakeupPayment();
    this.calculateClosingBalance();
  }

  private calculateMakeupPayment(): void {
    const mpGross = parseFloat(this.voucherForm.get('mpGross')?.value) || 0;
    const mpTunch = parseFloat(this.voucherForm.get('mpTunch')?.value) || 100;

    this.totals.mpGross = mpGross;
    this.totals.mpTunch = mpTunch;
    this.totals.mpFine = mpGross * (mpTunch / 100);

    this.calculateClosingBalance();
  }

  private calculateCurrentItemFineWeight(): void {
    const gross = parseFloat(this.voucherForm.get('gross')?.value) || 0;
    const less = parseFloat(this.voucherForm.get('less')?.value) || 0;
    const tunch = parseFloat(this.voucherForm.get('tunch')?.value) || 0;
    const wastage = parseFloat(this.voucherForm.get('wastage')?.value) || 0;
    this.currentItemFineWeight = this.calculateFineWeight(gross, less, tunch, wastage);
  }

  private calculateFineWeight(gross: number, less: number, tunch: number, wastage: number): number {
    // Legacy index.html formula: (gross - less) * ((tunch + wastage) / 100)
    return (gross - less) * ((tunch + wastage) / 100);
  }

  private calculateClosingBalance(): void {
    this.totals.closingBalance =
      this.totals.openingBalance +
      this.totals.fineWeight -
      this.totals.mpFine;
  }

  updateMPValues(): void {
    this.calculateMakeupPayment();
  }

  async saveVoucher(): Promise<void> {
    if (!this.selectedClient) {
      this.snackBar.open('Please select a client', 'Close', { duration: 3000 });
      return;
    }

    if (this.selectedClient.id === this.demoClientId) {
      this.snackBar.open('Demo account is for display only. Please create a real client in Master.', 'Close', { duration: 3500 });
      return;
    }

    if (this.items.length === 0) {
      this.snackBar.open('Please add at least one item', 'Close', { duration: 3000 });
      return;
    }

    this.isSaving = true;
    try {
      const session = this.sessionService.getSession();
      if (!session) {
        throw new Error('Session not found');
      }

      const voucher = {
        customerId: session.id,
        date: this.voucherForm.get('date')?.value || new Date().toISOString().split('T')[0],
        items: this.items,
        openingBalance: this.totals.openingBalance,
        closingBalance: this.totals.closingBalance,
        mpGross: this.totals.mpGross,
        mpTunch: this.totals.mpTunch,
        mpFine: this.totals.mpFine,
        fineWeight: this.totals.fineWeight,
        grossWeight: this.totals.grossWeight,
        netWeight: this.totals.netWeight
      };

      const savedVoucher = await this.supabaseService.saveVoucher(
        session.id,
        this.selectedClient.id,
        voucher
      );

      this.snackBar.open('Voucher saved successfully!', 'Close', { duration: 2000 });

      // Generate and download legacy-format PDF (same as report reprint)
      this.pdfService.generateVoucherReceiptFromDb(
        savedVoucher,
        this.items,
        this.selectedClient.name,
        session.username
      );

      // Reset form
      this.resetForm();
      this.loadClients();
    } catch (error) {
      console.error('Error saving voucher:', error);
      this.snackBar.open('Failed to save voucher', 'Close', { duration: 3000 });
    } finally {
      this.isSaving = false;
      this.cdr.detectChanges();
    }
  }

  private resetForm(): void {
    this.items = [];
    this.voucherForm.reset({
      date: new Date().toISOString().split('T')[0],
      description: '',
      stamp: '',
      gross: '',
      less: '',
      tunch: 92,
      wastage: 0,
      pieces: 1,
      mpGross: '',
      mpTunch: 100,
      mpFine: ''
    });
    this.selectedClient = null;
    this.selectedClientId = null;
    this.currentItemFineWeight = 0;
    this.totals = {
      fineWeight: 0,
      grossWeight: 0,
      netWeight: 0,
      openingBalance: 0,
      mpGross: 0,
      mpTunch: 0,
      mpFine: 0,
      closingBalance: 0
    };
  }
}
