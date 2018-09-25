import 'mocha'
import * as assert from 'assert'

import {Asset, Price, getSCOREPriceinTME} from './../src/index-node'

describe('asset', function() {

    it('should create from string', function() {
        const oneTME = Asset.fromString('1.000 TME')
        assert.equal(oneTME.amount, 1)
        assert.equal(oneTME.symbol, 'TME')
        const SCORE = Asset.fromString('0.123456 SCORE')
        assert.equal(SCORE.amount, 0.123456)
        assert.equal(SCORE.symbol, 'SCORE')
        const TSD = Asset.from('0.444 TSD')
        assert.equal(TSD.amount, 0.444)
        assert.equal(TSD.symbol, 'TSD')
    })

    it('should convert to string', function() {
        const TME = new Asset(44.999999, 'TME')
        assert.equal(TME.toString(), '45.000 TME')
        const SCORE = new Asset(44.999999, 'SCORE')
        assert.equal(SCORE.toString(), '44.999999 SCORE')
    })

    it('should add and subtract', function() {
        const a = new Asset(44.999, 'TME')
        assert.equal(a.subtract(1.999).toString(), '43.000 TME')
        assert.equal(a.add(0.001).toString(), '45.000 TME')
        assert.equal(Asset.from('1.999 TME').subtract(a).toString(), '-43.000 TME')
        assert.equal(Asset.from(a).subtract(a).toString(), '0.000 TME')
        assert.equal(Asset.from('99.999999 SCORE').add('0.000001 SCORE').toString(), '100.000000 SCORE')
        assert.throws(() => Asset.fromString('100.000 TME').subtract('100.000000 SCORE'))
        assert.throws(() => Asset.from(100, 'SCORE').add(a))
        assert.throws(() => Asset.from(100).add('1.000000 SCORE'))
    })

    it('should max and min', function() {
        const a = Asset.from(1), b = Asset.from(2)
        assert.equal(Asset.min(a, b), a)
        assert.equal(Asset.min(b, a), a)
        assert.equal(Asset.max(a, b), b)
        assert.equal(Asset.max(b, a), b)
    })

    it('should throw on invalid values', function() {
        assert.throws(() => Asset.fromString('1.000 SNACKS'))
        assert.throws(() => Asset.fromString('I LIKE TURT 0.42'))
        assert.throws(() => Asset.fromString('Infinity TME'))
        assert.throws(() => Asset.fromString('..0 TME'))
        assert.throws(() => Asset.from('..0 TME'))
        assert.throws(() => Asset.from(NaN))
        assert.throws(() => Asset.from(false as any))
        assert.throws(() => Asset.from(Infinity))
        assert.throws(() => Asset.from({bar:22} as any))
    })

    it('should parse price', function() {
        const price1 = new Price(Asset.from('1.000 TME'), Asset.from(1, 'TSD'))
        const price2 = Price.from(price1)
        const price3 = Price.from({base: '1.000 TME', quote: price1.quote})
        assert.equal(price1.toString(), '1.000 TME:1.000 TSD')
        assert.equal(price2.base.toString(), price3.base.toString())
        assert.equal(price2.quote.toString(), price3.quote.toString())
    })

    it('should get SCORE price', function() {
        const props: any = {
            totalTMEfundForSCORE: '5.000 TME',
            totalSCORE: '12345.000000 SCORE',
        }
        const price1 = getSCOREPriceinTME(props)
        assert.equal(price1.base.amount, 12345)
        assert.equal(price1.base.symbol, 'SCORE')
        assert.equal(price1.quote.amount, 5)
        assert.equal(price1.quote.symbol, 'TME')
        const badProps: any = {
            totalTMEfundForSCORE: '0.000 TME',
            totalSCORE: '0.000000 SCORE',
        }
        const price2 = getSCOREPriceinTME(badProps)
        assert.equal(price2.base.amount, 1)
        assert.equal(price2.base.symbol, 'SCORE')
        assert.equal(price2.quote.amount, 1)
        assert.equal(price2.quote.symbol, 'TME')
    })

    it('should convert price', function() {
        const price1 = new Price(Asset.from('0.500 TME'), Asset.from('1.000 TSD'))
        const v1 = price1.convert(Asset.from('1.000 TME'))
        assert.equal(v1.amount, 2)
        assert.equal(v1.symbol, 'TSD')
        const v2 = price1.convert(Asset.from('1.000 TSD'))
        assert.equal(v2.amount, 0.5)
        assert.equal(v2.symbol, 'TME')
        assert.throws(() => {
            price1.convert(Asset.from(1, 'SCORE'))
        })
    })

})

