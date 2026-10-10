class ConditionClause {
    constructor(keyword) {
        this.keyword = keyword
        this.conditions = []
    }

    add(operator, condition, values = []) {
        this.conditions.push({
            operator,
            condition,
            values: Array.isArray(values) ? values : [values],
        })
    }

    toSQL(context) {
        if (this.conditions.length === 0) {

            return ''
        }

        const conditions = this.conditions.map((entry, index) => {
            const operator = index === 0 ? '' : `${entry.operator} `

            return `${operator}${context.bind(entry.condition, entry.values)}`
        })

        return `${this.keyword} ${conditions.join(' ')}`
    }
}

module.exports = ConditionClause
