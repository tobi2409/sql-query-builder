import type { CompilableClause, SQLCompileContext } from '../../types'

export default class OffsetClause implements CompilableClause {
    count: number

    constructor(count: number) {
        this.count = count
    }

    toSQL(_context: SQLCompileContext): string {

        return `OFFSET ${this.count}`
    }
}
