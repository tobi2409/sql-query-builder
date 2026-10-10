const test = require('node:test')
const assert = require('node:assert/strict')

const SQLQueryBuilder = require('../src/sql-query-builder')

test('builds a grouped SELECT query', () => {
    const query = new SQLQueryBuilder()
        .select(['p.name', 'COUNT(o.id) AS order_count'])
        .from('persons p')
        .leftJoin('orders o', 'o.person_id = p.id AND o.created_at >= ?', ['2026-01-01'])
        .where('p.age > ?', [18])
        .groupBy(['p.id', 'p.name'])
        .having('COUNT(o.id) > ?', [2])
        .orderBy('p.name')
        .limit(10)
        .offset(0)

    assert.deepEqual(query.toSQL(), {
        text: 'SELECT p.name, COUNT(o.id) AS order_count FROM persons p LEFT JOIN orders o ON o.person_id = p.id AND o.created_at >= $1 WHERE p.age > $2 GROUP BY p.id, p.name HAVING COUNT(o.id) > $3 ORDER BY p.name ASC LIMIT 10 OFFSET 0',
        values: ['2026-01-01', 18, 2],
    })
})

test('builds a SELECT query with a CTE', () => {
    const adultPersons = new SQLQueryBuilder()
        .select(['id', 'name', 'age'])
        .from('persons')
        .where('age >= ?', [18])

    const query = new SQLQueryBuilder()
        .with('adult_persons', adultPersons)
        .select(['a.name', 'a.age'])
        .from('adult_persons', 'a')
        .where('a.age < ?', [65])
        .orderBy('a.name')

    assert.deepEqual(query.toSQL(), {
        text: 'WITH adult_persons AS (SELECT id, name, age FROM persons WHERE age >= $1) SELECT a.name, a.age FROM adult_persons AS a WHERE a.age < $2 ORDER BY a.name ASC',
        values: [18, 65],
    })
})

test('builds a multi-row INSERT query', () => {
    const query = new SQLQueryBuilder()
        .insertInto('persons', ['name', 'age'])
        .values(['Ada', 36])
        .values(['Grace', 40])
        .returning(['id', 'name'])

    assert.deepEqual(query.toSQL(), {
        text: 'INSERT INTO persons (name, age) VALUES ($1, $2), ($3, $4) RETURNING id, name',
        values: ['Ada', 36, 'Grace', 40],
    })
})

test('builds an UPDATE query', () => {
    const query = new SQLQueryBuilder()
        .update('persons')
        .set({ active: true })
        .where('age >= ?', [18])
        .returning(['id', 'active'])

    assert.deepEqual(query.toSQL(), {
        text: 'UPDATE persons SET active = $1 WHERE age >= $2 RETURNING id, active',
        values: [true, 18],
    })
})

test('builds a DELETE query', () => {
    const query = new SQLQueryBuilder()
        .deleteFrom('persons')
        .where('active = ?', [false])
        .returning('id')

    assert.deepEqual(query.toSQL(), {
        text: 'DELETE FROM persons WHERE active = $1 RETURNING id',
        values: [false],
    })
})