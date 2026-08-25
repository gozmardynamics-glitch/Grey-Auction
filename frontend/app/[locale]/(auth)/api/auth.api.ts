import { api } from '@/redux/api';
import type {
  User,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  VerifyOtpRequest,
  CompleteProfileRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  MessageResponse,
} from '../models/models';

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // ─── Authentication ───────────────────────────────────────────

    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),

    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),

    verifyOtp: builder.mutation<AuthResponse, VerifyOtpRequest>({
      query: (body) => ({ url: '/auth/verify-otp', method: 'POST', body }),
    }),

    sendOtp: builder.mutation<MessageResponse, { email: string }>({
      query: (body) => ({ url: '/auth/send-otp', method: 'POST', body }),
    }),

    // ─── Profile (backend exposes POST /auth/profile to complete it) ─
    completeProfile: builder.mutation<AuthResponse, CompleteProfileRequest>({
      query: (body) => ({
        url: '/auth/profile',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Profile'],
    }),

    // ─── Password ─────────────────────────────────────────────────

    forgotPassword: builder.mutation<MessageResponse, ForgotPasswordRequest>({
      query: (body) => ({ url: '/auth/forgot-password', method: 'POST', body }),
    }),

    resetPassword: builder.mutation<MessageResponse, ResetPasswordRequest>({
      query: (body) => ({ url: '/auth/reset-password', method: 'POST', body }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useVerifyOtpMutation,
  useSendOtpMutation,
  useCompleteProfileMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} = authApi;
