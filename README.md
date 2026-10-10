# SQL Query Builder

A fluent SQL query builder written in TypeScript for PostgreSQL, MySQL, and SQLite. It supports DQL and DML statements, validates clause order through a state machine, and keeps SQL text separate from bound values.

## Requirements

- Node.js 18 or newer
- npm

## Installation

```bash
npm install
```

The project has no runtime dependencies.

## Build and Test

```bash
npm run build
npm test
```

The build is written to `dist/` and includes JavaScript and TypeScript declarations. Separate test suites cover PostgreSQL, MySQL, and SQLite.

## Usage

### TypeScript

```ts
import SQLQueryBuilder = require('sql-query-builder')

const query = new SQLQueryBuilder('pg')
    .select(['name', 'age'])
    .from('persons')
    .where('age >= ?', [18])
    .orderBy('name')
    .limit(10)

const { text, values } = query.toSQL()
```

PostgreSQL result:

```ts
{
    text: 'SELECT name, age FROM persons WHERE age >= $1 ORDER BY name ASC LIMIT 10',
    values: [18]
}
```

### CommonJS

```js
const SQLQueryBuilder = require('sql-query-builder')
```

## Dialects

Select the dialect when creating the builder:

```ts
new SQLQueryBuilder('pg')
new SQLQueryBuilder('postgresql')
new SQLQueryBuilder('mysql')
new SQLQueryBuilder('sqlite')
new SQLQueryBuilder('sqlite3')
```

| Behavior | PostgreSQL | MySQL | SQLite |
| --- | --- | --- | --- |
| Placeholders | `$1`, `$2` | `?` | `?` |
| `DISTINCT ON` | yes | no | no |
| `RETURNING` | yes | no | yes |
| `FULL JOIN` | yes | no | yes, in recent versions |
| `NULLS FIRST/LAST` | yes | no | yes |
| `UPDATE ... FROM` | yes | no | yes, in recent versions |
| `DELETE ... USING` | yes | no | no |
| `FOR UPDATE` / `FOR SHARE` | yes | yes | no |
| Materialized CTEs | yes | no | yes |

Unsupported features throw an error before SQL is generated.

## SELECT

```ts
const query = new SQLQueryBuilder('pg')
    .select(['p.name', 'COUNT(o.id) AS order_count'])
    .from('persons', 'p')
    .leftJoin('orders o', 'o.person_id = p.id')
    .where('p.age >= ?', [18])
    .groupBy(['p.id', 'p.name'])
    .having('COUNT(o.id) > ?', [2])
    .orderBy('p.name', 'ASC')
    .limit(10)
    .offset(0)
```

Supported clauses include:

- `DISTINCT` and PostgreSQL `DISTINCT ON`
- `INNER`, `LEFT`, `RIGHT`, `FULL`, and `CROSS JOIN`
- `WHERE` with `AND` and `OR`
- `GROUP BY` and `HAVING`
- `UNION` and `UNION ALL`
- `ORDER BY`, `LIMIT`, and `OFFSET`
- PostgreSQL and MySQL locking

## CTEs and Subqueries

Subqueries use separate builder instances, keeping their state and clauses isolated from the root query.

```ts
const adults = new SQLQueryBuilder('pg')
    .select(['id', 'name'])
    .from('persons')
    .where('age >= ?', [18])

const query = new SQLQueryBuilder('pg')
    .with('adults', adults)
    .select(['name'])
    .from('adults')
```

The root query and subquery must use the same dialect. Their shared compile context keeps PostgreSQL parameter numbering continuous across both queries.

## INSERT

```ts
const query = new SQLQueryBuilder('pg')
    .insertInto('persons', ['name', 'age'])
    .values(['Ada', 36])
    .values(['Grace', 40])
    .returning(['id', 'name'])
```

## UPDATE

```ts
const query = new SQLQueryBuilder('pg')
    .update('persons')
    .set({ active: true })
    .setRaw('updated_at = NOW()')
    .where('age >= ?', [18])
    .returning(['id', 'active'])
```

Use `setRaw()` for SQL expressions. Values can still be bound through `?` placeholders.

## DELETE

```ts
const query = new SQLQueryBuilder('sqlite')
    .deleteFrom('persons')
    .where('active = ?', [false])
    .returning('id')
```

## Output

`toSQL()` returns the SQL text and values separately:

```ts
interface QueryResult {
    text: string
    values: unknown[]
}
```

`toString()` returns only the SQL text.

## Security

Always pass values through `?` placeholders and the corresponding values array. The builder translates placeholders for the selected dialect.

```ts
query.where('email = ?', [email])
```

Table names, column names, and raw SQL expressions are inserted into the statement unchanged. Never pass untrusted user input into these parts of a query.

## Project Structure

```text
src/
├── sql-query-builder.ts
├── compile-context.ts
├── types.ts
├── clauses/
│   ├── common/
│   ├── dql/
│   └── dml/
└── dialects/
    ├── postgresql/
    ├── mysql/
    └── sqlite/

test/
├── postgresql/
├── mysql/
└── sqlite/
```
