class OffsetClause {
    constructor(count) {
        this.count = count
    }

    toSQL() {

        return `OFFSET ${this.count}`
    }
}

module.exports = OffsetClause
