import { describe, it, expect } from 'vitest';
import {
  connectInspector,
  disconnectInspector,
  DEFAULT_PORT,
  PROTOCOL_VERSION,
} from '../index';

describe('client index exports', () => {
  it('exports connectInspector function', () => {
    expect(typeof connectInspector).toBe('function');
  });

  it('exports disconnectInspector function', () => {
    expect(typeof disconnectInspector).toBe('function');
  });

  it('exports DEFAULT_PORT constant', () => {
    expect(DEFAULT_PORT).toBe(8765);
  });

  it('exports PROTOCOL_VERSION constant', () => {
    expect(PROTOCOL_VERSION).toBe(1);
  });
});
