'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;

function groupBy(xs, key) {
    return xs.reduce(function (rv, x) {
        (rv[x[key]] = rv[x[key]] || []).push(x);

        return rv;
    }, {});
}

function getWeekNumber(day) {
    switch (day) {
        case 'ПН':
            return 0;
        case 'ВТ':
            return 1;
        case 'СР':
            return 2;
        case 'ЧТ':
            return 3;
        case 'ПТ':
            return 4;
        case 'СБ':
            return 5;
        case 'ВС':
            return 6;
    }
}

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
function getAppropriateMoment(schedule, duration, workingHours) {
    console.info(schedule, duration, workingHours);
    workingHours = {
        shift: parseInt(workingHours.from.slice(6)),
        from: {
            hour: parseInt(workingHours.from.slice(0, 2)),
            minutes: parseInt(workingHours.from.slice(3, 5))
        },
        to: {
            hour: parseInt(workingHours.to.slice(0, 2)),
            minutes: parseInt(workingHours.to.slice(3, 5))
        }
    };
    schedule = Object.keys(schedule)
        .map(
            x => schedule[x].map(y => {
                const hour = parseInt(y.from.slice(3, 5));
                const shift = parseInt(y.from.slice(9, 11));

                return {
                    name: x,
                    from: {
                        day: getWeekNumber(y.from.slice(0, 2)),
                        hour: (24 + hour - shift) % 24 + workingHours.shift,
                        minutes: y.from.slice(6, 8)
                    },
                    to: {
                        day: getWeekNumber(y.to.slice(0, 2)),
                        hour: y.to.slice(3, 5),
                        minutes: y.to.slice(6, 8)
                    }
                };
            }))
        .reduce((x, y)=>x.concat(y))
        .sort((x, y)=> x.from.day - y.from.day || x.from.hour - y.from.hour);

    // const groupBy1 = groupBy(schedule, 'day');
    // const filter = schedule
    //     .map(x => x.filter(
    //         y => y.from.hour >= workingHours.from.hour &&
    //             y.from.minutes >= workingHours.from.minutes &&
    //             y.to.hour <= workingHours.to.hour &&
    //             y.to.minutes >= workingHours.to.minutes)
    //     );

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return false;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            return template;
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            return false;
        }
    };
}

module.exports = {
    getAppropriateMoment,

    isStar
};
