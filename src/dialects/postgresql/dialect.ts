import type { Dialect, DialectFeatureKey, DialectName } from '../../types'

export default class PostgreSQLDialect implements Dialect {
    name: DialectName

    constructor() {
        this.name = 'pg'
    }

    placeholder(index: number): string {

        return `$${index}`
    }

    assertSupports(_feature: DialectFeatureKey): void {}
}
