import { describe, it, expect } from 'vitest';
import { checkTermination } from '../termination';
import type { TerminationCondition } from '../../../types/scenario';
import type { SupervisorOutput } from '../../../types/agents';

describe('checkTermination', () => {
  it('returns false when no conditions are met', () => {
    const conditions: TerminationCondition[] = [
      { type: 'turn_cap', maxTurns: 30 },
    ];
    const result = checkTermination(conditions, 5, []);
    expect(result.shouldTerminate).toBe(false);
  });

  it('terminates on turn cap', () => {
    const conditions: TerminationCondition[] = [
      { type: 'turn_cap', maxTurns: 10 },
    ];
    const result = checkTermination(conditions, 10, []);
    expect(result.shouldTerminate).toBe(true);
    expect(result.reason).toContain('turn_cap');
  });

  it('terminates on supervisor classification', () => {
    const conditions: TerminationCondition[] = [
      {
        type: 'supervisor_classification',
        supervisorName: 'judge',
        terminalValues: ['ACCEPTANCE', 'REJECTION'],
      },
    ];
    const outputs: SupervisorOutput[] = [
      {
        afterTurn: 4,
        supervisorName: 'judge',
        outputType: 'classification',
        parsed: { classification: 'ACCEPTANCE' },
        rawResponse: '{"status":"ACCEPTANCE"}',
      },
    ];
    const result = checkTermination(conditions, 4, outputs);
    expect(result.shouldTerminate).toBe(true);
    expect(result.reason).toContain('ACCEPTANCE');
  });

  it('does not terminate on non-terminal classification', () => {
    const conditions: TerminationCondition[] = [
      {
        type: 'supervisor_classification',
        supervisorName: 'judge',
        terminalValues: ['ACCEPTANCE', 'REJECTION'],
      },
    ];
    const outputs: SupervisorOutput[] = [
      {
        afterTurn: 2,
        supervisorName: 'judge',
        outputType: 'classification',
        parsed: { classification: 'CONTINUE' },
        rawResponse: '{"status":"CONTINUE"}',
      },
    ];
    const result = checkTermination(conditions, 2, outputs);
    expect(result.shouldTerminate).toBe(false);
  });

  it('uses latest classification from the correct supervisor', () => {
    const conditions: TerminationCondition[] = [
      {
        type: 'supervisor_classification',
        supervisorName: 'judge',
        terminalValues: ['ACCEPTANCE'],
      },
    ];
    const outputs: SupervisorOutput[] = [
      {
        afterTurn: 2,
        supervisorName: 'judge',
        outputType: 'classification',
        parsed: { classification: 'CONTINUE' },
        rawResponse: '',
      },
      {
        afterTurn: 4,
        supervisorName: 'analyst',
        outputType: 'extraction',
        parsed: { price: 85 },
        rawResponse: '',
      },
      {
        afterTurn: 4,
        supervisorName: 'judge',
        outputType: 'classification',
        parsed: { classification: 'ACCEPTANCE' },
        rawResponse: '',
      },
    ];
    const result = checkTermination(conditions, 4, outputs);
    expect(result.shouldTerminate).toBe(true);
  });

  it('checks multiple conditions (first match wins)', () => {
    const conditions: TerminationCondition[] = [
      { type: 'turn_cap', maxTurns: 5 },
      {
        type: 'supervisor_classification',
        supervisorName: 'judge',
        terminalValues: ['ACCEPTANCE'],
      },
    ];
    const result = checkTermination(conditions, 5, []);
    expect(result.shouldTerminate).toBe(true);
    expect(result.reason).toContain('turn_cap');
  });
});
