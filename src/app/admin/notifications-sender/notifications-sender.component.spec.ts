import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationsSenderComponent } from './notifications-sender.component';

describe('NotificationsSenderComponent', () => {
  let component: NotificationsSenderComponent;
  let fixture: ComponentFixture<NotificationsSenderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationsSenderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotificationsSenderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
