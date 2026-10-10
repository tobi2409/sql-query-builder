class SelectClause {
    constructor(columns = ['*']) {
        this.columns = Array.isArray(columns) ? columns : [columns]
        this.distinctColumns = []
        this.isDistinct = false
    }

    distinct() {
        this.isDistinct = true
    }

    distinctOn(columns) {
        this.distinctColumns.push(...(Array.isArray(columns) ? columns : [columns]))
    }

    toSQL() {
        if (this.columns.length === 0) {
            throw new Error('At least one SELECT column is required')
        }

        const distinct = this.distinctColumns.length
            ? `DISTINCT ON (${this.distinctColumns.join(', ')}) `
            : this.isDistinct ? 'DISTINCT ' : ''

        return `SELECT ${distinct}${this.columns.join(', ')}`
    }
}

module.exports = SelectClause
