import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from './supabase.service';
import { environment } from '@environments/environment';

const SESSION_KEY = 'gf_session';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private session = new BehaviorSubject<User | null>(this.loadSession());
  private idleLogoutTimer: ReturnType<typeof setTimeout> | null = null;
  private idleHandlersAttached = false;
  private inactivityEvents = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'];

  public session$ = this.session.asObservable();

  constructor(private router: Router, private ngZone: NgZone) {
    this.initializeSession();
  }

  /**
   * Initialize session from storage
   */
  private initializeSession(): void {
    const session = this.loadSession();
    if (session) {
      this.session.next(session);
      this.startInactivityTracking();
    }
  }

  /**
   * Load session from sessionStorage
   */
  private loadSession(): User | null {
    try {
      const sessionData = sessionStorage.getItem(SESSION_KEY);
      if (sessionData) {
        return JSON.parse(sessionData);
      }
      // Fallback to localStorage for legacy sessions
      const legacyData = localStorage.getItem(SESSION_KEY);
      if (legacyData) {
        const user = JSON.parse(legacyData);
        // Promote to sessionStorage
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
        localStorage.removeItem(SESSION_KEY);
        return user;
      }
    } catch (error) {
      console.error('Error loading session:', error);
    }
    return null;
  }

  /**
   * Save session to sessionStorage
   */
  saveSession(user: User): void {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
      localStorage.removeItem(SESSION_KEY); // Clear old localStorage sessions
      this.session.next(user);
    } catch (error) {
      console.error('Error saving session:', error);
    }
  }

  /**
   * Get current session
   */
  getSession(): User | null {
    return this.session.value;
  }

  /**
   * Get session observable
   */
  getSession$(): Observable<User | null> {
    return this.session$;
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    return this.session.value !== null;
  }

  /**
   * Get user role
   */
  getUserRole(): 'admin' | 'customer' | null {
    return this.session.value?.role || null;
  }

  /**
   * Check if user is admin
   */
  isAdmin(): boolean {
    return this.session.value?.role === 'admin';
  }

  /**
   * Clear session
   */
  clearSession(): void {
    try {
      sessionStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(SESSION_KEY);
      this.session.next(null);
      this.stopInactivityTracking();
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }

  /**
   * Start inactivity tracking
   */
  startInactivityTracking(): void {
    if (this.idleHandlersAttached) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      this.inactivityEvents.forEach(event => {
        document.addEventListener(event, () => this.resetInactivityTimer(), { passive: true });
      });
    });

    this.idleHandlersAttached = true;
    this.resetInactivityTimer();
  }

  /**
   * Reset inactivity timer
   */
  private resetInactivityTimer(): void {
    if (this.idleLogoutTimer) {
      clearTimeout(this.idleLogoutTimer);
    }

    this.idleLogoutTimer = setTimeout(() => {
      this.ngZone.run(() => {
        console.warn('Session expired due to inactivity');
        this.logout();
      });
    }, environment.sessionTimeout);
  }

  /**
   * Stop inactivity tracking
   */
  private stopInactivityTracking(): void {
    if (this.idleLogoutTimer) {
      clearTimeout(this.idleLogoutTimer);
    }
    this.idleHandlersAttached = false;
  }

  /**
   * Logout user
   */
  logout(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }
}
