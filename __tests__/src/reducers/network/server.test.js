import { BITCOIN_WALLET_SYNC_SUCCESS, BITCOIN_WALLET_SYNC_FAILURE } from '../../../../src/actions/bitcoin/wallet/sync';
import serverReducer from '../../../../src/reducers/network/server';

describe('serverReducer', () => {
  it('is a function', () => {
    expect(typeof serverReducer).toBe('function');
  });

  describe('when action is BITCOIN_WALLET_SYNC_FAILURE', () => {
    it('returns an object with disconnected set to true', () => {
      const oldState = { disconnected: false };
      const action = { type: BITCOIN_WALLET_SYNC_FAILURE };
      const newState = serverReducer(oldState, action);

      const expectedState = {
        disconnected: true
      };

      expect(newState).toMatchObject(expectedState);
    });
  });

  describe('when action is BITCOIN_WALLET_SYNC_SUCCESS', () => {
    it('returns an object with disconnected set to false', () => {
      const oldState = { disconnected: true };
      const action = { type: BITCOIN_WALLET_SYNC_SUCCESS };
      const newState = serverReducer(oldState, action);

      const expectedState = {
        disconnected: false
      };

      expect(newState).toMatchObject(expectedState);
    });
  });

  describe('when action is an unknown type', () => {
    it('returns the old state', () => {
      const oldState = { disconnected: '32feab78-fa6e-4970-bf38-9897d8b847a4' };
      const action = { type: 'UNKNOWN' };
      const newState = serverReducer(oldState, action);

      expect(newState).toBe(oldState);
    });
  });

  describe('when state is not defined', () => {
    it('returns an empty object', () => {
      const action = { type: 'UNKNOWN' };
      const newState = serverReducer(undefined, action);

      expect(newState).toMatchObject({});
    });
  });
});
