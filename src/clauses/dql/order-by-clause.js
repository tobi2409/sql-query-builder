class OrderByClause {
    constructor() {
        this.orders = []
    }

    add(column, direction, nulls) {
        this.orders.push({ column, direction, nulls })
    }

    toSQL() {
        if (this.orders.length === 0) {

            return ''
        }

        const orders = this.orders.map(({ column, direction, nulls }) =>
            `${column} ${direction}${nulls ? ` NULLS ${nulls}` : ''}`
        )

        return `ORDER BY ${orders.join(', ')}`
    }
}

module.exports = OrderByClause
