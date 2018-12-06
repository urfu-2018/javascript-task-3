'use strict';

const WEEK = ['ПН', 'ВТ', 'СР'];
const MINUTES_IN_DAY = 60 * 24;
const MINUTES_IN_HOUR = 60;

function addZero(num) {
    var str = String(num);

    return str.length === 2 ? str : `0${str}`;
}

function timeStrToMinutes(schedule, bankTimeZone) {
    var arr = schedule.split(' ');
    var weekDay = WEEK.indexOf(arr[0]);
    var timeArr = arr[1].split('+');
    var hoursMinutes = timeArr[0].split(':');

    return weekDay * MINUTES_IN_DAY + Number(hoursMinutes[0]) * MINUTES_IN_HOUR +
        Number(hoursMinutes[1]) + (bankTimeZone - Number(timeArr[1])) * MINUTES_IN_HOUR;
}

function cutLimits(obj, limit) {
    return {
        from: obj.from < limit.from ? limit.from : obj.from,
        to: obj.to > limit.to ? limit.to : obj.to
    };
}

function invertTimesArray(arr, limit) {
    if (!arr.length) {
        return [];
    }

    var result = [{
        from: limit.from,
        to: arr[0].from
    }];

    for (var key = 0; key < arr.length - 1; key++) {
        result.push({
            from: arr[key].to,
            to: arr[key + 1].from
        });
    }

    result.push({
        from: arr[arr.length - 1].to,
        to: limit.to
    });

    return result.map(function (obj) {
        return cutLimits(obj, limit);
    });
}

function findIntersection(firstInterval, secondInterval) {
    var leftInterval = firstInterval.from < secondInterval.from
        ? firstInterval
        : secondInterval;
    var rightInterval = firstInterval.from < secondInterval.from
        ? secondInterval
        : firstInterval;
    if (leftInterval.to > rightInterval.from) {
        return {
            from: rightInterval.from,
            to: leftInterval.to > rightInterval.to
                ? rightInterval.to
                : leftInterval.to
        };
    }
}

function findIntersections(first, second) {
    var intersections = [];

    first.forEach(function (firstInterval) {
        second.forEach(function (secondInterval) {
            var intersection = findIntersection(firstInterval, secondInterval);

            if (intersection !== undefined) {
                intersections.push(intersection);
            }
        });
    });

    return intersections;
}

function findAppropriate(limit, workingHours, schedule, duration) {
    var bankTimeZone = Number(workingHours.to.split('+')[1]);

    var daysForRobbery = WEEK;
    var bankWorkingTime = daysForRobbery.map(function (day) {
        return {
            from: day + ' ' + workingHours.from,
            to: day + ' ' + workingHours.to
        };
    });
    var bankWorkingMinutes = bankWorkingTime.map((obj) => timeObjToMinutes(obj, bankTimeZone));

    var busyTimes = Object.entries(schedule).map(function (obj) {
        return obj[1].map((busyObj) => timeObjToMinutes(busyObj, bankTimeZone));
    });

    var freeTimes = busyTimes.map((interval) => {
        return invertTimesArray(interval, limit);
    });
    freeTimes.push(bankWorkingMinutes);

    var united = freeTimes[0];
    for (var key = 1; key < freeTimes.length; key++) {
        united = findIntersections(united, freeTimes[key]);
    }

    return united.filter((interval) => {
        return interval.to - interval.from >= duration;
    })[0];
}

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;

function timeObjToMinutes(obj, bankTimeZone) {
    return {
        from: timeStrToMinutes(obj.from, bankTimeZone),
        to: timeStrToMinutes(obj.to, bankTimeZone)
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
    var appropriate = findAppropriate({
        from: 0,
        to: WEEK.length * MINUTES_IN_DAY
    }, workingHours, schedule, duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return Boolean(appropriate);
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (!appropriate) {
                return '';
            }

            var m = appropriate.from;
            var day = Math.floor(m / MINUTES_IN_DAY);

            var hour = Math.floor((m - day * MINUTES_IN_DAY) / MINUTES_IN_HOUR);
            var minute = m - day * MINUTES_IN_DAY - hour * MINUTES_IN_HOUR;

            return template
                .split('%HH')
                .join(addZero(hour))
                .split('%MM')
                .join(addZero(minute))
                .split('%DD')
                .join(WEEK[day]);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (!appropriate) {
                return false;
            }

            var newLimit = {
                from: appropriate.from + (MINUTES_IN_HOUR / 2),
                to: WEEK.length * MINUTES_IN_DAY
            };
            var newAppropriate = findAppropriate(newLimit, workingHours, schedule, duration);

            if (newAppropriate) {
                appropriate = newAppropriate;

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
