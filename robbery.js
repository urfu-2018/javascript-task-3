'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;

function converting(timeStartOrEnd) {
    let date = new Date();
    date.setUTCFullYear(2018);
    date.setUTCMonth(9);
    let daysToConvert = new Map();
    daysToConvert
        .set('ПН', 1)
        .set('ВТ', 2)
        .set('СР', 3)
        .set('ЧТ', 4)
        .set('ПТ', 5)
        .set('СБ', 6)
        .set('ВС', 7);
    date.setUTCDate(daysToConvert.get(timeStartOrEnd.substr(0, 2)));
    let regexp = timeStartOrEnd.match(/\+\d{1,}/);
    regexp[0] = regexp[0].substr(1, regexp[0].length - 1);
    date.setUTCHours(timeStartOrEnd.substr(3, 2));
    date.setUTCMinutes(timeStartOrEnd.substr(6, 2));
    date.setUTCSeconds(0);
    date.setUTCMilliseconds(0);
    date = date.valueOf() - Number(regexp[0]) * 3600000;

    return date;
}

function conversionToSpareTime(schedule) {
    let spareTime = [];
    const start = converting('ПН 00:00+5');
    const end = converting('ВС 23:59+5');
    for (const key in schedule) {
        if (schedule.hasOwnProperty(key)) {
            spareTime = spareTime.concat(schedule[key].reduce((acc, busyTime) => {
                acc.push({
                    from: start,
                    to: converting(busyTime.from)
                });
                acc.push({
                    from: converting(busyTime.to),
                    to: end
                });

                return acc;
            }, []));
        }
    }

    return spareTime;
}

function conversionToCommonSpareTime(schedule) {
    let time = conversionToSpareTime(schedule);
    let commonSpareTime = [];
    for (let i = 0; i < time.length; i = i + 2) {
        if (i === 0) {
            commonSpareTime.push(time[i]);
            commonSpareTime.push(time[i + 1]);
        }
        commonSpareTime.forEach(leisureInterval => {
            if (firstEveryTimeInCommonTime(time, i, leisureInterval)) {
                leisureInterval.to = time[i].to;
            }
            if (twoEveryTimeInCommonTime(time, i, leisureInterval)) {
                commonSpareTime.push({
                    from: time[i + 1].from,
                    to: leisureInterval.to
                });
                leisureInterval.to = time[i].to;
            }
            if (secondEveryTimeInCommonTime(time, i, leisureInterval)) {
                leisureInterval.from = time[i + 1].from;
            }
        });
    }

    return commonSpareTime;
}

function firstEveryTimeInCommonTime(time, i, leisureInterval) {
    return time[i].to <= leisureInterval.to &&
    time[i].to > leisureInterval.from &&
    time[i + 1].from > leisureInterval.to;
}

function twoEveryTimeInCommonTime(time, i, leisureInterval) {
    return time[i].to < leisureInterval.to &&
    time[i + 1].from <= leisureInterval.to &&
    time[i].to < time[i + 1].from &&
    leisureInterval.from <= time[i].to;
}

function secondEveryTimeInCommonTime(time, i, leisureInterval) {
    return time[i].to < leisureInterval.from &&
    time[i + 1].from >= leisureInterval.from &&
    time[i + 1].from < leisureInterval.to;
}

function conversionToRobberyTime(workingHours, commonSpareTime) {
    let days = bankWorkingDays(workingHours);
    let robberyTime = [];
    days.forEach(day => {
        commonSpareTime.forEach(robberyInterval => {
            if (robberyLaterDay(robberyInterval, day)) {
                robberyTime.push({
                    from: robberyInterval.from,
                    to: day.to
                });
            }
            if (robberyEarlierDay(robberyInterval, day)) {
                robberyTime.push({
                    from: day.from,
                    to: robberyInterval.to
                });
            }
            if (dayInRobbery(robberyInterval, day)) {
                robberyTime.push({
                    from: day.from,
                    to: day.to
                });
            }
            if (robberyInDay(robberyInterval, day)) {
                robberyTime.push({
                    from: robberyInterval.from,
                    to: robberyInterval.to
                });
            }
        });
    });

    return robberyTime;
}

function robberyLaterDay(robberyInterval, day) {
    return robberyInterval.from < day.to &&
    robberyInterval.from > day.from &&
    robberyInterval.to > day.to;
}

function robberyEarlierDay(robberyInterval, day) {
    return robberyInterval.to > day.from &&
    robberyInterval.to < day.to &&
    robberyInterval.from < day.from;
}
function dayInRobbery(robberyInterval, day) {
    return robberyInterval.to >= day.to &&
    robberyInterval.from <= day.from;
}

function robberyInDay(robberyInterval, day) {
    return robberyInterval.to < day.to &&
    robberyInterval.from > day.from;
}

function bankWorkingDays(working) {
    let bank = ['ПН ', 'ВТ ', 'СР '];
    bank = bank.map(day => {
        return {
            from: converting(day + working.from),
            to: converting(day + working.to)
        };
    });

    return bank;
}

function sorting(robberyInterval, index, arr) {
    if (arr[index + 1] && robberyInterval.from > arr[index + 1].from) {
        let temp1 = robberyInterval.from;
        let temp2 = robberyInterval.to;
        robberyInterval.from = arr[index + 1].from;
        robberyInterval.to = arr[index + 1].to;
        arr[index + 1].from = temp1;
        arr[index + 1].to = temp2;
    }
}

function converting2(ms) {
    ms = Number(ms) + 5 * 3600000;
    ms = new Date(ms);
    let DDHHMM = [];
    let daysToConvert = new Map();
    daysToConvert
        .set(1, 'ПН')
        .set(2, 'ВТ')
        .set(3, 'СР');
    DDHHMM.push(daysToConvert.get(ms.getDate()));
    let hours = ms.getUTCHours().toString();
    if (hours < 10) {
        hours = '0' + hours;
    }
    DDHHMM.push(hours);
    let minutes = ms.getUTCMinutes().toString();
    if (minutes < 10) {
        minutes = '0' + minutes;
    }
    DDHHMM.push(minutes);

    return DDHHMM;
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
    let commonSpareTime = conversionToCommonSpareTime(schedule);
    let forTryLater = {
        milliseconds: duration * 60000,
        intervals: conversionToRobberyTime(workingHours, commonSpareTime),
        filterAndSorting: function () {
            this.intervals = this.intervals.filter(robberyInterval =>
                robberyInterval.to - robberyInterval.from >=
                this.milliseconds);
            this.intervals.forEach(sorting);
        },
        nextSuitableInterval: function () {
            forTryLater.intervals[0].from = forTryLater.intervals[0].from +
            30 * 60000;
        },
        savePreviousInterval: function () {
            this.previosInterval = this.intervals;

        },
        retrievePreviousInterval: function () {
            this.intervals = this.previosInterval;
        }
    };
    forTryLater.filterAndSorting();

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            if (!forTryLater.intervals[0]) {
                return false;
            }

            return true;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * в часовом поясе банка
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (!forTryLater.intervals[0]) {
                return '';
            }
            let DDHHMM = converting2(forTryLater.intervals[0].from);
            template = template.replace(/%DD/g, DDHHMM[0]);
            template = template.replace(/%HH/g, DDHHMM[1]);
            template = template.replace(/%MM/g, DDHHMM[2]);

            return template;
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            forTryLater.savePreviousInterval();
            if (forTryLater.intervals[0]) {
                forTryLater.nextSuitableInterval();
                forTryLater.filterAndSorting();

                return true;
            }
            forTryLater.retrievePreviousInterval();

            return false;
        }
    };
}

module.exports = {
    getAppropriateMoment,

    isStar
};
