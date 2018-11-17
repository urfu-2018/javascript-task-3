'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;

function converting(time) {
    let date = new Date();
    let daysToConvert = new Map();
    daysToConvert
        .set('ПН', 1)
        .set('ВТ', 2)
        .set('СР', 3)
        .set('ЧТ', 4)
        .set('ПТ', 5)
        .set('СБ', 6)
        .set('ВС', 7);
    date.setUTCDate(daysToConvert.get(time.substr(0, 2)));
    const timezone = time.substr(8, time.length - 8);
    date.setUTCHours(time.substr(3, 2));
    date.setUTCMinutes(time.substr(6, 2));
    date.setUTCSeconds(0);
    date.setUTCMilliseconds(0);
    const millisecondsInHour = 60 * 60 * 1000;
    date = date.valueOf() - Number(timezone) * millisecondsInHour;

    return date;
}

function conversionToSpareTime(schedule) {
    let spareTime = [];
    const start = converting('ПН 00:00+5');
    const end = converting('ВС 23:59+5');
    for (const key in schedule) {
        if (!schedule.hasOwnProperty(key)) {
            continue;
        }
        const freeTimeOneRobber = schedule[key].reduce((acc, busyTime) => {
            acc.push({
                from: start,
                to: converting(busyTime.from)
            });
            acc.push({
                from: converting(busyTime.to),
                to: end
            });

            return acc;
        }, []);
        spareTime = spareTime.concat(freeTimeOneRobber);
    }

    return spareTime;
}

function conversionToCommonSpareTime(schedule) {
    const time = conversionToSpareTime(schedule);
    let commonSpareTime = [];
    for (let i = 0; i < time.length; i = i + 2) {
        if (i === 0) {
            commonSpareTime.push(time[i]);
            commonSpareTime.push(time[i + 1]);
        }
        commonSpareTime.forEach(leisureInterval => {
            if (time[i + 1].from > leisureInterval.to) {
                leisureInterval.to = Math.min(leisureInterval.to, time[i].to);
            } else if (time[i].to < leisureInterval.from) {
                leisureInterval.from =
                Math.max(leisureInterval.from, time[i + 1].from);
            } else {
                commonSpareTime.push({
                    from: time[i + 1].from,
                    to: leisureInterval.to
                });
                leisureInterval.to = time[i].to;
            }
        });
    }

    return commonSpareTime;
}

function conversionToRobberyTime(workingHours, commonSpareTime) {
    const days = bankWorkingDays(workingHours);
    let robberyTime = [];
    days.forEach(day => {
        commonSpareTime.forEach(robberyInterval => {
            robberyTime.push({
                from: Math.max(robberyInterval.from, day.from),
                to: Math.min(robberyInterval.to, day.to)
            });
        });
    });

    return robberyTime;
}

function bankWorkingDays(working) {
    const bank = ['ПН ', 'ВТ ', 'СР '];

    return bank.map(day => {
        return {
            from: converting(day + working.from),
            to: converting(day + working.to)
        };
    });
}

function reverseConverting(ms) {
    ms = Number(ms) + 5 * 3600000;
    ms = new Date(ms);
    let DDHHMM = [];
    let daysToReverseConvert = new Map();
    daysToReverseConvert
        .set(1, 'ПН')
        .set(2, 'ВТ')
        .set(3, 'СР');
    DDHHMM.push(daysToReverseConvert.get(ms.getDate()));
    const hours = ms.getUTCHours().toString();
    DDHHMM = addingZero(hours, DDHHMM);
    const minutes = ms.getUTCMinutes().toString();
    DDHHMM = addingZero(minutes, DDHHMM);

    return DDHHMM;
}

function addingZero(unit, arrDate) {
    if (unit < 10) {
        unit = '0' + unit;
    }
    arrDate.push(unit);

    return arrDate;
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
    const commonSpareTime = conversionToCommonSpareTime(schedule);
    const millisecondsInMinute = 60000;
    const halfHour = 30;
    let forTryLater = {
        milliseconds: duration * millisecondsInMinute,
        intervals: conversionToRobberyTime(workingHours, commonSpareTime),
        filter: function () {
            this.intervals = this.intervals.filter(robberyInterval =>
                robberyInterval.to - robberyInterval.from >=
                this.milliseconds);
        },
        nextSuitableInterval: function () {
            forTryLater.intervals[0].from = forTryLater.intervals[0].from +
            halfHour * millisecondsInMinute;
        }
    };
    forTryLater.filter();
    forTryLater.intervals.sort((a, b) => a.from - b.from);

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
            const DDHHMM = reverseConverting(forTryLater.intervals[0].from);
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
            if (!forTryLater.intervals[0]) {

                return false;
            }
            const tempFrom = forTryLater.intervals[0].from;
            const tempTo = forTryLater.intervals[0].to;
            forTryLater.nextSuitableInterval();
            forTryLater.filter();
            if (!forTryLater.intervals[0]) {
                forTryLater.intervals = [{
                    from: tempFrom,
                    to: tempTo
                }];

                return false;
            }

            return true;
        }
    };
}

module.exports = {
    getAppropriateMoment,

    isStar
};
