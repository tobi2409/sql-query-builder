import type { Dialect, DialectFeatureKey, DialectName } from '../../types'

const UnsupportedFeatures: Readonly<Record<DialectFeatureKey, string>> = Object.freeze({
    deleteUsing: 'DELETE ... USING',
    distinctOn: 'DISTINCT ON',
    fullJoin: 'FULL JOIN',
    locking: 'FOR UPDATE/FOR SHARE',
    materializedCte: 'MATERIALIZED CTEs',
    nullsOrder: 'NULLS FIRST/LAST',
    returning: 'RETURNING',
    updateFrom: 'UPDATE ... FROM',
    withInsert: 'WITH before INSERT ... VALUES',
})

export default class SQLiteDialect implements Dialect {
    name: DialectName

    constructor() {
        this.name = 'sqlite'
    }

    placeholder(_index: number): string {

        return '?'
    }

    assertSupports(feature: DialectFeatureKey): void {
        if (feature === 'deleteUsing' || feature === 'distinctOn' || feature === 'locking') {
            throw new Error(`sqlite does not support ${UnsupportedFeatures[feature]}`)
        }
    }
}
