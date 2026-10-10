class JoinClause {
    constructor() {
        this.joins = []
    }

    add(table, condition, values, type) {
        this.joins.push({
            table,
            condition,
            values: Array.isArray(values) ? values : [values],
            type,
        })
    }

    toSQL(context) {

        return this.joins.map((join) => {
            const condition = join.condition
                ? ` ON ${context.bind(join.condition, join.values)}`
                : ''

            return `${join.type} JOIN ${join.table}${condition}`
        }).join(' ')
    }
}

module.exports = JoinClause
