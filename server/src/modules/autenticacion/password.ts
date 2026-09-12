import * as argon2 from "argon2";
export const passwordOptions = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;
export const hashPassword = (password: string) => argon2.hash(password, passwordOptions);
export const verifyPassword = (hash: string, password: string) =>
  argon2.verify(hash, password).catch(() => false);
