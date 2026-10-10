const CompileContext = require('./compile-context')
const FromClause = require('./clauses/common/from-clause')
const WhereClause = require('./clauses/common/where-clause')
const WithClause = require('./clauses/common/with-clause')
const DeleteClause = require('./clauses/dml/delete-clause')
const InsertClause = require('./clauses/dml/insert-clause')
const ReturningClause = require('./clauses/dml/returning-clause')
const SetClause = require('./clauses/dml/set-clause')
const UpdateClause = require('./clauses/dml/update-clause')
const UsingClause = require('./clauses/dml/using-clause')
const ValuesClause = require('./clauses/dml/values-clause')
const GroupByClause = require('./clauses/dql/group-by-clause')
const HavingClause = require('./clauses/dql/having-clause')
const JoinClause = require('./clauses/dql/join-clause')
const LimitClause = require('./clauses/dql/limit-clause')
const LockClause = require('./clauses/dql/lock-clause')
const OffsetClause = require('./clauses/dql/offset-clause')
const OrderByClause = require('./clauses/dql/order-by-clause')
const SelectClause = require('./clauses/dql/select-clause')
const UnionClause = require('./clauses/dql/union-clause')

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
})

// Each row reads: after CURRENT_STATE, calling method moves to NEXT_STATE.
// Example: SELECT -> from() -> FROM.
const NextStateByMethod = Object.freeze({
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

const CompleteQueryStates = new Set([
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

class SQLQueryBuilder {
    constructor(driverName = 'pg') {
        if (driverName !== 'pg') {
            throw new Error(`Unsupported driver: ${driverName}`)
        }

        this.driverName = driverName
        this.reset()
    }

    reset() {
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

    with(name, subquery, values = [], options = {}) {
        if (!name || !subquery) {
            throw new Error('A CTE name and subquery are required')
        }

        this.#moveToNextState('with')
        this.withClause.add(name, subquery, values, options)

        return this
    }

    select(columns = ['*']) {
        this.#moveToNextState('select')
        this.queryType = 'SELECT'
        this.selectClause = new SelectClause(columns)

        return this
    }

    insertInto(table, columns) {
        if (!table) {
            throw new Error('An INSERT table is required')
        }
        if (!columns || (Array.isArray(columns) && columns.length === 0)) {
            throw new Error('At least one INSERT column is required')
        }

        this.#moveToNextState('insertInto')
        this.queryType = 'INSERT'
        this.insertClause = new InsertClause(table, columns)
        this.valuesClause = new ValuesClause(this.insertClause.columns.length)

        return this
    }

    values(values) {
        const row = Array.isArray(values) ? values : [values]

        if (row.length !== this.valuesClause.columnCount) {
            throw new Error(`VALUES row must contain ${this.valuesClause.columnCount} values`)
        }

        this.#moveToNextState('values')
        this.valuesClause.add(row)

        return this
    }

    update(table, alias = null) {
        if (!table) {
            throw new Error('An UPDATE table is required')
        }

        this.#moveToNextState('update')
        this.queryType = 'UPDATE'
        this.updateClause = new UpdateClause(table, alias)

        return this
    }

    set(values) {
        if (!values || Array.isArray(values) || Object.keys(values).length === 0) {
            throw new Error('SET requires a non-empty object')
        }

        this.#moveToNextState('set')
        this.setClause.add(values)

        return this
    }

    setRaw(expression, values = []) {
        if (!expression) {
            throw new Error('A SET expression is required')
        }

        this.#moveToNextState('setRaw')
        this.setClause.addRaw(expression, values)

        return this
    }

    deleteFrom(table, alias = null) {
        if (!table) {
            throw new Error('A DELETE table is required')
        }

        this.#moveToNextState('deleteFrom')
        this.queryType = 'DELETE'
        this.deleteClause = new DeleteClause(table, alias)

        return this
    }

    using(table) {
        if (!table) {
            throw new Error('A USING table is required')
        }

        this.#moveToNextState('using')
        this.usingClause.add(table)

        return this
    }

    returning(columns = ['*']) {
        this.#moveToNextState('returning')
        this.returningClause = new ReturningClause(columns)

        return this
    }

    distinct() {
        this.#moveToNextState('distinct')
        this.selectClause.distinct()

        return this
    }

    distinctOn(columns) {
        this.#moveToNextState('distinctOn')
        this.selectClause.distinctOn(columns)

        return this
    }

    from(table, alias = null) {
        if (!table) {
            throw new Error('A table is required')
        }

        this.#moveToNextState('from')
        this.fromClause = new FromClause(table, alias)

        return this
    }

    join(table, condition, values = [], type = 'INNER') {
        const joinType = type.toUpperCase()
        const allowedTypes = ['INNER', 'LEFT', 'RIGHT', 'FULL', 'CROSS']

        if (!allowedTypes.includes(joinType)) {
            throw new Error(`Unsupported join type: ${type}`)
        }
        if (joinType !== 'CROSS' && !condition) {
            throw new Error(`${joinType} JOIN requires a condition`)
        }

        this.#moveToNextState('join')
        this.joinClause.add(table, condition, values, joinType)

        return this
    }

    innerJoin(table, condition, values = []) {

        return this.join(table, condition, values, 'INNER')
    }

    leftJoin(table, condition, values = []) {

        return this.join(table, condition, values, 'LEFT')
    }

    rightJoin(table, condition, values = []) {

        return this.join(table, condition, values, 'RIGHT')
    }

    fullJoin(table, condition, values = []) {

        return this.join(table, condition, values, 'FULL')
    }

    crossJoin(table) {

        return this.join(table, null, [], 'CROSS')
    }

    where(condition, values = []) {
        this.#assertCondition(condition)
        this.#moveToNextState('where')
        this.whereClause.add('AND', condition, values)

        return this
    }

    andWhere(condition, values = []) {
        this.#assertCondition(condition)
        this.#moveToNextState('andWhere')
        this.whereClause.add('AND', condition, values)

        return this
    }

    orWhere(condition, values = []) {
        this.#assertCondition(condition)
        this.#moveToNextState('orWhere')
        this.whereClause.add('OR', condition, values)

        return this
    }

    groupBy(columns) {
        this.#moveToNextState('groupBy')
        this.groupByClause.add(columns)

        return this
    }

    having(condition, values = []) {
        this.#assertCondition(condition)
        this.#moveToNextState('having')
        this.havingClause.add('AND', condition, values)

        return this
    }

    andHaving(condition, values = []) {
        this.#assertCondition(condition)
        this.#moveToNextState('andHaving')
        this.havingClause.add('AND', condition, values)

        return this
    }

    orHaving(condition, values = []) {
        this.#assertCondition(condition)
        this.#moveToNextState('orHaving')
        this.havingClause.add('OR', condition, values)

        return this
    }

    union(subquery, values = [], all = false) {
        if (!subquery) {
            throw new Error('A UNION subquery is required')
        }

        this.#moveToNextState('union')
        this.unionClause.add(subquery, values, all)

        return this
    }

    unionAll(subquery, values = []) {

        return this.union(subquery, values, true)
    }

    orderBy(column, direction = 'ASC', nulls = null) {
        const normalizedDirection = direction.toUpperCase()
        const normalizedNulls = nulls ? nulls.toUpperCase() : null

        if (!['ASC', 'DESC'].includes(normalizedDirection)) {
            throw new Error(`Unsupported sort direction: ${direction}`)
        }
        if (normalizedNulls && !['FIRST', 'LAST'].includes(normalizedNulls)) {
            throw new Error(`Unsupported NULLS position: ${nulls}`)
        }

        this.#moveToNextState('orderBy')
        this.orderByClause.add(column, normalizedDirection, normalizedNulls)

        return this
    }

    limit(count) {
        const normalizedCount = this.#nonNegativeInteger(count, 'LIMIT')

        this.#moveToNextState('limit')
        this.limitClause = new LimitClause(normalizedCount)

        return this
    }

    offset(count) {
        const normalizedCount = this.#nonNegativeInteger(count, 'OFFSET')

        this.#moveToNextState('offset')
        this.offsetClause = new OffsetClause(normalizedCount)

        return this
    }

    forUpdate() {
        this.#moveToNextState('forUpdate')
        this.lockClause = new LockClause('UPDATE')

        return this
    }

    forShare() {
        this.#moveToNextState('forShare')
        this.lockClause = new LockClause('SHARE')

        return this
    }

    compile(context) {
        this.#assertComplete()

        const clausesByQueryType = {
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
            .filter(Boolean)
            .map((clause) => clause.toSQL(context))
            .filter(Boolean)
            .join(' ')
    }

    toSQL() {
        const context = new CompileContext()
        const text = this.compile(context)

        return { text, values: context.values }
    }

    toString() {

        return this.toSQL().text
    }

    #assertCondition(condition) {
        if (!condition) {
            throw new Error('A condition is required')
        }
    }

    #moveToNextState(calledMethod) {
        const currentState = this.state
        const nextStates = NextStateByMethod[currentState]

        if (!Object.hasOwn(nextStates, calledMethod)) {
            const allowedMethods = Object.keys(nextStates)
            const expected = allowedMethods.length ? allowedMethods.join(', ') : 'none'

            throw new Error(
                `Invalid query transition: ${calledMethod}() cannot follow ${currentState}; expected: ${expected}`
            )
        }

        this.state = nextStates[calledMethod]
    }

    #assertComplete() {
        if (!CompleteQueryStates.has(this.state)) {
            throw new Error(`Query is incomplete in state ${this.state}`)
        }
    }

    #nonNegativeInteger(value, name) {
        if (!Number.isInteger(value) || value < 0) {
            throw new Error(`${name} must be a non-negative integer`)
        }

        return value
    }
}

SQLQueryBuilder.QueryState = QueryState
module.exports = SQLQueryBuilder
