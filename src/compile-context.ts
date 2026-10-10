import type {
    CompilableInput,
    CompilableQuery,
    Dialect,
    SQLCompileContext,
    SQLValues,
    SQLValuesInput,
} from './types'

function normalizeValues(values: SQLValuesInput = []): SQLValues {
    if (Array.isArray(values)) {

        return values
    }

    return [values]
}

function isCompilableQuery(query: CompilableInput): query is CompilableQuery {

    return typeof query !== 'string'
}

export default class CompileContext implements SQLCompileContext {
    dialect: Dialect
    values: SQLValues

    constructor(dialect: Dialect) {
        this.dialect = dialect
        this.values = []
    }

    bind(sql: string, parameters: SQLValuesInput = []): string {
        const normalizedParameters = normalizeValues(parameters)
        let parameterIndex = 0

        const text = sql.replace(/\?/g, () => {
            if (parameterIndex >= normalizedParameters.length) {
                throw new Error(`Missing value for placeholder in: ${sql}`)
            }

            parameterIndex += 1

            return this.dialect.placeholder(this.values.length + parameterIndex)
        })

        if (parameterIndex !== normalizedParameters.length) {
            throw new Error(`Too many values for placeholders in: ${sql}`)
        }

        this.values.push(...normalizedParameters)

        return text
    }

    compileQuery(query: CompilableInput, parameters: SQLValuesInput = []): string {
        if (isCompilableQuery(query)) {
            if (query.driverName !== this.dialect.name) {
                throw new Error(
                    `Cannot compile ${query.driverName} subquery in ${this.dialect.name} query`
                )
            }

            return query.compile(this)
        }

        return this.bind(query, parameters)
    }
}
