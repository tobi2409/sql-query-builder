class GroupByClause {
    constructor() {
        this.columns = []
    }

    add(columns) {
        this.columns.push(...(Array.isArray(columns) ? columns : [columns]))
    }

    toSQL() {
        if (this.columns.length === 0) {

            return ''
        }

        return `GROUP BY ${this.columns.join(', ')}`
    }
}

module.exports = GroupByClause
