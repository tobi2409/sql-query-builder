class LockClause {
    constructor(mode) {
        this.mode = mode
    }

    toSQL() {

        return `FOR ${this.mode}`
    }
}

module.exports = LockClause
