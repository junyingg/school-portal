import {
  createClassRequestSchema,
  createTeacherRequestSchema,
  unknownTeacherEmailMessage,
  type SchoolClass,
  type Teacher,
} from "@school-portal/contract"
import { delay, http, HttpResponse } from "msw"
import { designClasses, designTeachers } from "../designFixtures.ts"

export const TEACHERS_URL = "/api/teachers"
export const CLASSES_URL = "/api/classes"

const HTTP_CREATED = 201
const HTTP_BAD_REQUEST = 400
const HTTP_BAD_GATEWAY = 502

interface Store {
  teachers: Teacher[]
  classes: SchoolClass[]
}

const store: Store = { teachers: [], classes: [] }

export function resetStore(): void {
  store.teachers = [...designTeachers]
  store.classes = [...designClasses]
}

resetStore()

function errorReply(status: number, error: string) {
  return HttpResponse.json({ error }, { status })
}

function firstIssueMessage(issues: readonly { message: string }[]): string {
  return issues.map((issue) => issue.message).join("; ")
}

export const handlers = [
  http.get(TEACHERS_URL, () => HttpResponse.json({ data: store.teachers })),

  http.post(TEACHERS_URL, async ({ request }) => {
    const parsed = createTeacherRequestSchema.safeParse(await request.json())
    if (!parsed.success) {
      return errorReply(HTTP_BAD_REQUEST, firstIssueMessage(parsed.error.issues))
    }
    store.teachers.push(parsed.data)
    return HttpResponse.json(parsed.data, { status: HTTP_CREATED })
  }),

  http.get(CLASSES_URL, () => HttpResponse.json({ data: store.classes })),

  http.post(CLASSES_URL, async ({ request }) => {
    const parsed = createClassRequestSchema.safeParse(await request.json())
    if (!parsed.success) {
      return errorReply(HTTP_BAD_REQUEST, firstIssueMessage(parsed.error.issues))
    }
    const formTeacher = store.teachers.find(
      (teacher) => teacher.email.toLowerCase() === parsed.data.teacherEmail.toLowerCase(),
    )
    if (formTeacher === undefined) {
      return errorReply(HTTP_BAD_REQUEST, unknownTeacherEmailMessage(parsed.data.teacherEmail))
    }
    const created: SchoolClass = {
      level: parsed.data.level,
      name: parsed.data.name,
      formTeacher: { name: formTeacher.name, email: formTeacher.email },
    }
    store.classes.push(created)
    return HttpResponse.json(created, { status: HTTP_CREATED })
  }),
]

export function teachersWith(teachers: readonly Teacher[]) {
  return http.get(TEACHERS_URL, () => HttpResponse.json({ data: teachers }))
}

export function teachersEmpty() {
  return teachersWith([])
}

export function classesEmpty() {
  return http.get(CLASSES_URL, () => HttpResponse.json({ data: [] }))
}

export function teachersPending() {
  return http.get(TEACHERS_URL, () => delay("infinite"))
}

export function classesPending() {
  return http.get(CLASSES_URL, () => delay("infinite"))
}

export function teachersFail(status: number) {
  return http.get(TEACHERS_URL, () => errorReply(status, "Internal server error"))
}

export function classesFail(status: number) {
  return http.get(CLASSES_URL, () => errorReply(status, "Internal server error"))
}

export function createTeacherFails(status: number, error: string) {
  return http.post(TEACHERS_URL, () => errorReply(status, error))
}

export function createClassFails(status: number, error: string) {
  return http.post(CLASSES_URL, () => errorReply(status, error))
}

export function createTeacherPending() {
  return http.post(TEACHERS_URL, () => delay("infinite"))
}

export function createClassPending() {
  return http.post(CLASSES_URL, () => delay("infinite"))
}

export function networkError(method: "get" | "post", url: string) {
  return http[method](url, () => HttpResponse.error())
}

export function htmlBadGateway(method: "get" | "post", url: string) {
  return http[method](
    url,
    () =>
      new HttpResponse("<html><body>502 Bad Gateway</body></html>", {
        status: HTTP_BAD_GATEWAY,
        headers: { "content-type": "text/html" },
      }),
  )
}
