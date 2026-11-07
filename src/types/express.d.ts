export {};

declare global {
  namespace Express {
    interface Request {
      admin?: {
        id: string;
        username: string;
        email: string;
        fullName: string | null;
        role: "ADMIN" | "SUPER_ADMIN";
      };

      sessionId?: string;
    }
  }
}
