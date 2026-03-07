import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SessionService } from '../../core/services/session.service';
import { SupabaseService, Client } from '../../core/services/supabase.service';

@Component({
  selector: 'app-master',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './master.component.html',
  styleUrls: ['./master.component.scss']
})
export class MasterComponent implements OnInit {
  readonly masterPassphrase = 'GOLD786';
  passphrase = '';
  isUnlocked = false;
  isLoading = false;
  isSaving = false;
  newClientName = '';
  clients: Client[] = [];

  constructor(
    private sessionService: SessionService,
    private supabaseService: SupabaseService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const session = this.sessionService.getSession();
    if (!session || session.role !== 'customer') {
      this.snackBar.open('Master is available only for customer accounts.', 'Close', { duration: 2500 });
    }
  }

  async unlock(): Promise<void> {
    if (this.passphrase !== this.masterPassphrase) {
      this.snackBar.open('Invalid master passphrase', 'Close', { duration: 2500 });
      return;
    }

    this.isUnlocked = true;
    this.passphrase = '';
    this.cdr.detectChanges();
    await this.loadClients();
  }

  async loadClients(): Promise<void> {
    const session = this.sessionService.getSession();
    if (!session || session.role !== 'customer') {
      return;
    }

    this.isLoading = true;
    try {
      this.clients = await this.supabaseService.getCustomerClients(session.id);
    } catch (error) {
      console.error('Failed to load clients:', error);
      this.snackBar.open('Failed to load clients', 'Close', { duration: 2500 });
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  async addClient(): Promise<void> {
    const session = this.sessionService.getSession();
    const name = this.newClientName.trim();
    if (!session || session.role !== 'customer') {
      return;
    }

    if (!name) {
      this.snackBar.open('Enter client name', 'Close', { duration: 2500 });
      return;
    }

    const duplicate = this.clients.some((client) => client.name.trim().toLowerCase() === name.toLowerCase());
    if (duplicate) {
      this.snackBar.open('Client already exists', 'Close', { duration: 2500 });
      return;
    }

    this.isSaving = true;
    try {
      await this.supabaseService.saveCustomerClient(session.id, {
        name,
        master_password: this.masterPassphrase,
        current_stock: 0
      });
      this.newClientName = '';
      await this.loadClients();
      this.snackBar.open('Client added', 'Close', { duration: 2000 });
    } catch (error) {
      console.error('Failed to add client:', error);
      this.snackBar.open('Failed to add client', 'Close', { duration: 2500 });
    } finally {
      this.isSaving = false;
      this.cdr.detectChanges();
    }
  }

  async deleteClient(clientId: string): Promise<void> {
    if (!clientId) {
      return;
    }

    this.isSaving = true;
    try {
      await this.supabaseService.deleteCustomerClient(clientId);
      await this.loadClients();
      this.snackBar.open('Client deleted', 'Close', { duration: 2000 });
    } catch (error) {
      console.error('Failed to delete client:', error);
      this.snackBar.open('Failed to delete client', 'Close', { duration: 2500 });
    } finally {
      this.isSaving = false;
      this.cdr.detectChanges();
    }
  }
}
