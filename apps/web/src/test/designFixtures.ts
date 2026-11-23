import {
  classListResponseSchema,
  teacherListResponseSchema,
  type SchoolClass,
  type Teacher,
} from "@school-portal/contract"

const DESIGN_TEACHERS: Teacher[] = [
  {
    name: "Hannah Low",
    subject: "English Language",
    email: "hannah.low@example.com",
    contactNumber: "67363939",
  },
  {
    name: "Wong Sze Ting",
    subject: "Mathematics",
    email: "wong.szeting@example.com",
    contactNumber: "62810482",
  },
  {
    name: "Justin Xiong",
    subject: "Science",
    email: "justin.xiong@example.com",
    contactNumber: "65512234",
  },
  {
    name: "Billy Tan",
    subject: "Art",
    email: "billy.tan@example.com",
    contactNumber: "63370190",
  },
  {
    name: "Gao Ah Xing",
    subject: "Mother Tongue Language",
    email: "gao.ahxing@example.com",
    contactNumber: "69183344",
  },
  {
    name: "Chen Bing Bing",
    subject: "Physical Education",
    email: "chen.bingbing@example.com",
    contactNumber: "64429917",
  },
]

const DESIGN_CLASSES: SchoolClass[] = [
  { level: "Primary 1", name: "Class 1A", formTeacher: { name: "Hannah Low" } },
  { level: "Primary 4", name: "Class 4D", formTeacher: { name: "Wong Sze Ting" } },
  { level: "Primary 5", name: "Class 5E", formTeacher: { name: "Justin Xiong" } },
  { level: "Primary 3", name: "Class 3C", formTeacher: { name: "Billy Tan" } },
  { level: "Primary 2", name: "Class 2B", formTeacher: { name: "Gao Ah Xing" } },
]

export const designTeachers: readonly Teacher[] = teacherListResponseSchema.parse({
  data: DESIGN_TEACHERS,
}).data

export const designClasses: readonly SchoolClass[] = classListResponseSchema.parse({
  data: DESIGN_CLASSES,
}).data
