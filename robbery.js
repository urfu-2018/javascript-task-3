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
            tomorrow: 'ВТ'
        },
        'ВТ': {
            yesterday: 'ПН',
            tomorrow: 'СР'
        },
        'СР': {
            yesterday: 'ВТ'
        }
    });

function getNormilizedToBankTimezoneDT(strDateTime, bankTimeZone) {
    const day = strDateTime.split(' ')[0];
    const time = strDateTime.split(' ')[1];

    let dt = {
        day: day,
        hours: getConvertedToIntTime(time.split(':')[0]),
        minutes: getConvertedToIntTime(time.split(':')[1]),
        timeZone: parseInt(time.substring(TIMEZONE_START_INDEX))
    };

    if (dt.timeZone !== bankTimeZone) {
        const diffedHours = dt.hours + (bankTimeZone - dt.timeZone);

        if (diffedHours < 0) {
            dt.hours = 24 + diffedHours;
            dt.day = DAYS[dt.day].yesterday;
        } else if (diffedHours > 24) {
            dt.hours = diffedHours - 24;
            dt.day = DAYS[dt.day].tomorrow;
        } else {
            dt.hours = diffedHours;
        }
        dt.timeZone = bankTimeZone;
    }

    return dt;
}

function getConvertedToIntTime(time) {
    return time.startsWith('0')
        ? parseInt(time.substr(1))
        : parseInt(time);
}

function convertToMinutes(hours, minutes) {
    return hours * 60 + minutes;
}

function isOutOfBoundPeriod(convertedFrom, period, convertedTo) {
    return convertedFrom > period.toInMinutes ||
        convertedTo < period.fromInMinutes;
}

function isFullInnerPeriod(convertedFrom, period, convertedTo) {
    return convertedFrom > period.fromInMinutes &&
        convertedTo < period.toInMinutes;
}

function isPeriodThroutBoundLeft(convertedFrom, period, convertedTo) {
    return convertedFrom < period.fromInMinutes &&
        convertedTo < period.toInMinutes;
}

function isPeriodThroutBoundRight(convertedFrom, period, convertedTo) {
    return convertedFrom < period.toInMinutes &&
        convertedTo > period.toInMinutes;
}

function removeElementFromArray(arr, element) {
    const index = arr.indexOf(element);
    if (index > -1) {
        arr.splice(index, 1);
    }
}

function isPeriodCorrect(period) {
    return period.fromInMinutes > period.toInMinutes;
}

function computeFreeTimeForPeriod(period, convertedFrom, convertedTo, currentDay) {
    if (isOutOfBoundPeriod(convertedFrom, period, convertedTo)) {
        console.info('');
    } else if (isFullInnerPeriod(convertedFrom, period, convertedTo)) {
        const newPeriod = {
            fromInMinutes: convertedTo,
            toInMinutes: period.toInMinutes
        };

        period.toInMinutes = convertedFrom;
        currentDay.push(newPeriod);
    } else if (
        isPeriodThroutBoundLeft(convertedFrom, period, convertedTo)) {

        period.fromInMinutes = convertedTo;

    } else if (
        isPeriodThroutBoundRight(convertedFrom, period, convertedTo)) {

        period.toInMinutes = convertedFrom;
    }

    if (isPeriodCorrect(period)) {
        removeElementFromArray(currentDay, period);
    }
}


/* eslint complexity: off */

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
            const bankTimeZone = parseInt(workingHours.from.substring(TIMEZONE_START_INDEX));
            console.info(workingHours.from);

            const bankDTFrom = workingHours.from.substring(0, 5).split(':');
            const bankDTTo = workingHours.to.substring(0, 5).split(':');

            const fromHours = getConvertedToIntTime(bankDTFrom[0]);
            const fromMinutes = getConvertedToIntTime(bankDTFrom[1]);
            const toHours = getConvertedToIntTime(bankDTTo[0]);
            const toMinutes = getConvertedToIntTime(bankDTTo[1]);

            let freeTimes = {
                'ПН': [{
                    fromInMinutes: convertToMinutes(fromHours, fromMinutes),
                    toInMinutes: convertToMinutes(toHours, toMinutes),
                    name: 'ПН'
                }],
                'ВТ': [{
                    fromInMinutes: convertToMinutes(fromHours, fromMinutes),
                    toInMinutes: convertToMinutes(toHours, toMinutes),
                    name: 'ВТ'
                }],
                'СР': [{
                    fromInMinutes: convertToMinutes(fromHours, fromMinutes),
                    toInMinutes: convertToMinutes(toHours, toMinutes),
                    name: 'СР'
                }]
            };

            /* function test(robber, fromDT) {
                return robber === 'Linus' && fromDT.day === 'ПН';
            }

            test(robber, fromDT);*/

            Object.keys(schedule).forEach((robber) => {
                schedule[robber].forEach((busyDuration) => {
                    const fromDT = getNormilizedToBankTimezoneDT(busyDuration.from, bankTimeZone);
                    const toDT = getNormilizedToBankTimezoneDT(busyDuration.to, bankTimeZone);

                    if (fromDT.day !== toDT.day) {
                        const convertedFromFirstDay =
                            convertToMinutes(fromDT.hours, fromDT.minutes);
                        const convertedToFirstDay = 1440;
                        const convertedFromSecondDay = 0;
                        const convertedToSecondDay =
                            convertToMinutes(toDT.hours, toDT.minutes);


                        freeTimes[fromDT.day].forEach(
                            (period) => {
                                computeFreeTimeForPeriod(period,
                                    convertedFromFirstDay,
                                    convertedToFirstDay,
                                    freeTimes[fromDT.day]);
                            }
                        );
                        freeTimes[toDT.day].forEach(
                            (period) => {
                                computeFreeTimeForPeriod(period,
                                    convertedFromSecondDay,
                                    convertedToSecondDay,
                                    freeTimes[fromDT.day]);
                            }
                        );
                    }
                    if (fromDT.day === toDT.day) {
                        const convertedFrom = convertToMinutes(fromDT.hours, fromDT.minutes);
                        const convertedTo = convertToMinutes(toDT.hours, toDT.minutes);

                        freeTimes[fromDT.day].forEach(
                            (period) => {
                                computeFreeTimeForPeriod(period,
                                    convertedFrom,
                                    convertedTo,
                                    freeTimes[fromDT.day]);
                            }
                        );
                    }
                });

                console.info('finish robber - ' + robber);
                console.info(freeTimes);
                console.info('-------------------------------');
            });

            freeTimes.reduce((isFound, day) => {
                return day.reduce((accumulator, period) => {
                    if (period.toInMinutes - period.fromInMinutes >= duration) {
                        return {
                            DD: day.name,
                            HH: Math.floor(period.fromInMinutes / 60),
                            MM: period.fromInMinutes % 60
                        };
                    }
                }, null);
            }, null);

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
