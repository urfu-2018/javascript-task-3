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
        'ПН': 0, 'ВТ': 1, 'СР': 2, 'ЧТ': 3, 'ПТ': 4, 'СБ': 5, 'ВС': 6,
        0: 'ПН', 1: 'ВТ', 2: 'СР', 3: 'ЧТ', 4: 'ПТ', 5: 'СБ', 6: 'ВС'
    });

    /**
     * Собирает все входные данные в один массив (с преобразованиями)
     * @returns {Object}
     */
    function congregateIntervals() {

        /**
         * По интервалу в форме ПН: 09:35+5 возвращает интервал в минутах и приписывает имя
         * @param {Object} interval
         * @returns {Object}
         */
        function transformInterval(interval) {
            // 'ПН 09:35+5' => [ПН, 09, 35, 5]
            const regex = /^(.{2}) (\d{2}):(\d{2})+.(\d)+$/g;

            // Для интервалов без даты, полагаем что с нуля (нужно для банка).
            if (!interval.from.includes(' ')) {
                interval.from = 'ПН ' + interval.from;
            }

            if (!interval.to.includes(' ')) {
                interval.to = 'ПН ' + interval.to;
            }

            // Да, я и сам думаю как вот ближайшие 5 вещей не писать два раза
            const intervalPartsFrom = interval.from.split(regex).filter(e => e.length > 0);
            const intervalPartsTo = interval.to.split(regex).filter(e => e.length > 0);

            const dayFrom = weekEnum[interval.from.split(' ')[0]] * MINUTES_IN_DAY;
            const dayTo = weekEnum[interval.to.split(' ')[0]] * MINUTES_IN_DAY;

            const timeFrom = parseInt(intervalPartsFrom[1]) * 60 + parseInt(intervalPartsFrom[2]);
            const timeTo = parseInt(intervalPartsTo[1]) * 60 + parseInt(intervalPartsTo[2]);

            const timezoneShift = (TARGET_TIME_ZONE - parseInt(intervalPartsFrom[3])) * 60;

            return { from: dayFrom + timeFrom + timezoneShift,
                to: dayTo + timeTo + timezoneShift };
        }

        let bankTimes = [];
        let busyTimes = [];

        const transformed = transformInterval(workingHours);
        for (let i = 0; i < 3; i ++) { // формируем расписание банка (3: до среды)
            bankTimes.push({
                from: transformed.from + MINUTES_IN_DAY * i,
                to: transformed.to + MINUTES_IN_DAY * i
            });
        }

        for (let data of Object.values(schedule)) { // читаем расписание грабителей
            for (let interval of data) {
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
         * Производит вычитание интервалов (а - b)
         * @param {Object} intervalA
         * @param {Object} intervalB
         * @returns {Object[]}
         */
        function subtractIntervals(intervalA, intervalB) {

            /**
             * Определяет тип пересечения интервалов.
             * 0 - не пересекаются,
             * 1 - пересекаются и а начинаентся раньше b
             * 2 - пересекаются и b начинается раньше а
             * 3 - пересекаются и a вложен в b
             * 4 - пересекаются и b вложен в a
             * @param {Object} a
             * @param {Object} b
             * @returns {Number}
             */
            function getIntersectionType(a, b) {

                /**
                 * Проверяет, содержится ли интервал а в b.
                 * @param {Object} c
                 * @param {Object} d
                 * @returns {boolean}
                 */
                function contains(c, d) {
                    return c.from >= d.from && c.to <= d.to;
                }

                /**
                 * Эта функция проверяет, лежит ли число d между с1 и с2
                 * Она здесь написана только потому, что я не знаю, как еще сократить complexity.
                 * @param {Number} c1
                 * @param {Number} d
                 * @param {Number} c2
                 * @returns {Boolean}
                 */
                function liesInBetween(c1, d, c2) {
                    return c1 <= d && c2 >= d;
                }

                let intersectionType = 0;
                if (liesInBetween(a.from, b.from, a.to)) {
                    intersectionType = 1;
                }
                if (liesInBetween(a.from, b.to, a.to)) {
                    intersectionType = 2;
                }
                if (contains(a, b)) {
                    return 3;
                }
                if (contains(b, a)) {
                    return 4;
                }

                return intersectionType;
            }

            switch (getIntersectionType(intervalA, intervalB)) {
                default:
                    return [intervalA];
                case 1:
                    return [{
                        from: Math.min(intervalA.from, intervalB.from),
                        to: Math.max(intervalA.from, intervalB.from)
                    }];
                case 2:
                    return [{
                        from: Math.min(intervalA.to, intervalB.to),
                        to: Math.max(intervalA.to, intervalB.to)
                    }];
                case 3:
                    return [];
                case 4:
                    return [{
                        from: intervalA.from,
                        to: intervalB.from }, {
                        from: intervalB.to,
                        to: intervalA.to }];
            }
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
        .sort((a, b) => (a.from > b.from));
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
            if (hour === 0) {
                hour = '00';
            }
            let minute = (time % MINUTES_IN_DAY) % 60;
            if (minute === 0) {
                minute = '00';
            }
            template = template.replace('%DD', day);
            template = template.replace('%HH', hour);
            template = template.replace('%MM', minute);

            return template;
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            const backup = firstCandidate;
            if (firstCandidate.to - firstCandidate.from >= (30 + duration)) {
                firstCandidate.from = firstCandidate.from + 30;
            } else {
                firstCandidate = candidates.filter(e => e.from >= firstCandidate.from + 30)[0];
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
