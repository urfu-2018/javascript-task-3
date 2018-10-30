'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = false;
const DAYS = new Map([
    ['ПН', 0], ['ВТ', 1],
    ['СР', 2], ['ЧТ', 3],
    ['ПТ', 4], ['СБ', 5],
    ['ВС', 6]]);
const DAYSTODEAL = new Map([[0, 'ПН'], [1, 'ВТ'], [2, 'СР']]);
const TIME_PATTERN_BANDITS = /^(\W\W) (\d\d):(\d\d)\+(\d+)$/;
const TIME_PATTERN_BANK = /^(\d\d):(\d\d)\+(\d+)$/;

function parseBanditoTime(rawTime) {
    const [, day, hours, minutes, timeZone] = rawTime.match(TIME_PATTERN_BANDITS);
    const dInt = DAYS.get(day);

    return [dInt, hours, minutes, timeZone].map(val => parseInt(val));
}

function parseBankTime(rawTime) {
    const [, hours, minutes, timeZone] = rawTime.match(TIME_PATTERN_BANK);

    return [hours, minutes, timeZone].map(val => parseInt(val));
}

function parseSchedule(banditsTimes) {
    let parsedG = [];
    for (var name in banditsTimes) {
        if (banditsTimes.hasOwnProperty(name)) {
            banditsTimes[name].map(function (x) {
                const from = parseBanditoTime(x.from);
                const to = parseBanditoTime(x.to);

                return { from: from, to: to };
            }).forEach(element => parsedG.push(element));
        }
    }
    // [day, h, m, timespan]

    return parsedG.filter(x => x.from[0] < 3);
}

/**
 * @param {Number} h
 * @param {Number} m
 * @returns {Array}
 */
function toMinutes(h, m) {
    return h * 60 + m;
}

function getSetTimesInDay() {
    var setTimes = new Set();
    var h = 0;
    var m = 0;
    for (var i = 0; i < 48; i++) {
        setTimes.add([h, m].toString());
        m += 30;
        if (m === 60) {
            h += 1;
            m = 0;
        }
    }

    return setTimes;
}

function getDayTimesWorkingBank(splitedBankTime) {
    let tempo = new Set();
    splitedBankTime.forEach(function (bankTime) {
        getSetTimesInDay().forEach(function (dayTime) {
            if (bankTime.toString() === dayTime.toString()) {
                tempo.add(bankTime);
            }
        });
    });

    return tempo;
}

function findFreeSpace(BT, workingTimeBank) {
    let splitedBankTime = splitTimeZone([
        [workingTimeBank.from[0], workingTimeBank.from[1]],
        [workingTimeBank.to[0], workingTimeBank.to[1]]
    ]);
    let result = [
        getDayTimesWorkingBank(splitedBankTime),
        getDayTimesWorkingBank(splitedBankTime),
        getDayTimesWorkingBank(splitedBankTime)
    ];
    BT.forEach(function (item) {
        let banditoSetTimes = [];
        if (item.to[2] === 30) {
            banditoSetTimes = splitTimeZone([
                [item.from[1], item.from[2]],
                [item.to[1], item.to[2] - 30]]);
        } else {
            banditoSetTimes = splitTimeZone([
                [item.from[1], item.from[2]],
                [item.to[1] - 1, item.to[2] + 30]]);
        }
        const currentDay = item.from[0];
        banditoSetTimes.forEach(function (delta) {
            result.forEach(function (day, i) {
                if (currentDay === i && result[i].has(delta.toString())) {
                    result[i].delete(delta.toString());
                }
            });
        });
    });

    return result;
}

function splitTimeZone(tZ) {
    let result = new Set();
    var h = 0;
    var m = 0;
    for (var i = 0; i < 49; i++) {
        if (toMinutes(h, m) >= toMinutes(tZ[0][0], tZ[0][1]) &&
        toMinutes(h, m) <= toMinutes(tZ[1][0], tZ[1][1])) {
            result.add([h, m].toString());
        }
        m += 30;
        if (m === 60) {
            h += 1;
            m = 0;
        }
    }

    return result;
}

function checkHour(timeZone) {
    if (timeZone.from[1] < 0) {
        timeZone.from[1] = 24 + timeZone.from[1];
        timeZone.from[0] -= 1;
    }

    return timeZone;
}

function normalizeTimeZone(elem, timeZone, normalTimeZone) {
    let result = {};
    for (const i in elem) {
        if (elem.hasOwnProperty(i)) {
            const minutes = elem[i][2];
            const hours = elem[i][1] + timeZone;
            const day = elem[i][0];
            result[i] = [day, hours, minutes, normalTimeZone];
        }
    }

    return result;
}

function normalizeTimeSpan(banditsTimes, normalTimeSpan) {
    let temp = banditsTimes.map(function (elem) {
        const dTime = normalTimeSpan - elem.from[3];
        if (dTime !== 0) {

            return checkHour(normalizeTimeZone(elem, dTime, normalizeTimeSpan));
        }

        return elem;
    });
    let result = [];
    temp.forEach(function (elem) {
        let res = checkDays(elem);
        res.forEach(e => result.push(e));
    });

    return result;
}

function checkDays(timeZone) {
    if (timeZone.from[0] !== timeZone.to[0]) {
        let result = [
            {
                from: timeZone.from,
                to: [timeZone.from[0], 24, 0, timeZone.from[3]]
            },
            {
                from: [timeZone.to[0], 0, 0, timeZone.to[3]],
                to: timeZone.to
            }
        ];

        return result;
    }

    return [timeZone];
}

function findDurationInOneDay(freeTime, duration) {
    let currentDuration = 0;
    let prev = freeTime[0];
    let startTime = freeTime[0];
    freeTime.forEach(function (elem) {
        if (currentDuration >= duration) {
            return;
        }
        if (toMinutes(elem[0], elem[1]) - toMinutes(prev[0], prev[1]) <= 30) {
            currentDuration += 30;
        } else {
            currentDuration = 0;
            startTime = elem;
        }
        prev = elem;
    });
    if (currentDuration >= duration) {

        return startTime;
    }

    return null;
}

function findTimeToBad(freeSpaces, duration) {
    let result = [];
    freeSpaces.forEach(x => result.push(findDurationInOneDay(x, duration)));

    return result;
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
    let parsedWorkingBank = {
        from: parseBankTime(workingHours.from),
        to: parseBankTime(workingHours.to)
    };
    let parsedShedule = parseSchedule(schedule);
    let normalized = normalizeTimeSpan(parsedShedule, parsedWorkingBank.from[2]);
    let freeSpace = findFreeSpace(normalized, parsedWorkingBank)
        .map(set => Array.from(set)
            .map(elem => elem.split(',')
                .map(x => parseInt(x))
            )
        );
    let result = findTimeToBad(freeSpace, duration);
    let day = '';
    let h = 0;
    let m = 0;
    result.forEach(function (x, i) {
        if (x !== null && day === '') {
            day = DAYSTODEAL.get(i);
            h = x[0];
            m = x[1];
        }
    });

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            if (day === '') {

                return false;
            }

            return true;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (day === '') {

                return '';
            }
            if (h.toString().length === 1) {
                h = '0' + h.toString();
            }
            if (m.toString().length === 1) {
                m = '0' + m.toString();
            }
            const newTemplate = template.replace('%DD', day).replace('%HH', h)
                .replace('%MM', m);

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
