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
    const MINUTES_IN_WEEK = MINUTES_IN_DAY * 7;


    const TARGET_TIME_ZONE = parseInt(workingHours.from.split('+')[1]);

    const weekEnum = Object.freeze({
        'ПН': 0, 'ВТ': 1, 'СР': 2, 'ЧТ': 3, 'ПТ': 4, 'СБ': 5, 'ВС': 6
    });

    /**
     * По интервалу в форме ПН: 09:35+5 возвращает интервал в минутах и приписывает имя
     * @param {Object} interval
     * @param {String} who
     * @returns {Object}
     */
    function transformInterval(interval, who) {
        // 'ПН 09:35+5' => [ПН, 09, 35, 5]
        const regex = /^(.{2}) (\d{2}):(\d{2})+.(\d)+$/g;

        // Да, я и сам думаю как вот ближайшие 5 вещей не писать два раза
        const intervalPartsFrom = interval.from.split(regex).filter(e => e.length > 0);
        const intervalPartsTo = interval.to.split(regex).filter(e => e.length > 0);

        // Для интервалов без даты, полагаем что с нуля (нужно для банка).
        if (intervalPartsFrom.length === 3) {
            intervalPartsFrom.unshift('ПН');
        }

        const dayFrom = weekEnum[interval.from.split(' ')[0]] * MINUTES_IN_DAY;
        const dayTo = weekEnum[interval.to.split(' ')[0]] * MINUTES_IN_DAY;

        const timeFrom = parseInt(intervalPartsFrom[1]) * 24 + parseInt(intervalPartsFrom[2]);
        const timeTo = parseInt(intervalPartsTo[1]) * 24 + parseInt(intervalPartsTo[2]);

        const timezoneShift = (TARGET_TIME_ZONE - parseInt(intervalPartsFrom[3])) * 60;

        return { from: dayFrom + timeFrom + timezoneShift,
            to: dayTo + timeTo + timezoneShift, who: who };
    }

    /**
     * По интервалу возвращает обратный в промежутке недели
     * @param {Object} interval
     * @returns {Object[]}
     */
    function invertInterval(interval) {

        // инвертируем
        let result = [];
        result.push({ from: 0, to: interval.from, who: interval.who });
        result.push({ from: interval.to, to: MINUTES_IN_WEEK, who: interval.who });

        // убираем пустые интервалы
        for (let i in result) {
            if (result[i].to - result[i].from === 0) {
                delete result[i];
            }
        }

        return result;
    }

    /**
     * Собирает все входные даdayнные в один массив (с преобразованиями)
     * @returns {Object[]}
     */
    function congregateIntervals() {
        let availableTimes = []; // когда доступны грабители и банк

        const transformed = transformInterval(workingHours, 'bank');
        for (let i = 0; i < weekEnum.length; i ++) { // формируем расписание банка на неделю
            availableTimes.push({
                from: transformed.from + MINUTES_IN_DAY * i,
                to: transformed.to + MINUTES_IN_DAY * i,
                who: transformed.who
            });
        }

        for (let [person, data] of Object.entries(schedule)) { // читаем расписание грабителей
            for (let interval of data) {
                availableTimes = availableTimes
                    .concat(invertInterval(transformInterval(interval, person)));
            }
        }

        return availableTimes;
    }

    /**
     * Определяет, пересекаются ли два интервала.
     * @param {Object} a
     * @param {Object} b
     * @returns {boolean}
     */
    function twoIntervalsIntersect(a, b) {
        return a.from <= b.from && a.to >= b.from || a.from <= b.to && a.to >= b.to;
    }

    /**
     * Находит пересечения всех интервалов с учетом принадлежности
     * @param {Object[]} intervals
     * @returns {Object[]}
     */
    function intersectIntervals(intervals) {
        let everyoneAvailable = [];
        // Находим персечения
        for (let i = 0; i < intervals.length - 1; i++) {
            const a = intervals.splice(i, 1)[0];
            if (a.who.split(';').length === 4) {
                everyoneAvailable.push(a);
                continue;
            }

            const b = intervals.splice(i, 1)[0];
            if (b.who.split(';').length === 4) {
                everyoneAvailable.push(b);
                continue;
            }

            if (twoIntervalsIntersect(a, b)) {
                const c = {
                    from: Math.max(a.from, b.from),
                    to: Math.min(a.to, b.to),
                    who: a.who + ';' + b.who
                };
                intervals.push(c);
            }
            intervals.push(b);
        }

        return everyoneAvailable;
    }

    const candidates = intersectIntervals(congregateIntervals())
        .filter(interval => interval.to - interval.from > duration);
    const firstCandidate = candidates.pop();

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
            const day = Math.floor(time / MINUTES_IN_DAY);
            const hour = Math.floor((time % MINUTES_IN_DAY) / 24);
            const minute = time % (MINUTES_IN_DAY * 24);
            template.replace('%DD', day);
            template.replace('%HH', hour);
            template.replace('%MM', minute);

            return template;
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            return candidates.filter(e => e.from === firstCandidate.from + 30).length > 0;
        }
    };
}

module.exports = {
    getAppropriateMoment,

    isStar
};
