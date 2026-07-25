import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isVerified: boolean;
  isDefault?: boolean;
  userType?: 'buyer' | 'seller' | 'both';
}

export interface WithdrawalRequest {
  id: string;
  amount: number;
  bankAccount: BankAccount;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  processedAt?: string;
  fee?: number;
  userType?: 'buyer' | 'seller';
  processingFeeRate?: number;
}

export interface WalletState {
  bankAccounts: BankAccount[];
  defaultBankAccount: BankAccount | null;
  hasWithdrawalPin: boolean;
  buyerWithdrawals: WithdrawalRequest[];
  sellerWithdrawals: WithdrawalRequest[];
  currentWithdrawal: WithdrawalRequest | null;
  buyerBalance: number;
  sellerBalance: number;
}

const initialState: WalletState = {
  bankAccounts: [],
  defaultBankAccount: null,
  hasWithdrawalPin: false,
  buyerWithdrawals: [],
  sellerWithdrawals: [],
  currentWithdrawal: null,
  buyerBalance: 0,
  sellerBalance: 0,
};

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    addBankAccount: (state, action: PayloadAction<BankAccount>) => {
      state.bankAccounts.push(action.payload);
      if (!state.defaultBankAccount) {
        state.defaultBankAccount = action.payload;
      }
    },
    verifyBankAccount: (state, action: PayloadAction<string>) => {
      const account = state.bankAccounts.find(
        (acc) => acc.id === action.payload
      );
      if (account) {
        account.isVerified = true;
      }
    },
    setDefaultBankAccount: (state, action: PayloadAction<string>) => {
      const account = state.bankAccounts.find(
        (acc) => acc.id === action.payload
      );
      if (account) {
        state.defaultBankAccount = account;
        state.bankAccounts = state.bankAccounts.map((acc) => ({
          ...acc,
          isDefault: acc.id === action.payload,
        }));
      }
    },
    removeBankAccount: (state, action: PayloadAction<string>) => {
      state.bankAccounts = state.bankAccounts.filter(
        (acc) => acc.id !== action.payload
      );
      if (state.defaultBankAccount?.id === action.payload) {
        state.defaultBankAccount = state.bankAccounts[0] || null;
      }
    },
    setWithdrawalPin: (state) => {
      state.hasWithdrawalPin = true;
    },
    addWithdrawal: (state, action: PayloadAction<WithdrawalRequest>) => {
      const withdrawal = action.payload;
      if (withdrawal.userType === 'buyer') {
        state.buyerWithdrawals.unshift(withdrawal);
        state.buyerBalance -= withdrawal.amount + (withdrawal.fee || 0);
      } else {
        state.sellerWithdrawals.unshift(withdrawal);
        state.sellerBalance -= withdrawal.amount + (withdrawal.fee || 0);
      }
      state.currentWithdrawal = withdrawal;
    },
    setBuyerBalance: (state, action: PayloadAction<number>) => {
      state.buyerBalance = action.payload;
    },
    setSellerBalance: (state, action: PayloadAction<number>) => {
      state.sellerBalance = action.payload;
    },
  },
});

export const {
  addBankAccount,
  verifyBankAccount,
  setDefaultBankAccount,
  removeBankAccount,
  setWithdrawalPin,
  addWithdrawal,
  setBuyerBalance,
  setSellerBalance,
} = walletSlice.actions;

export default walletSlice.reducer;
