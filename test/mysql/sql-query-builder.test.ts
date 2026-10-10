import assert from 'node:assert/strict'
import test from 'node:test'

import SQLQueryBuilder = require('../../src/sql-query-builder')

test('builds a MySQL SELECT query', () => {
    const query = new SQLQueryBuilder('mysql')
        .select(['p.id', 'p.name'])
        .from('persons', 'p')
        .where('p.age >= ?', [18])
        .orderBy('p.name')
        .limit(10)

    assert.deepEqual(query.toSQL(), {
        text: 'SELECT p.id, p.name FROM persons AS p WHERE p.age >= ? ORDER BY p.name ASC LIMIT 10',
        values: [18],
    })
})

test('builds a MySQL query with a CTE', () => {
    const adults = new SQLQueryBuilder('mysql')
        .select(['id', 'name'])
        .from('persons')
        .where('age >= ?', [18])

    const query = new SQLQueryBuilder('mysql')
        .with('adults', adults)
        .select(['name'])
        .from('adults')
        .where('name <> ?', ['Ada'])

    assert.deepEqual(query.toSQL(), {
        text: 'WITH adults AS (SELECT id, name FROM persons WHERE age >= ?) SELECT name FROM adults WHERE name <> ?',
        values: [18, 'Ada'],
    })
})

test('builds MySQL INSERT, UPDATE, and DELETE queries', () => {
    const insertQuery = new SQLQueryBuilder('mysql')
        .insertInto('persons', ['name', 'age'])
        .values(['Ada', 36])

    const updateQuery = new SQLQueryBuilder('mysql')
        .update('persons')
        .set({ active: true })
        .where('id = ?', [1])

    const deleteQuery = new SQLQueryBuilder('mysql')
        .deleteFrom('persons')
        .where('id = ?', [1])

    assert.deepEqual(insertQuery.toSQL(), {
        text: 'INSERT INTO persons (name, age) VALUES (?, ?)',
        values: ['Ada', 36],
    })
    assert.deepEqual(updateQuery.toSQL(), {
        text: 'UPDATE persons SET active = ? WHERE id = ?',
        values: [true, 1],
    })
    assert.deepEqual(deleteQuery.toSQL(), {
        text: 'DELETE FROM persons WHERE id = ?',
        values: [1],
    })
})

test('rejects PostgreSQL-only features for MySQL', () => {
    assert.throws(
        () => new SQLQueryBuilder('mysql').select().distinctOn('id'),
        /mysql does not support DISTINCT ON/
    )
    assert.throws(
        () => new SQLQueryBuilder('mysql')
            .insertInto('persons', ['name'])
            .values(['Ada'])
            .returning('id'),
        /mysql does not support RETURNING/
    )
})

test('rejects subqueries from another dialect', () => {
    const postgresqlQuery = new SQLQueryBuilder('pg')
        .select(['id'])
        .from('persons')

    const query = new SQLQueryBuilder('mysql')
        .with('persons', postgresqlQuery)
        .select(['id'])
        .from('persons')

    assert.throws(
        () => query.toSQL(),
        /Cannot compile pg subquery in mysql query/
    )
})