import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Category } from '@/app/[locale]/(website)/models';

interface CategoriesState {
  categories: Category[];
  selectedCategory: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: CategoriesState = {
  categories: [],
  selectedCategory: null,
  loading: false,
  error: null,
};

const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    setCategories: (state, action: PayloadAction<Category[]>) => {
      state.categories = action.payload;
    },
    setSelectedCategory: (state, action: PayloadAction<string | null>) => {
      state.selectedCategory = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearCategorySelection: (state) => {
      state.selectedCategory = null;
    },
  },
});

export const {
  setCategories,
  setSelectedCategory,
  setLoading,
  setError,
  clearCategorySelection,
} = categoriesSlice.actions;

export default categoriesSlice.reducer;
