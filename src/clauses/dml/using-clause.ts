import type { CompilableClause, SQLCompileContext } from '../../types'

export default class UsingClause implements CompilableClause {
    tables: string[]

    constructor() {
        this.tables = []
    }

    add(table: string): void {
        this.tables.push(table)
    }

    toSQL(_context: SQLCompileContext): string {
        if (this.tables.length === 0) {

            return ''
        }

        return `USING ${this.tables.join(', ')}`
    }
}
