import { AttackStage } from '@/lib/types';

export type MitreMapping = {
  stage: AttackStage;
  techniques: string[];
  confidence: number; // 0.0 – 1.0
};

export const MITRE_MAP: Record<string, MitreMapping> = {
  authentication_failure: {
    stage: 'Initial Access',
    techniques: ['T1110'],
    confidence: 0.7,
  },

  authentication_success: {
    stage: 'Initial Access',
    techniques: ['T1078'],
    confidence: 0.6,
  },

  privilege_change: {
    stage: 'Privilege Escalation',
    techniques: ['T1068', 'T1548'],
    confidence: 0.9,
  },

  resource_access: {
    stage: 'Lateral Movement',
    techniques: ['T1021'],
    confidence: 0.6,
  },

  configuration_change: {
    stage: 'Persistence',
    techniques: ['T1547'],
    confidence: 0.7,
  },
};
