import type { CompilableClause, SQLCompileContext } from '../../types'

export default class DeleteClause implements CompilableClause {
    table: string
    alias: string | null

    constructor(table: string, alias: string | null = null) {
        this.table = table
        this.alias = alias
    }

    toSQL(_context: SQLCompileContext): string {

        return `DELETE FROM ${this.table}${this.alias ? ` AS ${this.alias}` : ''}`
    }
}
