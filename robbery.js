'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;
const DAYS_WORKS = ['ПН', 'ВТ', 'СР'];

function getParsRegEx(gap) {
    return /^(ПН|ВТ|СР|ЧТ|ПТ|СБ|ВС)?\s?([0-9]{2}):([0-9]{1,2})\+([0-9]{1,2})$/.exec(gap);

}

function getPartInterval(partGap) {
    let timeGap = getParsRegEx(partGap);
        if (timeGap === null) {
         timeGap = getParsRegEx(partGap);
        }
    return { day: timeGap[1], hours: Number(timeGap[2]),
        minutes: Number(timeGap[3]), timeZone: Number(timeGap[4]) };
}

function getFullInterval(fullGap) {
    return { from: getPartInterval(fullGap.from), to: getPartInterval(fullGap.to) };
}

function getParseFullInterval(fullInterval, timeZone) {
    let mainTimeZone = timeZone ? timeZone - Number(fullInterval.from.timeZone) : 0;
    let start = DAYS_WORKS.indexOf(fullInterval.from.day) * (24 * 60) +
        (fullInterval.from.hours + mainTimeZone) * 60 +
        fullInterval.from.minutes;
    let end = DAYS_WORKS.indexOf(fullInterval.to.day) * (24 * 60) +
        (fullInterval.to.hours + mainTimeZone) * 60 +
        fullInterval.to.minutes;

    return { start, end };
}

function checkInclusion(firstInterval, secondInterval) {
    return firstInterval.start <= secondInterval.start && firstInterval.end >= secondInterval.end;
}

function isIntersection(firstInterval, secondInterval) {
    return checkInclusion(firstInterval, secondInterval) ||
        checkInclusion(secondInterval, firstInterval) ||
        (firstInterval.start < secondInterval.start &&
            firstInterval.end > secondInterval.start) ||
        (firstInterval.end > secondInterval.end &&
            firstInterval.start < secondInterval.end);
}

function chooseInterval(banksInterval, gangsInterval) {
    if (checkInclusion(banksInterval, gangsInterval)) {
        return [{ start: banksInterval.start, end: gangsInterval.start },
            { start: gangsInterval.end, end: banksInterval.end }];
    }
    if (banksInterval.start <= gangsInterval.end &&
        banksInterval.start >= gangsInterval.start) {
        return [{ start: gangsInterval.end, end: banksInterval.end }];
    }
    if (banksInterval.end >= gangsInterval.start &&
        banksInterval.end <= gangsInterval.end) {
        return [{ start: banksInterval.start, end: gangsInterval.start }];
    }
}

function allIntersect(banksInterval, gangsInterval) {
    let intervalSchedule = [];
    for (let bankInterval of banksInterval) {
        if (!isIntersection(gangsInterval, bankInterval)) {
            intervalSchedule.push(bankInterval);
            continue;
        }
        if (checkInclusion(gangsInterval, bankInterval)) {
            continue;
        }
        intervalSchedule = intervalSchedule.concat(chooseInterval(bankInterval, gangsInterval));
    }

    return intervalSchedule;
}

function getBanks(banksHours) {
    return DAYS_WORKS.map(day => {
        return {
            from: { day: day, hours: banksHours.from.hours,
                minutes: banksHours.from.minutes, timeZone: banksHours.from.timeZone
            },
            to: { day: day, hours: banksHours.to.hours,
                minutes: banksHours.to.minutes, timeZone: banksHours.to.timeZone
            }
        };
    });
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
    const banksHours = getFullInterval(workingHours);
    const banksZone = banksHours.to.timeZone;
    const banksInterval = getBanks(banksHours);
    let intervalsGangs = [];
    for (let interval of banksInterval) {
        intervalsGangs.push(getParseFullInterval(interval, banksZone));
    }
    let intervalsRobbers = [];
    Object.keys(schedule).forEach(person) {
        schedule[person].forEach(interval) {
            intervalsRobbers.push(getParseFullInterval(getFullInterval(interval), banksZone));
        };
    };
    intervalsRobbers.forEach(robbersInterval => {
        intervalsGangs = allIntersect(intervalsGangs, robbersInterval);
    });
    intervalsGangs = intervalsGangs
        .filter(interval => interval.end - interval.start >= duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return intervalsGangs.length !== 0;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (intervalsGangs.length === 0) {
                return '';
            }
            let timeFinish = intervalsGangs[0].start;
            let account = Math.floor(timeFinish / (24 * 60));
            let day = DAYS_WORKS[account];
            let minutes = timeFinish % (60);
            let hours = Math.floor((timeFinish - account * 60 * 24) / 60);
            let obj = { day, hours, minutes };
            minutes = (obj.minutes >= 10 ? '' : '0') + obj.minutes;
            hours = (obj.hours >= 10 ? '' : '0') + obj.hours;

            return template
                .replace('%HH', hours)
                .replace('%MM', minutes)
                .replace('%DD', obj.day);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (intervalsGangs.length === 0) {
                return false;
            }
            let nextMoment = 30 + intervalsGangs[0].start;
            let postMoment = intervalsGangs.filter(interval => {
                return nextMoment + duration <= interval.end;
            });
            if (postMoment.length !== 0) {
                intervalsGangs = postMoment;
                intervalsGangs[0].start = Math.max(
                    intervalsGangs[0].start, nextMoment);
            }

            return postMoment.length !== 0;
        }
    };
}

module.exports = {
    getAppropriateMoment,

    isStar
};
