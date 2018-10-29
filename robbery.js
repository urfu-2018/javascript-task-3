'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;

function addDays(d, days) {
    var date = new Date(d.valueOf());
    date.setDate(date.getDate() + days);

    return date;
}

const dayOfWeek = {
    'ПН': 1,
    'ВТ': 2,
    'СР': 3,
    'ЧТ': 4,
    'ПТ': 5,
    'СБ': 6,
    'ВС': 7
};

function parseDate(str, shiftGmt = 0, noGmt = false) {
    var splitFullTime = str.split(' ');
    var weekday = splitFullTime.length > 1 ? splitFullTime[0] : 'ПН';
    var time = (splitFullTime.length > 1 ? splitFullTime[1] : splitFullTime[0]).split(':');
    var h = Number(time[0]);
    var m = Number(time[1].substring(0, 2));
    var gmt = noGmt ? 0 : Number(time[1].substring(3));

    return new Date(2018, 9, dayOfWeek[weekday], h - gmt + shiftGmt, m);
}

function parseTimeTemplate(template, date) {
    var weekday = Object.keys(dayOfWeek)[date.getDay() - 1];
    var hours = date.getHours();
    var minutes = date.getMinutes();

    return template
        .replace(/%DD/g, weekday)
        .replace(/%HH/g, hours > 9 ? hours : '0' + hours)
        .replace(/%MM/g, minutes > 9 ? minutes : '0' + minutes);
}

function getWorkTimeBank(workingHours) {
    var interval = [];
    var startWork = parseDate(workingHours.from, 0, true);
    var endWork = parseDate(workingHours.to, 0, true);
    var numberOfThursday = 3;

    for (var numberOfDayWeek = 0; numberOfDayWeek < numberOfThursday; numberOfDayWeek++) {
        interval.push(
            {
                from: addDays(startWork, numberOfDayWeek),
                to: addDays(endWork, numberOfDayWeek)
            }
        );
    }

    return interval;
}

function tryCombineIntervals(first, second) {
    if (first.to < second.from) {
        return null;
    }
    if (first.from <= second.from && second.to <= first.to) {
        return first;
    }
    if (first.from <= second.from && first.to < second.to) {
        return {
            from: first.from,
            to: second.to
        };
    }
}

function combineTimeIntervals(intervals) {
    var newIntervals = [];
    var accumulationInterval = 0;

    for (var i = 1; i < intervals.length; i++) {
        var combines = tryCombineIntervals(intervals[accumulationInterval], intervals[i]);
        if (!combines) {
            newIntervals.push(intervals[accumulationInterval]);
            accumulationInterval = i;
        } else {
            intervals[accumulationInterval] = combines;
        }
    }
    if (intervals[accumulationInterval]) {
        newIntervals.push(intervals[accumulationInterval]);
    }

    return newIntervals;
}

function isBetween(firstNumber, between, lastNumber) {
    return firstNumber <= between && between <= lastNumber;
}

function isSubstractInterval(interval, subInterval) {
    return interval.from <= subInterval.from &&
        subInterval.to <= interval.to;
}

function getSubstractInterval(lastInterval, subtractionInterval) {
    if (isSubstractInterval(lastInterval, subtractionInterval)) {

        return [{
            from: lastInterval.from,
            to: subtractionInterval.from
        }, {
            from: subtractionInterval.to,
            to: lastInterval.to
        }];
    }
    if ((subtractionInterval.from < lastInterval.from &&
        subtractionInterval.to <= lastInterval.to)) {

        return [{
            from: subtractionInterval.to,
            to: lastInterval.to
        }];
    }
    if ((lastInterval.from <= subtractionInterval.from &&
        lastInterval.to < subtractionInterval.to)) {

        return [{
            from: lastInterval.from,
            to: subtractionInterval.from
        }];
    }
}

function deductIntervals(pluralityIntervals, subtractionInterval) {
    var lastInterval = pluralityIntervals.pop();
    if (!(isBetween(lastInterval.from, subtractionInterval.from, lastInterval.to) ||
        isBetween(lastInterval.from, subtractionInterval.to, lastInterval.to))) {
        pluralityIntervals.push(lastInterval);

        return pluralityIntervals;
    }

    return pluralityIntervals.concat(getSubstractInterval(lastInterval, subtractionInterval));
}

function getAllBadActsDay(schedule, workingHours, duration, howManyTry) {
    var goodTimes = [];

    workingHours.forEach(function (workDay) {
        var acts = [workDay];
        schedule.forEach(function (busyTime) {
            acts = deductIntervals(acts, busyTime);
        });
        acts.forEach(function (freeTime) {
            for (var time = freeTime.from.getTime();
                freeTime.to.getTime() >= time + duration * 60 * 1000;
                time += howManyTry * 60 * 1000) {
                goodTimes.push(new Date(time));
            }
        });
    });

    return goodTimes;
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
    var timeZoneBank = Number(workingHours.from.split('+')[1]);

    var overallSchedule = Object.keys(schedule).map(function (scheduleOne) {
        return schedule[scheduleOne].map(function (e) {
            return {
                from: parseDate(e.from, timeZoneBank),
                to: parseDate(e.to, timeZoneBank)
            };
        });
    });

    var attemptOffset = 30;
    var normalWorkingHoursBank = getWorkTimeBank(workingHours);
    var parseOverallSchedule = overallSchedule.reduce(function (x, y) {
        return x.concat(y);
    });
    var sortIntervals = parseOverallSchedule
        .sort(function (a, b) {
            return a.from.getTime() - b.from.getTime();
        }
        );
    var busyIntervals = combineTimeIntervals(sortIntervals);
    var goodTimes = [];

    goodTimes = getAllBadActsDay(busyIntervals, normalWorkingHoursBank, duration, attemptOffset);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return goodTimes.length > 0;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            return this.exists() ? parseTimeTemplate(template, goodTimes[0]) : '';
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (goodTimes.length > 1) {
                goodTimes.shift();

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
