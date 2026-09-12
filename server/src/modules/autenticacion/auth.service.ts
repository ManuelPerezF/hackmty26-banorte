import {
  ConflictException,
  Inject,
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from "@nestjs/common";
import { createHash, randomBytes } from "node:crypto";
import { ENV, Environment } from "../../config/env";
import { PrismaService } from "../../database/prisma.service";
import { Prisma } from "../../generated/prisma/client";
import { Identity } from "./auth.types";
import { Registration } from "./auth.schemas";
import { hashPassword, verifyPassword } from "./password";
import { provision } from "./initial-data";
export const sessionCookie = "banorte_session";
type SessionWithUser = Prisma.SessionGetPayload<{
  include: { user: { include: { profile: { include: { account: true } } } } };
}>;
const digest = (value: string) => createHash("sha256").update(value).digest("hex");
@Injectable()
export class AuthService implements OnModuleInit {
  private dummyHash = "";
  constructor(
    private readonly db: PrismaService,
    @Inject(ENV) private readonly env: Environment,
  ) {}
  async onModuleInit() {
    this.dummyHash = await hashPassword(randomBytes(32).toString("hex"));
  }
  async register(input: Registration) {
    const passwordHash = await hashPassword(input.password);
    try {
      return await this.db.$transaction(async (tx) => {
        const user = await tx.user.create({ data: { email: input.email, passwordHash } });
        const profile = await provision(tx, user.id, input.displayName, this.env.BUSINESS_TIMEZONE);
        return { user: { id: user.id, email: user.email, displayName: profile.displayName } };
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
        throw new ConflictException({
          code: "EMAIL_ALREADY_REGISTERED",
          message: "El email ya está registrado.",
        });
      throw e;
    }
  }
  async login(email: string, password: string, oldToken?: string) {
    const user = await this.db.user.findUnique({ where: { email }, include: { profile: true } });
    const valid = await verifyPassword(user?.active ? user.passwordHash : this.dummyHash, password);
    if (!valid || !user?.active || !user.profile)
      throw new UnauthorizedException({
        code: "INVALID_CREDENTIALS",
        message: "Credenciales incorrectas.",
      });
    if (oldToken) await this.revokeToken(oldToken);
    const token = randomBytes(32).toString("base64url");
    const session = await this.db.session.create({
      data: {
        userId: user.id,
        tokenHash: digest(token),
        csrfToken: randomBytes(32).toString("base64url"),
        expiresAt: new Date(Date.now() + this.env.SESSION_HOURS * 3600000),
      },
    });
    return {
      token,
      data: {
        user: { id: user.id, email: user.email, displayName: user.profile.displayName },
        expiresAt: session.expiresAt.getTime(),
        csrfToken: session.csrfToken,
      },
    };
  }
  async resolve(token: string, touch = true) {
    if (!/^[A-Za-z0-9_-]{43}$/.test(token)) throw new UnauthorizedException();
    const session = await this.db.session.findUnique({
      where: { tokenHash: digest(token) },
      include: { user: { include: { profile: { include: { account: true } } } } },
    });
    return this.validate(session, touch);
  }
  async bySessionId(id: string, touch = false) {
    const session = await this.db.session.findUnique({
      where: { id },
      include: { user: { include: { profile: { include: { account: true } } } } },
    });
    return this.validate(session, touch);
  }
  private async validate(session: SessionWithUser | null, touch: boolean) {
    const now = Date.now();
    if (
      !session ||
      session.revokedAt ||
      session.expiresAt.getTime() <= now ||
      session.lastSeenAt.getTime() + this.env.SESSION_IDLE_MINUTES * 60000 <= now ||
      !session.user.active ||
      !session.user.profile?.account
    )
      throw new UnauthorizedException({
        code: "UNAUTHENTICATED",
        message: "Inicia sesión para continuar.",
      });
    if (touch && now - session.lastSeenAt.getTime() > 60000)
      await this.db.session.updateMany({
        where: { id: session.id, revokedAt: null },
        data: { lastSeenAt: new Date(now) },
      });
    const identity: Identity = {
      userId: session.userId,
      profileId: session.user.profile.id,
      accountId: session.user.profile.account.id,
      sessionId: session.id,
      timezone: session.user.profile.timezone,
    };
    return {
      identity,
      csrfToken: session.csrfToken,
      expiresAt: session.expiresAt.getTime(),
      user: {
        id: session.userId,
        email: session.user.email,
        displayName: session.user.profile.displayName,
      },
    };
  }
  async revokeToken(token: string) {
    const sessions = await this.db.session.findMany({
      where: { tokenHash: digest(token), revokedAt: null },
      select: { id: true },
    });
    await this.db.$transaction([
      this.db.session.updateMany({
        where: { tokenHash: digest(token), revokedAt: null },
        data: { revokedAt: new Date() },
      }),
      this.db.pendingAction.updateMany({
        where: { sessionId: { in: sessions.map((s) => s.id) }, status: "pending" },
        data: { status: "cancelled" },
      }),
    ]);
  }
}
