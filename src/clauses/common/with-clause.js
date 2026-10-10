class WithClause {
    constructor() {
        this.definitions = []
    }

    add(name, subquery, values = [], options = {}) {
        this.definitions.push({
            name,
            subquery,
            values: Array.isArray(values) ? values : [values],
            recursive: options.recursive === true,
            materialized: options.materialized,
        })
    }

    toSQL(context) {
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

module.exports = WithClause
