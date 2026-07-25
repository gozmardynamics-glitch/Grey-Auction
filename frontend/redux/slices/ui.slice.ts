import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  isMenuOpen: boolean;
  isScrolled: boolean;
  sidebarOpen: boolean;
  currentTheme: 'light' | 'dark';
  loading: Record<string, boolean>;
  modals: {
    bid: boolean;
    share: boolean;
    wishlist: boolean;
    login: boolean;
  };
  // Auction listing UI state
  viewMode: 'grid' | 'list';
  currentPage: number;
  mobileFiltersOpen: boolean;
}

const initialState: UIState = {
  isMenuOpen: false,
  isScrolled: false,
  sidebarOpen: false,
  currentTheme: 'light',
  loading: {},
  modals: {
    bid: false,
    share: false,
    wishlist: false,
    login: false,
  },
  // Auction listing UI state
  viewMode: 'grid',
  currentPage: 1,
  mobileFiltersOpen: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setMenuOpen: (state, action: PayloadAction<boolean>) => {
      state.isMenuOpen = action.payload;
    },
    setScrolled: (state, action: PayloadAction<boolean>) => {
      state.isScrolled = action.payload;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.currentTheme = action.payload;
    },
    setLoading: (
      state,
      action: PayloadAction<{ key: string; loading: boolean }>
    ) => {
      state.loading[action.payload.key] = action.payload.loading;
    },
    clearLoading: (state, action: PayloadAction<string>) => {
      delete state.loading[action.payload];
    },
    openModal: (state, action: PayloadAction<keyof UIState['modals']>) => {
      state.modals[action.payload] = true;
    },
    closeModal: (state, action: PayloadAction<keyof UIState['modals']>) => {
      state.modals[action.payload] = false;
    },
    closeAllModals: (state) => {
      Object.keys(state.modals).forEach((key) => {
        state.modals[key as keyof UIState['modals']] = false;
      });
    },
    // Auction listing UI actions
    setViewMode: (state, action: PayloadAction<'grid' | 'list'>) => {
      state.viewMode = action.payload;
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
    setMobileFiltersOpen: (state, action: PayloadAction<boolean>) => {
      state.mobileFiltersOpen = action.payload;
    },
  },
});

export const {
  setMenuOpen,
  setScrolled,
  setSidebarOpen,
  setTheme,
  setLoading,
  clearLoading,
  openModal,
  closeModal,
  closeAllModals,
  setViewMode,
  setCurrentPage,
  setMobileFiltersOpen,
} = uiSlice.actions;

export default uiSlice.reducer;
