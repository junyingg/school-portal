export interface NewClass {
  readonly level: string
  readonly name: string
  readonly formTeacherId: number
}

export interface ClassRepository {
  insert(schoolClass: NewClass): Promise<void>
}
