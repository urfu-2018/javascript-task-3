'use strict';

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
    let appropriateMoments = findAppropriateMoments(schedule, duration, workingHours);
    let generator = generateBeginTimes(appropriateMoments, 30, duration);
    let beginTime = generator.next();

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return !beginTime.done;
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

            return printByTemplate(template, getStartTime(beginTime.value));
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            let next = generator.next();
            if (next.done) {
                return false;
            }
            beginTime = next;

            return true;
        }
    };
}


var weekDay = {};
weekDay.ПН = 0;
weekDay.ВТ = 1;
weekDay.СР = 2;
weekDay.ЧТ = 3;
weekDay.ПТ = 4;
weekDay.СБ = 5;
weekDay.ВС = 6;

var millisecondsInMinute = 60000;
var bankTime;
var bankUTC;
var bankOpen;
var bankClose;

var gangsterNumber = {};
gangsterNumber.Danny = 0;
gangsterNumber.Rusty = 1;
gangsterNumber.Linus = 2;

var minuteInDay = 1440;

function* generateBeginTimes(appropriateMoments, shift, duration) {
    for (let i = 0; i < appropriateMoments.length; ++i) {
        let begin = appropriateMoments[i].begin;
        let end = appropriateMoments[i].end;
        while (end - begin >= duration) {
            yield begin;
            begin += shift;
        }
    }
}

function initializeBankTime(workingHours) {
    bankTime = getTime(workingHours.from);
    bankUTC = bankTime.utc;
    bankOpen = toMinuteCount(getTime(workingHours.from));
    bankClose = toMinuteCount(getTime(workingHours.to));
}

function takeAppropriateMoment(allReadyMoment, duration) {
    let begin = allReadyMoment.begin;
    if (getDay(begin) >= 3) {
        return;
    }
    let end = allReadyMoment.end;
    let afterBankOpen = (begin % minuteInDay > bankClose && end % minuteInDay > bankClose);
    let beforeBankOpen = (begin % minuteInDay < bankOpen && end % minuteInDay < bankOpen);
    if (!afterBankOpen && !beforeBankOpen) {
        return takeBankCorrectMoment(begin, end, duration);
    }
}

function findAppropriateMoments(schedule, duration, workingHours) {
    initializeBankTime(workingHours);
    let gangstersTimeSpans = createTimeSpansForGangsters(schedule);
    let allReadyMoments = findAllReadyMoments(gangstersTimeSpans);
    let result = [];
    for (let i = 0; i < allReadyMoments.length; ++i) {
        let moment = takeAppropriateMoment(allReadyMoments[i], duration);
        if (moment) {
            result.push(moment);
        }
    }

    return result;
}

function createTimeSpansForGangster(gangsterSchedule, gangster) {
    let result = [];
    gangsterSchedule.forEach(s => {
        result.push({
            minute: toMinuteCount(getTime((s.from))),
            do: '+' + gangster
        });
        result.push({
            minute: toMinuteCount(getTime((s.to))),
            do: '-' + gangster
        });
    });

    return result;
}

function createTimeSpansForGangsters(gangsterSchedules) {
    let result = [];
    let gangsters = Object.keys(gangsterSchedules);
    for (let i = 0; i < gangsters.length; ++i) {
        let timeSpans = createTimeSpansForGangster(gangsterSchedules[gangsters[i]], gangsters[i]);
        result = result.concat(timeSpans);
    }
    result.sort(function (a, b) {
        if (a.minute - b.minute !== 0) {
            return a.minute - b.minute;
        }

        return a.do < b.do;
    });

    return result;
}

function getTime(time) {
    let timeReg = /(\d+):(\d+)\+(\d+)/u;
    const result = {};
    if (time.match(/[а-я]+/i)) {
        let split = time.split(' ');
        result.weekDay = weekDay[split[0]];
    }
    let match = time.match(timeReg);
    result.minute = parseInt(match[2]);
    result.hour = parseInt(match[1]);
    result.utc = parseInt(match[3]);

    return result;
}

function toMinuteCount(time) {
    let result = new Date(0);
    if (time.weekDay) {
        result.setUTCDate(time.weekDay + 1);
    }
    result.setUTCHours(time.hour + bankUTC - time.utc);
    result.setUTCMinutes(time.minute);

    return (result - new Date(0)) / millisecondsInMinute;
}

function findAllReadyMoments(gangstersTimeSpans) {
    let set = new Set();
    let beginMoment = 0;
    let result = [];
    gangstersTimeSpans.forEach(t => {
        let key = t.do;
        if (key[0] === '+') {
            if (set.size === 0) {
                result = result.concat(addPossibleAppropriateMoment(beginMoment, t.minute));
            }
            set.add(key.substring(1));
        } else {
            set.delete(key.substring(1));
            if (set.size === 0) {
                beginMoment = t.minute;
            }
        }
    });
    result = result.concat(addPossibleAppropriateMoment(beginMoment, minuteInDay * 3 - 1));

    return result;
}

function getDay(time) {
    return Math.floor(time / minuteInDay);
}

function splitDays(begin, beginDay, endDay, end) {
    let result = [];
    result.push({
        begin: begin,
        end: (beginDay + 1) * minuteInDay - 1
    });
    result.push({
        begin: (endDay) * minuteInDay,
        end: (Math.min((endDay + 1) * minuteInDay - 1, end))
    });

    for (let i = 1; i < endDay - beginDay - 1; ++i) {
        result.push({
            begin: beginDay + i * minuteInDay,
            end: beginDay + (i + 1) * minuteInDay - 1
        });
    }

    return result;
}

function addPossibleAppropriateMoment(begin, end) {
    let beginDay = getDay(begin);
    let endDay = getDay(end);
    if (beginDay !== endDay) {
        return splitDays(begin, beginDay, endDay, end);
    }

    return {
        begin: begin,
        end: end
    };
}

function takeBankCorrectMoment(begin, end, duration) {
    let realBegin = Math.max(begin, bankOpen + getDay(begin) * minuteInDay);
    let realEnd = Math.min(end, bankClose + getDay(end) * minuteInDay);
    if (realEnd - realBegin >= duration) {
        return {
            begin: realBegin,
            end: realEnd
        };
    }
}

function getStartTime(time) {
    let dayNumber = getDay(time);
    let day;
    var keys = Object.keys(weekDay);
    for (let i = 0; i < keys.length; ++i) {
        if (weekDay[keys[i]] === dayNumber) {
            day = keys[i];
        }
    }

    return {
        day: day,
        minute: time % 60,
        hour: Math.floor(time % minuteInDay / 60)
    };
}

function printByTemplate(template, startTime) {
    return template.replace('%HH', twoDigit(startTime.hour))
        .replace('%MM', twoDigit(startTime.minute))
        .replace('%DD', startTime.day);
}

function twoDigit(val) {
    return (val < 10) ? '0' + val : val;
}
module.exports = {
    getAppropriateMoment,

    isStar
};
