import type { CompilableClause, SQLCompileContext } from '../../types'

export default class InsertClause implements CompilableClause {
    table: string
    columns: string[]

    constructor(table: string, columns: string | string[]) {
        this.table = table
        this.columns = Array.isArray(columns) ? columns : [columns]
    }

    toSQL(_context: SQLCompileContext): string {
        const columns = this.columns.length ? ` (${this.columns.join(', ')})` : ''

        return `INSERT INTO ${this.table}${columns}`
    }
}
