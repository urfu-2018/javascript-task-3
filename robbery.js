'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;
const weekdayNames = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
const dayToIndex = new Map(weekdayNames.map(function (day, index) {
    return [day, index];
}));
const friends = ['Danny', 'Rusty', 'Linus'];
const daysCountForRobbery = 3;
const hoursInDay = 24;
const minutesInHour = 60;
const minutesInDay = hoursInDay * minutesInHour;
const minTimestamp = 0;
const maxTimestamp = daysCountForRobbery * minutesInDay + 5;
const timeBetweenRobberies = 30;

function parseTime(timeString) {
    const res = timeString.match(/(([А-Я]{2}) )?(\d{2}):(\d{2})\+(\d+)/);

    let day = res[2];
    if (day === undefined) {
        day = 'ПН';
    }

    return {
        day,
        hour: parseInt(res[3]),
        minute: parseInt(res[4]),
        timezone: parseInt(res[5])
    };
}

function getTimestampFromMondayBankOpening(timeString, bankOpening) {
    const time = parseTime(timeString);
    let timestamp = (dayToIndex.get(time.day) * 24 +
                     time.hour - bankOpening.hour +
                     bankOpening.timezone - time.timezone) * 60 + time.minute - bankOpening.minute;
    timestamp = Math.max(timestamp, minTimestamp);
    timestamp = Math.min(timestamp, maxTimestamp);

    return timestamp;
}

function handleFriends(schedule, bankOpeningTime, collisionsByTimestamp) {
    friends.forEach(friend => {
        schedule[friend].forEach(interval => {
            const fromTimestamp = getTimestampFromMondayBankOpening(interval.from,
                bankOpeningTime);
            const toTimestamp = getTimestampFromMondayBankOpening(interval.to,
                bankOpeningTime);
            collisionsByTimestamp[fromTimestamp]++;
            collisionsByTimestamp[toTimestamp]--;
        });
    });
}

function calcCollisions(schedule, bankOpeningTime, workingEndTimestamp) {
    const collisionsByTimestamp = new Array(maxTimestamp).fill(0);

    handleFriends(schedule, bankOpeningTime, collisionsByTimestamp);

    for (let timestamp = 1; timestamp < maxTimestamp; timestamp++) {
        collisionsByTimestamp[timestamp] += collisionsByTimestamp[timestamp - 1];
    }

    for (let timestamp = 0; timestamp < maxTimestamp; timestamp++) {
        if (timestamp % minutesInDay >= workingEndTimestamp ||
            Math.trunc(timestamp / minutesInDay) >= daysCountForRobbery) {
            collisionsByTimestamp[timestamp] = 1;
        }
    }

    return collisionsByTimestamp;
}

function createMoment(momentStart, curTime, bankOpeningTime) {
    let length = curTime - momentStart + 1;
    const day = weekdayNames[Math.trunc(momentStart / minutesInDay)];
    let hour = (bankOpeningTime.hour + Math.trunc((momentStart % minutesInDay) / minutesInHour));
    let minute = bankOpeningTime.minute + momentStart % minutesInHour;

    return { day, hour, minute, length };
}

function handleCurrentInterval(collisionsByTimestamp, bankOpeningTime, duration, intervalStart) {
    const moments = [];
    let curTime = intervalStart;
    while (collisionsByTimestamp[curTime + 1] === 0) {
        curTime++;
    }
    let length = curTime - intervalStart + 1;
    while (length >= duration) {
        moments.push(createMoment(intervalStart, curTime, bankOpeningTime));
        intervalStart += timeBetweenRobberies;
        length -= timeBetweenRobberies;
    }

    return moments;
}

function findGoodMoments(collisionsByTimestamp, bankOpeningTime, duration) {
    const goodMoments = [];
    for (let timestamp = 0; timestamp < maxTimestamp; timestamp++) {
        if (collisionsByTimestamp[timestamp] === 0 &&
            (timestamp === 0 || collisionsByTimestamp[timestamp - 1] !== 0)) {
            const newMoments = handleCurrentInterval(
                collisionsByTimestamp, bankOpeningTime, duration, timestamp);
            goodMoments.push.apply(goodMoments, newMoments);
        }
    }

    return goodMoments;
}

function createTimeString(time) {
    return ('0' + time).slice(-2);
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
    const bankOpeningTime = parseTime(workingHours.from);
    const workingEndTimestamp = getTimestampFromMondayBankOpening(workingHours.to, bankOpeningTime);
    const collisionsByTimestamp = calcCollisions(schedule, bankOpeningTime, workingEndTimestamp);
    const goodMoments = findGoodMoments(collisionsByTimestamp, bankOpeningTime, duration);

    return {
        goodMoments,
        ansIndex: 0,

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return this.goodMoments.length > 0;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (this.ansIndex >= this.goodMoments.length) {
                return '';
            }

            return template
                .replace('%DD', createTimeString(this.goodMoments[this.ansIndex].day))
                .replace('%HH', createTimeString(this.goodMoments[this.ansIndex].hour))
                .replace('%MM', createTimeString(this.goodMoments[this.ansIndex].minute));
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (this.ansIndex + 1 >= this.goodMoments.length) {
                return false;
            }
            this.ansIndex++;

            return true;
        }
    };
}

module.exports = {
    getAppropriateMoment,

    isStar
};
