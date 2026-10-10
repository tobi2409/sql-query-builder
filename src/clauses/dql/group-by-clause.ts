import type { CompilableClause, SQLCompileContext } from '../../types'

export default class GroupByClause implements CompilableClause {
    columns: string[]

    constructor() {
        this.columns = []
    }

    add(columns: string | string[]): void {
        this.columns.push(...(Array.isArray(columns) ? columns : [columns]))
    }

    toSQL(_context: SQLCompileContext): string {
        if (this.columns.length === 0) {

            return ''
        }

        return `GROUP BY ${this.columns.join(', ')}`
    }
}
