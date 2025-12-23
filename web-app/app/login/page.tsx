'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

  // Send OTP
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
      const response = await authApi.post('/auth/send-otp', {
        phone: phone,
        purpose: 'login',
      });
      
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
      const message = error.response?.data?.message || 'Invalid OTP';
      setError(message);
      toast.error('Invalid OTP', {
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      const response = await authApi.post('/auth/send-otp', {
        phone,
        purpose: 'login',
      });
      
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
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone Number</label>
                <div className="flex">
                  <div className="flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md">
                    <span className="text-gray-600">+91</span>
                  </div>
                  <Input
                    type="tel"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="rounded-l-none"
                    maxLength={10}
                    disabled={isLoading}
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send OTP'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">OTP</label>
                <Input
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-2xl tracking-widest"
                  maxLength={6}
                  disabled={isLoading}
                />
                {error && <p className="text-sm text-red-500">{error}</p>}
              </div>
              
              <div className="text-sm text-center space-y-2">
                <div className="text-gray-600">
                  Sent to +91 {phone}
                  <Button
                    type="button"
                    variant="link"
                    className="ml-2 p-0 h-auto"
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
                  <div className="text-green-600 font-semibold">
                    Your OTP: {displayOtp}
                  </div>
                )}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
