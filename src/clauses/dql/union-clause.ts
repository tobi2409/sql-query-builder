import type {
    CompilableClause,
    CompilableInput,
    SQLCompileContext,
    SQLValues,
    SQLValuesInput,
} from '../../types'

interface UnionEntry {
    subquery: CompilableInput
    values: SQLValues
    all: boolean
}

function normalizeValues(values: SQLValuesInput = []): SQLValues {
    if (Array.isArray(values)) {

        return values
    }

    return [values]
}

export default class UnionClause implements CompilableClause {
    unions: UnionEntry[]

    constructor() {
        this.unions = []
    }

    add(subquery: CompilableInput, values: SQLValuesInput = [], all = false): void {
        this.unions.push({
            subquery,
            values: normalizeValues(values),
            all,
        })
    }

    toSQL(context: SQLCompileContext): string {

        return this.unions.map((union) => {
            const sql = context.compileQuery(union.subquery, union.values)

            return `UNION${union.all ? ' ALL' : ''} ${sql}`
        }).join(' ')
    }
}
