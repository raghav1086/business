'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OTPInput } from '@/components/ui/otp-input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { authApi, tokenStorage } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpId, setOtpId] = useState('');
  const [displayOtp, setDisplayOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Send OTP with auto-detection for new users
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate phone
    if (!phone || phone.length !== 10 || !/^[6-9]\d{9}$/.test(phone)) {
      setError('Please enter a valid 10-digit phone number');
      toast.error('Invalid phone number');
      return;
    }

    setIsLoading(true);
    try {
      // First try with 'login' purpose
      let response;
      try {
        response = await authApi.post('/auth/send-otp', {
          phone: phone,
          purpose: 'login',
        });
      } catch (loginError: any) {
        // If user not found, automatically try registration
        if (loginError.response?.status === 400 && 
            loginError.response?.data?.message?.includes('User not found')) {
          response = await authApi.post('/auth/send-otp', {
            phone: phone,
            purpose: 'registration',
          });
        } else {
          throw loginError;
        }
      }
      
      // Store otp_id and display OTP for testing
      const { otp_id, otp: receivedOtp } = response.data;
      setOtpId(otp_id);
      setDisplayOtp(receivedOtp);
      
      setStep('otp');
      toast.success('OTP sent successfully', {
        description: `OTP: ${receivedOtp}`,
        duration: 10000,
      });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to send OTP';
      setError(message);
      toast.error('Failed to send OTP', {
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate OTP
    if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      setError('Please enter a valid 6-digit OTP');
      toast.error('Invalid OTP');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.post('/auth/verify-otp', {
        phone,
        otp_id: otpId,
        otp: otp,
      });

      const { tokens, user, is_new_user } = response.data;
      const { access_token, refresh_token } = tokens;

      // Store tokens
      tokenStorage.setAccessToken(access_token);
      tokenStorage.setRefreshToken(refresh_token);
      
      // Set user in store
      setUser({ id: user.id, phone: user.phone });

      toast.success(is_new_user ? 'Registration successful!' : 'Login successful', {
        description: is_new_user ? 'Welcome! Let\'s set up your business.' : 'Welcome back!',
      });

      // Redirect to business selection
      router.push('/business/select');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Invalid OTP';
      setError(message);
      toast.error('Invalid OTP', {
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP with auto-detection for new users
  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      // Try login first, fallback to registration
      let response;
      try {
        response = await authApi.post('/auth/send-otp', {
          phone,
          purpose: 'login',
        });
      } catch (loginError: any) {
        // If user not found, automatically try registration
        if (loginError.response?.status === 400 && 
            loginError.response?.data?.message?.includes('User not found')) {
          response = await authApi.post('/auth/send-otp', {
            phone,
            purpose: 'registration',
          });
        } else {
          throw loginError;
        }
      }
      
      // Store new otp_id and display OTP
      const { otp_id, otp: receivedOtp } = response.data;
      setOtpId(otp_id);
      setDisplayOtp(receivedOtp);
      
      toast.success('OTP resent successfully', {
        description: `OTP: ${receivedOtp}`,
        duration: 10000,
      });
      setOtp('');
    } catch (error: any) {
      toast.error('Failed to resend OTP', {
        description: error.response?.data?.message || 'Please try again',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/3 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <Card className="w-full max-w-md relative z-10 shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <CardHeader className="space-y-4 pb-6">
          {/* Logo and Brand */}
          <div className="flex flex-col items-center space-y-4">
            <div className="w-20 h-20 flex items-center justify-center">
              <img
                src="/samruddhi-logo.svg"
                alt="Samruddhi Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-center space-y-1">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Samruddhi
              </CardTitle>
              <p className="text-sm text-muted-foreground font-medium">
                Business Management Platform
              </p>
            </div>
          </div>
          <CardDescription className="text-center text-base pt-2">
            {step === 'phone'
              ? 'Enter your phone number to receive OTP'
              : 'Enter the 6-digit OTP sent to your phone'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 'phone' ? (
            <form onSubmit={handlePhoneSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground mb-3 block">
                  Phone Number
                </label>
                <div className="flex shadow-md rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all duration-200">
                  <div className="flex items-center px-4 sm:px-5 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 border-r-2 border-gray-200 dark:border-gray-700">
                    <span className="text-gray-700 dark:text-gray-300 font-bold text-base sm:text-lg">+91</span>
                  </div>
                  <Input
                    type="tel"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="rounded-none border-0 focus-visible:ring-0 focus-visible:border-0 h-12 sm:h-14 text-base sm:text-lg font-semibold px-4 bg-white dark:bg-gray-800"
                    maxLength={10}
                    disabled={isLoading}
                    inputMode="numeric"
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1.5 mt-2 px-1">
                    <span className="text-base">⚠️</span> 
                    <span>{error}</span>
                  </p>
                )}
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-6 shadow-lg hover:shadow-xl transition-all duration-200" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span> Sending OTP...
                  </span>
                ) : (
                  'Send OTP'
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-5">
              <div className="space-y-4">
                <label className="text-sm font-semibold text-foreground block text-center">
                  Enter OTP
                </label>
                <OTPInput
                  value={otp}
                  onChange={setOtp}
                  length={6}
                  disabled={isLoading}
                  autoFocus={true}
                />
                {error && (
                  <p className="text-sm text-red-600 dark:text-red-400 flex items-center justify-center gap-1.5 mt-2 px-1">
                    <span className="text-base">⚠️</span> 
                    <span>{error}</span>
                  </p>
                )}
              </div>
              
              <div className="text-sm text-center space-y-3 py-2">
                <div className="text-muted-foreground flex items-center justify-center gap-2">
                  <span>📱</span>
                  <span>Sent to +91 {phone}</span>
                  <Button
                    type="button"
                    variant="link"
                    className="ml-2 p-0 h-auto text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold"
                    onClick={() => {
                      setStep('phone');
                      setOtp('');
                      setError('');
                      setDisplayOtp('');
                    }}
                    disabled={isLoading}
                  >
                    Change
                  </Button>
                </div>
                {displayOtp && (
                  <div className="text-green-600 dark:text-green-400 font-semibold bg-green-50 dark:bg-green-900/20 py-2 px-4 rounded-lg border border-green-200 dark:border-green-800">
                    🔑 Your OTP: {displayOtp}
                  </div>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-6 shadow-lg hover:shadow-xl transition-all duration-200" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span> Verifying...
                  </span>
                ) : (
                  'Verify OTP'
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
                onClick={handleResendOtp}
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Resend OTP'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
      
      {/* Footer text */}
      <div className="absolute bottom-6 left-0 right-0 text-center text-xs text-muted-foreground z-10">
        <p>© 2024 Samruddhi. All rights reserved.</p>
      </div>
    </div>
  );
}
