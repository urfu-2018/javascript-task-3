'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;

const TASK_TIME = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
function getAppropriateMoment(schedule, duration, workingHours) {
    const TIME_ZONE = Number(workingHours.from.split('+')[1]);
    const BANK_SCHEDULE = getScheduleInMinutes(getWorkSchedule(workingHours), TIME_ZONE);

    let busyTime = [];
    Object.keys(schedule).forEach(member => {
        busyTime = busyTime.concat(getScheduleInMinutes(schedule[member], TIME_ZONE));
    });

    let appropriateMoments = BANK_SCHEDULE.slice(0, 3);
    busyTime.forEach(busyInterval => {
        appropriateMoments = cutBusyTime(appropriateMoments, busyInterval);
    });

    appropriateMoments = appropriateMoments
        .reduce((moments, interval) => {
            let from = interval.from;
            let to = interval.to;
            while (from + 30 < to) {
                moments.push({
                    from: from + 30,
                    to
                });
                from += 30;
            }

            return moments;
        }, appropriateMoments)
        .filter(interval => interval.to - interval.from >= duration)
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
            if (this.appropriateMoments.length - 1 > this.index) {
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
        hours: parseInt(hours),
        minutes: parseInt(minutes),
        timezone: parseInt(timezone)
    };
}

function getWorkSchedule(workingHours) {
    return TASK_TIME.map(weekDay => {
        return {
            from: weekDay + ' ' + workingHours.from,
            to: weekDay + ' ' + workingHours.to
        };
    });
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

    return TASK_TIME.indexOf(parsedDate.day) * 1440 +
        (parsedDate.hours + timezone - parsedDate.timezone) * 60 +
        parsedDate.minutes;
}

function minutesToDate(dateInMinutes) {
    let day = TASK_TIME[Math.floor(dateInMinutes / 1440)];
    dateInMinutes = parseInt(dateInMinutes - TASK_TIME.indexOf(day) * 1440);
    let hours = Math.floor(dateInMinutes / 60);
    let minutes = dateInMinutes - hours * 60;

    return {
        day,
        hours,
        minutes
    };
}

function cutBusyTime(freeIntervals, busyInterval) {
    return freeIntervals.reduce((freeTime, interval) => {
        if (inclide(interval, busyInterval)) {
            freeTime.push({
                from: interval.from,
                to: busyInterval.from
            });
            freeTime.push({
                from: busyInterval.to,
                to: interval.to
            });
        } else if (leftIntersection(interval, busyInterval)) {
            freeTime.push({
                from: busyInterval.to,
                to: interval.to
            });
        } else if (leftIntersection(busyInterval, interval)) {
            freeTime.push({
                from: interval.from,
                to: busyInterval.from
            });
        } else if (!inclide(busyInterval, interval)) {
            freeTime.push(interval);
        }

        return freeTime;
    }, []);
}

function leftIntersection(firstInterval, secondInterval) {
    return firstInterval.from >= secondInterval.from &&
        secondInterval.to > firstInterval.from &&
        secondInterval.to < firstInterval.to;
}

function inclide(firstInterval, secondInterval) {
    return firstInterval.from < secondInterval.from && secondInterval.to < firstInterval.to;
}

module.exports = {
    getAppropriateMoment,

    isStar
};
