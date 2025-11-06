// Path: lib/mockUsers.ts

import bcrypt from 'bcryptjs';

export let mockUsers: Array<{
  id: number;
  email: string;
  password: string;
  name: string;
}> = [];

// Pre-seed with hashed test user (run once)
if (mockUsers.length === 0) {
  const hashedPassword = bcrypt.hashSync('password123', 10);
  mockUsers = [
    { id: 1, email: 'user@example.com', password: hashedPassword, name: 'Test User' },
  ];
}

// Helper to add user (used in sign-up)
export const addMockUser = async (email: string, password: string, name: string) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = {
    id: mockUsers.length + 1,
    email,
    password: hashedPassword,
    name,
  };
  mockUsers.push(newUser);
  return newUser;
};