// Path: app/auth/signin/page.tsx

'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function SignIn() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleCredentials = async () => {
    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
      callbackUrl,
    });
    if (res?.ok) {
      toast.success('Signed in!');
      router.push(callbackUrl);
    } else {
      toast.error('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign In to BookWise Pro</CardTitle>
          <CardDescription>Welcome back! Discover more with your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="credentials" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="credentials">Email</TabsTrigger>
              <TabsTrigger value="google">Google</TabsTrigger>
              <TabsTrigger value="github">GitHub</TabsTrigger>
            </TabsList>
            <TabsContent value="credentials" className="space-y-4">
              <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <Button onClick={handleCredentials} className="w-full">Sign In</Button>
            </TabsContent>
            <TabsContent value="google" className="space-y-4">
              <Button onClick={() => signIn('google', { callbackUrl })} className="w-full">Sign in with Google</Button>
            </TabsContent>
            <TabsContent value="github" className="space-y-4">
              <Button onClick={() => signIn('github', { callbackUrl })} className="w-full">Sign in with GitHub</Button>
            </TabsContent>
          </Tabs>
          <Button variant="link" onClick={() => router.push('/auth/signup')} className="w-full mt-4">
            Don't have an account? Sign Up
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}