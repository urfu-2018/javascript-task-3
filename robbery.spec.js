/* eslint-env mocha */
'use strict';

const assert = require('assert');

const robbery = require('./robbery');

const intervalFactory = robbery.intervalFactory;
const dateFactory = robbery.dateFactory;
const timeFactory = robbery.timeFactory;


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

    it('должен парсить дату c новой зоной', () => {
        assert.deepStrictEqual(
            robbery.toDateWithCustomZone('ПН 12:00+5', 0),
            dateFactory('ПН', 7, 0, 0)
        );

        assert.deepStrictEqual(
            robbery.toDateWithCustomZone('ПН 00:00+5', 0),
            dateFactory('ВС', 19, 0, 0)
        );

        assert.deepStrictEqual(
            robbery.toDateWithCustomZone('ПН 20:30+5', 0),
            dateFactory('ПН', 15, 30, 0)
        );

        assert.deepStrictEqual(
            robbery.toDateWithCustomZone('ПН 20:30+5', 7),
            dateFactory('ПН', 22, 30, 7)
        );

        assert.deepStrictEqual(
            robbery.toDateWithCustomZone('ПН 22:30+5', 7),
            dateFactory('ВТ', 0, 30, 7)
        );
    });

    it('должен сравнивать время', () => {
        assert.deepStrictEqual(
            robbery.timeCompare(
                timeFactory(7, 0, 0),
                timeFactory(7, 0, 0)
            ), 0);

        assert.deepStrictEqual(
            robbery.timeCompare(
                timeFactory(7, 0, 0),
                timeFactory(6, 0, 0)
            ), 1);

        assert.deepStrictEqual(
            robbery.timeCompare(
                timeFactory(7, 0, 0),
                timeFactory(7, 30, 0)
            ), -1);
    });

    it('должен сравнивать даты', () => {
        assert.deepStrictEqual(
            robbery.dateCompare(
                dateFactory('ВТ', 7, 0, 0),
                dateFactory('ВТ', 7, 0, 0)
            ), 0);
        assert.deepStrictEqual(
            robbery.dateCompare(
                dateFactory('ВТ', 7, 0, 0),
                dateFactory('ПН', 7, 0, 0)
            ), 1);

        assert.deepStrictEqual(
            robbery.dateCompare(
                dateFactory('ВТ', 7, 0, 0),
                dateFactory('СР', 7, 0, 0)
            ), -1);

        assert.deepStrictEqual(
            robbery.dateCompare(
                dateFactory('ПН', 7, 0, 0),
                dateFactory('ВС', 7, 0, 0)
            ), -1);

        assert.deepStrictEqual(
            robbery.dateCompare(
                dateFactory('ВС', 7, 0, 0),
                dateFactory('ПН', 7, 0, 0)
            ), 1);
    });

    it('должен объединять периоды', () => {
        assert.deepStrictEqual(
            robbery.mergeIntervals([
                intervalFactory(
                    dateFactory('ВТ', 7, 0, 0),
                    dateFactory('СР', 5, 0, 0),
                ),
                intervalFactory(
                    dateFactory('СР', 3, 0, 0),
                    dateFactory('ЧТ', 7, 0, 0),
                )
            ]
            ), [
                intervalFactory(
                    dateFactory('ВТ', 7, 0, 0),
                    dateFactory('ЧТ', 7, 0, 0),
                )
            ]);

        assert.deepStrictEqual(
            robbery.mergeIntervals([
                intervalFactory(
                    dateFactory('ВТ', 7, 0, 0),
                    dateFactory('СР', 5, 0, 0),
                ),
                intervalFactory(
                    dateFactory('СР', 3, 0, 0),
                    dateFactory('ЧТ', 7, 0, 0),
                ),
                intervalFactory(
                    dateFactory('ЧТ', 8, 0, 0),
                    dateFactory('ЧТ', 8, 30, 0),
                ),
                intervalFactory(
                    dateFactory('ЧТ', 8, 31, 0),
                    dateFactory('ПТ', 8, 30, 0),
                ),
                intervalFactory(
                    dateFactory('ПТ', 8, 30, 0),
                    dateFactory('СБ', 8, 30, 0),
                )
            ]
            ), [
                intervalFactory(
                    dateFactory('ВТ', 7, 0, 0),
                    dateFactory('ЧТ', 7, 0, 0),
                ),
                intervalFactory(
                    dateFactory('ЧТ', 8, 0, 0),
                    dateFactory('ЧТ', 8, 30, 0),
                ),
                intervalFactory(
                    dateFactory('ЧТ', 8, 31, 0),
                    dateFactory('СБ', 8, 30, 0),
                )
            ]);
    });

    it('должен переводить интервалы в минуты', () => {
        assert.deepStrictEqual(
            robbery.intervalToMinutes(
                intervalFactory(
                    dateFactory('ВТ', 7, 0, 0),
                    dateFactory('ВТ', 7, 30, 0),
                )), 30);

        assert.deepStrictEqual(
            robbery.intervalToMinutes(intervalFactory(
                dateFactory('ВТ', 7, 0, 0),
                dateFactory('ВТ', 8, 30, 0),
            )), 90);

        assert.deepStrictEqual(
            robbery.intervalToMinutes(
                intervalFactory(
                    dateFactory('ВТ', 7, 0, 0),
                    dateFactory('СР', 8, 30, 0),
                )), 1530);

        assert.deepStrictEqual(
            robbery.intervalToMinutes(intervalFactory(
                dateFactory('ВТ', 7, 0, 0),
                dateFactory('СР', 0, 0, 0),
            )), 1020);

        assert.deepStrictEqual(
            robbery.intervalToMinutes(intervalFactory(
                dateFactory('ВТ', 7, 0, 0),
                dateFactory('СР', 1, 30, 0),
            )), 1110);
    });

    it('должен извлекать свободное время', () => {
        assert.deepStrictEqual(
            robbery.invertIntervals([
                intervalFactory(
                    dateFactory('ВТ', 7, 0),
                    dateFactory('ЧТ', 7, 30),
                ),
                intervalFactory(
                    dateFactory('ЧТ', 8, 0),
                    dateFactory('ЧТ', 8, 30),
                ),
                intervalFactory(
                    dateFactory('ЧТ', 8, 31),
                    dateFactory('СБ', 8, 30),
                )
            ]), [
                intervalFactory(
                    dateFactory('ПН', 0, 0),
                    dateFactory('ВТ', 7, 0),
                ),
                intervalFactory(
                    dateFactory('ЧТ', 7, 30),
                    dateFactory('ЧТ', 8, 0),
                ),
                intervalFactory(
                    dateFactory('ЧТ', 8, 30),
                    dateFactory('ЧТ', 8, 31),
                ),
                intervalFactory(
                    dateFactory('СБ', 8, 30),
                    dateFactory('ВС', 23, 59),
                )
            ]);
    });

    it('должен форматировать существующий момент', () => {
        const moment = getMomentFor(90);

        assert.ok(moment.exists());
        assert.strictEqual(
            moment.format('Метим на %DD, старт в %HH:%MM!'),
            'Метим на ВТ, старт в 11:30!'
        );
    });

    it('Должен добавлять к дате минуты', () => {
        assert.deepStrictEqual(
            robbery.addMinutes(dateFactory('ПН', 0, 0, 0), 30),
            dateFactory('ПН', 0, 30, 0)
        );
        assert.deepStrictEqual(
            robbery.addMinutes(dateFactory('ПН', 0, 0, 0), 90),
            dateFactory('ПН', 1, 30, 0)
        );
        assert.deepStrictEqual(
            robbery.addMinutes(dateFactory('ПН', 0, 0, 0), 60 * 24 + 60 + 30),
            dateFactory('ВТ', 1, 30, 0)
        );
        assert.deepStrictEqual(
            robbery.addMinutes(dateFactory('ПН', 23, 59, 0), 1),
            dateFactory('ВТ', 0, 0, 0)
        );
        assert.deepStrictEqual(
            robbery.addMinutes(dateFactory('ПН', 23, 59, 0), -1),
            dateFactory('ПН', 23, 58, 0)
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

    // if (robbery.isStar) {
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
    // }
});
