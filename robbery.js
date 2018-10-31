'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;

const HOURS_IN_DAY = 24;
const MINUTES_IN_HOUR = 60;
const DAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ'];
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
                .replace('%MM', convertTimeToFormat(minutes))
                .replace('%HH', convertTimeToFormat(hours))
                .replace('%DD', day);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            const mayBeLater = successfulTimes.length > 1;
            if (mayBeLater) {
                successfulTimes.shift();
            }

            return mayBeLater;
        }
    };

    function getSuccessfulTimes() {
        const freeTimes = Object.getOwnPropertyNames(schedule).map(
            person => getFreeTimeForOnePerson(person));
        freeTimes.push(getWorkingTimeOfBank());
        const possibleTime = freeTimes.reduce(
            (prevIntersect, nextFreeTimes) => getIntersect(prevIntersect, nextFreeTimes));

        return pushSuccessfulTimes(possibleTime);
    }

    function getFreeTimeForOnePerson(person) {
        let result = [];
        const workingTimesInMinutes = schedule[person].map(
            time => ([getTimeInMinutes(time.from), getTimeInMinutes(time.to)]));

        if (workingTimesInMinutes.length === 0) {
            return result.concat([[0, MAX_TIME_FOR_ROBBERY_IN_MINUTES]]);
        }

        const tempTimes = workingTimesInMinutes[workingTimesInMinutes.length - 1];
        const [minTime, maxTime] = [workingTimesInMinutes[0][0], tempTimes[tempTimes.length - 1]];
        if (minTime > 0) {
            result.push([0, minTime]);
        }
        result = result.concat(getDiffTimePeriods(workingTimesInMinutes, minTime));
        if (maxTime < MAX_TIME_FOR_ROBBERY_IN_MINUTES) {
            result.push([maxTime, MAX_TIME_FOR_ROBBERY_IN_MINUTES]);
        }

        return result;
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
        return DAYS.map(day => {
            const from = getTimeInMinutes(`${day} ${workingHours.from}`);
            const to = getTimeInMinutes(`${day} ${workingHours.to}`);

            return [from, to];
        });
    }

    function pushSuccessfulTimes(possibleTime) {
        const result = [];
        for (let time of possibleTime) {
            let [leftEdge, rightEdge] = time;
            while (leftEdge + duration <= rightEdge) {
                result.push([leftEdge, rightEdge]);
                leftEdge += OFFSET_IN_MINUTES;
            }
        }

        return result;
    }
}

function getDiffTimePeriods(times, currentLeftEdge) {
    return times.map(time => {
        let result = [currentLeftEdge, time[0]];
        currentLeftEdge = time[1];

        return result;
    }).filter(([leftEdge, rightEdge]) => leftEdge < rightEdge);
}

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
    const [leftEdge1, rightEdge1] = freeTime1;
    const [leftEdge2, rightEdge2] = freeTime2;
    const [resultLeftEdge, resultRightEdge] =
        [Math.max(leftEdge1, leftEdge2), Math.min(rightEdge1, rightEdge2)];
    if (resultLeftEdge < resultRightEdge) {
        timeIntersects.push([resultLeftEdge, resultRightEdge]);
    }
}

function convertFromMinutes(start) {
    const minutes = start[0] % MINUTES_IN_HOUR;
    const hours = Math.floor(start[0] / MINUTES_IN_HOUR);
    const remainedHours = hours % HOURS_IN_DAY;
    const day = DAYS[Math.floor(hours / HOURS_IN_DAY)];

    return [minutes, remainedHours, day];
}

function convertTimeToFormat(time) {
    return time > 9 ? time : '0' + time;
}

module.exports = {
    getAppropriateMoment,

    isStar
};
