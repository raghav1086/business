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
      
      // Set user in store (include is_superadmin if available)
      setUser({ 
        id: user.id, 
        phone: user.phone,
        is_superadmin: user.is_superadmin || false,
      });

      toast.success(is_new_user ? 'Registration successful!' : 'Login successful', {
        description: is_new_user ? 'Welcome! Let\'s set up your business.' : 'Welcome back!',
      });

      // Redirect based on user type
      if (user.is_superadmin) {
        router.push('/admin');
      } else {
        router.push('/business/select');
      }
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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/3 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center relative z-10">
        {/* Left Side - Branding & Features (Hidden on mobile, shown on desktop) */}
        <div className="hidden lg:block space-y-8">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 flex items-center justify-center">
                <img
                  src="/samruddhi-logo.svg"
                  alt="Samruddhi Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Samruddhi
                </h1>
                <p className="text-lg text-muted-foreground font-medium">
                  समृद्धि - Where prosperity meets purpose
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Complete Business Management for Indian MSMEs
              </h2>
              <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                Streamline your business operations with invoicing, inventory, GST compliance, 
                and accounting—all in one powerful platform designed for Indian businesses.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
                <div className="text-2xl">📊</div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">GST Compliance</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Auto-calculated GST & reports</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
                <div className="text-2xl">📦</div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Inventory Management</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Real-time stock tracking</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
                <div className="text-2xl">🧾</div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Smart Invoicing</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Professional invoices & billing</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
                <div className="text-2xl">💰</div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Accounting & Reports</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Complete financial insights</p>
                </div>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center gap-6 pt-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span>Secure & Encrypted</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span>100% India Compliant</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Card */}
        <Card className="w-full max-w-md mx-auto shadow-2xl border-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm">
          <CardHeader className="space-y-4 pb-6">
            {/* Logo and Brand (Mobile) */}
            <div className="flex flex-col items-center space-y-4 lg:hidden">
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
                  समृद्धि - Where prosperity meets purpose
                </p>
              </div>
            </div>
            
            {/* Desktop Header */}
            <div className="hidden lg:block text-center space-y-2">
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {step === 'phone' ? 'Welcome Back' : 'Verify Your Account'}
              </CardTitle>
            </div>

            <CardDescription className="text-center text-sm sm:text-base pt-2 space-y-1">
              {step === 'phone' ? (
                <>
                  <p className="font-medium text-gray-700 dark:text-gray-300">
                    Sign in to access your business dashboard
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Enter your phone number to receive a secure OTP
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium text-gray-700 dark:text-gray-300">
                    We've sent a 6-digit code to your phone
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Enter the code below to complete verification
                  </p>
                </>
              )}
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
                  <div className="mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
                      <span className="text-base">⚠️</span> 
                      <span className="font-medium">{error}</span>
                    </p>
                  </div>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 px-1">
                  By continuing, you agree to receive OTP via SMS. Standard message rates may apply.
                </p>
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-6 shadow-lg hover:shadow-xl transition-all duration-200 text-base" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span> Sending OTP...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span>📲</span> Send OTP
                  </span>
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
                  <div className="mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-700 dark:text-red-400 flex items-center justify-center gap-2">
                      <span className="text-base">⚠️</span> 
                      <span className="font-medium">{error}</span>
                    </p>
                  </div>
                )}
              </div>
              
              <div className="text-sm text-center space-y-3 py-2">
                <div className="text-muted-foreground flex flex-wrap items-center justify-center gap-2 px-2">
                  <span className="text-base">📱</span>
                  <span className="font-medium">Sent to +91 {phone}</span>
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold underline"
                    onClick={() => {
                      setStep('phone');
                      setOtp('');
                      setError('');
                      setDisplayOtp('');
                    }}
                    disabled={isLoading}
                  >
                    Change Number
                  </Button>
                </div>
                {displayOtp && (
                  <div className="text-green-700 dark:text-green-400 font-semibold bg-green-50 dark:bg-green-900/30 py-3 px-4 rounded-lg border-2 border-green-300 dark:border-green-700 shadow-sm">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-lg">🔑</span>
                      <span>Your OTP: <span className="font-mono text-lg tracking-wider">{displayOtp}</span></span>
                    </div>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-normal">
                      For testing purposes only
                    </p>
                  </div>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 pt-1">
                  Didn't receive the code? Check your SMS or{' '}
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                  >
                    resend OTP
                  </button>
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-6 shadow-lg hover:shadow-xl transition-all duration-200 text-base" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span> Verifying...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span>✓</span> Verify & Continue
                  </span>
                )}
              </Button>

              <div className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 font-medium transition-all"
                  onClick={handleResendOtp}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin">⏳</span> Sending...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span>↻</span> Resend OTP
                    </span>
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
        </Card>
      </div>
      
      {/* Footer text */}
      <div className="absolute bottom-4 sm:bottom-6 left-0 right-0 text-center text-xs text-muted-foreground z-10 px-4">
        <p className="text-gray-600 dark:text-gray-400">
          © 2024 Samruddhi. All rights reserved. | 
          <span className="ml-1">Secure • Compliant • Trusted</span>
        </p>
      </div>
    </div>
  );
}
