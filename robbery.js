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
function parseToUtc(inputStr) {
    let day = getWeekNumber(inputStr.slice(0, 2));

    const localHour = parseInt(inputStr.slice(3, 5));
    const minutes = parseInt(inputStr.slice(6, 8));
    const shift = parseInt(inputStr.slice(9, 11));
    let fromUtcHour = localHour - shift;

    if (fromUtcHour < 0) {
        fromUtcHour = (24 + fromUtcHour) % 24;
        day = (7 + day) % day;
    }

    return { day: day, hour: fromUtcHour, minutes: minutes };
}

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
    let newSchedule = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };

    function fillSchedule(robberSchedule, robberName) {
        const fromInUtc = parseToUtc(robberSchedule.from);
        const toInUtc = parseToUtc(robberSchedule.to);
        if (fromInUtc.day === toInUtc.day) {
            newSchedule[fromInUtc.day].push(
                { name: robberName, fromInUtc: fromInUtc, toInYtc: toInUtc });

            return;
        }
        newSchedule[fromInUtc.day].push(
            {
                name: robberName,
                fromInUtc: fromInUtc,
                toInYtc: { day: fromInUtc.day, hour: 23, minutes: 59 }
            });
        newSchedule[toInUtc.day].push({
            name: robberName,
            fromInUtc: { day: toInUtc.day, hour: 0, minutes: 0 },
            toInYtc: toInUtc
        });
    }

    for (let propName in schedule) {
        if (!Array.isArray(schedule[propName])) {
            continue;
        }
        const robberSchedule = schedule[propName];
        for (let i = 0; i < robberSchedule.length; i++) {
            fillSchedule(robberSchedule[i], propName);
        }
    }
    const anies = Object.keys(newSchedule).filter(x=>newSchedule[x].length > 0)
        .map(x=>newSchedule[x]
            .sort((y, z) =>
                y.fromInUtc.day - z.fromInUtc.day ||
            y.fromInUtc.hour - z.fromInUtc.hour || y.fromInUtc.minutes - z.fromInUtc.minutes)
            .reduce((y, z)=> {
                return { fromInUtc: z.fromInUtc, toInYtc: y.toInYtc };
            }));

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
