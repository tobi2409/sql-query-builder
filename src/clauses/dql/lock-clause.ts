import type { CompilableClause, LockMode, SQLCompileContext } from '../../types'

export default class LockClause implements CompilableClause {
    mode: LockMode

    constructor(mode: LockMode) {
        this.mode = mode
    }

    toSQL(_context: SQLCompileContext): string {

        return `FOR ${this.mode}`
    }
}
