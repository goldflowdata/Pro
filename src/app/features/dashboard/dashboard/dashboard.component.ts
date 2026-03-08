import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SessionService } from '../../../core/services/session.service';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatToolbarModule,
    MatButtonModule,
    MatTabsModule,
    MatSnackBarModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentView: string = 'ledger';
  username: string = '';
  userRole: string = '';
  selectedTabIndex: number = 0;
  private destroy$ = new Subject<void>();

  constructor(
    private sessionService: SessionService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadUserInfo();
    this.trackNavigation();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadUserInfo(): void {
    const session = this.sessionService.getSession();
    if (session) {
      this.username = session.username;
      this.userRole = session.role;
      if (this.userRole === 'admin' && !this.router.url.includes('/dashboard/admin')) {
        this.router.navigate(['/dashboard/admin']);
      }
    }
  }

  private trackNavigation(): void {
    this.router.events
      .pipe(
        filter((event: any) => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: any) => {
        const url = event.urlAfterRedirects;
        if (this.isAdminView()) {
          this.currentView = 'admin';
          this.selectedTabIndex = 0;
        } else if (url.includes('ledger')) {
          this.currentView = 'ledger';
          this.selectedTabIndex = 0;
        } else if (url.includes('reports')) {
          this.currentView = 'reports';
          this.selectedTabIndex = 1;
        } else if (url.includes('master')) {
          this.currentView = 'master';
          this.selectedTabIndex = 2;
        } else if (url.includes('admin')) {
          this.currentView = 'admin';
          this.selectedTabIndex = 2;
        }
      });
  }

  selectTab(tabIndex: number): void {
    this.selectedTabIndex = tabIndex;
    const views = this.isAdminView() ? ['admin'] : ['ledger', 'reports', 'master'];
    if (tabIndex < views.length) {
      this.router.navigate([`/dashboard/${views[tabIndex]}`]);
    }
  }

  isAdminView(): boolean {
    return this.userRole === 'admin';
  }

  logout(): void {
    this.sessionService.logout();
    this.snackBar.open('Logged out successfully', 'Close', { duration: 2000, verticalPosition: 'bottom' });
  }
}

