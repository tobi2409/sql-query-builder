import type {
    CompilableClause,
    ConditionOperator,
    SQLCompileContext,
    SQLValues,
    SQLValuesInput,
} from '../../types'

interface ConditionEntry {
    operator: ConditionOperator
    condition: string
    values: SQLValues
}

function normalizeValues(values: SQLValuesInput = []): SQLValues {
    if (Array.isArray(values)) {

        return values
    }

    return [values]
}

export default class ConditionClause implements CompilableClause {
    keyword: string
    conditions: ConditionEntry[]

    constructor(keyword: string) {
        this.keyword = keyword
        this.conditions = []
    }

    add(operator: ConditionOperator, condition: string, values: SQLValuesInput = []): void {
        this.conditions.push({
            operator,
            condition,
            values: normalizeValues(values),
        })
    }

    toSQL(context: SQLCompileContext): string {
        if (this.conditions.length === 0) {

            return ''
        }

        const conditions = this.conditions.map((entry, index) => {
            const operator = index === 0 ? '' : `${entry.operator} `

            return `${operator}${context.bind(entry.condition, entry.values)}`
        })

        return `${this.keyword} ${conditions.join(' ')}`
    }
}
