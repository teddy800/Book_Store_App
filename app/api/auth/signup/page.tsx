// Path: app/auth/signup/page.tsx

'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function SignUp() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCredentials = async () => {
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (!name || !email.includes('@')) {
      toast.error('Please fill valid name and email');
      return;
    }

    setLoading(true);
    try {
      // ✅ API call to register
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        toast.error(error || 'Registration failed');
        return;
      }

      toast.success('Account created! Signing you in...');
      // Auto-sign in
      const signInRes = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl,
      });
      if (signInRes?.ok) {
        router.push(callbackUrl);
      } else {
        toast.error('Sign-in failed after registration');
      }
    } catch (error) {
      toast.error('Registration failed. Please try again.');
      console.error('Signup error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignUp = (provider: 'google' | 'github') => {
    signIn(provider, { callbackUrl });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Join BookWise Pro</CardTitle>
          <CardDescription>Create your account to discover extraordinary books.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="credentials" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="credentials">Email</TabsTrigger>
              <TabsTrigger value="google">Google</TabsTrigger>
              <TabsTrigger value="github">GitHub</TabsTrigger>
            </TabsList>
            <TabsContent value="credentials" className="space-y-4">
              <Input 
                placeholder="Full Name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />
              <Input 
                type="email" 
                placeholder="Email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
              <Input 
                type="password" 
                placeholder="Password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
              <Input 
                type="password" 
                placeholder="Confirm Password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                required 
              />
              <Button onClick={handleCredentials} className="w-full" disabled={loading}>
                {loading ? 'Creating Account...' : 'Sign Up'}
              </Button>
            </TabsContent>
            <TabsContent value="google" className="space-y-4">
              <Button onClick={() => handleSocialSignUp('google')} className="w-full" disabled={loading}>
                Sign up with Google
              </Button>
            </TabsContent>
            <TabsContent value="github" className="space-y-4">
              <Button onClick={() => handleSocialSignUp('github')} className="w-full" disabled={loading}>
                Sign up with GitHub
              </Button>
            </TabsContent>
          </Tabs>
          <Button 
            variant="link" 
            onClick={() => router.push('/auth/signin')} 
            className="w-full mt-4"
            disabled={loading}
          >
            Already have an account? Sign In
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}