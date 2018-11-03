'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = false;

function convertRobbersSchedule(schedule) {
    const robbers = Object.keys(schedule);
    const convertedSchedule = [];

    robbers.forEach(function (robber) {
        schedule[robber].forEach(function (timeLine) {
            convertedSchedule.push({ from: convertTimeToMinutes(timeLine.from),
                to: convertTimeToMinutes(timeLine.to) });
        });
    });

    return convertedSchedule;
}

function convertTimeToMinutes(time) {
    const dayOfWeek = ['ПН', 'ВТ', 'СР'];
    const dayToInt = dayOfWeek.indexOf(time.slice(0, 2));
    const [hours, minutes, timeZone] = [Number(time.slice(3, 5)),
        Number(time.slice(6, 8)), Number(time.slice(9))];
    const result = (24 * dayToInt + hours - timeZone) * 60 + minutes;

    return result;
}

function deleteEmptyIntervals(schedule) {
    return schedule.filter(interval => interval.from !== interval.to);
}

function intersectionСheck(first, second) {
    const [firstStart, firstEnd, secondStart, secondEnd] =
        [first.from, first.to, second.from, second.to];
    const firstСondition = firstStart <= secondEnd && firstStart >= secondStart;
    const secondСondition = firstEnd <= secondEnd && firstEnd >= secondStart;
    const thirdСondition = firstStart < secondStart && firstEnd > secondEnd;
    const alongWith = firstСondition || secondСondition ||
        thirdСondition;

    return alongWith;
}

function uniteIntersections(first, second) {
    return {
        from: Math.min(first.from, second.from),
        to: Math.max(first.to, second.to)
    };
}

function uniteIfIntersect(unitedSchedule, oldIinterval) {
    let newUnitedSchedule = [];
    unitedSchedule.forEach(function (interval) {
        if (intersectionСheck(interval, oldIinterval)) {
            oldIinterval = uniteIntersections(interval, oldIinterval);
        } else {
            newUnitedSchedule.push(interval);
        }
    });
    newUnitedSchedule.push(oldIinterval);

    return newUnitedSchedule;
}

function uniteRobbersSchedule(oldSchedule) {
    let unitedSchedule = [];
    oldSchedule.forEach(function (oldIinterval) {
        unitedSchedule = uniteIfIntersect(unitedSchedule, oldIinterval);
    });

    return unitedSchedule;
}

function converBankTimeLineToMinutes(time) {
    const [hours, minutes, timeZone] =
        [Number(time.slice(0, 2)), Number(time.slice(3, 5)), Number(time.slice(6))];
    const result = (hours - timeZone) * 60 + minutes;

    return result;
}

function convertBankSchedule(bankWorkingHours) {
    const newBankSchedule = [];
    const minutesInDay = 24 * 60;
    const from = converBankTimeLineToMinutes(bankWorkingHours.from);
    const to = converBankTimeLineToMinutes(bankWorkingHours.to);
    for (let day = 0; day < 3; day++) {
        newBankSchedule.push({ from: minutesInDay * day + from, to: minutesInDay * day + to });
    }

    return newBankSchedule;
}

function cutFromStartСondition(bankInterval, gangBusyInterval) {
    return gangBusyInterval.from <= bankInterval.from &&
        gangBusyInterval.to < bankInterval.to &&
        gangBusyInterval.to > bankInterval.from;
}

function cutFromEndСondition(bankInterval, gangBusyInterval) {
    return gangBusyInterval.from > bankInterval.from &&
        gangBusyInterval.to >= bankInterval.to &&
        gangBusyInterval.from < bankInterval.to;
}

function deleteСondition(bankInterval, gangBusyInterval) {
    return gangBusyInterval.from <= bankInterval.from &&
        gangBusyInterval.to >= bankInterval.to;
}

function splitCondition(bankInterval, gangBusyInterval) {
    return gangBusyInterval.from > bankInterval.from &&
        gangBusyInterval.to < bankInterval.to;
}

function cutOutInterval(bankInterval, gangBusyInterval) {

    if (cutFromStartСondition(bankInterval, gangBusyInterval)) { //  оставляем конец
        return [{ from: gangBusyInterval.to, to: bankInterval.to }];
    } else if (deleteСondition(bankInterval, gangBusyInterval)) { // удаляем
        return [];
    } else if (cutFromEndСondition(bankInterval, gangBusyInterval)) { // режем начало
        return [{ from: bankInterval.from, to: gangBusyInterval.from }];
    } else if (splitCondition(bankInterval, gangBusyInterval)) { // разбиваем на два
        return [{ from: bankInterval.from, to: gangBusyInterval.from },
            { from: gangBusyInterval.to, to: bankInterval.to }];
    }

    return [{ from: bankInterval.from, to: bankInterval.to }];

}

function cutOutBusyTime(bankSchedule, gangSchedule) {

    return gangSchedule.reduce((newDayFreeTime, gangBusyInterval) => {
        const arr = [];
        newDayFreeTime.forEach((freeInterval) => {
            arr.push(...cutOutInterval(freeInterval, gangBusyInterval));
        });

        return arr;
    }, [...bankSchedule]);
}

function isEnoughTime(schedule, time) {
    const result = [];
    schedule.forEach((timeLine)=> {
        let residual = timeLine.to - timeLine.from;
        if (residual >= time) {
            result.push(timeLine.from);
        }
    });

    return result;
}

function convertNumbeForOutput(number) {
    if (number < 10) {
        return `0${number}`;
    }

    return number;
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
    let convertedRobbersSchedule = convertRobbersSchedule(schedule);
    convertedRobbersSchedule = deleteEmptyIntervals(convertedRobbersSchedule);
    convertedRobbersSchedule = uniteRobbersSchedule(convertedRobbersSchedule);
    const convertedBankSchedule = convertBankSchedule(workingHours);
    const freeTimeforRobbery = cutOutBusyTime(convertedBankSchedule, convertedRobbersSchedule);
    const canRobberTime = isEnoughTime(freeTimeforRobbery, duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return canRobberTime.length > 0;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            const time = canRobberTime[0];
            if (canRobberTime.length === 0) {
                return '';
            }
            const timeZone = Number(workingHours.from.slice(6));
            let daysOfWeek = ['ПН', 'ВТ', 'СР'];
            const minutesInDay = 24 * 60;
            let day = daysOfWeek[Math.floor(time / (24 * 60))];
            let hours = Math.floor((time - daysOfWeek.indexOf(day) * minutesInDay) / 60) + timeZone;
            let minutes = (time - daysOfWeek.indexOf(day) * minutesInDay) % 60;
            day = convertNumbeForOutput(day);
            hours = convertNumbeForOutput(hours);
            minutes = convertNumbeForOutput(minutes);

            return template
                .replace(/%DD/g, day)
                .replace(/%HH/g, hours)
                .replace(/%MM/g, minutes);
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
