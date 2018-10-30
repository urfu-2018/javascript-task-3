/* eslint-env mocha */
'use strict';

const assert = require('assert');

const robbery = require('./robbery');
const utils = require('./utils');

describe('robbery.getAppropriateMoment()', () => {
    function getMomentFor(time) {
        return robbery.getAppropriateMoment(
            {
                Danny: [
                    { from: 'ПН 12:00+5', to: 'ПН 17:00+5' },
                    { from: 'ВТ 13:00+5', to: 'ВТ 16:00+5' }
                ],
                Rusty: [
                    { from: 'ПН 11:30+5', to: 'ПН 16:30+5' },
                    { from: 'ВТ 13:00+5', to: 'ВТ 16:00+5' }
                ],
                Linus: [
                    { from: 'ПН 09:00+3', to: 'ПН 14:00+3' },
                    { from: 'ПН 21:00+3', to: 'ВТ 09:30+3' },
                    { from: 'СР 09:30+3', to: 'СР 15:00+3' }
                ]
            },
            time,
            { from: '10:00+5', to: '18:00+5' }
        );
    }

    it('должен форматировать существующий момент', () => {
        const moment = getMomentFor(90);

        assert.ok(moment.exists());
        assert.strictEqual(
            moment.format('Метим на %DD, старт в %HH:%MM!'),
            'Метим на ВТ, старт в 11:30!'
        );
    });

    it('должен вернуть пустую строку при форматировании несуществующего момента', () => {
        const moment = getMomentFor(121);

        assert.ok(!moment.exists());
        assert.strictEqual(
            moment.format('Метим на %DD, старт в %HH:%MM!'),
            ''
        );
    });

    if (robbery.isStar) {
        it('должен перемещаться на более поздний момент [*]', () => {
            const moment = getMomentFor(90);

            assert.ok(moment.tryLater());
            assert.strictEqual(moment.format('%DD %HH:%MM'), 'ВТ 16:00');

            assert.ok(moment.tryLater());
            assert.strictEqual(moment.format('%DD %HH:%MM'), 'ВТ 16:30');

            assert.ok(moment.tryLater());
            assert.strictEqual(moment.format('%DD %HH:%MM'), 'СР 10:00');
        });

        it('не должен сдвигать момент, если более позднего нет [*]', () => {
            const moment = getMomentFor(90);

            assert.ok(moment.tryLater());
            assert.ok(moment.tryLater());
            assert.ok(moment.tryLater());

            assert.ok(!moment.tryLater());
            assert.strictEqual(moment.format('%DD %HH:%MM'), 'СР 10:00');
        });
    }
});


function makeTest(assertions, func) {
    return assertions.map(([input, expected]) => assert.deepStrictEqual(func(input), expected));
}

describe('utils test', () => {
    it('should parse time', () => {
        makeTest([
            ['00:00+0', 0],
            ['23:59+0', 24 * 60 - 1],
            ['5:00+05', 0],
            ['16:54+12', 4 * 60 + 54]
        ], utils.parseTimeWithTimeZone);
    });

    it('should parse dates', () => {
        makeTest([
            ['ПН 00:00+0', 0],
            ['ВТ 11:30+07', 24 * 60 + 4 * 60 + 30]
        ], utils.parseDateWithTimezone);
    });

    it('should correctly tell if value is in interval', () => {
        assert.equal(utils.isValueInInterval([0, 1000], 0), true);
        assert.equal(utils.isValueInInterval([0, 1000], 1000), false);
        assert.equal(utils.isValueInInterval([0, 1000], 40), true);
    });

    it('should convert schedule entries to intervals', () => {
        makeTest([
            [{ from: 'ПН 01:00+0', to: 'ВТ 01:00+0' }, [60, 25 * 60]],
            [{ from: 'ВТ 05:00+5', to: 'СР 06:00+5' }, [24 * 60, 49 * 60]]
        ], utils.convertScheduleEntryToInterval);
    });

    it('should format data', () => {
        assert.equal(utils.formatDate('%HH:%MM - %DD', 0, 0), '00:00 - ПН');
    });
});


describe('intervals', () => {
    it('should interpolate bank opened hours', () => {
        makeTest([
            [
                { from: '00:00+0', to: '01:00+0' },
                [
                    [0, 60],
                    [24 * 60, 24 * 60 + 60],
                    [48 * 60, 48 * 60 + 60]
                ]
            ]
        ], robbery.getBankOpenedIntervals);
    });

    it('should tell if moment available', () => {
        assert.equal(
            robbery.isMomentAvailableToGang([[0, 100]], [[[0, 100]]], 50),
            false
        );
        assert.equal(
            robbery.isMomentAvailableToGang([[-50, 50]], [[[500, 600], 700, 900], [[0, 100]]], -5),
            true
        );
        assert.equal(
            robbery.isMomentAvailableToGang([[-50, 50]], [[[500, 600], 700, 900], [[0, 100]]], 10),
            false
        );
        assert.equal(
            robbery.isMomentAvailableToGang([[-50, 50]], [[[500, 600], 700, 900], [[0, 100]]], -50),
            true
        );
        assert.equal(
            robbery.isMomentAvailableToGang([[-50, 50]], [[[500, 600], 700, 900], [[0, 100]]], 0),
            false
        );
    });
    // it('should correctly calculate bank closed hours', () => {
    //     makeTest([
    //         [{ from: '00:00+0', to: '23:00+0' }, []]
    //     ])
    // })
});
