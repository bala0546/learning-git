import { Injectable } from '@angular/core';
import { CanActivateChild, CanActivate, Router, UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivateChild, CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivateChild(): boolean | UrlTree {
    return this.checkAuth();
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    return this.checkAuth(state.url);
  }

  private checkAuth(redirectUrl?: string): boolean | UrlTree {
    if (this.auth.isAuthenticated()) return true;
    // save redirect
    this.auth.setRedirectUrl(redirectUrl || null);
    return this.router.parseUrl('/login');
  }
}
