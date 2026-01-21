import { convertTzIdentifierToTzOffset } from './timezone-helpers';

describe('convertTzIdentifierToTzOffset', () => {
  it('returns +7 for a UTC+7 timezone', () => {
    const offset = convertTzIdentifierToTzOffset('Asia/Jakarta');
    expect(offset).toBe(7);
  });

  it('returns 0 for UTC', () => {
    const offset = convertTzIdentifierToTzOffset('UTC');
    expect(offset).toBe(0);
  });

  it('returns -5 for a UTC-5 timezone', () => {
    // Using Etc/GMT+5 which corresponds to UTC-5
    const offset = convertTzIdentifierToTzOffset('Etc/GMT+5');
    expect(offset).toBe(-5);
  });

  it('handles :30 minute offsets (e.g., Asia/Kolkata)', () => {
    const offset = convertTzIdentifierToTzOffset('Asia/Kolkata');
    expect(offset).toBe(5.5);
  });

  it('handles :45 minute offsets (e.g., Asia/Kathmandu)', () => {
    const offset = convertTzIdentifierToTzOffset('Asia/Kathmandu');
    expect(offset).toBe(5.75);
  });
});
