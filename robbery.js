'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;

const dayNumbers = new Map([
    ['ПН', 0],
    ['ВТ', 1],
    ['СР', 2],
    ['ЧТ', 3],
    ['ПТ', 4],
    ['СБ', 5],
    ['ВС', 6]
]);

const days = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

class Time {
    constructor(minutes, timezone) {
        this.minutes = minutes;
        this.timezone = timezone;
    }

    getMinutes() {
        return this.minutes;
    }

    getTime() {
        const minutesInTimezone = this.minutes + this.timezone * 60;

        const day = Math.trunc(minutesInTimezone / (24 * 60));
        const hours = Math.trunc(minutesInTimezone / 60) - day * 24;
        const minutes = minutesInTimezone % 60;

        return {
            day: days[day % 7],
            hours: hours,
            minutes: minutes,
            timezone: this.timezone
        };
    }

    toString() {
        const time = this.getTime();

        return `${time.day} ${getFormattedString(time.hours)}:${getFormattedString(time.minutes)}` +
            `+${time.timezone}`;
    }

    setTimeZone(timezone) {
        this.timezone = timezone;

        return this;
    }

    getTimeSpanDuration(otherTime) {
        return Math.abs(otherTime.getMinutes() - this.getMinutes());
    }

    getTimeAfter(minutes) {
        return new Time(this.minutes + minutes, this.timezone);
    }

}

function createTime(day, hours, minutes, timezone) {
    const totalMinutes = dayNumbers.get(day) * 24 * 60 + (hours - timezone) * 60 + minutes;

    return new Time(totalMinutes, timezone);
}

function parseTime(dateString) {
    const match = dateString.match(/(\d{2}):(\d{2})([+-]\d+)/);
    const hours = Number.parseInt(match[1]);
    const minutes = Number.parseInt(match[2]);
    const timezone = Number.parseInt(match[3]);

    return { hours, minutes, timezone };
}

function parseDate(dateString) {
    const day = dateString.match(/^.{2}/)[0];
    const time = parseTime(dateString);

    return createTime(day, time.hours, time.minutes, time.timezone);
}

class Interval {
    constructor(start, finish) {
        this.start = start;
        this.finish = finish;
    }

    isIntersected(otherInterval) {
        return this.start.getMinutes() <= otherInterval.finish.getMinutes() &&
            this.finish.getMinutes() >= otherInterval.start.getMinutes();
    }

    getDuration() {
        return this.start.getTimeSpanDuration(this.finish);
    }

    throwOutInterval(interval) {
        if (!this.isIntersected(interval)) {
            return [this];
        }

        const separatedIntervals = [];

        if (this.start.getMinutes() < interval.start.getMinutes()) {
            separatedIntervals.push(new Interval(this.start, interval.start));
        }

        if (interval.finish.getMinutes() < this.finish.getMinutes()) {
            separatedIntervals.push(new Interval(interval.finish, this.finish));
        }

        return separatedIntervals;
    }

    isTimeMomentAfterInterval(timeMoment) {
        return this.finish.getMinutes() <= timeMoment.getMinutes();
    }

    isTimeMomentInInterval(timeMoment) {
        return this.start.getMinutes() < timeMoment.getMinutes() &&
            timeMoment.getMinutes() < this.finish.getMinutes();
    }
}

class Schedule {
    constructor(timeIntervals) {
        this.timeIntervals = timeIntervals;
    }

    throwOutBusyTime(busyTimeSchedule) {
        let bankWorkingTime = this.timeIntervals;
        busyTimeSchedule.timeIntervals.forEach(busyTimeInterval => {
            const newBankWorkingTime = [];
            bankWorkingTime.forEach(workingTimeInterval => {
                workingTimeInterval.throwOutInterval(busyTimeInterval)
                    .forEach(separatedInterval => newBankWorkingTime.push(separatedInterval));
            });
            bankWorkingTime = newBankWorkingTime;
        });

        return new Schedule(bankWorkingTime);
    }

    getCorrectIntervalAfterMoment(timeMoment, minIntervalDuration) {
        let intervalsAfterMoment = [];
        this.timeIntervals.forEach(interval => {
            if (interval.isTimeMomentAfterInterval(timeMoment)) {
                return;
            }
            if (interval.isTimeMomentInInterval(timeMoment)) {
                intervalsAfterMoment.push(new Interval(timeMoment, interval.finish));
            } else {
                intervalsAfterMoment.push(interval);
            }
        });

        intervalsAfterMoment = intervalsAfterMoment
            .filter(interval => interval.getDuration() >= minIntervalDuration);
        if (intervalsAfterMoment.length === 0) {
            return null;
        }

        return intervalsAfterMoment[0];
    }
}

function getBusyTime(schedule) {
    return new Schedule(
        schedule.map(
            workingTime =>
                new Interval(parseDate(workingTime.from), parseDate(workingTime.to))
        )
    );
}

function getBankWorkingSchedule(workingTimeFrom, workingTimeTo) {

    return new Schedule(
        ['ПН', 'ВТ', 'СР'].map(day => new Interval(
            createTime(
                day,
                workingTimeFrom.hours,
                workingTimeFrom.minutes,
                workingTimeFrom.timezone
            ),
            createTime(
                day,
                workingTimeTo.hours,
                workingTimeTo.minutes,
                workingTimeTo.timezone
            )
        )));
}

function getFormattedString(number) {
    const numberString = number.toString();
    if (numberString.length >= 2) {
        return numberString;
    }

    return `0${numberString}`;
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
    const bankWorkingTimeFrom = parseTime(workingHours.from);
    const bankWorkingTimeTo = parseTime(workingHours.to);

    const bankTimeZone = bankWorkingTimeFrom.timezone;

    const dannyTime = getBusyTime(schedule.Danny);
    const rustyTime = getBusyTime(schedule.Rusty);
    const linusTime = getBusyTime(schedule.Linus);

    const robberySchedule = getBankWorkingSchedule(bankWorkingTimeFrom, bankWorkingTimeTo)
        .throwOutBusyTime(dannyTime)
        .throwOutBusyTime(rustyTime)
        .throwOutBusyTime(linusTime);

    const firstRobberyInterval = robberySchedule
        .getCorrectIntervalAfterMoment(
            createTime(
                'ПН',
                bankWorkingTimeFrom.hours,
                bankWorkingTimeFrom.minutes,
                bankWorkingTimeFrom.timezone
            ),
            duration
        );

    return {

        robberyTime: firstRobberyInterval === null ? null : firstRobberyInterval.start,

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return this.robberyTime !== null;
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

            const time = this.robberyTime.setTimeZone(bankTimeZone).getTime();

            return template
                .replace(/%HH/g, getFormattedString(time.hours))
                .replace(/%MM/g, getFormattedString(time.minutes))
                .replace(/%DD/g, time.day);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            const laterTime = this.robberyTime.getTimeAfter(30);
            const robberyInterval = robberySchedule
                .getCorrectIntervalAfterMoment(laterTime, duration);
            if (robberyInterval === null) {
                return false;
            }

            this.robberyTime = robberyInterval.start;

            return true;
        }
    };
}

module.exports = {
    getAppropriateMoment,

    isStar
};
