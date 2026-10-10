class SetClause {
    constructor() {
        this.assignments = []
    }

    add(values) {
        for (const [column, value] of Object.entries(values)) {
            this.assignments.push({ expression: `${column} = ?`, values: [value] })
        }
    }

    addRaw(expression, values = []) {
        this.assignments.push({
            expression,
            values: Array.isArray(values) ? values : [values],
        })
    }

    toSQL(context) {
        const assignments = this.assignments.map((assignment) =>
            context.bind(assignment.expression, assignment.values)
        )

        return `SET ${assignments.join(', ')}`
    }
}

module.exports = SetClause
