class LimitClause {
    constructor(count) {
        this.count = count
    }

    toSQL() {

        return `LIMIT ${this.count}`
    }
}

module.exports = LimitClause
