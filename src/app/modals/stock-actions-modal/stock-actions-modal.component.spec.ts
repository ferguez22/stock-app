import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StockActionsModalComponent } from './stock-actions-modal.component';

describe('StockActionsModalComponent', () => {
  let component: StockActionsModalComponent;
  let fixture: ComponentFixture<StockActionsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StockActionsModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StockActionsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
