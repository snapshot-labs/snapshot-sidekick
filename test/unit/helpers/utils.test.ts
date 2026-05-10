import { capture } from '@snapshot-labs/snapshot-sentry';
import { captureException, isExpectedClientError } from '../../../src/helpers/utils';

jest.mock('@snapshot-labs/snapshot-sentry', () => ({
  capture: jest.fn()
}));

const mockedCapture = capture as jest.Mock;

describe('utils.ts', () => {
  describe('isExpectedClientError', () => {
    it.each([
      ['RECORD_NOT_FOUND', new Error('RECORD_NOT_FOUND')],
      ['UNAUTHORIZED', new Error('UNAUTHORIZED')],
      ['plain string RECORD_NOT_FOUND', 'RECORD_NOT_FOUND']
    ])('returns true for %s', (_label, value) => {
      expect(isExpectedClientError(value)).toBe(true);
    });

    it.each([
      ['random Error', new Error('something went wrong')],
      ['Invalid Request (negative code)', new Error('Invalid Request')],
      ['undefined', undefined],
      ['null', null],
      ['number', 42]
    ])('returns false for %s', (_label, value) => {
      expect(isExpectedClientError(value)).toBe(false);
    });
  });

  describe('captureException', () => {
    beforeEach(() => {
      mockedCapture.mockClear();
    });

    it('skips capture for expected client errors', () => {
      captureException(new Error('RECORD_NOT_FOUND'));
      captureException('UNAUTHORIZED');
      expect(mockedCapture).not.toHaveBeenCalled();
    });

    it('forwards unexpected errors to capture', () => {
      const err = new Error('boom');
      captureException(err, { body: { foo: 1 } });
      expect(mockedCapture).toHaveBeenCalledWith(err, { body: { foo: 1 } });
    });
  });
});
