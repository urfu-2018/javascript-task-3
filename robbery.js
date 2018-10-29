'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = false;

function parseTime(time) {
    const timePattern = /^(\d\d):(\d\d)\+(\d+)$/;
    const [, hours, minutes, timeZone] = time.match(timePattern);

    return [hours, minutes, timeZone].map(val => Number(val));
}

function convertMinutesToTime(minutes) {
    const days = {
        0: 'ПН',
        1: 'ВТ',
        2: 'СР'
    };

    const numberOfDay = Math.floor(minutes / (24 * 60));
    const hours = Math.floor((minutes - numberOfDay * 24 * 60) / 60).toString()
        .padStart(2, '0');
    const minute = (minutes - numberOfDay * 24 * 60 - hours * 60).toString()
        .padStart(2, '0');

    return [days[numberOfDay], hours, minute];
}

function convertTimeToMinutes(day, timeIntervale, bankTimeZone) {
    let [hours, minutes, timeZone] = parseTime(timeIntervale);
    hours += bankTimeZone - timeZone;
    const days = {
        'ПН': 0,
        'ВТ': 24 * 60,
        'СР': 48 * 60
    };

    return days[day] + hours * 60 + minutes;
}

function getBankTimeZone(bankWorkingTime) {

    return Number(bankWorkingTime.split('+')[1]);
}

function bankScheduleToMinutesIntrvales(shedule, bankTimeZone) {
    const resultArray = [];
    const days = ['ПН', 'ВТ', 'СР'];
    days.forEach(day => {
        resultArray.push({ start: convertTimeToMinutes(day, shedule.from, bankTimeZone),
            end: convertTimeToMinutes(day, shedule.to, bankTimeZone) });
    });

    return resultArray;
}

function scheduleToMinutesIntervales(personSchedule, bankTimeZone) {
    const resultArray = [];
    personSchedule.forEach(timeIntervale => {
        const splittedFromTimeIntrvale = timeIntervale.from.split(' ');
        const splittedToTimeIntrvale = timeIntervale.to.split(' ');
        resultArray.push(
            { start: convertTimeToMinutes(splittedFromTimeIntrvale[0],
                splittedFromTimeIntrvale[1], bankTimeZone),
            end: convertTimeToMinutes(splittedToTimeIntrvale[0],
                splittedToTimeIntrvale[1], bankTimeZone) });
    });

    return resultArray;
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
        const resultUnion = unionSchediles.map((intervale, index) => {
            if (intervale.start > currentEnd && index !== 0) {
                const returnStatement = { start: currentStart, end: currentEnd };
                currentStart = intervale.start;
                currentEnd = intervale.end;

                return returnStatement;
            } else if (intervale.end > currentEnd) {
                currentEnd = intervale.end;
            }

            return undefined;
        }).filter(intervale => {

            return typeof intervale !== 'undefined';
        });
        resultUnion.push({ start: currentStart, end: currentEnd });

        return new TimeLine(resultUnion);
    }

    intersectionLines(anotherLine) {
        let unionSchediles = this.scheduleInMinutes.concat(anotherLine.getScheduleInMinutes);
        unionSchediles.sort((firstInterval, secondInterval) => {
            return firstInterval.start - secondInterval.start;
        });
        const intersectionIntervales = [];
        let start;
        let end;
        let foundFlag = false;
        for (let minute = 0; minute <= 4321; minute++) {
            const numberOfIntervalsForMinute = unionSchediles.reduce((acc, intervale) => {
                if (intervale.start <= minute && intervale.end >= minute) {
                    acc++;
                }

                return acc;
            }, 0);
            if (numberOfIntervalsForMinute > 1 && !foundFlag) {
                foundFlag = true;
                start = minute;
            } else if (numberOfIntervalsForMinute <= 1 && foundFlag) {
                foundFlag = false;
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
        const invertedIntervaleLines = this.scheduleInMinutes.map(intervale => {
            const returnStatement = { start: currentStart, end: intervale.start };
            currentStart = intervale.end;

            return returnStatement;
        }).filter(intervale => {

            return typeof intervale !== 'undefined';
        });
        invertedIntervaleLines.push({ start: currentStart, end: 4320 });
        this.scheduleInMinutes = invertedIntervaleLines;
    }

    getfIntervalesMoreOrEqualConst(number) {
        return this.scheduleInMinutes.filter(intervale => {
            return intervale.end - intervale.start >= number;
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

    const foundTime = unionTimeLine.intersectionLines(bankTimeLine)
        .getfIntervalesMoreOrEqualConst(duration);

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

            const newTemplate = template.replace('%DD', day).replace('%HH', hours)
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
