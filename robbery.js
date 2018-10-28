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
    const minutesInDay = 60 * 24;
    let workingHoursSegments = getWorkingTimeSegments();
    let scheduleSegments = getScheduleSegments();
    let robberySegments = [];
    findRobberyMoments();
    let curSegment = 0;


    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return robberySegments.length > 0;
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
            const segment = robberySegments[curSegment];
            template = template.replace(/%DD/, getDay(segment.from));
            template = template.replace(/%HH/, getHour(segment.from));
            template = template.replace(/%MM/, getMinutes(segment.from));

            return template;
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (curSegment < robberySegments.length - 1) {
                curSegment += 1;

                return true;
            }

            return false;
        }
    };

    function getMinutes(time) {
        let minutes = time % minutesInDay;
        minutes = (minutes % 60).toString();
        if (minutes.length === 1) {
            minutes = '0' + minutes;
        }

        return minutes;
    }

    function getHour(time) {
        const minutes = time % minutesInDay;
        let hour = Math.floor(minutes / 60).toString();
        if (hour.length === 1) {
            hour = '0' + hour;
        }

        return hour;
    }

    function getDay(time) {
        const numberToDay = { 0: 'ПН', 1: 'ВТ', 2: 'СР' };

        return numberToDay[Math.floor(time / minutesInDay)];
    }

    function getWorkingTimeSegments() {
        let resList = [];

        for (let i = 0; i < 3; i++) {
            let hours = parseInt(workingHours.from.substr(0, 2));
            let minutes = parseInt(workingHours.from.substr(3, 2));
            const from = i * minutesInDay + hours * 60 + minutes;

            hours = parseInt(workingHours.to.substr(0, 2));
            minutes = parseInt(workingHours.to.substr(3, 2));
            const to = i * minutesInDay + hours * 60 + minutes;

            resList.push({ from: from, to: to });
        }

        return resList;
    }

    function getScheduleSegments() {
        let result = [];
        const bankTimeZone = parseInt(workingHours.from.match(/\+\d{1,2}/)[0].substring(1));
        const daysNumbers = { 'ПН': 0, 'ВТ': 1, 'СР': 2 };
        for (let friend in schedule) {
            if (schedule.hasOwnProperty(friend)) {
                schedule[friend] = schedule[friend].forEach(element => {
                    const from = getTimeInMinutes(element.from);
                    const to = getTimeInMinutes(element.to);

                    result.push({ from: from, to: to });
                });
            }
        }

        function getTimeInMinutes(time) {
            const dayNumber = daysNumbers[time.substr(0, 2)];
            const timeZone = bankTimeZone - parseInt(time.match(/\+\d{1,2}/)[0].substring(1));
            const hours = parseInt(time.substr(3, 2));
            const minutes = parseInt(time.substr(6, 2));

            return dayNumber * minutesInDay + hours * 60 + minutes + timeZone * 60;
        }

        return result;
    }

    function findRobberyMoments() {
        workingHoursSegments.forEach(segment => {
            const dayStart = segment.from;
            const dayEnd = segment.to;
            let robberyStart = dayStart;
            let robberyEnd = robberyStart + duration;
            while (robberyEnd <= dayEnd) {
                let shift = getPossibleTime(robberyStart, robberyEnd);
                if (shift === -1) {
                    robberySegments.push({ from: robberyStart, to: robberyEnd });
                    robberyStart += 30;
                    robberyEnd = robberyStart + duration;
                } else {
                    robberyStart = shift;
                    robberyEnd = shift + duration;
                }
            }
        });

        robberySegments.sort((a, b) => {
            if (a.from < b.from) {
                return -1;
            }
            if (a.from > b.from) {
                return 1;
            }

            return 0;
        });
    }

    function getPossibleTime(robberyStart, robberyEnd) {
        for (let i = 0; i < scheduleSegments.length; i++) {
            const segment = scheduleSegments[i];
            if (robberyStart < segment.to && robberyEnd > segment.from) {
                return segment.to;
            }
        }

        return -1;
    }
}

module.exports = {
    getAppropriateMoment,

    isStar
};
