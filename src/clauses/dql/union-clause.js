class UnionClause {
    constructor() {
        this.unions = []
    }

    add(subquery, values = [], all = false) {
        this.unions.push({
            subquery,
            values: Array.isArray(values) ? values : [values],
            all,
        })
    }

    toSQL(context) {

        return this.unions.map((union) => {
            const sql = context.compileQuery(union.subquery, union.values)

            return `UNION${union.all ? ' ALL' : ''} ${sql}`
        }).join(' ')
    }
}

module.exports = UnionClause
