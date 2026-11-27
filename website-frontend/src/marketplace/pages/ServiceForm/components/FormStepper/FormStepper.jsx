import { useTranslations } from "next-intl";
import React from 'react';
import { Check } from 'lucide-react';
import styles from './FormStepper.module.css';
export default function FormStepper({
  currentStep,
  onSelectStep
}) {
  const tr = useTranslations("misc");
  const steps = [{
    id: 1,
    title: tr("m1007"),
    subtitle: tr("m1008")
  }, {
    id: 2,
    title: tr("m1009"),
    subtitle: tr("m1010")
  }, {
    id: 3,
    title: tr("m1011"),
    subtitle: tr("m1012")
  }];
  const progressPercent = (currentStep - 1) / (steps.length - 1) * 100;
  return <nav className={styles.stepperSection} aria-label={tr("m1013")}>
      <div className={styles.stepperContainer}>
        <div className={styles.stepperLine}>
          <div className={styles.stepperLineFill} style={{
          width: `${progressPercent}%`
        }} />
        </div>

        {steps.map(step => {
        const isCompleted = step.id < currentStep;
        const isActive = step.id === currentStep;
        return <div key={step.id} className={`${styles.stepItem} ${isActive ? styles.active : ''} ${isCompleted ? styles.completed : ''}`} onClick={() => {
          // Can always go back to completed steps, or current step
          if (step.id <= currentStep) {
            onSelectStep(step.id);
          }
        }}>
              <div className={styles.stepCircle}>
                {isCompleted ? <Check size={18} strokeWidth={3} /> : step.id}
              </div>
              <div className={styles.stepContent}>
                <span className={styles.stepTitle}>{step.title}</span>
                <span className={styles.stepSubtitle}>{step.subtitle}</span>
              </div>
            </div>;
      })}
      </div>
    </nav>;
}