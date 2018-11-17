/* eslint-env mocha */
'use strict';

const assert = require('assert');

const robbery = require('./robbery');

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

    it('ВТ у всех свободен', () => {
        const moment = robbery.getAppropriateMoment({
            Danny: [
                { from: 'ПН 10:00+5', to: 'ПН 17:00+5' }
            ],
            Rusty: [
                { from: 'ПН 10:00+5', to: 'ПН 17:00+5' }
            ],
            Linus: [
                { from: 'СР 10:00+5', to: 'СР 17:00+5' }
            ]
        }, 120, { from: '12:00+5', to: '14:00+5' });

        assert.ok(moment.exists());
        assert.strictEqual(
            moment.format('%DD %HH:%MM'),
            'ВТ 12:00'
        );
    });

    it('вычитаем время для перевода в часовой пояс банка', () => {
        const moment = robbery.getAppropriateMoment({
            Danny: [
                { from: 'ПН 14:00+7', to: 'ПН 19:00+7' },
                { from: 'ВТ 15:00+7', to: 'ВТ 18:00+7' }
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
        90,
        { from: '10:00+5', to: '18:00+5' });

        assert.ok(moment.exists());
        assert.strictEqual(
            moment.format('%DD %HH:%MM'),
            'ВТ 11:30'
        );
    });

    it('перевод времени изменяет день недели', () => {
        const moment = robbery.getAppropriateMoment(
            {
                Timmy: [
                    { from: 'ПН 12:00+5', to: 'ПН 17:00+5' },
                    { from: 'ВТ 13:00+5', to: 'ВТ 16:00+5' }
                ],
                Ben: [
                    { from: 'ПН 11:30+5', to: 'ПН 16:30+5' },
                    { from: 'ВТ 13:00+5', to: 'ВТ 16:00+5' }
                ],
                Loki: [
                    { from: 'ПН 09:00+3', to: 'ПН 14:00+3' },
                    { from: 'ПН 23:00+3', to: 'ВТ 09:30+3' },
                    { from: 'СР 09:30+3', to: 'СР 15:00+3' }
                ]
            },
            90,
            { from: '10:00+5', to: '18:00+5' }
        );

        assert.ok(moment.exists());
    });

    it('адекватное написание времени', () => {
        const moment = robbery.getAppropriateMoment(
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
            90,
            { from: '09:00+5', to: '18:00+5' }
        );

        assert.ok(moment.exists());
        assert.strictEqual(
            moment.format('%DD %HH:%MM'),
            'ПН 09:00'
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
