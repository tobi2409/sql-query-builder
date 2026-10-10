import type {
    CompilableClause,
    CompilableInput,
    SQLCompileContext,
    SQLValues,
    SQLValuesInput,
    WithOptions,
} from '../../types'

interface WithDefinition {
    name: string
    subquery: CompilableInput
    values: SQLValues
    recursive: boolean
    materialized?: boolean
}

function normalizeValues(values: SQLValuesInput = []): SQLValues {
    if (Array.isArray(values)) {

        return values
    }

    return [values]
}

export default class WithClause implements CompilableClause {
    definitions: WithDefinition[]

    constructor() {
        this.definitions = []
    }

    add(
        name: string,
        subquery: CompilableInput,
        values: SQLValuesInput = [],
        options: WithOptions = {}
    ): void {
        this.definitions.push({
            name,
            subquery,
            values: normalizeValues(values),
            recursive: options.recursive === true,
            materialized: options.materialized,
        })
    }

    toSQL(context: SQLCompileContext): string {
        if (this.definitions.length === 0) {

            return ''
        }

        const definitions = this.definitions.map((definition) => {
            const materialized = definition.materialized === true
                ? ' MATERIALIZED'
                : definition.materialized === false ? ' NOT MATERIALIZED' : ''
            const sql = context.compileQuery(definition.subquery, definition.values)

            return `${definition.name} AS${materialized} (${sql})`
        })

        const recursive = this.definitions.some((definition) => definition.recursive)
            ? ' RECURSIVE'
            : ''

        return `WITH${recursive} ${definitions.join(', ')}`
    }
}
