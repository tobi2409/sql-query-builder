const ConditionClause = require('./condition-clause')

class WhereClause extends ConditionClause {
    constructor() {
        super('WHERE')
    }
}

module.exports = WhereClause
