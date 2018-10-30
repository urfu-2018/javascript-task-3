'use strict';

const robbery = require('./robbery');

const gangSchedule = {
    Danny: [
    ],
    Rusty: [
    ],
    Linus: [
    ]
};

const bankWorkingHours = {
    from: '10:00+5',
    to: '18:00+5'
};

// Время не существует
const longMoment = robbery.getAppropriateMoment(gangSchedule, 121, bankWorkingHours);

// Выведется `false` и `""`
console.info(longMoment.exists());
console.info(longMoment.format('Метим на %DD, старт в %HH:%MM!'));

// Время существует
const moment = robbery.getAppropriateMoment(gangSchedule, 90, bankWorkingHours);

// Выведется `true` и `"Метим на ВТ, старт в 11:30!"`
console.info(moment.exists());
console.info(moment.format('Метим на %DD, старт в %HH:%MM!'));

if (robbery.isStar) {
    // Вернет `true`
    moment.tryLater();
    // `"ВТ 16:00"`
    console.info(moment.format('%DD %HH:%MM'));

    // Вернет `true`
    moment.tryLater();
    // `"ВТ 16:30"`
    console.info(moment.format('%DD %HH:%MM'));

    // Вернет `true`
    moment.tryLater();
    // `"СР 10:00"`
    console.info(moment.format('%DD %HH:%MM'));

    // Вернет `false`
    moment.tryLater();
    // `"СР 10:00"`
    console.info(moment.format('%DD %HH:%MM'));
}
