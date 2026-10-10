class InsertClause {
    constructor(table, columns) {
        this.table = table
        this.columns = Array.isArray(columns) ? columns : [columns]
    }

    toSQL() {
        const columns = this.columns.length ? ` (${this.columns.join(', ')})` : ''

        return `INSERT INTO ${this.table}${columns}`
    }
}

module.exports = InsertClause
