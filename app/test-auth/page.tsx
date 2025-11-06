'use client';
import { useSession, signIn, signOut } from 'next-auth/react';

export default function TestAuth() {
  const { data: session, status } = useSession();

  if (status === 'loading') return <p>Loading...</p>;

  return (
    <div className="p-8">
      {session ? (
        <div>
          <p>Signed in as {session.user?.email}</p>
          <button onClick={() => signOut()}>Sign Out</button>
        </div>
      ) : (
        <button onClick={() => signIn('credentials', { email: 'user@example.com', password: 'password123', redirect: false })}>
          Sign In (Test User)
        </button>
      )}
    </div>
  );
}