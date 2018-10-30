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

const days = { 'ПН': 0, 'ВТ': 1440, 'СР': 2880 };

function getBankTimeZone(workingHours) {
    let bankTimeZone;
    [, , , bankTimeZone] = workingHours.from.match(/^(\d){2}:(\d){2}\+(\d){1,2}$/);

    return bankTimeZone;
}

function getTimeInMinutes(time) {
    const timeShablon = /^([ПНВТСР]{2}) (\d{2}):(\d{2})\+(\d{1,2})$/;
    const [, day, hour, minute, timeZone] = time.match(timeShablon);

    return days[day] + Number(hour) * 60 + Number(minute) - timeZone * 60;
}

function getBankWorkingTime(workingHours) {
    let timeZone = getBankTimeZone(workingHours);

    return ['ПН', 'ВТ', 'СР'].map(day => {
        return {
            from: getTimeInMinutes(day + ' ' + workingHours.from) + timeZone * 60,
            to: getTimeInMinutes(day + ' ' + workingHours.to) + timeZone * 60
        };
    });
}

function getTimeFromSchedule(schedule, bankTimeZone) {
    let busyMinutes = [];
    for (let value of Object.values(schedule)) {
        for (let time of value) {
            busyMinutes.push(
                {
                    from: getTimeInMinutes(time.from) + bankTimeZone * 60,
                    to: getTimeInMinutes(time.to) + bankTimeZone * 60
                });
        }
    }

    return busyMinutes.sort(function (object1, object2) {
        if (object1.from > object2.from) {
            return 1;
        }
        if (object1.from < object2.from) {
            return -1;
        }

        return 0;
    });
}

function unionBusyMinutes(busyMinutes) {
    const intersectionDate = [busyMinutes[0]];
    let currentDate = intersectionDate[intersectionDate.length - 1];
    for (let date of busyMinutes) {
        if (currentDate.from >= date.to || currentDate.to <= date.from) {
            intersectionDate.push(date);
            currentDate = date;
        } else {
            currentDate.to = Math.max(currentDate.to, date.to);
        }
    }

    return intersectionDate;
}

function getFreeTime(intersectionDate) {
    const deadLine = getTimeInMinutes('СР 23:59+0');
    const timeWhenEverybodyIsFree = [];
    let start = 0;
    for (let date of intersectionDate) {
        const end = date.from;
        if (end < deadLine) {
            timeWhenEverybodyIsFree.push({
                from: start,
                to: end });
        } else {
            timeWhenEverybodyIsFree.push({
                from: start,
                to: deadLine
            });
        }
        start = date.to;
    }
    if (start < deadLine) {
        timeWhenEverybodyIsFree.push({
            from: start,
            to: deadLine
        });
    }

    return timeWhenEverybodyIsFree;
}

function getTimeForRobbery(bankWorkingTime, GaysFreeTime, duration) {
    const allTimeForRobbery = [];
    bankWorkingTime.forEach(bankTime => {
        GaysFreeTime.forEach(gaysTime => {
            if (bankTime.from < gaysTime.to &&
            bankTime.to > gaysTime.from) {
                const needdTime = {
                    from: Math.max(bankTime.from, gaysTime.from),
                    to: Math.min(bankTime.to, gaysTime.to)
                };
                if (needdTime.to - needdTime.from >= duration) {
                    allTimeForRobbery.push(needdTime);
                }
            }
        });
    });

    return allTimeForRobbery;
}

function getAppropriateMoment(schedule, duration, workingHours) {
    let bankTimeZone;
    [, , , bankTimeZone] = workingHours.from.match(/^(\d){2}:(\d){2}\+(\d){1,2}$/);
    const bankWorkingTime = getBankWorkingTime(workingHours);
    const busyTime = unionBusyMinutes(getTimeFromSchedule(schedule, bankTimeZone));
    const freeTime = getFreeTime(busyTime);
    const answer = getTimeForRobbery(bankWorkingTime, freeTime, duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            if (answer.length > 0) {
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
            if (answer.length === 0) {
                return '';
            }
            const needingTime = answer[0];
            let day;
            if (needingTime.from >= 0 && needingTime.from < 1440) {
                day = 'ПН';
            } else if (needingTime.from >= 1440 && needingTime.from < 2880) {
                day = 'ВТ';
            } else {
                day = 'СР';
            }
            const hour = Math.floor((needingTime.from - days[day]) / 60).toString()
                .padStart(2, '0');
            const minute = (needingTime.from - days[day] - hour * 60).toString()
                .padStart(2, '0');

            return template.replace('%DD', day).replace('%HH', hour)
                .replace('%MM', minute);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (!answer.length) {
                return false;
            }
            if (answer[0].to - answer[0].from - 30 >= duration) {
                answer[0].from += 30;

                return true;
            } else if (answer.length > 1) {
                answer.shift();

                return true;
            }

            return false;
        }
    };
}

module.exports = {
    getAppropriateMoment,

    isStar
};
