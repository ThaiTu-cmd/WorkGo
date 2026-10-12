import React from 'react';
import { Check } from 'lucide-react';
import styles from './FormStepper.module.css';

export default function FormStepper({ currentStep, onSelectStep }) {
  const steps = [
    {
      id: 1,
      title: '1. Thông tin cơ bản',
      subtitle: 'Tiêu đề, ngành nghề, hình thức',
    },
    {
      id: 2,
      title: '2. Bảng giá & 3 Gói',
      subtitle: 'Cơ bản, Tiêu chuẩn, Cao cấp',
    },
    {
      id: 3,
      title: '3. Hình ảnh & Media',
      subtitle: 'Ảnh bìa, thư viện ảnh & video',
    },
  ];

  const progressPercent = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <nav className={styles.stepperSection} aria-label="Tiến trình biểu mẫu">
      <div className={styles.stepperContainer}>
        <div className={styles.stepperLine}>
          <div
            className={styles.stepperLineFill}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {steps.map((step) => {
          const isCompleted = step.id < currentStep;
          const isActive = step.id === currentStep;

          return (
            <div
              key={step.id}
              className={`${styles.stepItem} ${isActive ? styles.active : ''} ${isCompleted ? styles.completed : ''}`}
              onClick={() => {
                // Can always go back to completed steps, or current step
                if (step.id <= currentStep) {
                  onSelectStep(step.id);
                }
              }}
            >
              <div className={styles.stepCircle}>
                {isCompleted ? <Check size={18} strokeWidth={3} /> : step.id}
              </div>
              <div className={styles.stepContent}>
                <span className={styles.stepTitle}>{step.title}</span>
                <span className={styles.stepSubtitle}>{step.subtitle}</span>
              </div>
            </div>
          );
        })}
      </div>
    </nav>
  );
}

