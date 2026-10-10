class ReturningClause {
    constructor(columns = ['*']) {
        this.columns = Array.isArray(columns) ? columns : [columns]
    }

    toSQL() {

        return `RETURNING ${this.columns.join(', ')}`
    }
}

module.exports = ReturningClause
