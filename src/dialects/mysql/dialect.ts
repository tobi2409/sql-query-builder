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

export default class MySQLDialect implements Dialect {
    name: DialectName

    constructor() {
        this.name = 'mysql'
    }

    placeholder(_index: number): string {

        return '?'
    }

    assertSupports(feature: DialectFeatureKey): void {
        if (Object.hasOwn(UnsupportedFeatures, feature)) {
            throw new Error(`mysql does not support ${UnsupportedFeatures[feature]}`)
        }
    }
}
