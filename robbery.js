'use strict';

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

    function getAnScheduleArray(_schedule) {
        const members = Object.keys(_schedule);
        const scheduleArray = [];
        for (let i = 0; i < members.length; i++) {
            for (let j = 0; j < _schedule[members[i]].length; j++) {
                scheduleArray.push([_schedule[members[i]][j].from, _schedule[members[i]][j].to]);
            }
        }

        return scheduleArray;
    }

    function getAnWorkingHoursUTCFormat(_workingHours) {
        function getTimeInUTC(time) {
            let bankWorkingTime = time.match(/(\d\d)(:)(\d\d)(.)(\d)/i);
            bankWorkingTime = new Date(
                Date.UTC(1970, 0, 1, Number(bankWorkingTime[1]), Number(bankWorkingTime[3]))
            );

            return bankWorkingTime.getTime() / 60000;
        }

        let timeZone = _workingHours.from.match(/\+(\d)/i);
        timeZone = timeZone[1];

        return {
            workingTimeFrom: function () {
                return getTimeInUTC(_workingHours.from);
            },
            workingTimeTo: function () {
                return getTimeInUTC(_workingHours.to);
            },
            timeZone: function () {
                return timeZone;
            }
        };
    }

    const bankTimeZone = getAnWorkingHoursUTCFormat(workingHours).timeZone();

    function getAnScheduleUTCFormat(_schedule) {
        const days = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
        const scheduleArray = getAnScheduleArray(_schedule);
        function getTimeInUTC(time) {
            let scheduleTime = time.match(/(..)\s(\d\d)(:)(\d\d)(.)(\d)/i);
            let day = 0;
            for (let i = 0; i < days.length; i++) {
                if (scheduleTime[1] === days[i]) {
                    day = i;
                    break;
                }
            }
            const TimeZoneDifference = (
                bankTimeZone - Number(scheduleTime[6]));
            scheduleTime = new Date(
                Date.UTC(1970, 0, day, (Number(scheduleTime[2]) + TimeZoneDifference),
                    Number(scheduleTime[4]))
            );

            return scheduleTime.getTime() / 60000;
        }
        const scheduleArrayUTC = [];
        for (let i = 0; i < scheduleArray.length; i++) {
            scheduleArrayUTC.push([getTimeInUTC(scheduleArray[i][0]),
                getTimeInUTC(scheduleArray[i][1])]
            );
        }

        return scheduleArrayUTC;
    }

    function getSortedSchedul(a, b) {
        if (a[0] === b[0]) {
            return 0;
        }

        return (a[0] < b[0]) ? -1 : 1;
    }

    const scheduleUTC = getAnScheduleUTCFormat(schedule);
    const workingTimeFrom = getAnWorkingHoursUTCFormat(workingHours).workingTimeFrom();
    const workingTimeTo = getAnWorkingHoursUTCFormat(workingHours).workingTimeTo();

    function getFreeGaps(_scheduleUTC) {
        const SortedScheduleUTC = _scheduleUTC.sort(getSortedSchedul);
        const busyGapsArr = [];
        busyGapsArr.push(
            SortedScheduleUTC.reduce((accum, element) => {
                if (accum[1] >= element[0] && accum[1] <= element[1]) {
                    accum = [accum[0], element[1]];

                    return accum;
                } else if (accum[1] >= element[1]) {
                    accum = [accum[0], accum[1]];

                    return accum;
                } else if (!(accum[1] >= element[0] && accum[1] <= element[1])) {
                    busyGapsArr.push(accum);
                    accum = [element[0], element[1]];

                    return accum;
                }

                return '';
            })
        );

        const freeGapsArr = [];
        for (let i = 0; i < busyGapsArr.length - 1; i++) {
            freeGapsArr.push([busyGapsArr[i][1], busyGapsArr[i + 1][0]]);
        }
        freeGapsArr.unshift([0, busyGapsArr[0][0]]);
        freeGapsArr.push([busyGapsArr[busyGapsArr.length - 1][1], 10080]);

        const freeGapsArrInWorkingTime = [];
        function getFreeGapsArrInWorkingTime(_workingTimeFrom, _workingTimeTo) {
            function entersWorkingTimeFromInside(__workingTimeFrom, __workingTimeTo) {
                for (let i = 0; i < freeGapsArr.length; i++) {
                    if (freeGapsArr[i][0] >= __workingTimeFrom &&
                        freeGapsArr[i][1] <= __workingTimeTo) {
                        freeGapsArrInWorkingTime.push([freeGapsArr[i][0], freeGapsArr[i][1]]);
                    }
                }
            }
            function entersWorkingTimeFromStart(__workingTimeFrom, __workingTimeTo) {
                for (let i = 0; i < freeGapsArr.length; i++) {
                    if (freeGapsArr[i][0] < __workingTimeFrom &&
                        freeGapsArr[i][1] > __workingTimeFrom &&
                        freeGapsArr[i][1] <= __workingTimeTo) {
                        freeGapsArrInWorkingTime.push([__workingTimeFrom, freeGapsArr[i][1]]);
                    }
                }
            }
            function entersWorkingTimeFromEnd(__workingTimeFrom, __workingTimeTo) {
                for (let i = 0; i < freeGapsArr.length; i++) {
                    if (freeGapsArr[i][0] >= __workingTimeFrom && freeGapsArr[i][0] <
                        __workingTimeTo && freeGapsArr[i][1] > __workingTimeTo) {
                        freeGapsArrInWorkingTime.push([freeGapsArr[i][0], __workingTimeTo]);
                    }
                }
            }
            entersWorkingTimeFromInside(_workingTimeFrom, _workingTimeTo);
            entersWorkingTimeFromStart(_workingTimeFrom, _workingTimeTo);
            entersWorkingTimeFromEnd(_workingTimeFrom, _workingTimeTo);

            return freeGapsArrInWorkingTime;
        }

        getFreeGapsArrInWorkingTime(workingTimeFrom, workingTimeTo);
        getFreeGapsArrInWorkingTime(workingTimeFrom + 1440, workingTimeTo + 1440);
        getFreeGapsArrInWorkingTime(workingTimeFrom + 2880, workingTimeTo + 2880);
        freeGapsArrInWorkingTime.sort(getSortedSchedul);

        return freeGapsArrInWorkingTime;
    }
    const freeGaps = getFreeGaps(scheduleUTC);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            for (let i = 0; i < freeGaps.length; i++) {
                if (freeGaps[i][1] - freeGaps[i][0] >= duration) {
                    return true;
                }
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
            function firstFreeTime() {
                for (let i = 0; i < freeGaps.length; i++) {
                    if (freeGaps[i][1] - freeGaps[i][0] >= duration) {
                        return freeGaps[i][0];
                    }
                }

                return false;
            }
            if (firstFreeTime() === false) {
                return '';
            }
            const utcSeconds = firstFreeTime() * 60;
            const date = new Date(0);
            date.setUTCSeconds(utcSeconds);

            let dateHours = date.getUTCHours();
            let dateMinutes = date.getUTCMinutes();
            let dateDay = String(date.getUTCDate())
                .replace('1', 'ПН')
                .replace('2', 'ВТ')
                .replace('3', 'СР');
            if (dateHours < 10) {
                dateHours = '0' + dateHours;
            }
            if (dateMinutes < 10) {
                dateMinutes = '0' + dateMinutes;
            }
            template = template.replace('%DD', dateDay)
                .replace('%HH', dateHours)
                .replace('%MM', dateMinutes);

            return template;
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
