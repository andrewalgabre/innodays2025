import { Component } from '@angular/core';
import {LucideAngularModule} from 'lucide-angular';
import {RouterLink, RouterLinkActive} from '@angular/router';

@Component({
  selector: 'app-history',
  imports: [
    LucideAngularModule,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './history.component.html',
  styleUrl: './history.component.css',
})
export class HistoryComponent {

}
