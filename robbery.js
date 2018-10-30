'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;

const MILLISECONDS_IN_MINUTE = 60 * 1000;
const MILLISECONDS_IN_HOUR = 60 * MILLISECONDS_IN_MINUTE;
const MILLISEC_IN_HALF = 30 * MILLISECONDS_IN_MINUTE;
const FORMAT_TIME = /^(ПН|ВТ|СР)\s(\d{2}):(\d{2})\+(\d+)$/;
const DAYS_OF_WEEK = ['ПН', 'ВТ', 'СР'];

class TimeRange {
    constructor(timeRange) {
        this.from = timeRange.from;
        this.to = timeRange.to;
    }

    static createTimeRangeFromString(stringTimeRange) {
        return new TimeRange(
            {
                from: parseDate(stringTimeRange.from),
                to: parseDate(stringTimeRange.to)
            }
        );
    }

    static intersectsAndReplaces(timeRangeFirst, timeRangeSecond) {
        if (timeRangeFirst.from < timeRangeSecond.to && timeRangeFirst.to > timeRangeSecond.from) {
            const newFrom = Math.min(timeRangeFirst.from, timeRangeSecond.from);
            const newTo = Math.max(timeRangeFirst.to, timeRangeSecond.to);

            return new TimeRange({ from: newFrom, to: newTo });
        }

        return null;
    }
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
    const worksTimeRanges = [
        TimeRange.createTimeRangeFromString({
            from: 'ПН ' + workingHours.from,
            to: 'ПН ' + workingHours.to
        }),
        TimeRange.createTimeRangeFromString({
            from: 'ВТ ' + workingHours.from,
            to: 'ВТ ' + workingHours.to
        }),
        TimeRange.createTimeRangeFromString({
            from: 'СР ' + workingHours.from,
            to: 'СР ' + workingHours.to
        })
    ];
    const gangTimesRanges = combineAllTimeRanges(
        Object.values(schedule)
            .reduce((allTimes, timesRobber) => allTimes.concat(timesRobber), [])
            .map(timeline => TimeRange.createTimeRangeFromString(timeline))
    );
    const durationMillis = duration * MILLISECONDS_IN_MINUTE;
    const robberyTimes = worksTimeRanges
        .reduce((dates, date, dayIndex) => {
            const endDate = date.to - durationMillis;
            for (let time = date.from; time <= endDate; time += MILLISEC_IN_HALF) {
                const checkedTime = new TimeRange({ from: time, to: time + durationMillis });
                if (gangTimesRanges &&
                    !gangTimesRanges.some(timeline =>
                        TimeRange.intersectsAndReplaces(timeline, checkedTime),
                    )) {
                    dates.push({
                        time: checkedTime.from,
                        nameDay: DAYS_OF_WEEK[dayIndex]
                    });
                }
            }

            return dates;
        }, []);
    let robberyTime = robberyTimes.shift();

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return Boolean(robberyTime);
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (!robberyTime) {
                return '';
            }
            const timezoneBank = parseInt(workingHours.to.split('+')[1]);
            const timeZoneRobbery = new Date(robberyTime.time).getTimezoneOffset();
            const millisecondInZone = (timezoneBank + timeZoneRobbery / 60) * MILLISECONDS_IN_HOUR;
            const date = new Date(robberyTime.time + millisecondInZone);
            let hour = date.getHours().toString();
            let minute = date.getMinutes().toString();
            if (hour.length !== 2) {
                hour = '0' + hour;
            }
            if (minute.length !== 2) {
                minute = '0' + minute;
            }

            return template
                .replace('%DD', robberyTime.nameDay)
                .replace('%HH', hour)
                .replace('%MM', minute);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (robberyTime && robberyTimes.length !== 0) {
                robberyTime = robberyTimes.shift();

                return true;
            }

            return false;
        }
    };
}


function parseDate(date) {
    return parseInt(date.replace(FORMAT_TIME,
        (fullDate, ...time) => {
            const [day, hours, minutes, timezone] = time;

            return Date.UTC(2018, 1, DAYS_OF_WEEK.indexOf(day) + 1, hours - timezone, minutes);
        }), 10);
}


function combineAllTimeRanges(gangTimesRanges) {
    let combinedTimesRange = [];
    while (combinedTimesRange.length !== gangTimesRanges.length) {
        combinedTimesRange = gangTimesRanges.reduce((timesRanges, timeRange) => {
            for (let i = 0; i < timesRanges.length; i++) {
                if (TimeRange.intersectsAndReplaces(timesRanges[i], timeRange)) {
                    timesRanges[i] = TimeRange.intersectsAndReplaces(timesRanges[i], timeRange);

                    return timesRanges;
                }
            }

            return timesRanges.concat(timeRange);
        }, []);
        gangTimesRanges = combinedTimesRange;
    }

    return combinedTimesRange;
}

module.exports = {
    getAppropriateMoment,
    isStar
};
