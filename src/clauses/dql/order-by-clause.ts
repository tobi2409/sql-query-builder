import type {
    CompilableClause,
    NullsPosition,
    SQLCompileContext,
    SortDirection,
} from '../../types'

interface OrderByEntry {
    column: string
    direction: SortDirection
    nulls: NullsPosition | null
}

export default class OrderByClause implements CompilableClause {
    orders: OrderByEntry[]

    constructor() {
        this.orders = []
    }

    add(column: string, direction: SortDirection, nulls: NullsPosition | null): void {
        this.orders.push({ column, direction, nulls })
    }

    toSQL(_context: SQLCompileContext): string {
        if (this.orders.length === 0) {

            return ''
        }

        const orders = this.orders.map(({ column, direction, nulls }) =>
            `${column} ${direction}${nulls ? ` NULLS ${nulls}` : ''}`
        )

        return `ORDER BY ${orders.join(', ')}`
    }
}
