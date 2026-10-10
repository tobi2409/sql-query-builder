import type { Dialect, DriverName } from '../types'
import MySQLDialect from './mysql/dialect'
import PostgreSQLDialect from './postgresql/dialect'
import SQLiteDialect from './sqlite/dialect'

type DialectConstructor = new () => Dialect

const Dialects: Readonly<Record<DriverName, DialectConstructor>> = Object.freeze({
    mysql: MySQLDialect,
    pg: PostgreSQLDialect,
    postgresql: PostgreSQLDialect,
    sqlite: SQLiteDialect,
    sqlite3: SQLiteDialect,
})

export default function createDialect(driverName: DriverName = 'pg'): Dialect {
    const DialectClass = Dialects[driverName]

    if (!DialectClass) {
        throw new Error(`Unsupported driver: ${driverName}`)
    }

    return new DialectClass()
}
