import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SupabaseService } from '../../../core/services/supabase.service';
import { SessionService } from '../../../core/services/session.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  username = '';
  password = '';
  hidePassword = true;
  isLoading = false;
  constructor(
    private supabaseService: SupabaseService,
    private sessionService: SessionService,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.supabaseService.seedDefaultAdmin();
    // Redirect if already logged in
    if (this.sessionService.isLoggedIn()) {
      this.redirectToDashboard();
    }
  }

  async login(): Promise<void> {
    if (!this.username || !this.password) {
      this.snackBar.open('Please enter username and password', 'Close', { duration: 3000 });
      return;
    }

    this.isLoading = true;
    try {
      const user = await this.supabaseService.login(this.username, this.password);
      if (user) {
        this.sessionService.saveSession(user);
        this.snackBar.open(`Welcome, ${user.username}!`, 'Close', { duration: 2000 });
        this.redirectToDashboard();
      } else {
        this.snackBar.open('Invalid username or password', 'Close', { duration: 3000 });
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const message = error?.message || 'Login failed. Please try again.';
      this.snackBar.open(message, 'Close', { duration: 3000 });
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  private redirectToDashboard(): void {
    const userRole = this.sessionService.getUserRole();
    if (userRole === 'admin') {
      this.router.navigate(['/dashboard/admin']);
    } else {
      this.router.navigate(['/dashboard/ledger']);
    }
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.login();
    }
  }
}
