'use strict';

const days = { 'ПН': 0, 'ВТ': 1, 'СР': 2, 'ЧТ': 3, 'ПТ': 4, 'СБ': 5, 'ВС': 6 };
const MINUTES_IN_DAY = 24 * 60;
const MINUTES_IN_HOUR = 60;
const START_PRIORITY = 0;
const FROM_PRIORITY = 1;
const TO_PRIORITY = 2;
const END_PRIORITY = 3;

function timeToMinute(time) {
    const partsTime = time.split(':');

    return parseInt(partsTime[0], 10) * 60 + parseInt(partsTime[1], 10);
}

function getMinuteFromTimeStart(day, time, timeZone, workingHours) {
    let minute = 0;
    minute += days[day] * MINUTES_IN_DAY;
    minute += timeToMinute(time);
    minute -= parseInt(timeZone, 10) * MINUTES_IN_HOUR;
    minute += parseInt(workingHours.from.slice(workingHours.from.length - 1), 10) * MINUTES_IN_HOUR;

    return minute;
}

function parseDatetime(datetime) {
    const splitted = datetime.split(new RegExp('[+ ]', 'g'));

    return { day: splitted[0], time: splitted[1], timeZone: splitted[2] };
}

function getTimePoints(schedule, workingHours) {
    const timePoints = [];
    Object.keys(schedule)
        .forEach(name => {
            schedule[name].forEach(evnt => {
                const datetimeFrom = parseDatetime(evnt.from);
                const from = getMinuteFromTimeStart(datetimeFrom.day, datetimeFrom.time,
                    datetimeFrom.timeZone, workingHours);
                const datetimeTo = parseDatetime(evnt.to);
                const to = getMinuteFromTimeStart(datetimeTo.day, datetimeTo.time,
                    datetimeTo.timeZone, workingHours);
                timePoints.push({
                    'name': name,
                    'minute': from,
                    'priority': FROM_PRIORITY,
                    'datetime': evnt.from
                });
                timePoints.push({
                    'name': name,
                    'minute': to,
                    'priority': TO_PRIORITY,
                    'datetime': evnt.to
                });
            });
        });

    return timePoints;
}

function addOpenCloseBankTime(workingHours, timePoints) {
    Object.keys(days)
        .filter(d => days[d] < 3)
        .forEach(day => {
            const datetimeFrom = day + ' ' + workingHours.from;
            const partsTimeFrom = parseDatetime(datetimeFrom);
            timePoints.push({
                'minute':
                    getMinuteFromTimeStart(day, partsTimeFrom.time, partsTimeFrom.timeZone,
                        workingHours),
                'priority': START_PRIORITY,
                'datetime': datetimeFrom
            });
            const datetimeTo = day + ' ' + workingHours.to;
            const partsTimeTo = parseDatetime(datetimeTo);
            timePoints.push({
                'minute': getMinuteFromTimeStart(day, partsTimeTo.time, partsTimeTo.timeZone,
                    workingHours),
                'priority': END_PRIORITY,
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

function updateIsWorking(isWorkingTime, point) {
    return point.priority === 0 || isWorkingTime && !(point.priority === 3);
}

function find(timePoints, isFree, duration) {
    let isWorkingTime = false;
    for (let i = 1; timePoints && i < timePoints.length; ++i) {
        const first = timePoints[i - 1];
        const second = timePoints[i];
        isWorkingTime = updateIsWorking(isWorkingTime, first);
        updateIsFree(isFree, first);
        if (Object.keys(isFree).every(name => isFree[name]) &&
            (second.minute - first.minute) >= duration &&
            isWorkingTime) {

            return { 'start': first, 'end': second, 'found': true };
        }
    }

    return { 'found': false };
}

function formatAnswer(foundObj) {
    const dayNumber = Math.floor(foundObj.start.minute / (24 * 60));
    const day = Object.keys(days)
        .find(d => days[d] === dayNumber);
    const hour = Math.floor(foundObj.start.minute / 60) % 24;
    const minute = Math.floor(foundObj.start.minute % 60);

    return { day, hour, minute };
}

function addLeadingZero(a) {
    a = a.toString();

    return a.length === 2 ? a : '0' + a;
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
    const timePoints = getTimePoints(schedule, workingHours);
    addOpenCloseBankTime(workingHours, timePoints);
    timePoints.sort((a, b) => {
        const diff = a.minute - b.minute;

        return diff !== 0 ? diff : a.priority - b.priority;
    });
    const foundObj = find(timePoints, isFree, duration);
    let answer;
    if (foundObj.found) {
        answer = formatAnswer(foundObj);
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
                .replace('%HH', addLeadingZero(answer.hour))
                .replace('%MM', addLeadingZero(answer.minute))
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
