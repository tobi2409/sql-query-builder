class DeleteClause {
    constructor(table, alias = null) {
        this.table = table
        this.alias = alias
    }

    toSQL() {

        return `DELETE FROM ${this.table}${this.alias ? ` AS ${this.alias}` : ''}`
    }
}

module.exports = DeleteClause
