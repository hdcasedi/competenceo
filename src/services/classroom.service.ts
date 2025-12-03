import prisma from "../../lib/prisma"
import type { Prisma } from "../../app/generated/prisma"

export type ClassroomWithRelations = Prisma.ClassroomGetPayload<{
  include: {
    enrollments: { include: { student: true } }
    groups: true
    sessions: true
  }
}>

export async function getClassroomsByTeacher(teacherId: string): Promise<ClassroomWithRelations[]> {
  return prisma.classroom.findMany({
    where: { teacherId },
    include: {
      enrollments: { include: { student: true } },
      groups: true,
      sessions: true,
    },
    orderBy: { name: "asc" },
  })
}


