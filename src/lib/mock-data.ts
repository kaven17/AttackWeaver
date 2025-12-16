import { faker } from '@faker-js/faker';
import type { RawLog } from './types';

const users = Array.from({ length: 10 }, () => faker.internet.userName());
const hosts = Array.from({ length: 5 }, (_, i) => `server-0${i + 1}`);

const eventGenerators: (() => RawLog)[] = [
  () => ({
    timestamp: faker.date.recent({ days: 7 }).toISOString(),
    source: 'auth_service',
    host: faker.helpers.arrayElement(hosts),
    event: 'LOGIN_SUCCESS',
    user: faker.helpers.arrayElement(users),
    message: `User login succeeded from IP ${faker.internet.ip()}`,
  }),
  () => ({
    timestamp: faker.date.recent({ days: 7 }).toISOString(),
    source: 'auth_service',
    host: faker.helpers.arrayElement(hosts),
    event: 'LOGIN_FAILED',
    user: faker.helpers.arrayElement(users),
    message: `Invalid password from IP ${faker.internet.ip()}`,
  }),
  () => ({
    timestamp: faker.date.recent({ days: 7 }).toISOString(),
    source: 'file_system',
    host: faker.helpers.arrayElement(hosts),
    event: 'FILE_ACCESS',
    user: faker.helpers.arrayElement(users),
    message: `Read access to ${faker.system.filePath()}`,
  }),
    () => ({
    timestamp: faker.date.recent({ days: 7 }).toISOString(),
    source: 'file_system',
    host: faker.helpers.arrayElement(hosts),
    event: 'PRIVILEGE_ESCALATION',
    user: faker.helpers.arrayElement(users),
    message: `User attempted to escalate privileges to 'Admin'`,
  }),
  () => ({
    timestamp: faker.date.recent({ days: 7 }).toISOString(),
    source: 'web_api',
    host: faker.helpers.arrayElement(hosts),
    event: 'API_CALL',
    user: faker.helpers.arrayElement(users),
    message: `POST /api/${faker.hacker.verb()}/${faker.hacker.noun()} returned 200`,
  }),
  () => ({
    timestamp: faker.date.recent({ days: 7 }).toISOString(),
    source: 'firewall',
    host: `gateway-0${faker.number.int({ min: 1, max: 2 })}`,
    event: 'NETWORK_CONNECTION',
    user: null,
    message: `Outbound connection from ${faker.internet.ip()} to ${faker.internet.ip()}:443`,
  }),
];

export const generateRawLogs = (count: number): RawLog[] => {
  return Array.from({ length: count }, () => {
    const generator = faker.helpers.arrayElement(eventGenerators);
    return generator();
  });
};
