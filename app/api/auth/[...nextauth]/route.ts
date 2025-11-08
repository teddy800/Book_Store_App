import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth'; // Your auth options (Step 3)

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };