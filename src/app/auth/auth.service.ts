import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

interface SavedUser {
  username: string;
  password: string;
  role?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _isLoggedIn = new BehaviorSubject<boolean>(!!localStorage.getItem('ims_token'));
  isLoggedIn$ = this._isLoggedIn.asObservable();
  private _username = new BehaviorSubject<string | null>(localStorage.getItem('ims_user') || null);
  username$ = this._username.asObservable();
  private _role = new BehaviorSubject<string | null>(localStorage.getItem('ims_role') || null);
  role$ = this._role.asObservable();
  private _redirectUrl: string | null = null;

  setRedirectUrl(url: string | null) {
    this._redirectUrl = url;
  }

  getRedirectUrl() {
    return this._redirectUrl;
  }

  private loadUsers(): SavedUser[] {
    try {
      const raw = localStorage.getItem('ims_users');
      if (!raw) return [];
      return JSON.parse(raw) as SavedUser[];
    } catch (e) {
      return [];
    }
  }

  private saveUsers(users: SavedUser[]) {
    try {
      localStorage.setItem('ims_users', JSON.stringify(users));
    } catch (e) {
      // ignore
    }
  }

  // add a user; returns false if username already exists
  addUser(username: string, password: string, role: string = 'others'): boolean {
    if (!username || !password) return false;
    const users = this.loadUsers();
    if (users.find(u => u.username === username)) return false;
    users.push({ username, password, role });
    this.saveUsers(users);
    return true;
  }

  // simple demo login; require a fixed admin password when role === 'admin', otherwise require a registered user match
  login(username: string, password: string, role: string = 'others') {
    if (!username || !password) return false;

    if (role === 'admin') {
      const ADMIN_PASSWORD = 'Admin@123';
      // for demo purposes only: require the admin password OR a registered admin account
      if (password === ADMIN_PASSWORD) {
        // allow admin login via demo password
      } else {
        // check registered users for an admin account with matching password
        const users = this.loadUsers();
        const found = users.find(u => u.username === username && u.role === 'admin' && u.password === password);
        if (!found) return false;
      }
    } else {
      // require that the user exists in the registered users list
      const users = this.loadUsers();
      const found = users.find(u => u.username === username && u.password === password);
      if (!found) return false;
    }

    localStorage.setItem('ims_token', 'true');
    localStorage.setItem('ims_user', username);
    localStorage.setItem('ims_role', role);
    this._isLoggedIn.next(true);
    this._username.next(username);
    this._role.next(role);
    return true;
  }

  logout() {
    localStorage.removeItem('ims_token');
    localStorage.removeItem('ims_user');
    localStorage.removeItem('ims_role');
    this._isLoggedIn.next(false);
    this._username.next(null);
    this._role.next(null);
  }

  isAuthenticated() {
    return !!localStorage.getItem('ims_token');
  }

  getUsername() {
    return this._username.value;
  }

  getRole() {
    return this._role.value;
  }

  isAdmin() {
    return this._role.value === 'admin';
  }

  // return whether a username exists in the stored user list
  userExists(username: string): boolean {
    if (!username) return false;
    const users = this.loadUsers();
    return users.some(u => u.username === username);
  }
}
