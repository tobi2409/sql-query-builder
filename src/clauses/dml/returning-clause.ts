import type { CompilableClause, SQLCompileContext } from '../../types'

export default class ReturningClause implements CompilableClause {
    columns: string[]

    constructor(columns: string | string[] = ['*']) {
        this.columns = Array.isArray(columns) ? columns : [columns]
    }

    toSQL(_context: SQLCompileContext): string {

        return `RETURNING ${this.columns.join(', ')}`
    }
}
