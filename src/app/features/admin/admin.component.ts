import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SupabaseService } from '../../core/services/supabase.service';
import { SessionService } from '../../core/services/session.service';

interface AdminUser {
  id: string;
  username: string;
  password: string;
  expiry?: string;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  customerForm!: FormGroup;
  customers: AdminUser[] = [];
  isLoading = false;
  isCreating = false;

  constructor(
    private fb: FormBuilder,
    private supabaseService: SupabaseService,
    private sessionService: SessionService,
    private snackBar: MatSnackBar,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.checkIsAdmin();
    this.loadCustomers();
  }

  private checkIsAdmin(): void {
    if (!this.sessionService.isAdmin()) {
      this.router.navigate(['/login']);
    }
  }

  private initializeForm(): void {
    this.customerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      expiry: ['', Validators.required]
    });
  }

  private async loadCustomers(): Promise<void> {
    this.isLoading = true;
    this.cdr.detectChanges();
    try {
      this.customers = await this.supabaseService.getCustomers();
    } catch (error) {
      console.error('Error loading customers:', error);
      this.snackBar.open('Failed to load customers', 'Close', { duration: 3000 });
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  async createCustomer(): Promise<void> {
    if (!this.customerForm.valid) {
      this.snackBar.open('Please fill all fields correctly', 'Close', { duration: 3000 });
      return;
    }

    this.isCreating = true;
    try {
      const formValue = this.customerForm.getRawValue();
      const newCustomer = await this.supabaseService.createCustomer(
        formValue.username,
        formValue.password,
        formValue.expiry
      );

      this.customerForm.reset();
      await this.loadCustomers();
      this.snackBar.open('Customer created successfully', 'Close', { duration: 2000 });
    } catch (error) {
      console.error('Error creating customer:', error);
      this.snackBar.open('Failed to create customer', 'Close', { duration: 3000 });
    } finally {
      this.isCreating = false;
    }
  }

  async updateExpiry(customer: AdminUser, newExpiry: string): Promise<void> {
    try {
      await this.supabaseService.updateCustomerExpiry(customer.id, newExpiry);
      customer.expiry = newExpiry;
      this.snackBar.open('Expiry date updated', 'Close', { duration: 2000 });
    } catch (error) {
      console.error('Error updating expiry:', error);
      this.snackBar.open('Failed to update expiry date', 'Close', { duration: 3000 });
    }
  }

  async deleteCustomer(customer: AdminUser): Promise<void> {
    const confirmDelete = confirm(`Are you sure you want to delete ${customer.username}?`);
    if (!confirmDelete) return;

    try {
      await this.supabaseService.deleteCustomer(customer.id);
      await this.loadCustomers();
      this.snackBar.open('Customer deleted successfully', 'Close', { duration: 2000 });
    } catch (error) {
      console.error('Error deleting customer:', error);
      this.snackBar.open('Failed to delete customer', 'Close', { duration: 3000 });
    }
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  }

  getExpiryStatus(expiryDate?: string): string {
    if (!expiryDate) return 'active';
    const today = new Date();
    const expiry = new Date(expiryDate);
    if (expiry < today) return 'expired';
    const daysLeft = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 7) return 'expiring-soon';
    return 'active';
  }

  openDatePicker(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (typeof input.showPicker === 'function') {
      input.showPicker();
    }
  }

  openDatePickerForInput(input: HTMLInputElement): void {
    if (typeof input.showPicker === 'function') {
      input.showPicker();
      return;
    }
    input.focus();
  }
}
