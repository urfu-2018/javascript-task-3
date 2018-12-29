'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;
const days = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];


function getAppropriateMomentNormalized(timetable, duration) {
    let [index, successfulIndex] = [-30, null];
    const result = {
        exists() {
            return successfulIndex !== null;
        },

        format(template) {
            if (!this.exists()) {
                return '';
            }
            const day = Math.floor(successfulIndex / 24 / 60);
            const hour = Math.floor((successfulIndex - day * 24 * 60) / 60);
            const minute = Math.floor(successfulIndex % 60);

            return template
                .replace(/%HH/g, (hour > 9 ? '' : '0') + hour)
                .replace(/%MM/g, (minute > 9 ? '' : '0') + minute)
                .replace(/%DD/g, days[day]);
        },

        tryLater() {
            let lastMoment = 0;
            for (index += 30; index < timetable.length; index++) {
                const isAvailableMinute = timetable[index];
                if (isAvailableMinute && ++lastMoment === duration) {
                    successfulIndex = index - duration + 1;
                    index = successfulIndex;

                    return true;
                } else if (!isAvailableMinute) {
                    lastMoment = 0;
                }
            }

            return false;
        }
    };
    result.tryLater();

    return result;
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
    const timetable = Array(60 * 24 * 3).fill(false);
    const bankOffset = Number(/(.\d+)$/.exec(workingHours.from)[1]);
    const fillTimetable = (what, { from, to }) => {
        const [, fDay, fHour, fMinute, fOffset] = /^(..) (\d\d):(\d\d)(.\d+)$/.exec(from);
        const [, tDay, tHour, tMinute, tOffset] = /^(..) (\d\d):(\d\d)(.\d+)$/.exec(to);
        const s = days.indexOf(fDay) * 24 * 60 + (bankOffset - fOffset - -fHour) * 60 - -fMinute;
        const e = days.indexOf(tDay) * 24 * 60 + (bankOffset - tOffset - -tHour) * 60 - -tMinute;
        timetable.fill(what, s, e);
    };
    [0, 1, 2].forEach(i => fillTimetable(true, {
        from: days[i] + ' ' + workingHours.from,
        to: days[i] + ' ' + workingHours.to
    }));
    Object.entries(schedule).forEach(([, table]) => table.forEach(x => fillTimetable(false, x)));

    return getAppropriateMomentNormalized(timetable, duration);
}

module.exports = {
    getAppropriateMoment,
    isStar
};
