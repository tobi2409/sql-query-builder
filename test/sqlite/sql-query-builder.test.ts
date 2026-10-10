import assert from 'node:assert/strict'
import test from 'node:test'

import SQLQueryBuilder = require('../../src/sql-query-builder')

test('builds a SQLite SELECT query', () => {
    const query = new SQLQueryBuilder('sqlite')
        .select(['p.id', 'p.name'])
        .from('persons', 'p')
        .where('p.age >= ?', [18])
        .orderBy('p.name', 'ASC', 'LAST')
        .limit(10)

    assert.deepEqual(query.toSQL(), {
        text: 'SELECT p.id, p.name FROM persons AS p WHERE p.age >= ? ORDER BY p.name ASC NULLS LAST LIMIT 10',
        values: [18],
    })
})

test('builds a SQLite query with a materialized CTE', () => {
    const adults = new SQLQueryBuilder('sqlite')
        .select(['id', 'name'])
        .from('persons')
        .where('age >= ?', [18])

    const query = new SQLQueryBuilder('sqlite')
        .with('adults', adults, [], { materialized: true })
        .select(['name'])
        .from('adults')
        .where('name <> ?', ['Ada'])

    assert.deepEqual(query.toSQL(), {
        text: 'WITH adults AS MATERIALIZED (SELECT id, name FROM persons WHERE age >= ?) SELECT name FROM adults WHERE name <> ?',
        values: [18, 'Ada'],
    })
})

test('builds SQLite INSERT, UPDATE, and DELETE queries with RETURNING', () => {
    const insertQuery = new SQLQueryBuilder('sqlite')
        .insertInto('persons', ['name', 'age'])
        .values(['Ada', 36])
        .returning('id')

    const updateQuery = new SQLQueryBuilder('sqlite')
        .update('persons')
        .set({ active: true })
        .where('id = ?', [1])
        .returning(['id', 'active'])

    const deleteQuery = new SQLQueryBuilder('sqlite')
        .deleteFrom('persons')
        .where('id = ?', [1])
        .returning('id')

    assert.deepEqual(insertQuery.toSQL(), {
        text: 'INSERT INTO persons (name, age) VALUES (?, ?) RETURNING id',
        values: ['Ada', 36],
    })
    assert.deepEqual(updateQuery.toSQL(), {
        text: 'UPDATE persons SET active = ? WHERE id = ? RETURNING id, active',
        values: [true, 1],
    })
    assert.deepEqual(deleteQuery.toSQL(), {
        text: 'DELETE FROM persons WHERE id = ? RETURNING id',
        values: [1],
    })
})

test('rejects unsupported SQLite features', () => {
    assert.throws(
        () => new SQLQueryBuilder('sqlite').select().distinctOn('id'),
        /sqlite does not support DISTINCT ON/
    )
    assert.throws(
        () => new SQLQueryBuilder('sqlite')
            .deleteFrom('persons')
            .using('accounts'),
        /sqlite does not support DELETE \.\.\. USING/
    )
    assert.throws(
        () => new SQLQueryBuilder('sqlite')
            .select()
            .from('persons')
            .forUpdate(),
        /sqlite does not support FOR UPDATE\/FOR SHARE/
    )
})

test('supports the sqlite3 driver alias', () => {
    const query = new SQLQueryBuilder('sqlite3')
        .select(['id'])
        .from('persons')

    assert.equal(query.driverName, 'sqlite')
    assert.equal(query.toString(), 'SELECT id FROM persons')
})
