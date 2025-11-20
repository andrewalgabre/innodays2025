import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CowProfileComponent } from './cow-profile.component';

describe('CowProfileComponent', () => {
  let component: CowProfileComponent;
  let fixture: ComponentFixture<CowProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CowProfileComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CowProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
