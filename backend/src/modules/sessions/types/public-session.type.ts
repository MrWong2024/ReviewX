export interface PublicSession {
  id: string;
  userId: string;
  expiresAt: Date;
  revokedAt?: Date | null;
  lastSeenAt?: Date | null;
  userAgent?: string | null;
  ip?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatedSessionResult {
  token: string;
  session: PublicSession;
  expiresAt: Date;
}
