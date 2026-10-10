import CompileContext from './compile-context'
import createDialect from './dialects'

import FromClause from './clauses/common/from-clause'
import WhereClause from './clauses/common/where-clause'
import WithClause from './clauses/common/with-clause'
import DeleteClause from './clauses/dml/delete-clause'
import InsertClause from './clauses/dml/insert-clause'
import ReturningClause from './clauses/dml/returning-clause'
import SetClause from './clauses/dml/set-clause'
import UpdateClause from './clauses/dml/update-clause'
import UsingClause from './clauses/dml/using-clause'
import ValuesClause from './clauses/dml/values-clause'
import GroupByClause from './clauses/dql/group-by-clause'
import HavingClause from './clauses/dql/having-clause'
import JoinClause from './clauses/dql/join-clause'
import LimitClause from './clauses/dql/limit-clause'
import LockClause from './clauses/dql/lock-clause'
import OffsetClause from './clauses/dql/offset-clause'
import OrderByClause from './clauses/dql/order-by-clause'
import SelectClause from './clauses/dql/select-clause'
import UnionClause from './clauses/dql/union-clause'
import type {
    CompilableClause,
    CompilableInput,
    Dialect,
    DriverName,
    JoinType,
    NullsPosition,
    QueryResult,
    QueryType,
    SQLCompileContext,
    SQLValue,
    SQLValues,
    SQLValuesInput,
    SortDirection,
    WithOptions,
} from './types'

const QueryState = Object.freeze({
    INITIAL: 'INITIAL',
    WITH: 'WITH',
    SELECT: 'SELECT',
    DISTINCT: 'DISTINCT',
    FROM: 'FROM',
    JOIN: 'JOIN',
    WHERE: 'WHERE',
    GROUP_BY: 'GROUP_BY',
    HAVING: 'HAVING',
    UNION: 'UNION',
    ORDER_BY: 'ORDER_BY',
    LIMIT: 'LIMIT',
    OFFSET: 'OFFSET',
    LOCK: 'LOCK',
    INSERT: 'INSERT',
    VALUES: 'VALUES',
    UPDATE: 'UPDATE',
    SET: 'SET',
    DML_FROM: 'DML_FROM',
    DELETE: 'DELETE',
    USING: 'USING',
    DML_WHERE: 'DML_WHERE',
    RETURNING: 'RETURNING',
} as const)

type QueryStateValue = (typeof QueryState)[keyof typeof QueryState]

type BuilderMethod =
    | 'with'
    | 'select'
    | 'insertInto'
    | 'update'
    | 'deleteFrom'
    | 'distinct'
    | 'distinctOn'
    | 'from'
    | 'join'
    | 'where'
    | 'andWhere'
    | 'orWhere'
    | 'groupBy'
    | 'having'
    | 'andHaving'
    | 'orHaving'
    | 'union'
    | 'orderBy'
    | 'limit'
    | 'offset'
    | 'forUpdate'
    | 'forShare'
    | 'values'
    | 'returning'
    | 'set'
    | 'setRaw'
    | 'using'

type BuilderStateMap = Readonly<
    Record<QueryStateValue, Readonly<Partial<Record<BuilderMethod, QueryStateValue>>>>
>

const NextStateByMethod: BuilderStateMap = Object.freeze({
    [QueryState.INITIAL]: {
        with: QueryState.WITH,
        select: QueryState.SELECT,
        insertInto: QueryState.INSERT,
        update: QueryState.UPDATE,
        deleteFrom: QueryState.DELETE,
    },
    [QueryState.WITH]: {
        with: QueryState.WITH,
        select: QueryState.SELECT,
        insertInto: QueryState.INSERT,
        update: QueryState.UPDATE,
        deleteFrom: QueryState.DELETE,
    },
    [QueryState.SELECT]: {
        distinct: QueryState.DISTINCT,
        distinctOn: QueryState.DISTINCT,
        from: QueryState.FROM,
        union: QueryState.UNION,
        orderBy: QueryState.ORDER_BY,
        limit: QueryState.LIMIT,
        offset: QueryState.OFFSET,
        forUpdate: QueryState.LOCK,
        forShare: QueryState.LOCK,
    },
    [QueryState.DISTINCT]: {
        from: QueryState.FROM,
        union: QueryState.UNION,
        orderBy: QueryState.ORDER_BY,
        limit: QueryState.LIMIT,
        offset: QueryState.OFFSET,
        forUpdate: QueryState.LOCK,
        forShare: QueryState.LOCK,
    },
    [QueryState.FROM]: {
        join: QueryState.JOIN,
        where: QueryState.WHERE,
        groupBy: QueryState.GROUP_BY,
        union: QueryState.UNION,
        orderBy: QueryState.ORDER_BY,
        limit: QueryState.LIMIT,
        offset: QueryState.OFFSET,
        forUpdate: QueryState.LOCK,
        forShare: QueryState.LOCK,
    },
    [QueryState.JOIN]: {
        join: QueryState.JOIN,
        where: QueryState.WHERE,
        groupBy: QueryState.GROUP_BY,
        union: QueryState.UNION,
        orderBy: QueryState.ORDER_BY,
        limit: QueryState.LIMIT,
        offset: QueryState.OFFSET,
        forUpdate: QueryState.LOCK,
        forShare: QueryState.LOCK,
    },
    [QueryState.WHERE]: {
        andWhere: QueryState.WHERE,
        orWhere: QueryState.WHERE,
        groupBy: QueryState.GROUP_BY,
        union: QueryState.UNION,
        orderBy: QueryState.ORDER_BY,
        limit: QueryState.LIMIT,
        offset: QueryState.OFFSET,
        forUpdate: QueryState.LOCK,
        forShare: QueryState.LOCK,
    },
    [QueryState.GROUP_BY]: {
        groupBy: QueryState.GROUP_BY,
        having: QueryState.HAVING,
        union: QueryState.UNION,
        orderBy: QueryState.ORDER_BY,
        limit: QueryState.LIMIT,
        offset: QueryState.OFFSET,
        forUpdate: QueryState.LOCK,
        forShare: QueryState.LOCK,
    },
    [QueryState.HAVING]: {
        andHaving: QueryState.HAVING,
        orHaving: QueryState.HAVING,
        union: QueryState.UNION,
        orderBy: QueryState.ORDER_BY,
        limit: QueryState.LIMIT,
        offset: QueryState.OFFSET,
        forUpdate: QueryState.LOCK,
        forShare: QueryState.LOCK,
    },
    [QueryState.UNION]: {
        union: QueryState.UNION,
        orderBy: QueryState.ORDER_BY,
        limit: QueryState.LIMIT,
        offset: QueryState.OFFSET,
        forUpdate: QueryState.LOCK,
        forShare: QueryState.LOCK,
    },
    [QueryState.ORDER_BY]: {
        orderBy: QueryState.ORDER_BY,
        limit: QueryState.LIMIT,
        offset: QueryState.OFFSET,
        forUpdate: QueryState.LOCK,
        forShare: QueryState.LOCK,
    },
    [QueryState.LIMIT]: {
        offset: QueryState.OFFSET,
        forUpdate: QueryState.LOCK,
        forShare: QueryState.LOCK,
    },
    [QueryState.OFFSET]: {
        forUpdate: QueryState.LOCK,
        forShare: QueryState.LOCK,
    },
    [QueryState.LOCK]: {},
    [QueryState.INSERT]: { values: QueryState.VALUES },
    [QueryState.VALUES]: {
        values: QueryState.VALUES,
        returning: QueryState.RETURNING,
    },
    [QueryState.UPDATE]: {
        set: QueryState.SET,
        setRaw: QueryState.SET,
    },
    [QueryState.SET]: {
        set: QueryState.SET,
        setRaw: QueryState.SET,
        from: QueryState.DML_FROM,
        where: QueryState.DML_WHERE,
        returning: QueryState.RETURNING,
    },
    [QueryState.DML_FROM]: {
        where: QueryState.DML_WHERE,
        returning: QueryState.RETURNING,
    },
    [QueryState.DELETE]: {
        using: QueryState.USING,
        where: QueryState.DML_WHERE,
        returning: QueryState.RETURNING,
    },
    [QueryState.USING]: {
        using: QueryState.USING,
        where: QueryState.DML_WHERE,
        returning: QueryState.RETURNING,
    },
    [QueryState.DML_WHERE]: {
        andWhere: QueryState.DML_WHERE,
        orWhere: QueryState.DML_WHERE,
        returning: QueryState.RETURNING,
    },
    [QueryState.RETURNING]: {},
})

const CompleteQueryStates = new Set<QueryStateValue>([
    QueryState.SELECT,
    QueryState.DISTINCT,
    QueryState.FROM,
    QueryState.JOIN,
    QueryState.WHERE,
    QueryState.GROUP_BY,
    QueryState.HAVING,
    QueryState.UNION,
    QueryState.ORDER_BY,
    QueryState.LIMIT,
    QueryState.OFFSET,
    QueryState.LOCK,
    QueryState.VALUES,
    QueryState.SET,
    QueryState.DML_FROM,
    QueryState.DELETE,
    QueryState.USING,
    QueryState.DML_WHERE,
    QueryState.RETURNING,
])

function normalizeValues(values: SQLValuesInput = []): SQLValues {
    if (Array.isArray(values)) {

        return values
    }

    return [values]
}

class SQLQueryBuilder {
    static readonly QueryState = QueryState

    readonly dialect: Dialect
    readonly driverName: Dialect['name']
    state: QueryStateValue
    queryType: QueryType | null
    withClause: WithClause
    selectClause: SelectClause | null
    fromClause: FromClause | null
    joinClause: JoinClause
    whereClause: WhereClause
    groupByClause: GroupByClause
    havingClause: HavingClause
    unionClause: UnionClause
    orderByClause: OrderByClause
    limitClause: LimitClause | null
    offsetClause: OffsetClause | null
    lockClause: LockClause | null
    insertClause: InsertClause | null
    valuesClause: ValuesClause | null
    updateClause: UpdateClause | null
    setClause: SetClause
    deleteClause: DeleteClause | null
    usingClause: UsingClause
    returningClause: ReturningClause | null

    constructor(driverName: DriverName = 'pg') {
        this.dialect = createDialect(driverName)
        this.driverName = this.dialect.name
        this.state = QueryState.INITIAL
        this.queryType = null
        this.withClause = new WithClause()
        this.selectClause = null
        this.fromClause = null
        this.joinClause = new JoinClause()
        this.whereClause = new WhereClause()
        this.groupByClause = new GroupByClause()
        this.havingClause = new HavingClause()
        this.unionClause = new UnionClause()
        this.orderByClause = new OrderByClause()
        this.limitClause = null
        this.offsetClause = null
        this.lockClause = null
        this.insertClause = null
        this.valuesClause = null
        this.updateClause = null
        this.setClause = new SetClause()
        this.deleteClause = null
        this.usingClause = new UsingClause()
        this.returningClause = null
        this.reset()
    }

    reset(): this {
        this.state = QueryState.INITIAL
        this.queryType = null
        this.withClause = new WithClause()
        this.selectClause = null
        this.fromClause = null
        this.joinClause = new JoinClause()
        this.whereClause = new WhereClause()
        this.groupByClause = new GroupByClause()
        this.havingClause = new HavingClause()
        this.unionClause = new UnionClause()
        this.orderByClause = new OrderByClause()
        this.limitClause = null
        this.offsetClause = null
        this.lockClause = null
        this.insertClause = null
        this.valuesClause = null
        this.updateClause = null
        this.setClause = new SetClause()
        this.deleteClause = null
        this.usingClause = new UsingClause()
        this.returningClause = null

        return this
    }

    with(
        name: string,
        subquery: CompilableInput,
        values: SQLValuesInput = [],
        options: WithOptions = {}
    ): this {
        if (!name || !subquery) {
            throw new Error('A CTE name and subquery are required')
        }
        if (options.materialized !== undefined) {
            this.dialect.assertSupports('materializedCte')
        }

        this.#moveToNextState('with')
        this.withClause.add(name, subquery, normalizeValues(values), options)

        return this
    }

    select(columns: string | string[] = ['*']): this {
        this.#moveToNextState('select')
        this.queryType = 'SELECT'
        this.selectClause = new SelectClause(columns)

        return this
    }

    insertInto(table: string, columns: string | string[]): this {
        if (!table) {
            throw new Error('An INSERT table is required')
        }
        if (!columns || (Array.isArray(columns) && columns.length === 0)) {
            throw new Error('At least one INSERT column is required')
        }
        if (this.withClause.definitions.length > 0) {
            this.dialect.assertSupports('withInsert')
        }

        this.#moveToNextState('insertInto')
        this.queryType = 'INSERT'
        this.insertClause = new InsertClause(table, columns)
        this.valuesClause = new ValuesClause(this.insertClause.columns.length)

        return this
    }

    values(values: SQLValuesInput): this {
        this.#moveToNextState('values')
        this.#assertValuesClause()
        this.valuesClause.add(values)

        return this
    }

    update(table: string, alias: string | null = null): this {
        if (!table) {
            throw new Error('An UPDATE table is required')
        }

        this.#moveToNextState('update')
        this.queryType = 'UPDATE'
        this.updateClause = new UpdateClause(table, alias)

        return this
    }

    set(values: Record<string, SQLValue>): this {
        if (!values || Array.isArray(values) || Object.keys(values).length === 0) {
            throw new Error('SET requires a non-empty object')
        }

        this.#moveToNextState('set')
        this.setClause.add(values)

        return this
    }

    setRaw(expression: string, values: SQLValuesInput = []): this {
        if (!expression) {
            throw new Error('A SET expression is required')
        }

        this.#moveToNextState('setRaw')
        this.setClause.addRaw(expression, normalizeValues(values))

        return this
    }

    deleteFrom(table: string, alias: string | null = null): this {
        if (!table) {
            throw new Error('A DELETE table is required')
        }

        this.#moveToNextState('deleteFrom')
        this.queryType = 'DELETE'
        this.deleteClause = new DeleteClause(table, alias)

        return this
    }

    using(table: string): this {
        if (!table) {
            throw new Error('A USING table is required')
        }

        this.dialect.assertSupports('deleteUsing')
        this.#moveToNextState('using')
        this.usingClause.add(table)

        return this
    }

    returning(columns: string | string[] = ['*']): this {
        this.dialect.assertSupports('returning')
        this.#moveToNextState('returning')
        this.returningClause = new ReturningClause(columns)

        return this
    }

    distinct(): this {
        this.#moveToNextState('distinct')
        this.#assertSelectClause()
        this.selectClause.distinct()

        return this
    }

    distinctOn(columns: string | string[]): this {
        this.dialect.assertSupports('distinctOn')
        this.#moveToNextState('distinctOn')
        this.#assertSelectClause()
        this.selectClause.distinctOn(columns)

        return this
    }

    from(table: string, alias: string | null = null): this {
        if (!table) {
            throw new Error('A table is required')
        }
        if (this.queryType === 'UPDATE') {
            this.dialect.assertSupports('updateFrom')
        }

        this.#moveToNextState('from')
        this.fromClause = new FromClause(table, alias)

        return this
    }

    join(
        table: string,
        condition: string | null,
        values: SQLValuesInput = [],
        type: JoinType = 'INNER'
    ): this {
        const joinType = type.toUpperCase() as JoinType
        const allowedTypes: JoinType[] = ['INNER', 'LEFT', 'RIGHT', 'FULL', 'CROSS']

        if (!allowedTypes.includes(joinType)) {
            throw new Error(`Unsupported join type: ${type}`)
        }
        if (joinType !== 'CROSS' && !condition) {
            throw new Error(`${joinType} JOIN requires a condition`)
        }
        if (joinType === 'FULL') {
            this.dialect.assertSupports('fullJoin')
        }

        this.#moveToNextState('join')
        this.joinClause.add(table, condition, normalizeValues(values), joinType)

        return this
    }

    innerJoin(table: string, condition: string, values: SQLValuesInput = []): this {

        return this.join(table, condition, values, 'INNER')
    }

    leftJoin(table: string, condition: string, values: SQLValuesInput = []): this {

        return this.join(table, condition, values, 'LEFT')
    }

    rightJoin(table: string, condition: string, values: SQLValuesInput = []): this {

        return this.join(table, condition, values, 'RIGHT')
    }

    fullJoin(table: string, condition: string, values: SQLValuesInput = []): this {

        return this.join(table, condition, values, 'FULL')
    }

    crossJoin(table: string): this {

        return this.join(table, null, [], 'CROSS')
    }

    where(condition: string, values: SQLValuesInput = []): this {
        this.#assertCondition(condition)
        this.#moveToNextState('where')
        this.whereClause.add('AND', condition, normalizeValues(values))

        return this
    }

    andWhere(condition: string, values: SQLValuesInput = []): this {
        this.#assertCondition(condition)
        this.#moveToNextState('andWhere')
        this.whereClause.add('AND', condition, normalizeValues(values))

        return this
    }

    orWhere(condition: string, values: SQLValuesInput = []): this {
        this.#assertCondition(condition)
        this.#moveToNextState('orWhere')
        this.whereClause.add('OR', condition, normalizeValues(values))

        return this
    }

    groupBy(columns: string | string[]): this {
        this.#moveToNextState('groupBy')
        this.groupByClause.add(columns)

        return this
    }

    having(condition: string, values: SQLValuesInput = []): this {
        this.#assertCondition(condition)
        this.#moveToNextState('having')
        this.havingClause.add('AND', condition, normalizeValues(values))

        return this
    }

    andHaving(condition: string, values: SQLValuesInput = []): this {
        this.#assertCondition(condition)
        this.#moveToNextState('andHaving')
        this.havingClause.add('AND', condition, normalizeValues(values))

        return this
    }

    orHaving(condition: string, values: SQLValuesInput = []): this {
        this.#assertCondition(condition)
        this.#moveToNextState('orHaving')
        this.havingClause.add('OR', condition, normalizeValues(values))

        return this
    }

    union(subquery: CompilableInput, values: SQLValuesInput = [], all = false): this {
        if (!subquery) {
            throw new Error('A UNION subquery is required')
        }

        this.#moveToNextState('union')
        this.unionClause.add(subquery, normalizeValues(values), all)

        return this
    }

    unionAll(subquery: CompilableInput, values: SQLValuesInput = []): this {

        return this.union(subquery, values, true)
    }

    orderBy(
        column: string,
        direction: SortDirection = 'ASC',
        nulls: NullsPosition | null = null
    ): this {
        const normalizedDirection = direction.toUpperCase() as SortDirection
        const normalizedNulls = nulls ? (nulls.toUpperCase() as NullsPosition) : null

        if (!['ASC', 'DESC'].includes(normalizedDirection)) {
            throw new Error(`Unsupported sort direction: ${direction}`)
        }
        if (normalizedNulls && !['FIRST', 'LAST'].includes(normalizedNulls)) {
            throw new Error(`Unsupported NULLS position: ${nulls}`)
        }
        if (normalizedNulls) {
            this.dialect.assertSupports('nullsOrder')
        }

        this.#moveToNextState('orderBy')
        this.orderByClause.add(column, normalizedDirection, normalizedNulls)

        return this
    }

    limit(count: number): this {
        const normalizedCount = this.#nonNegativeInteger(count, 'LIMIT')

        this.#moveToNextState('limit')
        this.limitClause = new LimitClause(normalizedCount)

        return this
    }

    offset(count: number): this {
        const normalizedCount = this.#nonNegativeInteger(count, 'OFFSET')

        this.#moveToNextState('offset')
        this.offsetClause = new OffsetClause(normalizedCount)

        return this
    }

    forUpdate(): this {
        this.dialect.assertSupports('locking')
        this.#moveToNextState('forUpdate')
        this.lockClause = new LockClause('UPDATE')

        return this
    }

    forShare(): this {
        this.dialect.assertSupports('locking')
        this.#moveToNextState('forShare')
        this.lockClause = new LockClause('SHARE')

        return this
    }

    compile(context: SQLCompileContext): string {
        this.#assertComplete()
        this.#assertQueryType()

        const clausesByQueryType: Record<QueryType, Array<CompilableClause | null>> = {
            SELECT: [
                this.withClause,
                this.selectClause,
                this.fromClause,
                this.joinClause,
                this.whereClause,
                this.groupByClause,
                this.havingClause,
                this.unionClause,
                this.orderByClause,
                this.limitClause,
                this.offsetClause,
                this.lockClause,
            ],
            INSERT: [
                this.withClause,
                this.insertClause,
                this.valuesClause,
                this.returningClause,
            ],
            UPDATE: [
                this.withClause,
                this.updateClause,
                this.setClause,
                this.fromClause,
                this.whereClause,
                this.returningClause,
            ],
            DELETE: [
                this.withClause,
                this.deleteClause,
                this.usingClause,
                this.whereClause,
                this.returningClause,
            ],
        }
        const clauses = clausesByQueryType[this.queryType]

        return clauses
            .filter((clause): clause is CompilableClause => Boolean(clause))
            .map((clause) => clause.toSQL(context))
            .filter(Boolean)
            .join(' ')
    }

    toSQL(): QueryResult {
        const context = new CompileContext(this.dialect)
        const text = this.compile(context)

        return { text, values: context.values }
    }

    toString(): string {

        return this.toSQL().text
    }

    #assertCondition(condition: string | null | undefined): asserts condition is string {
        if (!condition) {
            throw new Error('A condition is required')
        }
    }

    #moveToNextState(calledMethod: BuilderMethod): void {
        const currentState = this.state
        const nextStates = NextStateByMethod[currentState]

        if (!Object.hasOwn(nextStates, calledMethod)) {
            const allowedMethods = Object.keys(nextStates)
            const expected = allowedMethods.length ? allowedMethods.join(', ') : 'none'

            throw new Error(
                `Invalid query transition: ${calledMethod}() cannot follow ${currentState}; expected: ${expected}`
            )
        }

        this.state = nextStates[calledMethod] as QueryStateValue
    }

    #assertComplete(): void {
        if (!CompleteQueryStates.has(this.state)) {
            throw new Error(`Query is incomplete in state ${this.state}`)
        }
    }

    #assertSelectClause(): asserts this is SQLQueryBuilder & { selectClause: SelectClause } {
        if (!this.selectClause) {
            throw new Error('SELECT clause is missing')
        }
    }

    #assertValuesClause(): asserts this is SQLQueryBuilder & { valuesClause: ValuesClause } {
        if (!this.valuesClause) {
            throw new Error('VALUES clause is missing')
        }
    }

    #assertQueryType(): asserts this is SQLQueryBuilder & { queryType: QueryType } {
        if (!this.queryType) {
            throw new Error('Query type is missing')
        }
    }

    #nonNegativeInteger(value: number, name: 'LIMIT' | 'OFFSET'): number {
        if (!Number.isInteger(value) || value < 0) {
            throw new Error(`${name} must be a non-negative integer`)
        }

        return value
    }
}

export = SQLQueryBuilder
