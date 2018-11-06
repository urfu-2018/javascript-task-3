'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;

const TASK_TIME = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
const MINUTES_IN_HOUR = 60;
const MINUTES_IN_DAY = MINUTES_IN_HOUR * 24;

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
function getAppropriateMoment(schedule, duration, workingHours) {
    const timezone = Number(workingHours.from.split('+')[1]);
    const bankSchedule = getScheduleInMinutes(getWorkSchedule(workingHours), timezone);
    const busyTime = getScheduleInMinutes(getBusyTime(schedule), timezone);

    let appropriateMoments = getTimeForRobbery(bankSchedule.slice(0, 3), busyTime, duration)
        .sort((a, b) => a.from - b.from)
        .map(interval => {
            return {
                from: minutesToDate(interval.from),
                to: minutesToDate(interval.to)
            };
        });

    return {
        appropriateMoments,
        index: 0,

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return this.appropriateMoments.length !== 0;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (!this.exists()) {
                return '';
            }

            return template
                .replace(/%DD/, this.appropriateMoments[this.index].from.day)
                .replace(/%HH/, pad(this.appropriateMoments[this.index].from.hours))
                .replace(/%MM/, pad(this.appropriateMoments[this.index].from.minutes));
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (this.appropriateMoments[this.index + 1]) {
                ++this.index;

                return true;
            }

            return false;
        }
    };
}

function pad(number) {
    return (number < 10 ? '0' : '') + number;
}

function parseDate(date) {
    let [day, hours, minutes, timezone] = date.match(/^(\W\W)\s(\d\d):(\d\d)\+(\d)$/).slice(1, 5);

    return {
        day,
        hours: parseInt(hours, 10),
        minutes: parseInt(minutes, 10),
        timezone: parseInt(timezone, 10)
    };
}

function getWorkSchedule(workingHours) {
    return TASK_TIME.map(day => {
        return {
            from: day + ' ' + workingHours.from,
            to: day + ' ' + workingHours.to
        };
    });
}

function getBusyTime(schedule) {
    return Object.keys(schedule).reduce((busyTime, member) => {
        return busyTime.concat(schedule[member]);
    }, []);
}

function getScheduleInMinutes(schedule, timezone) {
    return schedule.map(time => {
        return {
            from: getMinutesFromTheBegining(time.from, timezone),
            to: getMinutesFromTheBegining(time.to, timezone)
        };
    });
}

function getMinutesFromTheBegining(date, timezone) {
    let parsedDate = parseDate(date);

    return TASK_TIME.indexOf(parsedDate.day) * MINUTES_IN_DAY +
        (parsedDate.hours + timezone - parsedDate.timezone) * MINUTES_IN_HOUR +
        parsedDate.minutes;
}

function minutesToDate(dateInMinutes) {
    let day = TASK_TIME[Math.floor(dateInMinutes / MINUTES_IN_DAY)];
    dateInMinutes = parseInt(dateInMinutes - TASK_TIME.indexOf(day) * MINUTES_IN_DAY);
    let hours = Math.floor(dateInMinutes / MINUTES_IN_HOUR);
    let minutes = dateInMinutes - hours * MINUTES_IN_HOUR;

    return {
        day,
        hours,
        minutes
    };
}

function getTimeForRobbery(freeTime, busyTime, duration) {
    return busyTime
        .reduce((appropriateMoments, busyInterval) => {
            return cutBusyTime(appropriateMoments, busyInterval);
        }, freeTime)
        .filter(interval => interval.to - interval.from >= duration)
        .reduce((moments, interval) => {
            let from = interval.from;
            while (from + duration <= interval.to) {
                moments.push({
                    from,
                    to: from + duration
                });
                from += 30;
            }

            return moments;
        }, []);
}

function cutBusyTime(freeIntervals, busyInterval) {
    return freeIntervals.reduce((freeTime, interval) => {
        if (notIntersect(busyInterval, interval)) {
            freeTime.push(interval);
        } else {
            if (busyInterval.to < interval.to) {
                freeTime.push({
                    from: busyInterval.to,
                    to: interval.to
                });
            }
            if (interval.from < busyInterval.from) {
                freeTime.push({
                    from: interval.from,
                    to: busyInterval.from
                });
            }
        }

        return freeTime;
    }, []);
}

function notIntersect(firstInterval, secondInterval) {
    return firstInterval.from >= secondInterval.to || firstInterval.to <= secondInterval.from;
}

module.exports = {
    getAppropriateMoment,

    isStar
};
