import type {
    CompilableClause,
    SQLCompileContext,
    SQLValues,
    SQLValuesInput,
} from '../../types'

function normalizeValues(values: SQLValuesInput): SQLValues {
    if (Array.isArray(values)) {

        return values
    }

    return [values]
}

export default class ValuesClause implements CompilableClause {
    columnCount: number
    rows: SQLValues[]

    constructor(columnCount: number) {
        this.columnCount = columnCount
        this.rows = []
    }

    add(values: SQLValuesInput): void {
        const row = normalizeValues(values)

        if (row.length !== this.columnCount) {
            throw new Error(`VALUES row must contain ${this.columnCount} values`)
        }

        this.rows.push(row)
    }

    toSQL(context: SQLCompileContext): string {
        const rows = this.rows.map((row) => {
            const placeholders = row.map(() => '?').join(', ')

            return `(${context.bind(placeholders, row)})`
        })

        return `VALUES ${rows.join(', ')}`
    }
}
