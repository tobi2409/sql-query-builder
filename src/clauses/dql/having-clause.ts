import ConditionClause from '../common/condition-clause'

export default class HavingClause extends ConditionClause {
    constructor() {
        super('HAVING')
    }
}
