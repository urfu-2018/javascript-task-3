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
function getAppropriateMoment(schedule, duration, workingHours) {
    console.info(schedule, duration, workingHours);

    function timeInMunutes(time) {
        const [hours, minutes] = time.split(':');
        hours = parseInt(hours);
        minutes = parseInt(minutes);

        return hours * 60 + minutes;
    }

    function calculateDifferenceInTimeZones(personTimeZone, bankTimeZone) {
        return (bankTimeZone - personTimeZone) * 60;
    }

    function hoursToMinutes(timeAndTimeZone, bankTimeZone) {
        const [time, timeZone] = timeAndTimeZone.split('+');
        timeZone = parseInt(timeZone);
        let formattedToMinutesTime =
            timeInMunutes(time) + bankTimeZone
                ? calculateDifferenceInTimeZones(timeZone, bankTimeZone)
                : 0;

        return formattedToMinutesTime;
    }

    function formatSchedule(bankTimeZone) {
        Object.keys(schedule).forEach(person => {
            schedule[person].forEach(({ from, to }) => {
                const [dayFrom, timeFrom] = from.split(' ');
                const [dayTo, timeTo] = to.split(' ');

                return {
                    from: [dayFrom, hoursToMinutes(timeFrom, bankTimeZone)],
                    to: [dayTo, hoursToMinutes(timeTo, bankTimeZone)]
                };
            });
        });
    }

    function getBankTimeZone() {
        return workingHours.from.split('+')[1];
    }

    function formatBankTime() {
        workingHours = {
            from: hoursToMinutes(workingHours.from),
            to: hoursToMinutes(workingHours.to)
        };
    }

    function createDaysTimeRange() {
        const ob = { ПН: [], ВТ: [], СР: [] };

        Object.keys(schedule).forEach(person => {
            schedule[person].forEach(({ from, to }) => {
                if (from[0] === to[0]) {
                    ob[from[0]].push([from[1], to[1]]);
                } else {
                    ob[from[0]].push([from[1], workingHours[to]]);
                    ob[to[0]].push(workingHours[from], to[0]);
                }
            });
        });

        return ob;
    }

    function compareRanges(supposedRange, dayRange) {
        return (
            (supposedRange[0] < dayRange[0] && supposedRange[1] < dayRange[1]) ||
            (supposedRange[0] > dayRange[0] && supposedRange[1] > dayRange[1])
        );
    }

    function findTimeRange(duration) {
        const bankTimeZone = getBankTimeZone();

        formatBankTime();
        formatSchedule(bankTimeZone);

        const invalidTimeRanges = createDaysTimeRange();

        for (let i = workingHours.from; i < workingHours.to - duration; i++) {
            Object.keys(invalidTimeRanges).forEach(day => {
                invalidTimeRanges[day].forEach(range => {
                    if (!compareRanges([i, i + duration], range)) {
                        return false;
                    }
                });
            });
        }
    }

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
