/* eslint-disable max-lines */
import React, { Component } from 'react';
import { StyleSheet, View } from 'react-native';
import PropTypes from 'prop-types';
import ReactNativeHaptic from 'react-native-haptic';

import { withTheme } from '../../contexts/theme';
import normalizeBtcAmount from '../../crypto/bitcoin/normalizeBtcAmount';
import AmountInput from './AmountInput';
import UnitPicker from './UnitPicker';
import InputBarButton from './InputBarButton';
import SendButtonIcon from '../icons/SendButtonIcon';
import CancelButtonIcon from '../icons/CancelButtonIcon';

import {
  UNIT_BTC,
  convert as convertBitcoin,
  satsToBtc
} from '../../crypto/bitcoin/convert';

const CURRENCY_BTC = 'BTC';

const styles = StyleSheet.create({
  toolbar: {
    paddingHorizontal: 15,
    paddingVertical: 5,
    alignSelf: 'stretch',
    justifyContent: 'center'
  },
  unitPicker: {
    position: 'absolute',
    right: 53
  },
  buttonsContainer: {
    position: 'absolute',
    right: 13,
    width: 45,
    height: 45
  },
  disabledOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    opacity: 0.5,
    marginHorizontal: 15,
    marginVertical: 5,
    borderRadius: 50
  }
});

class InputBar extends Component {
  static PAYMENT_TYPE_BOTH = 'both';
  static PAYMENT_TYPE_ONCHAIN = 'on-chain';
  static PAYMENT_TYPE_OFFCHAIN = 'off-chain';

  constructor(props) {
    super(...arguments);

    const { currency, unit, fiatRates, initialAmountBtc } = props;
    let initialAmount = null;

    if (initialAmountBtc) {
      if (currency === CURRENCY_BTC) {
        initialAmount = convertBitcoin(initialAmountBtc, UNIT_BTC, unit);
      } else {
        const fiatRate = fiatRates[currency];
        initialAmount = fiatRate ? (initialAmountBtc * fiatRate) : 0;
      }
    }

    this.state = {
      amount: 0,
      initialAmount,
      currency,
      unit: currency === CURRENCY_BTC ? unit : null,
      insufficientFunds: false,
      insufficientFundsReason: null,
      confirmTransaction: false
    };

    this._onChangeAmount = this._onChangeAmount.bind(this);
    this._onChangeUnit = this._onChangeUnit.bind(this);
    this._onSendPress = this._onSendPress.bind(this);
    this._onSendLongPress = this._onSendLongPress.bind(this);
    this._onCancelPress = this._onCancelPress.bind(this);
    this._onInputPress = this._onInputPress.bind(this);
  }

  reset() {
    this.setState({
      amount: 0,
      insufficientFunds: false,
      confirmTransaction: false
    });

    this._amountInput.reset();
  }

  focus() {
    this._amountInput.focus();
  }

  _onChangeAmount(amount) {
    this.setState({ amount });
    this._checkBalance(amount);
  }

  _onChangeUnit({ currency, unit }) {
    this.setState({ currency, unit });
    this.props.onChangeUnit({ currency, unit });
  }

  _getBtcAmount(amount) {
    const { currency, unit } = this.state;
    let amountBtc = 0;

    if (currency === CURRENCY_BTC) {
      amountBtc = convertBitcoin(amount, unit, UNIT_BTC);
    } else {
      const fiatRate = this.props.fiatRates[currency];
      amountBtc = fiatRate ? normalizeBtcAmount(amount / fiatRate) : 0;
    }

    return amountBtc;
  }

  // eslint-disable-next-line max-statements
  _checkBalance(amount) {
    const {
      onChainSpendableBalance,
      offChainSpendableBalance,
      contactInboundCapacity,
      paymentType
    } = this.props;

    const offChainSpendableBalanceBtc = satsToBtc(offChainSpendableBalance);
    const contactInboundCapacityBtc = satsToBtc(contactInboundCapacity || 0);
    const amountBtc = this._getBtcAmount(amount);

    let insufficientFunds;
    let insufficientFundsReason;

    switch (paymentType) {
      case InputBar.PAYMENT_TYPE_BOTH:
        if (amountBtc > normalizeBtcAmount(offChainSpendableBalanceBtc + onChainSpendableBalance)) {
          insufficientFunds = true;
          insufficientFundsReason = 'Insufficient spendable funds';
        } else if (amountBtc > offChainSpendableBalanceBtc && amountBtc > onChainSpendableBalance) {
          insufficientFunds = true;
          insufficientFundsReason = 'Use either on or off-chain funds';
        } else if (amountBtc > onChainSpendableBalance && amountBtc <= offChainSpendableBalanceBtc && amountBtc > contactInboundCapacityBtc) {
          insufficientFunds = true;
          insufficientFundsReason = 'Contact cannot receive this amount';
        }
        break;

      case InputBar.PAYMENT_TYPE_ONCHAIN:
        if (amountBtc > onChainSpendableBalance) {
          insufficientFunds = true;
          insufficientFundsReason = 'Insufficient on-chain funds';
        }
        break;

      case InputBar.PAYMENT_TYPE_OFFCHAIN:
        if (amountBtc > offChainSpendableBalanceBtc) {
          insufficientFunds = true;
          insufficientFundsReason = 'Insufficient off-chain funds';
        }
        break;
    }

    this.setState({ insufficientFunds, insufficientFundsReason });
  }

  _send(forceOnChain = false) {
    const amountBtc = this._getBtcAmount(this.state.amount);
    const displayCurrency = this.state.currency;
    const displayUnit = this.state.unit;

    ReactNativeHaptic.generate('selection');

    this.setState({ confirmTransaction: true });

    this.props.onSendPress({
      amountBtc,
      displayCurrency,
      displayUnit,
      forceOnChain
    });
  }

  _onSendPress() {
    this._send();
  }

  _onSendLongPress() {
    const forceOnChain = true;
    const { paymentType } = this.props;

    if (paymentType === InputBar.PAYMENT_TYPE_OFFCHAIN) {
      ReactNativeHaptic.generate('notificationError');
    } else {
      this._send(forceOnChain);
    }
  }

  _onCancelPress() {
    ReactNativeHaptic.generate('selection');

    this.setState({ confirmTransaction: false }, () => {
      this.props.onCancelPress();
      this.focus();
    });
  }

  _onInputPress() {
    if (this.state.confirmTransaction) {
      return this._onCancelPress();
    }

    this.focus();
  }

  _renderButton() {
    const { theme, locked } = this.props;
    const { amount, insufficientFunds, confirmTransaction } = this.state;
    const sendDisabled = locked || !amount || insufficientFunds;

    return (
      <View style={styles.buttonsContainer}>
        <View
          style={{ position: 'absolute', opacity: confirmTransaction ? 1 : 0 }}
          pointerEvents={confirmTransaction ? 'auto' : 'none'}
        >
          <InputBarButton
            style={theme.inputCancelButton}
            Icon={CancelButtonIcon}
            onPress={this._onCancelPress}
          />
        </View>
        <View
          style={{ position: 'absolute', opacity: confirmTransaction ? 0 : 1 }}
          pointerEvents={confirmTransaction ? 'none' : 'auto'}
        >
          <InputBarButton
            disabled={sendDisabled}
            style={theme.inputSendButton}
            Icon={SendButtonIcon}
            onPress={this._onSendPress}
            onLongPress={this._onSendLongPress}
          />
        </View>
      </View>
    );
  }

  render() {
    const {
      primaryCurrency,
      secondaryCurrency,
      defaultBitcoinUnit,
      fiatRates,
      disabled,
      locked,
      theme
    } = this.props;

    const {
      initialAmount,
      currency,
      unit,
      insufficientFunds,
      insufficientFundsReason,
      confirmTransaction
    } = this.state;

    const pointerEvents = disabled ? 'none' : null;
    const hideSecondaryCurrency = !fiatRates[secondaryCurrency];

    return (
      <View style={styles.toolbar} pointerEvents={pointerEvents}>
        <AmountInput
          ref={(ref) => { this._amountInput = ref; }}
          currency={currency}
          unit={unit}
          initialAmount={initialAmount}
          onChangeAmount={this._onChangeAmount}
          onPress={this._onInputPress}
          hasError={insufficientFunds}
          errorText={insufficientFundsReason}
          editable={!locked && !confirmTransaction}
        />
        <UnitPicker
          primaryCurrency={primaryCurrency}
          secondaryCurrency={hideSecondaryCurrency ? null : secondaryCurrency}
          defaultBitcoinUnit={defaultBitcoinUnit}
          currency={currency}
          unit={unit}
          onChangeUnit={this._onChangeUnit}
          style={styles.unitPicker}
          disabled={locked || confirmTransaction}
        />
        { this._renderButton() }
        { disabled && <View style={[styles.disabledOverlay, theme.inputDisabledOverlay]} /> }
      </View>
    );
  }
}

InputBar.propTypes = {
  primaryCurrency: PropTypes.string.isRequired,
  secondaryCurrency: PropTypes.string.isRequired,
  defaultBitcoinUnit: PropTypes.string.isRequired,
  currency: PropTypes.string.isRequired,
  unit: PropTypes.string.isRequired,
  onChainSpendableBalance: PropTypes.number.isRequired,
  offChainSpendableBalance: PropTypes.number.isRequired,
  fiatRates: PropTypes.object.isRequired,
  onSendPress: PropTypes.func.isRequired,
  onCancelPress: PropTypes.func.isRequired,
  onChangeUnit: PropTypes.func.isRequired,
  paymentType: PropTypes.oneOf([
    InputBar.PAYMENT_TYPE_BOTH,
    InputBar.PAYMENT_TYPE_ONCHAIN,
    InputBar.PAYMENT_TYPE_OFFCHAIN
  ]),
  initialAmountBtc: PropTypes.number,
  contactInboundCapacity: PropTypes.number,
  disabled: PropTypes.bool, // This is used when the input bar can't be used at all.
  locked: PropTypes.bool, // This is used to lock the amount, e.g. when paying a lightning invoice.
  theme: PropTypes.object
};

InputBar.defaultProps = {
  paymentType: InputBar.PAYMENT_TYPE_BOTH
};

export default withTheme(InputBar);
