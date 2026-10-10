class CompileContext {
    constructor() {
        this.values = []
    }

    bind(sql, parameters = []) {
        let parameterIndex = 0
        
        const text = sql.replace(/\?/g, () => {
            if (parameterIndex >= parameters.length) {
                throw new Error(`Missing value for placeholder in: ${sql}`)
            }

            parameterIndex += 1

            return `$${this.values.length + parameterIndex}`
        })

        if (parameterIndex !== parameters.length) {
            throw new Error(`Too many values for placeholders in: ${sql}`)
        }

        this.values.push(...parameters)

        return text
    }

    compileQuery(query, parameters = []) {
        if (query && typeof query.compile === 'function') {

            return query.compile(this)
        }

        return this.bind(query, parameters)
    }
}

module.exports = CompileContext
