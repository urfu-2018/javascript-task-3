'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = false;

const DAYS = {
    0: 'ПН',
    1: 'ВТ',
    2: 'СР'
};

const NUMBER_OF_MINUTES_IN_THREE_DAYS = 4320;

function getKeyByValue(object, value) {
    return Object
        .keys(object)
        .find(key => object[key] === value);
}

function parseTime(time) {
    const timePattern = /^(\d\d):(\d\d)\+(\d+)$/;
    const [, hours, minutes, timeZone] = time.match(timePattern);

    return [hours, minutes, timeZone].map(val => Number(val));
}

function convertMinutesToTime(minutes) {
    const numberOfDay = Math.floor(minutes / (24 * 60));
    const hours = Math
        .floor((minutes - numberOfDay * 24 * 60) / 60)
        .toString()
        .padStart(2, '0');
    const minute = (minutes - numberOfDay * 24 * 60 - hours * 60)
        .toString()
        .padStart(2, '0');

    return [DAYS[numberOfDay], hours, minute];
}

function convertTimeToMinutes(day, timeIntervale, bankTimeZone) {
    let [hours, minutes, timeZone] = parseTime(timeIntervale);
    hours += bankTimeZone - timeZone;

    return getKeyByValue(DAYS, day) * 24 * 60 + hours * 60 + minutes;
}

function getBankTimeZone(bankWorkingTime) {

    return Number(bankWorkingTime.split('+')[1]);
}

function bankScheduleToMinutesIntrvales(shedule, bankTimeZone) {
    return Object.values(DAYS).map(day => {
        return {
            start: convertTimeToMinutes(day, shedule.from, bankTimeZone),
            end: convertTimeToMinutes(day, shedule.to, bankTimeZone)
        };
    });
}

function scheduleToMinutesIntervales(personSchedule, bankTimeZone) {
    return personSchedule.map(timeIntervale => {
        const [fromDay, fromHours] = timeIntervale.from.split(' ');
        const [toDay, toHours] = timeIntervale.to.split(' ');

        return {
            start: convertTimeToMinutes(fromDay, fromHours, bankTimeZone),
            end: convertTimeToMinutes(toDay, toHours, bankTimeZone)
        };
    });
}

class TimeLine {
    constructor(scheduleInMinutes) {
        this.scheduleInMinutes = scheduleInMinutes;
    }

    get getScheduleInMinutes() {

        return this.scheduleInMinutes;
    }

    unionLines(anotherLine) {
        let unionSchediles = this.scheduleInMinutes.concat(anotherLine.getScheduleInMinutes);

        unionSchediles.sort((firstInterval, secondInterval) => {
            return firstInterval.start - secondInterval.start;
        });

        let currentStart = unionSchediles[0].start;
        let currentEnd = unionSchediles[0].end;

        const resultUnion = unionSchediles
            .map((interval, index) => {
                if (interval.start > currentEnd && index !== 0) {
                    const returnStatement = { start: currentStart, end: currentEnd };
                    currentStart = interval.start;
                    currentEnd = interval.end;

                    return returnStatement;
                } else if (interval.end > currentEnd) {
                    currentEnd = interval.end;
                }

                return null;
            })
            .filter(Boolean);
        resultUnion.push({ start: currentStart, end: currentEnd });

        return new TimeLine(resultUnion);
    }

    getIntersectionLines(anotherLine) {
        let unionSchediles = this.scheduleInMinutes.concat(anotherLine.getScheduleInMinutes);

        unionSchediles.sort((firstInterval, secondInterval) => {
            return firstInterval.start - secondInterval.start;
        });

        const intersectionIntervales = [];
        let start;
        let end;
        let isFound = false;

        for (let minute = 0; minute <= NUMBER_OF_MINUTES_IN_THREE_DAYS + 1; minute++) {
            const numberOfIntervalsForMinute = unionSchediles.reduce((acc, interval) => {
                if (interval.start <= minute && interval.end >= minute) {
                    acc++;
                }

                return acc;
            }, 0);
            if (numberOfIntervalsForMinute > 1 && !isFound) {
                isFound = true;
                start = minute;
            } else if (numberOfIntervalsForMinute <= 1 && isFound) {
                isFound = false;
                end = minute - 1;
                intersectionIntervales.push({ start, end });
            }
        }

        return new TimeLine(intersectionIntervales.filter(element => {
            return element.start !== element.end;
        }));
    }

    invertIntervalesOnLine() {
        let currentStart = 0;
        const invertedIntervaleLines = this.scheduleInMinutes
            .map(interval => {
                const returnStatement = { start: currentStart, end: interval.start };
                currentStart = interval.end;

                return returnStatement;
            })
            .filter(interval => {

                return typeof interval !== 'undefined';
            });

        invertedIntervaleLines.push({
            start: currentStart,
            end: NUMBER_OF_MINUTES_IN_THREE_DAYS
        });
        this.scheduleInMinutes = invertedIntervaleLines;
    }

    getIfIntervalesMoreOrEqualConst(number) {
        return this.scheduleInMinutes.filter(interval => {
            return interval.end - interval.start >= number;
        });
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
    const bankTimeZone = getBankTimeZone(workingHours.from);

    const firstTimeLine = new TimeLine(scheduleToMinutesIntervales(schedule.Danny, bankTimeZone));
    const secondTimeLine = new TimeLine(scheduleToMinutesIntervales(schedule.Rusty, bankTimeZone));
    const thirdTimeLine = new TimeLine(scheduleToMinutesIntervales(schedule.Linus, bankTimeZone));

    const bankTimeLine = new TimeLine(bankScheduleToMinutesIntrvales(workingHours, bankTimeZone));

    const unionTimeLine = firstTimeLine.unionLines(secondTimeLine).unionLines(thirdTimeLine);
    unionTimeLine.invertIntervalesOnLine();

    const foundTime = unionTimeLine
        .getIntersectionLines(bankTimeLine)
        .getIfIntervalesMoreOrEqualConst(duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            if (foundTime.length > 0) {

                return true;
            }

            return false;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (foundTime.length === 0) {

                return '';
            }

            const returningIntervale = foundTime[0];
            const [day, hours, minutes] = convertMinutesToTime(returningIntervale.start);

            const newTemplate = template
                .replace('%DD', day)
                .replace('%HH', hours)
                .replace('%MM', minutes);

            return newTemplate;
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {

            return false;
        }
    };
}

module.exports = {
    getAppropriateMoment,

    isStar
};
