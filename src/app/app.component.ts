import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { HeaderComponent } from './shared/header.component';
import { AuthService } from './auth/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'ims';
  // Development helper: force showing the login page on app start until production auth is confirmed
  // Set to false to allow normal auth flow so header appears after login
  private readonly FORCE_LOGIN = false;

  constructor(private auth: AuthService, private router: Router) {
    // navigate to login only when not authenticated (normal behavior)
    if (!this.auth.isAuthenticated()) {
      this.router.navigateByUrl('/login');
    }
  }

  showHeader = false;
  private currentUrl = '';
  private loggedIn = false;

  ngOnInit() {
    // initial values
    this.currentUrl = this.router.url;
    this.loggedIn = this.auth.isAuthenticated();
    console.debug('[AppComponent] init', { url: this.currentUrl, loggedIn: this.loggedIn });
    this.computeShowHeader();

    // react to auth changes
    this.auth.isLoggedIn$.subscribe(v => {
      this.loggedIn = v;
      console.debug('[AppComponent] auth change', v);
      if (v) {
        // show header immediately after login
        this.showHeader = true;
        console.debug('[AppComponent] showHeader set true due to auth change');
      } else {
        this.computeShowHeader();
      }
    });

    // react to navigation end events
    this.router.events.subscribe((e) => {
      if (e instanceof NavigationEnd) {
        this.currentUrl = e.urlAfterRedirects || e.url;
        console.debug('[AppComponent] navigation end', this.currentUrl);
        this.computeShowHeader();
      }
    });

    // also handle explicit event fired after login navigation completes
    window.addEventListener('auth:login', () => {
      console.debug('[AppComponent] auth:login event received');
      this.loggedIn = true;
      this.currentUrl = this.router.url;
      // ensure header is visible after login/navigation
      this.showHeader = true;
      console.debug('[AppComponent] showHeader set true on auth:login');
      // and recompute if needed later
      setTimeout(() => this.computeShowHeader(), 300);
    });
  }

  private computeShowHeader() {
    const onAuthRoute = this.currentUrl ? (this.currentUrl.startsWith('/login') || this.currentUrl.startsWith('/register')) : false;
    const prev = this.showHeader;
    if (this.loggedIn) {
      this.showHeader = true;
    } else {
      this.showHeader = !onAuthRoute;
    }
    console.debug('[AppComponent] computeShowHeader', { currentUrl: this.currentUrl, loggedIn: this.loggedIn, prev, next: this.showHeader, onAuthRoute });
  }
}
