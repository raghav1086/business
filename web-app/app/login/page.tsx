'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { authApi, tokenStorage } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';

// Phone number validation schema
const phoneSchema = z.object({
  phone: z.string()
    .length(10, 'Phone number must be 10 digits')
    .regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number'),
});

// OTP validation schema
const otpSchema = z.object({
  otp: z.string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only numbers'),
});

type PhoneFormValues = z.infer<typeof phoneSchema>;
type OtpFormValues = z.infer<typeof otpSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Phone form
  const phoneForm = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
  });

  // OTP form
  const otpForm = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' },
  });

  // Send OTP
  const onPhoneSubmit = async (data: PhoneFormValues) => {
    setIsLoading(true);
    try {
      await authApi.post('/auth/send-otp', {
        phone: data.phone,
        purpose: 'login',
      });
      
      setPhone(data.phone);
      setStep('otp');
      toast.success('OTP sent successfully', {
        description: `A 6-digit OTP has been sent to ${data.phone}`,
      });
    } catch (error: any) {
      toast.error('Failed to send OTP', {
        description: error.response?.data?.message || 'Please try again',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP
  const onOtpSubmit = async (data: OtpFormValues) => {
    setIsLoading(true);
    try {
      const response = await authApi.post('/auth/verify-otp', {
        phone,
        otp: data.otp,
        purpose: 'login',
      });

      const { access_token, refresh_token, user } = response.data;

      // Store tokens
      tokenStorage.setAccessToken(access_token);
      tokenStorage.setRefreshToken(refresh_token);
      
      // Set user in store
      setUser({ id: user.id, phone: user.phone });

      toast.success('Login successful', {
        description: 'Welcome back!',
      });

      // Redirect to business selection
      router.push('/business/select');
    } catch (error: any) {
      toast.error('Invalid OTP', {
        description: error.response?.data?.message || 'Please check and try again',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      await authApi.post('/auth/send-otp', {
        phone,
        purpose: 'login',
      });
      
      toast.success('OTP resent successfully');
      otpForm.reset();
    } catch (error: any) {
      toast.error('Failed to resend OTP', {
        description: error.response?.data?.message || 'Please try again',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Business Manager
          </CardTitle>
          <CardDescription className="text-center">
            {step === 'phone'
              ? 'Enter your phone number to receive OTP'
              : 'Enter the 6-digit OTP sent to your phone'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'phone' ? (
            <Form {...phoneForm}>
              <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-4">
                <FormField
                  control={phoneForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <div className="flex">
                          <div className="flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md">
                            <span className="text-gray-600">+91</span>
                          </div>
                          <Input
                            placeholder="9876543210"
                            {...field}
                            className="rounded-l-none"
                            maxLength={10}
                            disabled={isLoading}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Sending...' : 'Send OTP'}
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...otpForm}>
              <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-4">
                <FormField
                  control={otpForm.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>OTP</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="123456"
                          {...field}
                          className="text-center text-2xl tracking-widest"
                          maxLength={6}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="text-sm text-center text-gray-600">
                  Sent to +91 {phone}
                  <Button
                    type="button"
                    variant="link"
                    className="ml-2 p-0 h-auto"
                    onClick={() => {
                      setStep('phone');
                      otpForm.reset();
                    }}
                    disabled={isLoading}
                  >
                    Change
                  </Button>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Verifying...' : 'Verify OTP'}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={handleResendOtp}
                  disabled={isLoading}
                >
                  Resend OTP
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
