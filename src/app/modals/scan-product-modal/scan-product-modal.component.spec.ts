import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScanProductModalComponent } from './scan-product-modal.component';

describe('ScanProductModalComponent', () => {
  let component: ScanProductModalComponent;
  let fixture: ComponentFixture<ScanProductModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScanProductModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScanProductModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
