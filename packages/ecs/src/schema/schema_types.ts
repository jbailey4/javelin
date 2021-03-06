export type SchemaKey<T = unknown> =
  | Schema
  | DataType<T>
  | { type: DataType<T>; defaultValue?: T }

export type Schema = {
  [key: string]: SchemaKey
}

export type AnySchema = {
  [key: string]: SchemaKey<any>
}

export type PropsOfSchema<S extends Schema> = S extends DataType<infer T>
  ? T
  : {
      [K in keyof S]: S[K] extends SchemaKey<infer T> ? T : never
    }

export const $isDataType = Symbol("isDataType")

export type DataType<T> = {
  [$isDataType]: true
  create(defaultValue: T): T
  reset(
    component: { [key: string]: unknown },
    key: string,
    defaultValue: T,
  ): void
}
