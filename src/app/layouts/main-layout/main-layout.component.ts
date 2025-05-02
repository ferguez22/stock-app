import { Component, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [NavbarComponent, RouterOutlet],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css']
})
export class MainLayoutComponent {
  @ViewChild(NavbarComponent) navbar!: NavbarComponent;

  get isNavbarCollapsed(): boolean {
    return this.navbar?.isCollapsed || false;
  }
}
// This component serves as the main layout for the application, containing the navbar and the router outlet.
// It uses Angular's standalone component feature to import the NavbarComponent and RouterOutlet directly.
// The template and styles are defined in separate HTML and CSS files.
// The template URL points to the HTML file that defines the layout structure, while the style URLs point to the CSS file for styling.
// The component is part of the main layout of the application, which is responsible for rendering the common UI elements across different pages.
// The component is registered as a standalone component, allowing it to be used without being declared in an NgModule.
// The RouterOutlet is used to load the appropriate component based on the current route.
// The NavbarComponent is imported and used to display the navigation bar at the top of the layout.
// The component is defined with the selector 'app-main-layout', which can be used in other components or templates.
// The template URL points to the HTML file that defines the layout structure, while the style URLs point to the CSS file for styling.