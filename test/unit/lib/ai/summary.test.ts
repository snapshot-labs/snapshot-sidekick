import Summary from '../../../../src/lib/ai/summary';
import * as snapshotHelper from '../../../../src/helpers/snapshot';
import { storageEngine } from '../../../../src/helpers/utils';

const fetchProposalMock = jest.spyOn(snapshotHelper, 'fetchProposal');

describe('AI summary', () => {
  describe('isCacheable()', () => {
    describe('when the proposal is pending', () => {
      it('returns true if the proposal has not been cached yet', () => {
        expect.assertions(2);
        const summary = new Summary('1', storageEngine());
        fetchProposalMock.mockResolvedValueOnce({
          id: '2',
          state: 'pending',
          updated: 1
        } as snapshotHelper.Proposal);

        expect(summary.isCacheable()).resolves.toBe(true);
        expect(fetchProposalMock).toHaveBeenCalledTimes(1);
      });

      it('returns true if the proposal has not been updated since last cache', async () => {
        expect.assertions(2);
        const summary = new Summary('summary-1', storageEngine());
        fetchProposalMock.mockResolvedValueOnce({
          id: '1',
          state: 'pending',
          updated: 1
        } as snapshotHelper.Proposal);
        await summary.isCacheable();
        summary.afterCreateCache();

        fetchProposalMock.mockResolvedValueOnce({
          id: '1',
          state: 'pending',
          updated: 2
        } as snapshotHelper.Proposal);

        expect(summary.isCacheable()).resolves.toBe(false);
        expect(fetchProposalMock).toHaveBeenCalledTimes(2);
      });

      it('returns false if the proposal has been updated since last cache', async () => {
        expect.assertions(2);
        const summary = new Summary('1', storageEngine());
        fetchProposalMock.mockResolvedValue({
          id: '3',
          state: 'pending',
          updated: 1
        } as snapshotHelper.Proposal);
        await summary.isCacheable();
        summary.afterCreateCache();

        expect(summary.isCacheable()).resolves.toBe(true);
        expect(fetchProposalMock).toHaveBeenCalledTimes(2);
      });
    });

    it('returns true when the proposal exist', async () => {
      expect.assertions(2);
      const summary = new Summary('1', storageEngine());
      fetchProposalMock.mockResolvedValueOnce({} as snapshotHelper.Proposal);

      expect(summary.isCacheable()).resolves.toBe(true);
      expect(fetchProposalMock).toHaveBeenCalledTimes(1);
    });

    it('returns false when the proposal does not exist', () => {
      expect.assertions(2);
      const summary = new Summary('1', storageEngine());
      fetchProposalMock.mockRejectedValueOnce(new Error('RECORD_NOT_FOUND'));

      expect(summary.isCacheable()).rejects.toThrow('RECORD_NOT_FOUND');
      expect(fetchProposalMock).toHaveBeenCalledTimes(1);
    });
  });
});
