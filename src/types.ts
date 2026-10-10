export type DriverName = 'pg' | 'postgresql' | 'mysql' | 'sqlite' | 'sqlite3'

export type DialectName = 'pg' | 'mysql' | 'sqlite'

export type DialectFeatureKey =
    | 'deleteUsing'
    | 'distinctOn'
    | 'fullJoin'
    | 'locking'
    | 'materializedCte'
    | 'nullsOrder'
    | 'returning'
    | 'updateFrom'
    | 'withInsert'

export type QueryType = 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'

export type JoinType = 'INNER' | 'LEFT' | 'RIGHT' | 'FULL' | 'CROSS'

export type SortDirection = 'ASC' | 'DESC'

export type NullsPosition = 'FIRST' | 'LAST'

export type LockMode = 'UPDATE' | 'SHARE'

export type ConditionOperator = 'AND' | 'OR'

export type SQLValue = unknown

export type SQLValues = SQLValue[]

export type SQLValuesInput = SQLValue | SQLValues

export interface QueryResult {
    text: string
    values: SQLValues
}

export interface Dialect {
    name: DialectName
    placeholder(index: number): string
    assertSupports(feature: DialectFeatureKey): void
}

export interface CompilableQuery {
    driverName: DialectName
    compile(context: SQLCompileContext): string
}

export type CompilableInput = string | CompilableQuery

export interface SQLCompileContext {
    dialect: Dialect
    values: SQLValues
    bind(sql: string, parameters?: SQLValuesInput): string
    compileQuery(query: CompilableInput, parameters?: SQLValuesInput): string
}

export interface CompilableClause {
    toSQL(context: SQLCompileContext): string
}

export interface WithOptions {
    recursive?: boolean
    materialized?: boolean
}