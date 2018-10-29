'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;

const HOURS_IN_DAY = 24;
const MINUTES_IN_HOUR = 60;
const DAYS = ['ПН', 'ВТ', 'СР'];
const OFFSET_IN_MINUTES = 30;
const MAX_TIME_FOR_ROBBERY_IN_MINUTES = 4320;

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
function getAppropriateMoment(schedule, duration, workingHours) {
    const successfulTimes = getSuccessfulTimes();

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return successfulTimes.length > 0;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (successfulTimes.length === 0) {
                return '';
            }
            const [minutes, hours, day] = convertFromMinutes(successfulTimes[0]);

            return template
                .replace('%MM', minutes > 9 ? minutes : '0' + minutes)
                .replace('%HH', hours > 9 ? hours : '0' + hours)
                .replace('%DD', day);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            const mayBeLater = successfulTimes.length !== 1;
            if (mayBeLater) {
                successfulTimes.shift();
            }

            return mayBeLater;
        }
    };

    function getDayOfWeek(time) {
        return time.slice(0, 2);
    }

    function getHours(time) {
        return parseInt(time.slice(3, 5));
    }

    function getMinutes(time) {
        return parseInt(time.slice(6, 8));
    }

    function getTimeZone(time) {
        return parseInt(time.slice(9));
    }

    function getTimeInMinutes(time) {
        const dayInHours = DAYS.indexOf(getDayOfWeek(time)) * HOURS_IN_DAY;
        const timeZoneOfBank = getTimeZone('ПН ' + workingHours.from);
        const tzDiff = timeZoneOfBank - getTimeZone(time);
        const hours = getHours(time) + dayInHours + tzDiff;
        const hourInMinute = hours * MINUTES_IN_HOUR;

        return hourInMinute + getMinutes(time);
    }

    function getWorkingTimeOfBank() {
        const result = [];
        for (let day of DAYS) {
            const from = getTimeInMinutes(day + ' ' + workingHours.from);
            const to = getTimeInMinutes(day + ' ' + workingHours.to);
            result.push([from, to]);
        }

        return result;
    }

    function getFreeTimeForOnePerson(person) {
        const workingTimesInMinutes = [];
        let result = [];
        for (let time of schedule[person]) {
            const from = getTimeInMinutes(time.from);
            const to = getTimeInMinutes(time.to);
            workingTimesInMinutes.push([from, to]);
        }
        const minTime = workingTimesInMinutes[0][0];
        const tempTimes = workingTimesInMinutes[workingTimesInMinutes.length - 1];
        const maxTime = tempTimes[tempTimes.length - 1];
        if (minTime > 0) {
            result.push([0, minTime]);
        }
        result = getDiffTimePeriods(workingTimesInMinutes, minTime);
        if (maxTime < MAX_TIME_FOR_ROBBERY_IN_MINUTES) {
            result.push([maxTime, MAX_TIME_FOR_ROBBERY_IN_MINUTES]);
        }

        return result;
    }

    function getDiffTimePeriods(times, minTime) {
        const result = [];
        let a0 = minTime;
        for (let time of times) {
            const tempArr = [a0, time[0]];
            a0 = time[1];
            if (tempArr[0] < tempArr[1]) {
                result.push(tempArr);
            }
        }

        return result;
    }

    function getIntersect(oneFreeTimes, twoFreeTimes) {
        const timeIntersects = [];
        for (let freeTime1 of oneFreeTimes) {
            for (let freeTime2 of twoFreeTimes) {
                tryPush(freeTime1, freeTime2, timeIntersects);
            }
        }

        return timeIntersects;
    }

    function tryPush(freeTime1, freeTime2, timeIntersects) {
        const [a1, b1] = freeTime1;
        const [a2, b2] = freeTime2;
        const [a3, b3] = [Math.max(a1, a2), Math.min(b1, b2)];
        if (a3 < b3) {
            timeIntersects.push([a3, b3]);
        }
    }

    function pushSuccessfulTimes(possibleTime) {
        const result = [];
        for (let time of possibleTime) {
            let temp = time[0];
            while (temp + duration <= time[1]) {
                result.push([temp, time[1]]);
                temp += OFFSET_IN_MINUTES;
            }
        }

        return result;
    }

    function convertFromMinutes(start) {
        const minutes = start[0] % 60;
        const hours = Math.floor(start[0] / 60);
        const remainedHours = hours % 24;
        const day = DAYS[Math.floor(hours / 24)];

        return [minutes, remainedHours, day];
    }

    function getSuccessfulTimes() {
        const freeTimeOfPersons = [];
        for (let person of Object.getOwnPropertyNames(schedule)) {
            freeTimeOfPersons.push(getFreeTimeForOnePerson(person));
        }
        let intersects = getIntersect(freeTimeOfPersons[0], freeTimeOfPersons[1]);
        intersects = getIntersect(intersects, freeTimeOfPersons[2]);
        const possibleTime = getIntersect(intersects, getWorkingTimeOfBank());

        return pushSuccessfulTimes(possibleTime);
    }
}

module.exports = {
    getAppropriateMoment,

    isStar
};
