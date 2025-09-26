import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, Router, UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate, CanActivateChild {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    return this.checkRole(route);
  }

  canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    return this.checkRole(childRoute);
  }

  private checkRole(route: ActivatedRouteSnapshot): boolean | UrlTree {
    const roles: string[] | undefined = route.data && (route.data['roles'] as string[] | undefined);
    // if no roles specified, allow access
    if (!roles || roles.length === 0) return true;
    const current = this.auth.getRole();
    if (current && roles.includes(current)) return true;
    // not authorized for this role — redirect to dashboard
    return this.router.parseUrl('/');
  }
}
