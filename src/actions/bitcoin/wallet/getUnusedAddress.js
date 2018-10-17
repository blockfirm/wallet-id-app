import bip32 from 'bip32';
import bip39 from 'bip39';

import getMnemonicByKey from '../../../crypto/getMnemonicByKey';
import generateAddress from '../../../crypto/bitcoin/generateAddress';
import { add as addExternalAddress } from './addresses/external';
import { add as addInternalAddress } from './addresses/internal';

export const BITCOIN_WALLET_GET_UNUSED_ADDRESS_REQUEST = 'BITCOIN_WALLET_GET_UNUSED_ADDRESS_REQUEST';
export const BITCOIN_WALLET_GET_UNUSED_ADDRESS_SUCCESS = 'BITCOIN_WALLET_GET_UNUSED_ADDRESS_SUCCESS';
export const BITCOIN_WALLET_GET_UNUSED_ADDRESS_FAILURE = 'BITCOIN_WALLET_GET_UNUSED_ADDRESS_FAILURE';

const getUnusedAddressRequest = () => {
  return {
    type: BITCOIN_WALLET_GET_UNUSED_ADDRESS_REQUEST
  };
};

const getUnusedAddressSuccess = (address, internal) => {
  return {
    type: BITCOIN_WALLET_GET_UNUSED_ADDRESS_SUCCESS,
    address,
    internal
  };
};

const getUnusedAddressFailure = (error) => {
  return {
    type: BITCOIN_WALLET_GET_UNUSED_ADDRESS_FAILURE,
    error
  };
};

/**
 * Returns a map of all addresses found in the specified transactions.
 */
const getUsedAddressMap = (transactions) => {
  return transactions.reduce((addressMap, transaction) => {
    transaction.vout.forEach((vout) => {
      vout.scriptPubKey.addresses.forEach((address) => {
        addressMap[address] = true;
      });
    });

    return addressMap;
  }, {});
};

/**
 * Generates an address based on the inputs.
 * The account is hardcoded to 0.
 */
const getAddressByIndex = (root, network, internal, index) => {
  const addressInfo = {
    root,
    network,
    accountIndex: 0,
    internal,
    addressIndex: index
  };

  return generateAddress(addressInfo);
};

/**
 * Returns the current address index.
 */
const getAddressIndex = (state, internal) => {
  let allAddresses;

  if (internal) {
    allAddresses = Object.keys(state.bitcoin.wallet.addresses.internal.items);
  } else {
    allAddresses = Object.keys(state.bitcoin.wallet.addresses.external.items);
  }

  const index = allAddresses.length - 1;
  return index < 0 ? 0 : index;
};

/**
 * Adds an address to the state and persistent storage.
 * @returns {promise} that resolves when the address has been added.
 */
const addAddress = (dispatch, address, internal) => {
  // The addInternalAddress/addExternalAddress wants a map of addresses to add.
  const addressMap = { [address]: {} };
  let promise;

  if (internal) {
    promise = dispatch(addInternalAddress(addressMap));
  } else {
    promise = dispatch(addExternalAddress(addressMap));
  }

  return promise.then(() => address);
};

/**
 * Action to get a new unused bitcoin address for this wallet.
 */
export const getUnusedAddress = (internal = false) => {
  return (dispatch, getState) => {
    dispatch(getUnusedAddressRequest());

    const state = getState();
    const keys = state.keys.items;
    const keyId = Object.keys(keys)[0];
    const network = state.settings.bitcoin.network;
    const transactions = state.bitcoin.wallet.transactions.items;
    const usedAddressMap = getUsedAddressMap(transactions);
    const currentIndex = getAddressIndex(state, internal);

    return getMnemonicByKey(keyId)
      .then((mnemonic) => {
        const seed = bip39.mnemonicToSeed(mnemonic);
        const root = bip32.fromSeed(seed);
        const lastAddress = getAddressByIndex(root, network, internal, currentIndex);

        if (!(lastAddress in usedAddressMap)) {
          return lastAddress;
        }

        const newAddress = getAddressByIndex(root, network, internal, currentIndex + 1);
        return addAddress(dispatch, newAddress, internal);
      })
      .then((address) => {
        dispatch(getUnusedAddressSuccess(address, internal));
        return address;
      })
      .catch((error) => {
        dispatch(getUnusedAddressFailure(error));
        throw error;
      });
  };
};
