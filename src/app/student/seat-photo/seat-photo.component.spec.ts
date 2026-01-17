import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeatPhotoComponent } from './seat-photo.component';

describe('SeatPhotoComponent', () => {
  let component: SeatPhotoComponent;
  let fixture: ComponentFixture<SeatPhotoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeatPhotoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeatPhotoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
