'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;

const MINUTES_IN_DAY = 60 * 24;

const WEEK_DAYS = Object.freeze({ 'ПН': 0, 'ВТ': 1, 'СР': 2 });
const WEEK_DAYS_REVERSED = Object.freeze({ 0: 'ПН', 1: 'ВТ', 2: 'СР' });

/**
 * По времени в форме 09:35+5 возвращает количество минут с 00:00 (во времени банка)
 * @param {String} time
 * @param {Number} bankTimezone
 * @returns {Number}
 */
function getTimeBankWrapper(time, bankTimezone) {
    return getTimeInMinutes('ПН ' + time, bankTimezone);
}

/**
 * По времени в форме ПН 09:35+5 возвращает кол-во минут с ПН 00:00 (во времени банка)
 * @param {String} time
 * @param {Number} bankTimezone
 * @returns {Number}
 */
function getTimeInMinutes(time, bankTimezone) {
    // 'ПН 09:35+5' => [ПН, 09, 35, 5]
    const timeToMinutesRegex = /^(.{2}) (\d{2}):(\d{2})+.(\d)+$/g;

    const intervalParts = time.split(timeToMinutesRegex).filter(part => part.length > 0);
    const day = WEEK_DAYS[time.split(' ')[0]] * MINUTES_IN_DAY;
    const timeOfDay = parseInt(intervalParts[1]) * 60 + parseInt(intervalParts[2]);
    const timezoneShift = (bankTimezone - parseInt(intervalParts[3])) * 60;

    return day + timeOfDay + timezoneShift;
}

/**
 * Собирает все входные данные в один массив, приводя к минутам с ПН 00:00+зона_банка
 * @param {Object} schedule
 * @param {Object} workingHours
 * @returns {Object}
 */
function congregateIntervals(schedule, workingHours) {
    const BANK_TIME_ZONE = parseInt(workingHours.from.split('+')[1]);

    const workTimes = Object.values(WEEK_DAYS).map(day => ({
        from: getTimeBankWrapper(workingHours.from, BANK_TIME_ZONE) + MINUTES_IN_DAY * day,
        to: getTimeBankWrapper(workingHours.to, BANK_TIME_ZONE) + MINUTES_IN_DAY * day
    }));

    const busyTimes = [];
    Object.values(schedule).map(person => person.map(interval => busyTimes.push({
        from: getTimeInMinutes(interval.from, BANK_TIME_ZONE),
        to: getTimeInMinutes(interval.to, BANK_TIME_ZONE)
    })));

    return { bank: workTimes, people: busyTimes };
}

/**
 * Производит пересечение всех fullSchedule.people со всеми fullSchedule.bank, сокращая
 * интервалы банка, которые и возвращает.
 * @param {Object} fullSchedule
 * @returns {Object[]}
 */
function intersectIntervals(fullSchedule) {
    for (let busyTime of fullSchedule.people) {
        let leftovers = [];
        for (let workTime of fullSchedule.bank) {
            leftovers = leftovers.concat(subtractIntervals(workTime, busyTime));
        }
        fullSchedule.bank = leftovers; // так остаются только новые интервалы
    }

    return fullSchedule.bank;
}

/**
 * Проверяет, содержится ли интервал a в b.
 * @param {Object} a
 * @param {Object} b
 * @returns {boolean}
 */
function contains(a, b) {
    return a.from >= b.from && a.to <= b.to;
}

/**
 * Эта функция проверяет, лежит ли число value между begin и end
 * @param {Number} begin
 * @param {Number} end
 * @param {Number} value
 * @returns {Boolean}
 */
function liesInBetween(begin, end, value) {
    return begin <= value && end >= value;
}

/**
 * Возвращает множество интервалов, содержащихся в A, но не содержащихся в B
 * @param {Object} intervalA
 * @param {Object} intervalB
 * @returns {Object[]}
 */
function subtractIntervals(intervalA, intervalB) {

    if (contains(intervalA, intervalB)) { // или равны
        return [];
    }
    if (contains(intervalB, intervalA)) {
        return [{
            from: intervalA.from,
            to: intervalB.from }, {
            from: intervalB.to,
            to: intervalA.to }];
    }
    // следующие два if отличаются только .to или .from во втором аргументе, вынести?
    if (liesInBetween(intervalA.from, intervalA.to, intervalB.to)) {
        return [{
            from: intervalB.to,
            to: intervalA.to
        }];
    }
    if (liesInBetween(intervalA.from, intervalA.to, intervalB.from)) {
        return [{
            from: intervalA.from,
            to: intervalB.from
        }];
    }

    return [intervalA];
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
    console.info(schedule, '\n', duration, '\n', workingHours);
    const candidates = intersectIntervals(congregateIntervals(schedule, workingHours))
        .filter(interval => interval.to - interval.from >= duration)
        .sort((a, b) => a.from - b.from);
    let firstCandidate = candidates[0];

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return firstCandidate !== undefined;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (firstCandidate === undefined) {
                return '';
            }

            const time = firstCandidate.from;
            const day = WEEK_DAYS_REVERSED[Math.floor(time / MINUTES_IN_DAY)];
            let hour = Math.floor(time % MINUTES_IN_DAY / 60);
            if (hour < 10) {
                hour = '0' + hour;
            }
            let minute = time % MINUTES_IN_DAY % 60;
            if (minute < 10) {
                minute = '0' + minute;
            }

            return template.replace('%DD', day)
                .replace('%HH', hour.toString())
                .replace('%MM', minute.toString());
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (firstCandidate === undefined) {
                return false;
            }

            const backup = firstCandidate;
            // Если можем передвинуть время внутри того же интервала
            if (firstCandidate.to - firstCandidate.from >= 30 + duration) {
                firstCandidate.from += 30;
            } else {
                // Иначе выбираем первый интервал, что начинается хотя бы через 30 минут
                firstCandidate = candidates.filter(interval =>
                    interval.from > firstCandidate.from + 30)[0];
            }
            // Если такие не нашлись
            if (firstCandidate === undefined) {
                firstCandidate = backup;

                return false;
            }

            return true;
        }
    };
}

module.exports = {
    getAppropriateMoment,

    isStar
};
