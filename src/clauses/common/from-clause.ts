import type { CompilableClause, SQLCompileContext } from '../../types'

export default class FromClause implements CompilableClause {
    table: string
    alias: string | null

    constructor(table: string, alias: string | null = null) {
        this.table = table
        this.alias = alias
    }

    toSQL(_context: SQLCompileContext): string {

        return `FROM ${this.table}${this.alias ? ` AS ${this.alias}` : ''}`
    }
}
