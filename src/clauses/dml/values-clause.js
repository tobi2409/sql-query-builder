class ValuesClause {
    constructor(columnCount) {
        this.columnCount = columnCount
        this.rows = []
    }

    add(values) {
        const row = Array.isArray(values) ? values : [values]

        if (row.length !== this.columnCount) {
            throw new Error(`VALUES row must contain ${this.columnCount} values`)
        }

        this.rows.push(row)
    }

    toSQL(context) {
        const rows = this.rows.map((row) => {
            const placeholders = row.map(() => '?').join(', ')

            return `(${context.bind(placeholders, row)})`
        })

        return `VALUES ${rows.join(', ')}`
    }
}

module.exports = ValuesClause
