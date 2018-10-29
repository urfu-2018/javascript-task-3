'use strict';

const days = { 'ПН': 0, 'ВТ': 1, 'СР': 2, 'ЧТ': 3, 'ПТ': 4, 'СБ': 5, 'ВС': 6 };

function timeToMinute(time) {
    const partsTime = time.split(':');

    return parseInt(partsTime[0]) * 60 + parseInt(partsTime[1]);
}

function getMinuteFromTimeStart(day, time, timeZone) {
    let minute = 0;
    minute += days[day] * 24 * 60;
    minute += timeToMinute(time);
    minute -= parseInt(timeZone) * 60;

    return minute;
}

function parseDatetime(datetime) {
    return datetime.split(new RegExp('[+ ]', 'g'));
}

function getTimePoints(schedule) {
    const timePoints = [];
    Object.keys(schedule)
        .forEach(name => {
            schedule[name].forEach(evnt => {
                const timePartsFrom = parseDatetime(evnt.from);
                const from = getMinuteFromTimeStart(timePartsFrom[0], timePartsFrom[1],
                    timePartsFrom[2]);
                const timePartsTo = parseDatetime(evnt.to);
                const to = getMinuteFromTimeStart(timePartsTo[0], timePartsTo[1], timePartsTo[2]);
                timePoints.push({
                    'name': name,
                    'minute': from,
                    'priority': 1,
                    'datetime': evnt.from
                });
                timePoints.push({
                    'name': name,
                    'minute': to,
                    'priority': 2,
                    'datetime': evnt.to
                });
            });
        });

    return timePoints;
}

function isWorkingTime(workingHours, start, end) {
    const duration = end.minute - start.minute;
    const from = getMinuteFromTimeStart('ПН', workingHours.from.slice(0, 5),
        workingHours.from.slice(6));
    const to = getMinuteFromTimeStart('ПН', workingHours.to.slice(0, 5), workingHours.to.slice(6));
    const st = start.minute % (24 * 60);

    return st >= from && (st + duration) < to;
}

function addOpenCloseBankTime(workingHours, timePoints) {
    Object.keys(days)
        .filter(d => days[d] < 3)
        .forEach(day => {
            const datetimeFrom = day + ' ' + workingHours.from;
            const partsTimeFrom = parseDatetime(datetimeFrom);
            timePoints.push({
                'minute': getMinuteFromTimeStart(day, partsTimeFrom[1], partsTimeFrom[2]),
                'priority': 0,
                'datetime': datetimeFrom
            });
            const datetimeTo = day + ' ' + workingHours.to;
            const partsTimeTo = parseDatetime(datetimeTo);
            timePoints.push({
                'minute': getMinuteFromTimeStart(day, partsTimeTo[1], partsTimeTo[2]),
                'priority': 3,
                'datetime': datetimeTo
            });
        });
}

function updateIsFree(isFree, point) {
    if (point.priority === 2) {
        ++isFree[point.name];
    } else if (point.priority === 1) {
        --isFree[point.name];
    }
}

function find(timePoints, isFree, duration, workingHours) {
    for (let i = 1; i < timePoints.length; ++i) {
        const first = timePoints[i - 1];
        const second = timePoints[i];
        updateIsFree(isFree, first);
        if (Object.keys(isFree).every(name => isFree[name]) &&
            second.minute - first.minute >= duration &&
            isWorkingTime(workingHours, first, second)) {

            return { 'start': first, 'end': second, 'found': true };
        }
    }

    return { 'found': false };
}

function formatAnswer(foundObj, workingHours) {
    const bankTimeZone = parseInt(workingHours.from.slice(6));
    foundObj.start.minute += bankTimeZone * 60;
    const dayNumber = Math.floor(foundObj.start.minute / (24 * 60));
    const day = Object.keys(days)
        .find(d => days[d] === dayNumber);
    const hour = Math.floor((foundObj.start.minute % (24 * 60)) / 60);
    const minute = Math.floor(foundObj.start.minute % 60);

    return { day, hour, minute };
}

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = false;

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
    const isFree = {};
    Object.keys(schedule)
        .forEach(name => {
            isFree[name] = 1;
        });
    const timePoints = getTimePoints(schedule);
    addOpenCloseBankTime(workingHours, timePoints);
    timePoints.sort((a, b) => {
        const diff = a.minute - b.minute;

        return diff !== 0 ? diff : a.priority - b.priority;
    });
    const foundObj = find(timePoints, isFree, duration, workingHours);
    let answer;
    if (foundObj.found) {
        answer = formatAnswer(foundObj, workingHours);
    }

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return foundObj.found;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (!foundObj.found) {
                return '';
            }

            return template
                .replace('%HH', answer.hour)
                .replace('%MM', answer.minute)
                .replace('%DD', answer.day);
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
