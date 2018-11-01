'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;

const MILLISECONDS_IN_MINUTE = 60 * 1000;
const MILLISECONDS_IN_HOUR = 60 * MILLISECONDS_IN_MINUTE;
const MILLISECONDS_IN_HALF = 30 * MILLISECONDS_IN_MINUTE;
const DAYS_OF_WEEK = ['ПН', 'ВТ', 'СР'];
const DaysForRegExpTime = `${DAYS_OF_WEEK[0]}|${DAYS_OF_WEEK[1]}|${DAYS_OF_WEEK[2]}`;
const TIME_FORMAT = new RegExp(`^(${DaysForRegExpTime})\\s(\\d{2}):(\\d{2})\\+(\\d+)$`);

class TimeRange {
    constructor(timeRange) {
        this.from = timeRange.from;
        this.to = timeRange.to;
    }

    static createTimeRangeFromString(fromDateString, toDateString) {
        return new TimeRange(
            {
                from: parseDate(fromDateString),
                to: parseDate(toDateString)
            }
        );
    }

    union(timeRange) {
        if (this.from < timeRange.to && this.to > timeRange.from) {
            const newFrom = Math.min(this.from, timeRange.from);
            const newTo = Math.max(this.to, timeRange.to);

            return new TimeRange({ from: newFrom, to: newTo });
        }

        return null;
    }

    static union(timeRangeFirst, timeRangeSecond) {
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
        TimeRange.createTimeRangeFromString(
            'ПН ' + workingHours.from,
            'ПН ' + workingHours.to
        ),
        TimeRange.createTimeRangeFromString(
            'ВТ ' + workingHours.from,
            'ВТ ' + workingHours.to
        ),
        TimeRange.createTimeRangeFromString(
            'СР ' + workingHours.from,
            'СР ' + workingHours.to
        )
    ];
    const gangTimesRanges = combineAllTimeRanges(
        Object.values(schedule)
            .reduce((allTimes, timesRobber) => allTimes.concat(timesRobber), [])
            .map(timeline => TimeRange.createTimeRangeFromString(timeline.from, timeline.to))
    );
    const durationMillis = duration * MILLISECONDS_IN_MINUTE;
    const robberyTimes = worksTimeRanges
        .reduce((dates, date, dayIndex) => {
            const endDate = date.to - durationMillis;
            for (let time = date.from; time <= endDate; time += MILLISECONDS_IN_HALF) {
                const checkedTime = new TimeRange({ from: time, to: time + durationMillis });
                if (gangTimesRanges &&
                    !gangTimesRanges.some(timeline =>
                        TimeRange.union(timeline, checkedTime),
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

            return template
                .replace('%DD', robberyTime.nameDay)
                .replace('%HH', paddingTime(hour))
                .replace('%MM', paddingTime(minute));
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (robberyTime && robberyTimes.length !== 0) {
                robberyTime = robberyTimes.shift();

                return this.exists();
            }

            return false;
        }
    };
}

function paddingTime(time) {
    if (time.length !== 2) {

        return '0' + time;
    }

    return time;
}

function parseDate(date) {
    return parseInt(date.replace(TIME_FORMAT,
        (fullDate, ...time) => {
            const [day, hours, minutes, timezone] = time;
            const dayOfMonth = DAYS_OF_WEEK.indexOf(day) + 1;
            const unifiedHour = hours - timezone;

            return Date.UTC(2018, 1, dayOfMonth, unifiedHour, minutes);
        }), 10);
}


function combineAllTimeRanges(gangTimesRanges) {


    const combinedTimesRange = gangTimesRanges.sort(
        (firstDateNumber, secondDateNumber) => firstDateNumber - secondDateNumber)
        .reduce((timesRanges, timeRange) => {
            for (let i = 0; i < timesRanges.length; i++) {
                if (TimeRange.union(timesRanges[i], timeRange)) {
                    timesRanges[i] = timesRanges[i].union(timeRange);

                    return timesRanges;
                }
            }

            return timesRanges.concat(timeRange);
        }, []);

    return combinedTimesRange;
}

module.exports = {
    getAppropriateMoment,
    isStar
};
