import { MITRE_MAP } from './mitreMap';
import { AttackStage } from '@/lib/types';

export function reconcileWithMitre(
  inferredStage: AttackStage,
  semanticEventType: string
) {
  const mitre = MITRE_MAP[semanticEventType];

  if (!mitre) {
    return {
      stage: inferredStage,
      scoreAdjustment: 0,
      mitre,
    };
  }

  if (mitre.stage === inferredStage && mitre.confidence >= 0.7) {
    return {
      stage: inferredStage,
      scoreAdjustment: +5,
      mitre,
    };
  }

  if (mitre.stage !== inferredStage && mitre.confidence >= 0.8) {
    return {
      stage: inferredStage,
      scoreAdjustment: -5,
      mitre,
    };
  }

  return {
    stage: inferredStage,
    scoreAdjustment: 0,
    mitre,
  };
}
