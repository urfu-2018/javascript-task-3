'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;

const MINUTES_IN_DAY = 60 * 24;
const ROBBERY_DAYS = { 'ПН': 0, 'ВТ': 1, 'СР': 2 };
const NUMBER_TO_ROBBERY_DAY = { 0: 'ПН', 1: 'ВТ', 2: 'СР' };
const NEXT_ROBBERY_TIME_OFFSET = 30;


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

    const bankScheduleTimestamps = getBankScheduleTimestamps();
    const robbersScheduleTimestamps = getRobbersScheduleTimestamps();
    let robberyTimestamps = findPossibleRobberyTimestamps(
        bankScheduleTimestamps,
        robbersScheduleTimestamps);
    let currentTimestampIndex = 0;

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return robberyTimestamps.length > 0;
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
            const segment = robberyTimestamps[currentTimestampIndex];
            template = template.replace(/%DD/, getDay(segment[0]));
            template = template.replace(/%HH/, getHour(segment[0]));
            template = template.replace(/%MM/, getMinutes(segment[0]));

            return template;
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (currentTimestampIndex < robberyTimestamps.length - 1) {
                currentTimestampIndex += 1;

                return true;
            }

            return false;
        }
    };

    function hoursToMinutes(hoursString) {
        let hours = parseInt(hoursString.substr(0, 2));
        let minutes = parseInt(hoursString.substr(3, 2));

        return hours * 60 + minutes;
    }

    // Timestamp начинается с Понедельника 00:00
    function getBankScheduleTimestamps() {
        let bankSchedule = [];

        for (let i = 0; i < Object.keys(ROBBERY_DAYS).length; i++) {
            let startTimestamp = i * MINUTES_IN_DAY + hoursToMinutes(workingHours.from);
            let finishTimestamp = i * MINUTES_IN_DAY + hoursToMinutes(workingHours.to);
            bankSchedule.push([startTimestamp, finishTimestamp]);
        }

        return bankSchedule;
    }

    function getRobbersScheduleTimestamps() {
        let robbersSchedule = [];
        const bankTimezone = getTimezone(workingHours.from);

        for (let robber in schedule) {
            if (schedule.hasOwnProperty(robber)) {
                schedule[robber].forEach(timeWindow => {
                    let startTimestamp = getTimeFromStringInMinutes(timeWindow.from);
                    let finishTimestamp = getTimeFromStringInMinutes(timeWindow.to);
                    robbersSchedule.push([startTimestamp, finishTimestamp]);
                });
            }
        }

        return robbersSchedule;

        function getTimezone(timeString) {
            return parseInt(timeString.match(/\+(\d{1,2})/)[1]);
        }

        function getTimeFromStringInMinutes(timeString) {
            const dayNumber = ROBBERY_DAYS[timeString.substr(0, 2)];
            const robberTimezone = getTimezone(timeString);
            const timezoneOffset = bankTimezone - robberTimezone;
            const minutes = hoursToMinutes(timeString.substr(3));

            return dayNumber * MINUTES_IN_DAY + minutes + timezoneOffset * 60;
        }
    }

    function findPossibleRobberyTimestamps(bankTimestamps, robbersTimestamps) {
        let robTimestamps = [];

        bankTimestamps.forEach(dayTimestamp => {
            const dayStart = dayTimestamp[0];
            const dayEnd = dayTimestamp[1];

            let robberyStart = dayStart;
            let robberyEnd = robberyStart + duration;
            while (robberyEnd <= dayEnd) {
                let shift = getPossibleTime(robberyStart, robberyEnd, robbersTimestamps);
                if (shift === -1) {
                    robTimestamps.push([robberyStart, robberyEnd]);
                    robberyStart += NEXT_ROBBERY_TIME_OFFSET;
                    robberyEnd = robberyStart + duration;
                } else {
                    robberyStart = shift;
                    robberyEnd = shift + duration;
                }
            }
        });

        robTimestamps.sort((a, b) => {
            if (a[0] < b[0]) {
                return -1;
            }
            if (a[0] > b[0]) {
                return 1;
            }

            return 0;
        });

        return robTimestamps;
    }

    function getPossibleTime(robberyStart, robberyEnd, robbersTimestamps) {
        for (let i = 0; i < robbersTimestamps.length; i++) {
            const robberAvailableTime = robbersTimestamps[i];
            if (robberyStart < robberAvailableTime[1] && robberyEnd > robberAvailableTime[0]) {
                return robberAvailableTime[1];
            }
        }

        return -1;
    }

    function getDay(time) {
        return NUMBER_TO_ROBBERY_DAY[Math.floor(time / MINUTES_IN_DAY)];
    }

    function getHour(time) {
        const minutes = time % MINUTES_IN_DAY;
        let hour = Math.floor(minutes / 60).toString();
        if (hour.length === 1) {
            hour = '0' + hour;
        }

        return hour;
    }

    function getMinutes(time) {
        let minutes = time % MINUTES_IN_DAY;
        minutes = (minutes % 60).toString();
        if (minutes.length === 1) {
            minutes = '0' + minutes;
        }

        return minutes;
    }
}

module.exports = {
    getAppropriateMoment,
    isStar
};
