'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = false;
const dayOfWeek = [];
dayOfWeek['ПН'] = 0;
dayOfWeek['ВТ'] = 1;
dayOfWeek['СР'] = 2;
const backToDay = ['ПН', 'ВТ', 'СР'];
let timezone = 0;


class Time {
    constructor(minutes, day) {
        this.minutes = minutes;
        this.day = day;
    }

    getMinutes() {
        return this.minutes;
    }

    getTimeFromMinutes() {
        return {
            day: backToDay[this.day],
            hours: Math.floor(this.minutes / 60) + timezone,
            minutes: this.minutes - 60 * Math.floor(this.minutes / 60)
        };
    }

    getDifference(time) {
        return Math.abs(this.getMinutes() - time.getMinutes());
    }

}

class Section {
    constructor(from, to) {
        this.from = from;
        this.to = to;
    }

    isNoIntersection(section) {
        return section.to.getMinutes() < this.from.getMinutes() ||
            section.from.getMinutes() > this.to.getMinutes();
    }
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
    console.info(schedule, duration, workingHours);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return this.format('%DD %HH:%MM') !== '';
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            let _schedule = Object.keys(schedule).map(x => schedule[x]);
            let sections = [];
            for (let i = 0; i < 3; i++) {
                sections[i] = [];
            }
            for (let i of _schedule) {
                for (let j of i) {
                    let from = parseTime(j.from);
                    let to = parseTime(j.to);
                    if (from.day !== to.day) {
                        sections[from.day].push(new Section(from, new Time(1440, from.day)));
                        sections[to.day].push(new Section(new Time(0, to.day), to));
                    } else {
                        sections[from.day].push(new Section(from, to));
                    }
                }
            }
            let result = findTime(duration, sections, workingHours);
            if (result === null) {
                return '';
            }
            result = result.getTimeFromMinutes();
            let _template = template.replace(/%HH:%MM/,
                `${result.hours}:${result.minutes}`);
            _template = _template.replace(/%DD/,
                result.day.toString());

            return _template;

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

function findTime(duration, sections, workingHours) {
    let result = null;
    let whFromTime = parseWorkingHours(workingHours.from);
    let whToTime = parseWorkingHours(workingHours.to);
    for (let i = 0; i < 3; i++) {
        let intersections = [];
        let section = sections[i].sort((a, b) => {
            return a.from.getMinutes() - b.from.getMinutes();
        });
        for (let j = 0; j < section.length; j++) {
            let intersection = section.filter(x => x === section[j] ||
                !section[j].isNoIntersection(x));
            if (intersection.length !== 0) {
                intersections.push(intersection);
                intersections = intersections.filter(x => {
                    return (x === intersection ||
                        JSON.stringify(x) !== JSON.stringify(intersection));
                });
            }
            if (intersection.length === section.length) {
                break;
            }
        }
        if (intersections.length === 1) {
            console.info(intersections[0][0]);
            let min = Array.min(intersections.map(x => x[0].from.getMinutes()));
            let max = Array.max(intersections.map(x => x[0].to.getMinutes()));
            if (min - whFromTime.getMinutes() >= duration) {
                result = new Time(whFromTime.getMinutes(), i);
            }
            if (whToTime.getMinutes() - max >= duration) {
                result = new Time(max, i);
            }
        } else if (intersections.length === 0) {
            result = findWithoutIntersection(intersections, i, whFromTime, whToTime, duration);
            if (result !== null) {
                return result;
            }
        } else {
            let _sections = [];
            for (let n = 0; n < intersections.length; n++) {
                let _from = Array.min(intersections[n].map(x => x.from.getMinutes()));
                let _to = Array.max(intersections[n].map(x => x.to.getMinutes()));
                _sections.push(new Section(_from, _to));
            }
            result = findWithoutIntersection(_sections, i, whFromTime, whToTime, duration);
            if (result !== null) {
                return result;
            }
        }
    }

    return result;
}

function findWithoutIntersection(section, day, whFromTime, whToTime, duration) {
    let result = null;
    let start = whFromTime.getMinutes();
    for (let m of section) {
        if (m.from - start >= duration && m.from < whToTime.getMinutes()) {
            console.info('зашли сюда, когда', m.from, start);
            result = new Time(start, day);
            break;
        }
        start = m.to;
    }
    if (whToTime.getMinutes() - section[section.length - 1] >= duration) {
        result = new Time(section[section.length - 1], day);
    }

    return result;
}

Array.max = function (array) {
    return Math.max.apply(Math, array);
};

Array.min = function (array) {
    return Math.min.apply(Math, array);
};

function parseWorkingHours(str) {
    timezone = parseInt(str.substr(6, 2));
    let hours = parseInt(str.substr(0, 2)) - timezone;
    let minutes = parseInt(str.substr(3, 2));

    return new Time(hoursToMinutes(hours, minutes), 'all');
}

function hoursToMinutes(hours, minutes) {
    return hours * 60 + minutes;
}

function parseTime(str) {
    let hours = parseInt(str.substr(3, 2)) - parseInt(str.substr(-1, 2));
    let minutes = parseInt(str.substr(6, 2));
    let day = dayOfWeek[str.substr(0, 2)];

    return new Time(hoursToMinutes(hours, minutes), day);
}

module.exports = {
    getAppropriateMoment,

    isStar
};
