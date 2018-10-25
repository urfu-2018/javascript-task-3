'use strict';

const dayToNumber = { 'ПН': 0, 'ВТ': 1, 'СР': 2, 'ЧТ': 3, 'ПТ': 4, 'СБ': 5, 'ВС': 6 };
const numberToDay = { 0: 'ПН', 1: 'ВТ', 2: 'СР', 3: 'ЧТ', 4: 'ПТ', 5: 'СБ', 6: 'ВС' };
const MILLS_IN_DAY = 86400000;
const MILLS_IN_HOUR = 3600000;
const MILLS_IN_MIN = 60000;
const LATER_VALUE = 30 * MILLS_IN_MIN;

function getMax(a, b) {
    return a < b ? b : a;
}

function getMin(a, b) {
    return a < b ? a : b;
}

function getDayNumber(string) {
    return dayToNumber[string];
}

function getDayName(number) {
    return numberToDay[number];
}

function getTimeObject(string, zone) {
    const dayMatch = string.match(/[а-я]{2}/i);
    const timeMatch = string.match(/(\d{2}):(\d{2})\+(\d+)/i);
    const dayNumber = dayMatch === null ? 0 : getDayNumber(dayMatch);
    const timeZone = Number(timeMatch[3]);
    let timeStamp =
        dayNumber * MILLS_IN_DAY +
        Number(timeMatch[1]) * MILLS_IN_HOUR +
        Number(timeMatch[2]) * MILLS_IN_MIN;
    if (typeof zone !== 'undefined') {
        timeStamp += (zone - timeZone) * MILLS_IN_HOUR;
    }

    return { timeStamp, timeZone };
}

function unionTimeIntervals(schedule, newTimeInterval) {
    let updated = false;
    for (let i = 0; i < schedule.length; i++) {
        const from = schedule[i].from;
        const to = schedule[i].to;
        if (newTimeInterval.from > to || newTimeInterval.to < from) {
            continue;
        }
        schedule[i].to = getMax(to, newTimeInterval.to);
        schedule[i].from = getMin(from, newTimeInterval.from);
        updated = true;
    }
    if (!updated) {
        schedule.push({ from: newTimeInterval.from, to: newTimeInterval.to });
    }
}

function addBankIntervals(schedule, bankFrom, bankTo) {
    for (let i = 0; i < 3; i++) { // Добавим промежутки, в которые банк не работает
        const shift = i * MILLS_IN_DAY;

        unionTimeIntervals(schedule, { from: shift, to: shift + bankFrom });
        unionTimeIntervals(schedule, { from: shift + bankTo, to: shift + MILLS_IN_DAY });
    }
}

function buildBusySchedule(schedule, bankOpeningTime, bankClosingTime, timeZone) {
    const newSchedule = [];
    const timeIntervals = schedule.Danny.concat(schedule.Rusty).concat(schedule.Linus);

    timeIntervals.forEach(function (value) {
        const nextFrom = getTimeObject(value.from, timeZone).timeStamp;
        const nextTo = getTimeObject(value.to, timeZone).timeStamp;
        unionTimeIntervals(newSchedule, { from: nextFrom, to: nextTo });
    });
    addBankIntervals(newSchedule, bankOpeningTime, bankClosingTime);
    newSchedule.sort(function (a, b) {
        if (a.from < b.from) {
            return -1;
        }
        if (a.from > b.from) {
            return 1;
        }

        return 0;
    });

    return newSchedule;
}

function buildFreeSchedule(schedule, bankOpeningTime, bankClosingTime, timeZone) {
    const busySchedule = buildBusySchedule(schedule, bankOpeningTime, bankClosingTime, timeZone);

    // От списка "занятых" временных промежутков перешли к списку "свободных" временных промежутков
    return busySchedule.reduce(function (result, value, index, array) {
        if (index < array.length - 1) {
            result.push({ to: array[index].to, from: array[index + 1].from });
        }

        return result;
    }, []);
}

function addStartPointIfAvailable(startPoints, startInterval, endInterval, timeRequired) {
    let freeTime = endInterval - startInterval;
    if (freeTime >= timeRequired) {
        startPoints.push(startInterval);
    } else {
        return;
    }
    // Попытаемся сдвинуть время ограбления на пол часа вперед
    addStartPointIfAvailable(startPoints, startInterval + LATER_VALUE, endInterval, timeRequired);
}

function getAvailableStartPoints(schedule, bank, timeZone, duration) {
    const freeSchedule = buildFreeSchedule(schedule,
        bank.from.timeStamp, bank.to.timeStamp,
        timeZone);

    const availableStartPoints = [];
    const timeRequired = duration * MILLS_IN_MIN;
    freeSchedule.forEach(function (interval) {
        addStartPointIfAvailable(availableStartPoints,
            interval.to, interval.from,
            timeRequired);
    });

    return availableStartPoints;
}

function addPaddingZeros(value) {
    if (value.length < 2) {
        return '0' + value;
    }

    return value;
}

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;

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
    const bank = { from: getTimeObject(workingHours.from), to: getTimeObject(workingHours.to) };
    const timeZone = bank.from.timeZone;

    const availableStartPoints = getAvailableStartPoints(schedule, bank, timeZone, duration);

    let startPointer = 0;

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return startPointer < availableStartPoints.length;
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
            const startTime = availableStartPoints[startPointer]; // Получили аналог TimeStamp'а;
            const day = Math.floor(startTime / MILLS_IN_DAY);
            const hour = Math.floor((startTime - day * MILLS_IN_DAY) / MILLS_IN_HOUR);
            const min =
                Math.floor((startTime - day * MILLS_IN_DAY - hour * MILLS_IN_HOUR) / MILLS_IN_MIN);

            let strHour = addPaddingZeros(hour.toString());
            let strMin = addPaddingZeros(min.toString());

            return template.replace('%DD', getDayName(day))
                .replace('%HH', strHour)
                .replace('%MM', strMin);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            startPointer++;
            if (this.exists()) {
                return true;
            }
            startPointer--;

            return false;
        }
    };
}

module.exports = {
    getAppropriateMoment,

    isStar
};
