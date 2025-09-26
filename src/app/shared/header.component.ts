import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-header',
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit {
  username: string | null = 'Admin';
  role: string | null = null;
  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit() {
    this.auth.username$.subscribe((u) => (this.username = u || 'Admin'));
    this.auth.role$.subscribe((r) => (this.role = r));
  }

  logout() {
    if (!confirm('Are you sure you want to log out?')) return;
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
