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

    const weekEnum = Object.freeze({
        'ПН': 0, 'ВТ': 1, 'СР': 2,
        0: 'ПН', 1: 'ВТ', 2: 'СР'
    });

    /**
     * Собирает все входные данные в один массив (с преобразованиями)
     * @returns {Object}
     */
    function congregateIntervals() {

        /**
         * По интервалу в форме from: ПН: 09:35+5, to: 'ВТ: 14:59+5'
         * возвращает интервал в минутах и приписывает имя
         * @param {Object} interval
         * @returns {Object}
         */
        function transformInterval(interval) {
            // 'ПН 09:35+5' => [ПН, 09, 35, 5]
            const regex = /^(.{2}) (\d{2}):(\d{2})+.(\d)+$/g;

            /**
             * Выполняет эту операцию для одной из двух частей.
              * @param {String} time
             * @returns {number}
             */
            function parseInterval(time) {

                // Для интервалов без дня, полагаем что с нуля (нужно для банка).
                if (!time.includes(' ')) {
                    time = 'ПН ' + time;
                }
                const intervalParts = time.split(regex).filter(part => part.length > 0);
                const dayFrom = weekEnum[time.split(' ')[0]] * MINUTES_IN_DAY;
                const timeFrom = parseInt(intervalParts[1]) * 60 + parseInt(intervalParts[2]);
                const timezoneShift = (TARGET_TIME_ZONE - parseInt(intervalParts[3])) * 60;

                return dayFrom + timeFrom + timezoneShift;
            }

            return { from: parseInterval(interval.from), to: parseInterval(interval.to) };
        }

        let bankTimes = [];
        const transformed = transformInterval(workingHours);
        for (let i = 0; i < 3; i ++) { // формируем расписание банка (3: до среды)
            bankTimes.push({
                from: transformed.from + MINUTES_IN_DAY * i,
                to: transformed.to + MINUTES_IN_DAY * i
            });
        }

        let busyTimes = [];
        for (let person of Object.values(schedule)) { // читаем расписание грабителей
            for (let interval of person) {
                busyTimes.push(transformInterval(interval));
            }
        }

        return { bank: bankTimes, people: busyTimes };
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

        for (let interval of fullSchedule.people) {
            let leftovers = [];
            for (let day of fullSchedule.bank) {
                leftovers = leftovers.concat(subtractIntervals(day, interval));
            }
            fullSchedule.bank = leftovers;
        }

        return fullSchedule.bank;
    }

    const candidates = intersectIntervals(congregateIntervals())
        .filter(interval => (interval.to - interval.from) >= duration)
        .sort((a, b) => (a.from - b.from));
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
            const day = weekEnum[Math.floor(time / MINUTES_IN_DAY)];
            let hour = Math.floor((time % MINUTES_IN_DAY) / 60);
            if (hour < 10) {
                hour = '0' + hour;
            }
            let minute = (time % MINUTES_IN_DAY) % 60;
            if (minute < 10) {
                minute = '0' + minute;
            }

            return template.replace('%DD', day)
                .replace('%HH', hour)
                .replace('%MM', minute);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            const backup = firstCandidate;
            if (firstCandidate.to - firstCandidate.from >= (30 + duration)) {
                firstCandidate.from += 30;
            } else {
                firstCandidate = candidates.filter(interval =>
                    (interval.from >= firstCandidate.from + 30))[0];
            }
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
