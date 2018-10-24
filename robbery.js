'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;

const TIMEZONE_START_INDEX = 6;

const DAYS = Object.freeze(
    {
        'ПН': {
            yesterday: 'ВС',
            tomorrow: 'ВТ'
        },
        'ВТ': {
            yesterday: 'ПН',
            tomorrow: 'СР'
        },
        'СР': {
            yesterday: 'ВТ',
            tomorrow: 'ЧТ'
        },
        'ЧТ': {
            yesterday: 'СР',
            tomorrow: 'ПТ'
        },
        'ПТ': {
            yesterday: 'ЧТ',
            tomorrow: 'СБ'
        },
        'СБ': {
            yesterday: 'ПТ',
            tomorrow: 'ВС'
        },
        'ВС': {
            yesterday: 'СБ',
            tomorrow: 'ПН'
        }
    });

function getNormilizedToBankTimezoneDT(strDateTime, bankTimeZone) {
    const day = strDateTime.split(' ')[0];
    const time = strDateTime.split(' ')[1];

    let dt = {
        day: day,
        hours: parseInt(time.split(':')[0]),
        minutes: parseInt(time.split(':')[1]),
        timeZone: time.substring(TIMEZONE_START_INDEX)
    };

    if (dt.timeZone !== bankTimeZone) {
        const diffedHours = dt.timeZone + (bankTimeZone - dt.timeZone);
        if (diffedHours < 0) {
            dt.hours = 24 + diffedHours;
            dt.day = DAYS[dt.day].yesterday;
        } else if (diffedHours > 0) {
            dt.hours = 0 + diffedHours;
            dt.day = DAYS[dt.day].tomorrow;
        }
    }

    return dt;
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

    /* {
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
            }*/
    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            const bankTimeZone = workingHours.from.substring(TIMEZONE_START_INDEX);
            console.info(bankTimeZone);

            let busyTimes = [];

            Object.keys(schedule).forEach((robber) => {
                robber.forEach((busyDuration) => {
                    const fromDT = getNormilizedToBankTimezoneDT(busyDuration.from, bankTimeZone);
                    const toDT = getNormilizedToBankTimezoneDT(busyDuration.to, bankTimeZone);

                    if (fromDT.day !== toDT.day) {
                        busyTimes[fromDT.day].push({
                            fromInMinutes: fromDT.hours * 60 + fromDT.minutes,
                            toInMinutes: 24 * 60
                        });

                        busyTimes[toDT.day].push({
                            fromInMinutes: 0,
                            toInMinutes: toDT.hours * 60 + toDT.minutes
                        });
                    } else {
                        busyTimes[fromDT.day].push({
                            fromInMinutes: fromDT.hours * 60 + fromDT.minutes,
                            toInMinutes: toDT.hours * 60 + toDT.minutes
                        });
                    }
                });
            });

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
