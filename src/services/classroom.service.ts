import prisma from "../../lib/prisma"
import type { Classroom } from "../../app/generated/prisma"

export async function getClassroomsByTeacher(teacherId: string): Promise<Classroom[]> {
  return prisma.classroom.findMany({
    where: { teacherId },
    orderBy: { name: "asc" },
  })
}


