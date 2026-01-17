import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendancePanelComponent } from './attendance-panel.component';

describe('AttendancePanelComponent', () => {
  let component: AttendancePanelComponent;
  let fixture: ComponentFixture<AttendancePanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttendancePanelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AttendancePanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
