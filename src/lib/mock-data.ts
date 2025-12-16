import { faker } from '@faker-js/faker';
import type { RawEvent, UserBehaviorBaseline } from './types';

const users = Array.from({ length: 10 }, () => ({
  id: faker.string.uuid(),
  name: faker.internet.userName(),
  role: faker.helpers.arrayElement(['Admin', 'Developer', 'User'] as const),
}));

const devices = Array.from({ length: 20 }, () => ({
  id: faker.string.uuid(),
}));

const locations = Array.from({ length: 15 }, () => ({
  ip: faker.internet.ip(),
  country: faker.location.country(),
}));

const eventTypes: RawEvent['event']['type'][] = [
  'Login Attempt',
  'API Call',
  'Resource Access',
  'Privilege Escalation',
];

const eventDetailsMap: Record<RawEvent['event']['type'], () => string> = {
  'Login Attempt': () => `Login attempt from IP ${faker.internet.ip()}`,
  'API Call': () => `Called API endpoint /${faker.hacker.verb()}/${faker.hacker.noun()}`,
  'Resource Access': () => `Accessed resource: ${faker.system.filePath()}`,
  'Privilege Escalation': () => `Attempted to escalate privileges to 'Admin'`,
};

const generateBaseline = (user: RawEvent['user']): UserBehaviorBaseline => {
    return {
        loginTime: {
            normalRange: [faker.number.int({min: 7, max: 10}), faker.number.int({min: 17, max: 20})], // 7-10am and 5-8pm
            typicalDays: faker.helpers.arrayElements(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], faker.number.int({min: 3, max: 5})),
        },
        resourceAccess: {
            typicalOrder: faker.helpers.shuffle(['/dashboard', '/reports', '/settings', '/users']).slice(0, 3),
        },
        apiCallFrequency: {
            mean: faker.number.int({min: 10, max: 50}),
            stdDev: faker.number.int({min: 2, max: 10}),
        }
    }
};


export const generateMockEvents = (count: number): RawEvent[] => {
  return Array.from({ length: count }, (_, i): RawEvent => {
    const user = faker.helpers.arrayElement(users);
    const device = faker.helpers.arrayElement(devices);
    const location = faker.helpers.arrayElement(locations);
    const eventType = faker.helpers.arrayElement(eventTypes);

    const isHighRiskScenario = Math.random() < 0.3; // 30% chance of high risk
    const isBehavioralAnomaly = isHighRiskScenario || Math.random() < 0.4;

    const eventTime = faker.date.recent({ days: 7 });

    return {
      id: faker.string.uuid(),
      timestamp: eventTime.toISOString(),
      user,
      device: {
        id: device.id,
        isNovel: isHighRiskScenario ? true : Math.random() < 0.3,
      },
      location: {
        ...location,
        isNovel: isHighRiskScenario ? true : Math.random() < 0.2,
      },
      event: {
        type: isHighRiskScenario ? 'Privilege Escalation' : eventType,
        details: eventDetailsMap[isHighRiskScenario ? 'Privilege Escalation' : eventType](),
      },
      ruleBasedSeverity: isHighRiskScenario ? faker.number.int({ min: 8, max: 10 }) : faker.number.int({ min: 1, max: 7 }),
      contextualAnomalyScore: isHighRiskScenario ? faker.number.float({ min: 0.7, max: 1 }) : faker.number.float({ min: 0, max: 0.6 }),
      behavioralAnomalyScore: isBehavioralAnomaly ? faker.number.float({ min: 0.6, max: 1.0 }) : faker.number.float({min: 0, max: 0.4}),
      behavioralBaseline: generateBaseline(user),
      confidence: isHighRiskScenario ? faker.number.float({min: 0.85, max: 0.99}) : faker.number.float({min: 0.5, max: 0.84}),
    };
  });
};
