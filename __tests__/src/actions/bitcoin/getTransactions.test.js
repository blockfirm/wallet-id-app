import * as api from '../../../../src/api';

import {
  getTransactions,
  BITCOIN_GET_TRANSACTIONS_REQUEST,
  BITCOIN_GET_TRANSACTIONS_SUCCESS,
  BITCOIN_GET_TRANSACTIONS_FAILURE
} from '../../../../src/actions/bitcoin/getTransactions';

const dispatchMock = jest.fn();

const getStateMock = jest.fn(() => ({
  settings: {
    api: {
      baseUrl: '4527ccd6-e9cd-4ad4-98a9-2002c7d90255'
    }
  }
}));

jest.mock('../../../../src/api', () => ({
  bitcoin: {
    transactions: {
      get: jest.fn(() => Promise.resolve('c942a2aa-a81b-4e64-ac56-1ee80177785c'))
    }
  }
}));

describe('BITCOIN_GET_TRANSACTIONS_REQUEST', () => {
  it('equals "BITCOIN_GET_TRANSACTIONS_REQUEST"', () => {
    expect(BITCOIN_GET_TRANSACTIONS_REQUEST).toBe('BITCOIN_GET_TRANSACTIONS_REQUEST');
  });
});

describe('BITCOIN_GET_TRANSACTIONS_SUCCESS', () => {
  it('equals "BITCOIN_GET_TRANSACTIONS_SUCCESS"', () => {
    expect(BITCOIN_GET_TRANSACTIONS_SUCCESS).toBe('BITCOIN_GET_TRANSACTIONS_SUCCESS');
  });
});

describe('BITCOIN_GET_TRANSACTIONS_FAILURE', () => {
  it('equals "BITCOIN_GET_TRANSACTIONS_FAILURE"', () => {
    expect(BITCOIN_GET_TRANSACTIONS_FAILURE).toBe('BITCOIN_GET_TRANSACTIONS_FAILURE');
  });
});

describe('getTransactions', () => {
  let fakeAddresses;
  let fakePage;

  beforeEach(() => {
    fakeAddresses = [
      'ee8eed41-a60a-468b-82cb-380f2ed05e1f',
      '4a7c8a53-6be0-47c3-8afc-d2d3ddbaa1fd'
    ];

    fakePage = 1;

    api.bitcoin.transactions.get.mockClear();
  });

  it('is a function', () => {
    expect(typeof getTransactions).toBe('function');
  });

  it('accepts two arguments', () => {
    expect(getTransactions.length).toBe(2);
  });

  it('returns a function', () => {
    const returnValue = getTransactions(fakeAddresses, fakePage);
    expect(typeof returnValue).toBe('function');
  });

  describe('the returned function', () => {
    let returnedFunction;

    beforeEach(() => {
      returnedFunction = getTransactions(fakeAddresses, fakePage);
    });

    it('dispatches an action of type BITCOIN_GET_TRANSACTIONS_REQUEST', () => {
      returnedFunction(dispatchMock, getStateMock);

      expect(dispatchMock).toHaveBeenCalledWith({
        type: BITCOIN_GET_TRANSACTIONS_REQUEST
      });
    });

    it('gets the transactions with api.bitcoin.transactions.get() together with baseUrl from settings', () => {
      expect.hasAssertions();

      return returnedFunction(dispatchMock, getStateMock).then(() => {
        const expectedOptions = {
          baseUrl: '4527ccd6-e9cd-4ad4-98a9-2002c7d90255'
        };

        expect(api.bitcoin.transactions.get).toHaveBeenCalledTimes(1);
        expect(api.bitcoin.transactions.get).toHaveBeenCalledWith(fakeAddresses, fakePage, expectedOptions);
      });
    });

    it('returns a Promise', () => {
      const returnValue = returnedFunction(dispatchMock, getStateMock);
      expect(returnValue).toBeInstanceOf(Promise);
    });

    describe('the promise', () => {
      let promise;

      beforeEach(() => {
        promise = returnedFunction(dispatchMock, getStateMock);
      });

      it('dispatches an action of type BITCOIN_GET_TRANSACTIONS_SUCCESS with the result from api.bitcoin.transactions.get()', () => {
        expect.hasAssertions();

        return promise.then(() => {
          expect(dispatchMock).toHaveBeenCalledWith({
            type: BITCOIN_GET_TRANSACTIONS_SUCCESS,
            transactions: 'c942a2aa-a81b-4e64-ac56-1ee80177785c'
          });
        });
      });
    });

    describe('when the function fails', () => {
      let promise;

      beforeEach(() => {
        // Make the function fail by returning a rejected promise from api.bitcoin.transactions.get().
        api.bitcoin.transactions.get.mockImplementationOnce(() => Promise.reject(
          new Error('9f6c19c9-b7ac-433a-be2b-cbc194e06d8c')
        ));

        promise = getTransactions(fakeAddresses, fakePage)(dispatchMock, getStateMock);
      });

      it('rejects the returned promise', () => {
        expect.hasAssertions();

        return promise.catch((error) => {
          expect(error).toBeTruthy();
          expect(error.message).toBe('9f6c19c9-b7ac-433a-be2b-cbc194e06d8c');
        });
      });

      it('dispatches an action of type BITCOIN_GET_TRANSACTIONS_FAILURE with the error', () => {
        expect.hasAssertions();

        return promise.catch((error) => {
          expect(error).toBeTruthy();

          expect(dispatchMock).toHaveBeenCalledWith({
            type: BITCOIN_GET_TRANSACTIONS_FAILURE,
            error
          });
        });
      });
    });
  });
});
