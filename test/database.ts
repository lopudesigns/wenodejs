import 'mocha'
import * as assert from 'assert'

import {Client, Asset, Transaction, PrivateKey} from './../src/index-node'
import {getTestnetAccounts, randomString, agent, TEST_NODE} from './common'

describe('database api', function() {
    this.slow(500)
    this.timeout(20 * 1000)

    const client = Client.testnet({agent})
    let serverConfig: {[key: string]: boolean | string | number}
    const liveClient = new Client(TEST_NODE, {agent})

    let acc: {username: string, password: string}
    before(async function() {
        [acc] = await getTestnetAccounts()
    })

    it('getDynamicGlobalProperties', async function() {
        const result = await client.database.getDynamicGlobalProperties()
        assert.deepEqual(Object.keys(result), [
            'id', 'head_block_number', 'head_block_id', 'time', 'current_witness',
            'total_pow', 'num_pow_witnesses', 'virtual_supply', 'current_supply',
            'confidential_supply', 'current_TSD_supply', 'confidential_TSD_supply',
            'totalTMEfundForSCORE', 'totalSCORE', 'total_reward_fund_TME',
            'totalSCOREreward2', 'pending_rewarded_SCORE', 'pending_rewarded_SCOREvalueInTME',
            'TSD_interest_rate', 'TSD_print_rate', 'maximum_block_size', 'current_aslot',
            'recent_slots_filled', 'participation_count', 'last_irreversible_block_num',
            'vote_power_reserve_rate', 'current_reserve_ratio', 'average_block_size',
            'max_virtual_bandwidth'
        ])
    })

    it('getConfig', async function() {
        const result = await client.database.getConfig()
        const r = (key: string) => result[key] || result[key]
        assert.equal(r('CHAIN_ID'), client.options.chainId)
        serverConfig = result
        // also test some assumptions made throughout the code
        const conf = await liveClient.database.getConfig()
        assert.equal(r('CREATE_ACCOUNT_WITH_TME_MODIFIER'), 1)
        assert.equal(r('CREATE_ACCOUNT_DELEGATION_RATIO'), 5)
        assert.equal(r('100_PERCENT'), 10000)
        assert.equal(r('1_PERCENT'), 100)
    })

    it('getBlockHeader', async function() {
        const result = await client.database.getBlockHeader(1)
        assert.equal('0000000000000000000000000000000000000000', result.previous)
    })

    it('getBlock', async function() {
        const result = await client.database.getBlock(1)
        assert.equal('0000000000000000000000000000000000000000', result.previous)
        assert.equal(
            serverConfig['INIT_PUBLIC_KEY_STR'] ||
            serverConfig['INIT_PUBLIC_KEY_STR'],
            result.signing_key
        )
    })

    it('getOperations', async function() {
        const result = await client.database.getOperations(1)
        assert.equal(result.length, 1)
        assert.equal(result[0].op[0], 'producer_reward')
    })

    it('getDiscussions', async function() {
        const r1 = await liveClient.database.getDiscussions('comments', {
            start_author: 'almost-digital',
            start_permlink: 're-pal-re-almost-digital-dsteem-a-strongly-typed-steem-client-library-20170702t131034262z',
            tag: 'almost-digital',
            limit: 1,
        })
        assert.equal(r1.length, 1)
        assert.equal(r1[0].body, '☀️heroin for programmers')
    })

    it('getTransaction', async function() {
        const tx = await liveClient.database.getTransaction({id: 'c20a84c8a12164e1e0750f0ee5d3c37214e2f073', block_num: 13680277})
        assert.deepEqual(tx.signatures, ['201e02e8daa827382b1a3aefb6809a4501eb77aa813b705be4983d50d74c66432529601e5ae43981dcba2a7e171de5fd75be2e1820942260375d2daf647df2ccaa'])
        try {
            await client.database.getTransaction({id: 'c20a84c8a12164e1e0750f0ee5d3c37214e2f073', block_num: 1})
            assert(false, 'should not be reached')
        } catch (error) {
            assert.equal(error.message, 'Unable to find transaction c20a84c8a12164e1e0750f0ee5d3c37214e2f073 in block 1')
        }
    })

    it('getChainProperties', async function() {
        const props = await liveClient.database.getChainProperties()
        assert.equal(Asset.from(props.account_creation_fee).symbol, 'TME')
    })

    it('getCurrentMedianHistoryPrice', async function() {
        const price = await liveClient.database.getCurrentMedianHistoryPrice()
        assert.equal(Asset.from(price.base).symbol, 'TSD')
        assert.equal(price.quote.symbol, 'TME')
    })

    it('getSCOREdelegations', async function() {
        this.slow(5 * 1000)
        const [delegation] = await liveClient.database.getSCOREdelegations('ProtocolTestAccount', '', 1)
        assert.equal(delegation.delegator, 'ProtocolTestAccount')
        assert.equal(typeof delegation.id, 'number')
        assert.equal(Asset.from(delegation.SCORE).symbol, 'SCORE')
    })

    it('verifyAuthority', async function() {
        this.slow(5 * 1000)
        const tx: Transaction = {
            ref_block_num: 0,
            ref_block_prefix: 0,
            expiration: '2000-01-01T00:00:00',
            operations: [['customJson', {
                required_auths: [],
                required_posting_auths: [acc.username],
                id: 'rpc-params',
                json: '{"foo": "bar"}'
            }]],
            'extensions': [],
        }
        const key = PrivateKey.fromLogin(acc.username, acc.password, 'posting')
        const stx = client.broadcast.sign(tx, key)
        const rv = await client.database.verifyAuthority(stx)
        assert(rv === true)
        const bogusKey = PrivateKey.fromSeed('ogus')
        try {
            await client.database.verifyAuthority(client.broadcast.sign(tx, bogusKey))
            assert(false, 'should not be reached')
        } catch (error) {
            assert.equal(error.message, `Missing Posting Authority ${ acc.username }`)
        }
    })

})
