const ConditionClause = require('../common/condition-clause')

class HavingClause extends ConditionClause {
    constructor() {
        super('HAVING')
    }
}

module.exports = HavingClause
