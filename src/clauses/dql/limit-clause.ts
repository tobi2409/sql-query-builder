import type { CompilableClause, SQLCompileContext } from '../../types'

export default class LimitClause implements CompilableClause {
    count: number

    constructor(count: number) {
        this.count = count
    }

    toSQL(_context: SQLCompileContext): string {

        return `LIMIT ${this.count}`
    }
}
