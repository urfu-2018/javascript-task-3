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
    console.info(schedule, '\n', duration, '\n', workingHours);

    const MINUTES_IN_DAY = 60 * 24;

    const TARGET_TIME_ZONE = parseInt(workingHours.from.split('+')[1]);

    const WEEK_DAYS = Object.freeze({ 'ПН': 0, 'ВТ': 1, 'СР': 2 });
    const WEEK_DAYS_REVERSED = Object.freeze({ 0: 'ПН', 1: 'ВТ', 2: 'СР' });

    /**
     * Собирает все входные данные в один массив, приводя к минутам с ПН 00:00+зона_банка
     * @returns {Object}
     */
    function congregateIntervals() {

        /**
         * По времени в форме from: ПН: 09:35+5 возвращает кол-во минут с ПН 00:00
         * @param {Object} time
         * @returns {Object}
         */
        function transformTime(time) {
            // 'ПН 09:35+5' => [ПН, 09, 35, 5]
            const regex = /^(.{2}) (\d{2}):(\d{2})+.(\d)+$/g;

            // Для интервалов без дня, полагаем что с нуля (нужно для банка).
            if (!time.includes(' ')) {
                time = 'ПН ' + time;
            }
            const intervalParts = time.split(regex).filter(part => part.length > 0);
            const day = WEEK_DAYS[time.split(' ')[0]] * MINUTES_IN_DAY;
            const timeOfDay = parseInt(intervalParts[1]) * 60 + parseInt(intervalParts[2]);
            const timezoneShift = (TARGET_TIME_ZONE - parseInt(intervalParts[3])) * 60;

            return day + timeOfDay + timezoneShift;
        }

        const workTimes = Object.values(WEEK_DAYS).map(day => ({
            from: transformTime(workingHours.from) + MINUTES_IN_DAY * day,
            to: transformTime(workingHours.to) + MINUTES_IN_DAY * day
        }));

        const busyTimes = [];
        Object.values(schedule).map(person => person.map(interval => busyTimes.push({
            from: transformTime(interval.from),
            to: transformTime(interval.to)
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

        /**
         * Возвращает множество интервалов, содержащихся в A, но не содержащихся в B
         * @param {Object} intervalA
         * @param {Object} intervalB
         * @returns {Object[]}
         */
        function subtractIntervals(intervalA, intervalB) {

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
             * Эта функция проверяет, лежит ли число b между a1 и a2
             * @param {Number} a1
             * @param {Number} b
             * @param {Number} a2
             * @returns {Boolean}
             */
            function liesInBetween(a1, b, a2) {
                return a1 <= b && a2 >= b;
            }

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
            if (liesInBetween(intervalA.from, intervalB.to, intervalA.to)) {
                return [{
                    from: intervalB.to,
                    to: intervalA.to
                }];
            }
            if (liesInBetween(intervalA.from, intervalB.from, intervalA.to)) {
                return [{
                    from: intervalA.from,
                    to: intervalB.from
                }];
            }

            return [intervalA];
        }

        for (let busyTime of fullSchedule.people) {
            let leftovers = [];
            for (let workTime of fullSchedule.bank) {
                leftovers = leftovers.concat(subtractIntervals(workTime, busyTime));
            }
            fullSchedule.bank = leftovers; // так остаются только новые интервалы
        }

        return fullSchedule.bank;
    }

    const candidates = intersectIntervals(congregateIntervals())
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
