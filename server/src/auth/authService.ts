import type { Role, User, SchoolMembership } from '../../../src/types/platform';

export interface AuthSession {
  token: string;
  user: User;
  membership: SchoolMembership;
}

export class AuthService {
  private users = new Map<string, User & { passwordHash: string }>();
  private memberships = new Map<string, SchoolMembership>();
  private sessions = new Map<string, { userId: string; schoolId: string; role: Role }>();

  async registerUser(params: {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    schoolId: string;
    role: Role;
  }): Promise<{ user: User; membership: SchoolMembership }> {
    const userId = 'usr_' + Math.random().toString(36).substring(2, 11);
    const user: User & { passwordHash: string } = {
      id: userId,
      email: params.email.toLowerCase(),
      firstName: params.firstName,
      lastName: params.lastName,
      status: 'active',
      passwordHash: this.hashPassword(params.password),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const membership: SchoolMembership = {
      id: 'mem_' + Math.random().toString(36).substring(2, 11),
      schoolId: params.schoolId,
      userId,
      role: params.role,
      status: 'active',
      joinedAt: new Date().toISOString(),
    };

    this.users.set(user.id, user);
    this.memberships.set(`${params.schoolId}:${userId}`, membership);
    return { user, membership };
  }

  async login(email: string, password: string, schoolId: string): Promise<AuthSession> {
    const user = Array.from(this.users.values()).find(
      (u) => u.email === email.toLowerCase() && u.status === 'active'
    );
    if (!user || user.passwordHash !== this.hashPassword(password)) {
      throw new Error('Invalid credentials or inactive account');
    }

    const membership = this.memberships.get(`${schoolId}:${user.id}`);
    if (!membership || membership.status !== 'active') {
      throw new Error('User does not have an active membership in this institution');
    }

    const token = 'hlxr_jwt_' + Math.random().toString(36).substring(2) + Date.now();
    this.sessions.set(token, {
      userId: user.id,
      schoolId: membership.schoolId,
      role: membership.role,
    });

    return { token, user, membership };
  }

  validateToken(token: string): { userId: string; schoolId: string; role: Role } {
    const session = this.sessions.get(token);
    if (!session) throw new Error('Unauthorized or expired session');
    return session;
  }

  logout(token: string): void {
    this.sessions.delete(token);
  }

  private hashPassword(password: string): string {
    // Standard mock digest for portable in-memory tests (replaced with Argon2id in production container)
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      hash = (hash << 5) - hash + password.charCodeAt(i);
      hash |= 0;
    }
    return `hash_${Math.abs(hash)}`;
  }
}
