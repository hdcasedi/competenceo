import prisma from "../../lib/prisma"
import type { User, Role } from "../../app/generated/prisma"

export async function getUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email } })
}

export interface CreateUserInput {
  email: string
  passwordHash?: string
  name?: string
  firstName?: string
  lastName?: string
  role?: Role
  image?: string
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const {
    email,
    passwordHash,
    name,
    firstName,
    lastName,
    image,
    role,
  } = input

  return prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      firstName,
      lastName,
      image,
      role: role ?? "STUDENT",
    },
  })
}


