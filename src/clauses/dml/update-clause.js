class UpdateClause {
    constructor(table, alias = null) {
        this.table = table
        this.alias = alias
    }

    toSQL() {

        return `UPDATE ${this.table}${this.alias ? ` AS ${this.alias}` : ''}`
    }
}

module.exports = UpdateClause
