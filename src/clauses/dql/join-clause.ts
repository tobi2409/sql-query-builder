import type {
    CompilableClause,
    JoinType,
    SQLCompileContext,
    SQLValues,
    SQLValuesInput,
} from '../../types'

interface JoinEntry {
    table: string
    condition: string | null
    values: SQLValues
    type: JoinType
}

function normalizeValues(values: SQLValuesInput = []): SQLValues {
    if (Array.isArray(values)) {

        return values
    }

    return [values]
}

export default class JoinClause implements CompilableClause {
    joins: JoinEntry[]

    constructor() {
        this.joins = []
    }

    add(table: string, condition: string | null, values: SQLValuesInput, type: JoinType): void {
        this.joins.push({
            table,
            condition,
            values: normalizeValues(values),
            type,
        })
    }

    toSQL(context: SQLCompileContext): string {

        return this.joins.map((join) => {
            const condition = join.condition
                ? ` ON ${context.bind(join.condition, join.values)}`
                : ''

            return `${join.type} JOIN ${join.table}${condition}`
        }).join(' ')
    }
}
