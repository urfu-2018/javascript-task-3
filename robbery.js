'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;

const TIMEZONE_START_INDEX = 6;
const START_OF_DAY_IN_MINUTES = 0;
const END_OF_DAY_IN_MINUTES = 1440;

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

/**
 * Приводим дату и время в формат банка.
 * @param {String} strDateTime – Время и дата в строке
 * @param {Number} bankTimeZone - Часовой пояс банка
 * @returns {Object}
 */
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

function convertIntTimeToString(time) {
    return time.toString().length === 1
        ? `0${time}`
        : time;
}

function convertToMinutes(hours, minutes) {
    return hours * 60 + minutes;
}

// Методы определения пересечения занятого и свободного периода времени.

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
    return period.fromInMinutes < period.toInMinutes;
}

function computeFreeTimeForPeriod(period, convertedFrom, convertedTo, currentDay) {
    if (isOutOfBoundPeriod(convertedFrom, period, convertedTo)) {
        return;
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

    if (!isPeriodCorrect(period)) {
        removeElementFromArray(currentDay, period);
    }
}

function getBankWorkingPeriod(workingHours) {
    const bankDTFrom = workingHours.from.substring(0, 5).split(':');
    const bankDTTo = workingHours.to.substring(0, 5).split(':');

    const fromHours = getConvertedToIntTime(bankDTFrom[0]);
    const fromMinutes = getConvertedToIntTime(bankDTFrom[1]);
    const toHours = getConvertedToIntTime(bankDTTo[0]);
    const toMinutes = getConvertedToIntTime(bankDTTo[1]);

    return {
        fromInMinutes: convertToMinutes(fromHours, fromMinutes),
        toInMinutes: convertToMinutes(toHours, toMinutes)
    };
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

    const FOUND_ROBBERY_TIMES = [];
    let CURRENT_ROBBERY_TIME_INDEX = 0;

    const bankWorkingPeriod = getBankWorkingPeriod(workingHours);

    let freeTimes = [];
    Object.keys(DAYS).forEach((day) => {
        freeTimes[day] = [{
            fromInMinutes: bankWorkingPeriod.fromInMinutes,
            toInMinutes: bankWorkingPeriod.toInMinutes,
            name: day
        }];
    });

    // В общем суть алгоритма в разбиении дня на учатски свободного времени.
    // Мы пробегаем циклом по всем занятым участкам времени грабителей и
    // по свободному времени. В зависимости от того,
    // как пересекаются интервалы занятого и свободного времени,
    // меняем итервалы свободного времени (сдвигаем или разбиваем их).
    // Сохранив все интервалы, далее импользуем их для вычиления более позднего времени.

    Object.keys(schedule).forEach((robber) => {
        schedule[robber].forEach((busyDuration) => {
            const fromDT = getNormilizedToBankTimezoneDT(busyDuration.from,
                parseInt(workingHours.from.substring(TIMEZONE_START_INDEX)));
            const toDT = getNormilizedToBankTimezoneDT(busyDuration.to,
                parseInt(workingHours.from.substring(TIMEZONE_START_INDEX)));

            let convertedFromFirstDay;
            let convertedToFirstDay;

            if (fromDT.day !== toDT.day) {
                convertedFromFirstDay = convertToMinutes(fromDT.hours, fromDT.minutes);
                convertedToFirstDay = END_OF_DAY_IN_MINUTES;
                const convertedFromSecondDay = START_OF_DAY_IN_MINUTES;
                const convertedToSecondDay = convertToMinutes(toDT.hours, toDT.minutes);

                freeTimes[toDT.day].forEach(
                    (period) => {
                        computeFreeTimeForPeriod(period,
                            convertedFromSecondDay,
                            convertedToSecondDay,
                            freeTimes[toDT.day]);
                    }
                );
            } else {
                convertedFromFirstDay = convertToMinutes(fromDT.hours, fromDT.minutes);
                convertedToFirstDay = convertToMinutes(toDT.hours, toDT.minutes);
            }

            freeTimes[fromDT.day].forEach(
                (period) => {
                    computeFreeTimeForPeriod(period,
                        convertedFromFirstDay,
                        convertedToFirstDay,
                        freeTimes[fromDT.day]);
                }
            );
        });
    });

    Object.keys(freeTimes).forEach((day) => {
        FOUND_ROBBERY_TIMES.push(...freeTimes[day]
            .filter((period) => {
                return period.toInMinutes - period.fromInMinutes >= duration;
            })
            .map((period) => {
                return {
                    from: {
                        DD: day,
                        HH: Math.floor(period.fromInMinutes / 60),
                        MM: period.fromInMinutes % 60
                    },
                    remainingFreeTimeInMinutes: period.toInMinutes - period.fromInMinutes
                };
            })
        );
    });

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return FOUND_ROBBERY_TIMES.length;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (!this.exists()) {
                return '';
            }

            const firstFound = FOUND_ROBBERY_TIMES[CURRENT_ROBBERY_TIME_INDEX].from;

            return template
                .replace('%DD', firstFound.DD)
                .replace('%HH', convertIntTimeToString(firstFound.HH))
                .replace('%MM', convertIntTimeToString(firstFound.MM));
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            function calculateNextTime(CURRENT_ROBBERY_TIME) {
                CURRENT_ROBBERY_TIME.remainingFreeTimeInMinutes -= 30;
                const nextTimeMinutes = CURRENT_ROBBERY_TIME.from.MM + 30;
                if (nextTimeMinutes >= 60) {
                    CURRENT_ROBBERY_TIME.from.HH += 1;
                    CURRENT_ROBBERY_TIME.from.MM = nextTimeMinutes - 60;
                } else {
                    CURRENT_ROBBERY_TIME.from.MM = nextTimeMinutes;
                }
            }

            for (let i = CURRENT_ROBBERY_TIME_INDEX; i < FOUND_ROBBERY_TIMES.length; i++) {
                if (CURRENT_ROBBERY_TIME_INDEX !== i) {
                    CURRENT_ROBBERY_TIME_INDEX = i;

                    return true;
                }

                if (FOUND_ROBBERY_TIMES[i].remainingFreeTimeInMinutes - 30 < duration) {
                    continue;
                }

                calculateNextTime(FOUND_ROBBERY_TIMES[i]);

                CURRENT_ROBBERY_TIME_INDEX = i;

                return true;
            }


            return false;
        }
    };
}

module.exports = {
    getAppropriateMoment,

    isStar
};
