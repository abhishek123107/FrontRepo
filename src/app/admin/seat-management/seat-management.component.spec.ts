import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeatManagementComponent } from './seat-management.component';

describe('SeatManagementComponent', () => {
  let component: SeatManagementComponent;
  let fixture: ComponentFixture<SeatManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeatManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeatManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
