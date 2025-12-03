/* eslint-disable no-console */
import { PrismaClient, Grade, Role } from "../app/generated/prisma"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function upsertTeacher() {
  const passwordHash = await bcrypt.hash("password", 10)

  const teacher = await prisma.user.upsert({
    where: { email: "prof@test.com" },
    update: {
      role: Role.TEACHER,
      passwordHash,
      firstName: "Marie",
      lastName: "Curie",
      name: "Marie Curie",
    },
    create: {
      email: "prof@test.com",
      role: Role.TEACHER,
      passwordHash,
      firstName: "Marie",
      lastName: "Curie",
      name: "Marie Curie",
    },
  })

  return teacher
}

async function upsertAdmin() {
  const passwordHash = await bcrypt.hash("azerty", 10)
  const admin = await prisma.user.upsert({
    where: { email: "admin@test" },
    update: {
      role: Role.ADMIN,
      passwordHash,
      firstName: "Admin",
      lastName: "User",
      name: "Admin",
    },
    create: {
      email: "admin@test",
      role: Role.ADMIN,
      passwordHash,
      firstName: "Admin",
      lastName: "User",
      name: "Admin",
    },
  })
  return admin
}

async function createClassrooms(teacherId: string) {
  const names = ["Terminale S1", "Seconde A"]
  const classrooms = await Promise.all(
    names.map((name) =>
      prisma.classroom.upsert({
        where: { teacherId_name: { teacherId, name } },
        update: {},
        create: { name, teacherId },
      })
    )
  )
  return classrooms
}

function generateStudentName(index: number) {
  const firstNames = [
    "Alex", "Sam", "Lea", "Noah", "Eva", "Liam", "Mia", "Hugo", "Zoé", "Leo",
    "Nina", "Paul", "Aya", "Tom", "Lina", "Yanis", "Ella", "Jade", "Adam", "Emma",
  ]
  const lastNames = [
    "Martin", "Bernard", "Thomas", "Petit", "Robert", "Richard", "Durand", "Dubois", "Moreau", "Laurent",
    "Simon", "Michel", "Lefebvre", "Leroy", "Roux", "David", "Bertrand", "Morel", "Fournier", "Girard",
  ]
  return {
    firstName: firstNames[index % firstNames.length],
    lastName: lastNames[index % lastNames.length],
  }
}

async function createStudents(total: number) {
  const students = []
  for (let i = 1; i <= total; i++) {
    const { firstName, lastName } = generateStudentName(i - 1)
    const email = `eleve${String(i).padStart(2, "0")}@test.com`
    const student = await prisma.user.upsert({
      where: { email },
      update: {
        role: Role.STUDENT,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
      },
      create: {
        email,
        role: Role.STUDENT,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
      },
    })
    students.push(student)
  }
  return students
}

async function enrollStudents(classrooms: { id: string }[], students: { id: string }[]) {
  const perClass = Math.ceil(students.length / classrooms.length)
  const ops: Promise<unknown>[] = []
  classrooms.forEach((c, ci) => {
    const slice = students.slice(ci * perClass, (ci + 1) * perClass)
    slice.forEach((s, idx) => {
      ops.push(
        prisma.enrollment.upsert({
          where: { classroomId_studentId: { classroomId: c.id, studentId: s.id } },
          update: { isActive: true },
          create: { classroomId: c.id, studentId: s.id, seatNumber: String(idx + 1) },
        })
      )
    })
  })
  await Promise.all(ops)
}

async function createDomainAndCompetencies(teacherId: string) {
  const domain = await prisma.competencyDomain.upsert({
    where: { createdById_title: { createdById: teacherId, title: "S'approprier" } },
    update: {},
    create: {
      title: "S'approprier",
      createdById: teacherId,
      competencies: {
        create: [
          { title: "Compétence A1", code: "A1", description: "Compréhension et appropriation A1" },
          { title: "Compétence A2", code: "A2", description: "Compréhension et appropriation A2" },
          { title: "Compétence A3", code: "A3", description: "Compréhension et appropriation A3" },
        ],
      },
    },
    include: { competencies: true },
  })
  return domain
}

async function createSessionsAndEvaluations(teacherId: string) {
  const classrooms = await prisma.classroom.findMany({ where: { teacherId } })
  const competencies = await prisma.competency.findMany({
    where: { domain: { createdById: teacherId, title: "S'approprier" } },
    orderBy: { code: "asc" },
  })

  const grades = [Grade.A, Grade.B, Grade.C, Grade.D]

  for (const classroom of classrooms) {
    const session = await prisma.evaluationSession.create({
      data: {
        name: `Séance ${new Date().toLocaleDateString("fr-FR")} - ${classroom.name}`,
        classroomId: classroom.id,
        teacherId,
        startedAt: new Date(),
      },
    })

    const enrollments = await prisma.enrollment.findMany({
      where: { classroomId: classroom.id, isActive: true },
      include: { student: true },
    })

    const evalOps: Promise<unknown>[] = []
    for (const [i, enr] of enrollments.entries()) {
      const chosenCompetencies = [competencies[0], competencies[1], competencies[2]].filter(Boolean)
      for (const [j, comp] of chosenCompetencies.entries()) {
        // Distribue des notes variées
        const grade = grades[(i + j) % grades.length]
        evalOps.push(
          prisma.evaluation.upsert({
            where: {
              sessionId_studentId_competencyId: {
                sessionId: session.id,
                studentId: enr.studentId,
                competencyId: comp.id,
              },
            },
            update: {
              grade,
              comment: grade === Grade.A ? "Excellent" : grade === Grade.B ? "Bon" : grade === Grade.C ? "À renforcer" : "Non acquis",
            },
            create: {
              sessionId: session.id,
              studentId: enr.studentId,
              competencyId: comp.id,
              grade,
              comment: grade === Grade.A ? "Excellent" : grade === Grade.B ? "Bon" : grade === Grade.C ? "À renforcer" : "Non acquis",
            },
          })
        )
      }
    }
    await Promise.all(evalOps)
  }
}

async function main() {
  console.log("Seeding database...")
  await upsertAdmin()
  const teacher = await upsertTeacher()
  const classrooms = await createClassrooms(teacher.id)
  const students = await createStudents(20)
  await enrollStudents(classrooms, students)
  await createDomainAndCompetencies(teacher.id)
  await createSessionsAndEvaluations(teacher.id)
  console.log("Seed completed.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


