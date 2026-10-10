import type {
    CompilableClause,
    SQLCompileContext,
    SQLValue,
    SQLValues,
    SQLValuesInput,
} from '../../types'

interface Assignment {
    expression: string
    values: SQLValues
}

function normalizeValues(values: SQLValuesInput = []): SQLValues {
    if (Array.isArray(values)) {

        return values
    }

    return [values]
}

export default class SetClause implements CompilableClause {
    assignments: Assignment[]

    constructor() {
        this.assignments = []
    }

    add(values: Record<string, SQLValue>): void {
        for (const [column, value] of Object.entries(values)) {
            this.assignments.push({ expression: `${column} = ?`, values: [value] })
        }
    }

    addRaw(expression: string, values: SQLValuesInput = []): void {
        this.assignments.push({
            expression,
            values: normalizeValues(values),
        })
    }

    toSQL(context: SQLCompileContext): string {
        const assignments = this.assignments.map((assignment) =>
            context.bind(assignment.expression, assignment.values)
        )

        return `SET ${assignments.join(', ')}`
    }
}
