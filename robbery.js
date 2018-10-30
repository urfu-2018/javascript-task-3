'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */

function formatSchedule(schedule, bankTimeZone) {
    const formattedSchedule = {};

    Object.keys(schedule).forEach(person => {
        formattedSchedule[person] = schedule[person].map(busyHours => {
            const [dayFrom, timeFrom] = busyHours.from.split(' ');
            const [dayTo, timeTo] = busyHours.to.split(' ');

            return {
                from: [dayFrom, hoursToMinutes(timeFrom, bankTimeZone)],
                to: [dayTo, hoursToMinutes(timeTo, bankTimeZone)]
            };
        });
    });

    return formattedSchedule;
}

function getBankTimeZone(workingHours) {
    return parseInt(workingHours.from.split('+')[1]);
}

function timeInMunutes(time) {
    let [hours, minutes] = time.split(':');

    hours = parseInt(hours);
    minutes = parseInt(minutes);

    return hours * 60 + minutes;
}

function hoursToMinutes(timeAndTimeZone, bankTimeZone) {
    let [time, timeZone] = timeAndTimeZone.split('+');
    timeZone = parseInt(timeZone);
    let formattedToMinutesTime =
        timeInMunutes(time) +
        (bankTimeZone ? calculateDifferenceInTimeZones(timeZone, bankTimeZone) : 0);

    return formattedToMinutesTime;
}

function calculateDifferenceInTimeZones(personTimeZone, bankTimeZone) {
    return (bankTimeZone - personTimeZone) * 60;
}

function formatBankTime(workingHours) {
    return {
        from: hoursToMinutes(workingHours.from),
        to: hoursToMinutes(workingHours.to)
    };
}

function createDaysTimeRange(formattedSchedule, formattedWorkingHours) {
    const ob = { ПН: [], ВТ: [], СР: [] };

    Object.keys(formattedSchedule).forEach(person => {
        formattedSchedule[person].forEach(({ from, to }) => {
            if (from[0] === to[0]) {
                ob[from[0]].push([from[1], to[1]]);
            } else {
                ob[from[0]].push([from[1], formattedWorkingHours.to]);
                ob[to[0]].push([formattedWorkingHours.from, to[1]]);
            }
        });
    });

    return ob;
}

function compareRanges(supposedRange, dayRange) {
    return (
        (supposedRange[0] <= dayRange[0] && supposedRange[1] <= dayRange[0]) ||
        (supposedRange[0] >= dayRange[1] && supposedRange[1] >= dayRange[1])
    );
}

function findTimeRange(daysRanges, duration, formattedWorkingHours) {
    const possibleVariants = { ПН: [], ВТ: [], СР: [] };

    for (let i = formattedWorkingHours.from; i < formattedWorkingHours.to - duration + 1; i++) {
        Object.keys(daysRanges).forEach(day => {
            let counter = 0;

            daysRanges[day].forEach(range => {
                if (compareRanges([i, i + duration], range)) {
                    counter += 1;
                }
            });

            if (counter === daysRanges[day].length) {
                possibleVariants[day].push(i);
                i += 29;
            }
        });
    }

    return possibleVariants;
}

function findNearByTime(possibleTimes) {
    const days = Object.keys(possibleTimes);
    for (const day of days) {
        if (possibleTimes[day].length) {
            return [day, possibleTimes[day][0]];
        }
    }
}

function formatNumber(number) {
    const formatted = number.toString();

    if (formatted.length === 2) {
        return formatted;
    }

    return '0' + formatted;
}

function getAppropriateMoment(schedule, duration, workingHours) {
    // console.info(schedule, duration, workingHours);
    const bankTimeZone = getBankTimeZone(workingHours);
    const formattedSchedule = formatSchedule(schedule, bankTimeZone);
    const formattedWorkingHours = formatBankTime(workingHours);
    const daysRanges = createDaysTimeRange(formattedSchedule, formattedWorkingHours);
    const possibleTimes = findTimeRange(daysRanges, duration, formattedWorkingHours);

    let closestTime = findNearByTime(possibleTimes);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            const days = Object.keys(possibleTimes);
            for (const day of days) {
                if (possibleTimes[day].length) {
                    return true;
                }
            }

            return false;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (closestTime) {
                return template
                    .replace('%HH', formatNumber(parseInt(closestTime[1] / 60)))
                    .replace('%MM', formatNumber(closestTime[1] % 60))
                    .replace('%DD', closestTime[0]);
            }

            return '';
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        // eslint-disable-next-line
        tryLater: function() {
            const days = Object.keys(possibleTimes);
            const currentTime = closestTime[1];

            for (const day of days) {
                const filtered = possibleTimes[day].filter(
                    possibleTime => possibleTime > currentTime
                );
                if (day === closestTime[0] && filtered.length) {
                    closestTime[1] = filtered[0];

                    return true;
                } else if (
                    ((day === 'ВТ' && closestTime[0] === 'ПН') ||
                        (day === 'СР' && closestTime[0] === 'ВТ') ||
                        (day === 'СР' && closestTime[0] === 'ПН')) &&
                    possibleTimes[day].length
                ) {
                    closestTime = [day, possibleTimes[day][0]];

                    return true;
                }
            }

            return false;
        }
    };
}

module.exports = {
    getAppropriateMoment,

    isStar
};
