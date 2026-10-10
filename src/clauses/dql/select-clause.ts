import type { CompilableClause, SQLCompileContext } from '../../types'

export default class SelectClause implements CompilableClause {
    columns: string[]
    distinctColumns: string[]
    isDistinct: boolean

    constructor(columns: string | string[] = ['*']) {
        this.columns = Array.isArray(columns) ? columns : [columns]
        this.distinctColumns = []
        this.isDistinct = false
    }

    distinct(): void {
        this.isDistinct = true
    }

    distinctOn(columns: string | string[]): void {
        this.distinctColumns.push(...(Array.isArray(columns) ? columns : [columns]))
    }

    toSQL(_context: SQLCompileContext): string {
        if (this.columns.length === 0) {
            throw new Error('At least one SELECT column is required')
        }

        const distinct = this.distinctColumns.length
            ? `DISTINCT ON (${this.distinctColumns.join(', ')}) `
            : this.isDistinct ? 'DISTINCT ' : ''

        return `SELECT ${distinct}${this.columns.join(', ')}`
    }
}
