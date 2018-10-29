'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = false;
let bankTimeZone = 0;
const days = { 'ПН': 0, 'ВТ': 1, 'СР': 2 };

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
function getAppropriateMoment(schedule, duration, workingHours) {

    bankTimeZone = parseInt(workingHours.from.substr(5, 10));
    schedule.bank = [workingHours];

    Object.keys(schedule)
        .forEach((time) => {
            if (time === 'bank') {
                convertTimeToMinutesBank(schedule[time]);
            } else {
                convertTimeToMinutes(schedule[time], bankTimeZone);
            }
        });
    schedule = normalizingScheduleAndSort(schedule);
    let unionTime = findEveryFreeInterval(schedule);

    let heh = existArray(unionTime, duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {

            return heh.length !== 0;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            let date = makeDateValid(heh);
            if (heh.length !== 0) {

                template = template.replace('%DD', date[0]);
                template = template.replace('%HH', date[1]);
                template = template.replace('%MM', date[2]);

                return template;
            }

            return '';
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

function normalizingScheduleAndSort(schedule) {
    let arr = [];
    Object.keys(schedule)
        .forEach((time) => {
            schedule[time].forEach((lul) => {
                arr.push(lul);
            });
        });
    arr.sort((a, b) => {
        let genreA = a.from;
        let genreB = b.from;
        let comparison = 0;
        if (genreA > genreB) {
            comparison = 1;
        } else if (genreA < genreB) {
            comparison = -1;
        }

        return comparison;
    });

    return arr;
}

// convert time when bank doesn't work to minutes (start at 00:00 by its timezone)

function convertTimeToMinutesBank(workingHours) {
    let to = 0;
    let from = 0;
    workingHours.forEach((time) => {
        from = (parseInt(time.from.substr(0, 2)) * 60 + parseInt(time.from.substr(3, 2)));
        to = (parseInt(time.to.substr(0, 2)) * 60 + parseInt(time.to.substr(3, 2)));
        time.from = 0;
        time.to = from;
    });
    workingHours.push({ from: 0, to: from });
    workingHours.push({ from: to, to: from + 1440 });
    workingHours.push({ from: to + 1440, to: from + 2880 });
    workingHours.push({ from: to + 2880, to: 4320 });

}

function findEveryFreeInterval(arr) {
    let unionTime = [];
    let a = arr[0].from;
    let b = arr[0].to;
    arr.forEach((time, index) => {
        if (a <= time.from && time.from <= b) {
            if (b < time.to) {
                b = time.to;
            }
        } else if (index < arr.length - 1) {
            unionTime.push({ from: b, to: arr[index].from });
            a = arr[index].from;
            b = arr[index].to;
        }
    });

    return unionTime;
}

function existArray(unionTime, duration) {
    for (let time in unionTime) {
        if (unionTime[time].to - unionTime[time].from >= duration) {

            return unionTime[time];
        }
    }

    return '';
}

function makeDateValid(time) {
    let day = Object.keys(days)[Math.floor(time.from / 1440)];
    let hours = Math.floor((time.from % 1440) / 60) < 10 ? '0' + Math.floor((time.from % 1440) /
        60) : Math.floor((time.from % 1440) / 60);
    let minutes = (time.from % 1440) % 60 < 10 ? '0' + (time.from % 1440) % 60
        : (time.from % 1440) % 60;

    return [day, hours, minutes];
}

// convert schedule ofk every rubber to minutes (start at 00:00 by bank timezone)

function convertTimeToMinutes(schedule, bankTimeZone1) {
    schedule.forEach((time) => {
        time.from = (parseInt(time.from.substr(3, 2)) * 60 + parseInt(time.from.substr(6, 2)) +
            (bankTimeZone1 - parseInt(time.from.substr(8, 10))) * 60 +
            days[time.from.substr(0, 2)] * 24 * 60);
        time.to = (parseInt(time.to.substr(3, 2)) * 60 + parseInt(time.to.substr(6, 2)) +
            (bankTimeZone1 - parseInt(time.to.substr(8, 10))) * 60 + days[time.to.substr(0, 2)] *
            24 * 60);

    });
}

module.exports = {
    getAppropriateMoment,

    isStar
};
