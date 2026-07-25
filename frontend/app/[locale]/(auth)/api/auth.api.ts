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

    resendOtp: builder.mutation<MessageResponse, { email: string }>({
      query: (body) => ({ url: '/auth/resend-otp', method: 'POST', body }),
    }),

    // ─── Profile ──────────────────────────────────────────────────

    getProfile: builder.query<User, void>({
      query: () => '/auth/profile',
      providesTags: ['Profile'],
    }),

    completeProfile: builder.mutation<AuthResponse, CompleteProfileRequest>({
      query: (body) => ({
        url: '/auth/complete-profile',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Profile'],
    }),

    verifyIdentity: builder.mutation<MessageResponse, FormData>({
      query: (body) => ({ url: '/auth/verify-identity', method: 'POST', body }),
      invalidatesTags: ['Profile'],
    }),

    // ─── Password ─────────────────────────────────────────────────

    forgotPassword: builder.mutation<MessageResponse, ForgotPasswordRequest>({
      query: (body) => ({ url: '/auth/forgot-password', method: 'POST', body }),
    }),

    resetPassword: builder.mutation<MessageResponse, ResetPasswordRequest>({
      query: (body) => ({ url: '/auth/reset-password', method: 'PATCH', body }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useVerifyOtpMutation,
  useResendOtpMutation,
  useGetProfileQuery,
  useCompleteProfileMutation,
  useVerifyIdentityMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} = authApi;
