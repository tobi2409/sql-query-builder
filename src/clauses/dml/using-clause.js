class UsingClause {
    constructor() {
        this.tables = []
    }

    add(table) {
        this.tables.push(table)
    }

    toSQL() {
        if (this.tables.length === 0) {

            return ''
        }

        return `USING ${this.tables.join(', ')}`
    }
}

module.exports = UsingClause
