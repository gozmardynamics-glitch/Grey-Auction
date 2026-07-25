import { useAppDispatch, useAppSelector } from '@/redux/store';
import {
  addBankAccount,
  verifyBankAccount,
  setDefaultBankAccount,
  removeBankAccount,
  setWithdrawalPin,
  addWithdrawal,
  setBuyerBalance,
  setSellerBalance,
  type BankAccount,
  type WithdrawalRequest,
} from '@/redux/slices/wallet.slice';

// Full wallet hook
export const useWallet = () => {
  const dispatch = useAppDispatch();
  const wallet = useAppSelector((state) => state.wallet);

  return {
    ...wallet,

    addBankAccount: (account: BankAccount) => dispatch(addBankAccount(account)),
    verifyBankAccount: (accountId: string) => dispatch(verifyBankAccount(accountId)),
    setDefaultBankAccount: (accountId: string) => dispatch(setDefaultBankAccount(accountId)),
    removeBankAccount: (accountId: string) => dispatch(removeBankAccount(accountId)),
    setWithdrawalPin: () => dispatch(setWithdrawalPin()),
    addWithdrawal: (withdrawal: WithdrawalRequest) => dispatch(addWithdrawal(withdrawal)),
    setBuyerBalance: (balance: number) => dispatch(setBuyerBalance(balance)),
    setSellerBalance: (balance: number) => dispatch(setSellerBalance(balance)),
  };
};

// Buyer-specific hook
export const useBuyerWallet = () => {
  const dispatch = useAppDispatch();
  const wallet = useAppSelector((state) => state.wallet);

  return {
    balance: wallet.buyerBalance,
    withdrawals: wallet.buyerWithdrawals,
    currentWithdrawal: wallet.currentWithdrawal,
    bankAccounts: wallet.bankAccounts,
    defaultBankAccount: wallet.defaultBankAccount,
    hasWithdrawalPin: wallet.hasWithdrawalPin,

    addBankAccount: (account: BankAccount) => dispatch(addBankAccount(account)),
    verifyBankAccount: (accountId: string) => dispatch(verifyBankAccount(accountId)),
    setDefaultBankAccount: (accountId: string) => dispatch(setDefaultBankAccount(accountId)),
    setWithdrawalPin: () => dispatch(setWithdrawalPin()),
    addWithdrawal: (withdrawal: WithdrawalRequest) => dispatch(addWithdrawal(withdrawal)),
  };
};

// Seller-specific hook
export const useSellerWallet = () => {
  const dispatch = useAppDispatch();
  const wallet = useAppSelector((state) => state.wallet);

  return {
    balance: wallet.sellerBalance,
    withdrawals: wallet.sellerWithdrawals,
    currentWithdrawal: wallet.currentWithdrawal,
    bankAccounts: wallet.bankAccounts,
    defaultBankAccount: wallet.defaultBankAccount,
    hasWithdrawalPin: wallet.hasWithdrawalPin,

    setDefaultBankAccount: (accountId: string) => dispatch(setDefaultBankAccount(accountId)),
    addWithdrawal: (withdrawal: WithdrawalRequest) => dispatch(addWithdrawal(withdrawal)),
  };
};

// Shared bank accounts hook
export const useBankAccounts = () => {
  const dispatch = useAppDispatch();
  const wallet = useAppSelector((state) => state.wallet);

  return {
    accounts: wallet.bankAccounts,
    defaultAccount: wallet.defaultBankAccount,

    addAccount: (account: BankAccount) => dispatch(addBankAccount(account)),
    verifyAccount: (accountId: string) => dispatch(verifyBankAccount(accountId)),
    setDefault: (accountId: string) => dispatch(setDefaultBankAccount(accountId)),
    removeAccount: (accountId: string) => dispatch(removeBankAccount(accountId)),
  };
};
