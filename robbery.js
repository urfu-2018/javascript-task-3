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
        let hours = Math.floor(this.minutes / 60) + timezone;
        let day = hours < 0 ? this.day - 1 : this.day;

        return {
            day: backToDay[day],
            hours: hours < 0 ? 24 + hours : hours,
            minutes: this.minutes - 60 * Math.floor(this.minutes / 60)
        };
    }
}

class Section {
    constructor(from, to) {
        this.from = from;
        this.to = to;
    }

    isIntersection(section) {
        return section.to.getMinutes() >= this.from.getMinutes() &&
            section.from.getMinutes() <= this.to.getMinutes();
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
            let _schedule = [];
            Object
                .keys(schedule)
                .map(x => schedule[x])
                .forEach(x => x.forEach(y => _schedule.push(y)));
            let sections = [];
            for (let i = 0; i < 3; i++) {
                sections[i] = [];
            }
            for (let i of _schedule) {
                let from = parseTime(i.from);
                let to = parseTime(i.to);
                if (from.day !== to.day) {
                    console.info(from.day);
                    sections[from.day].push(new Section(from, new Time(1439, from.day)));
                    sections[to.day].push(new Section(new Time(0, to.day), to));
                } else {
                    sections[from.day].push(new Section(from, to));
                }
            }
            let result = findTime(duration, sections, workingHours);

            return result !== null ? formatTime(template, result.getTimeFromMinutes()) : '';
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

function formatTime(template, time) {
    let minutes = time.minutes < 10 ? '0' + time.minutes : time.minutes;
    let _template = template.replace(/%HH:%MM/,
        `${time.hours}:${minutes}`);
    _template = _template.replace(/%DD/,
        time.day);

    return _template;
}

function findWithOneIntersection(intersections, day, workingHours, duration) {
    let result = null;
    let whFromTime = parseWorkingHours(workingHours.from);
    let whToTime = parseWorkingHours(workingHours.to);
    let min = intersections[0][0].from.getMinutes();
    let max = intersections[0][intersections.length - 1].to.getMinutes();
    if (min - whFromTime.getMinutes() >= duration) {
        result = new Time(whFromTime.getMinutes(), day);
    }
    if (whToTime.getMinutes() - max >= duration) {
        result = new Time(max, day);
    }

    return result;
}

function findWithSomeIntersections(intersections, day, workingHours, duration) {
    let result = null;
    let _sections = [];
    for (let n of intersections) {
        let _from = n[0].from.getMinutes();
        let _to = n[n.length - 1].to.getMinutes();
        _sections.push(new Section(_from, _to));
    }
    result = findWithoutIntersection(_sections, day, workingHours, duration);

    return result;
}

function findTime(duration, sections, workingHours) {
    let result = null;
    sections = sections.map(x=> x.sort((a, b) => {
        return a.from.getMinutes() - b.from.getMinutes();
    }));

    for (let i = 0; i < 3; i++) {
        let intersections = [];
        let section = sections[i]
            .sort((a, b) => {
                return a.from.getMinutes() - b.from.getMinutes();
            });
        for (let j of section) {
            let intersection = section.filter(x => x === j ||
                j.isIntersection(x));
            intersections.push(intersection);
            intersections = intersections.filter(x => {
                return (x === intersection ||
                    JSON.stringify(x) !== JSON.stringify(intersection));
            });
        }
        if (intersections.length === 1) {
            findWithOneIntersection(intersections, i, workingHours, duration);
        } else if (intersections.length === 0) {
            result = findWithoutIntersection(intersections, i, workingHours, duration);
        } else {
            result = findWithSomeIntersections(intersections, i, workingHours, duration);
        }
    }

    return result;
}

function findWithoutIntersection(section, day, workingHours, duration) {
    let result = null;
    let whFromTime = parseWorkingHours(workingHours.from);
    let whToTime = parseWorkingHours(workingHours.to);
    let start = whFromTime.getMinutes();
    for (let m of section) {
        if (m.from - start >= duration && m.from < whToTime.getMinutes()) {
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

function parseWorkingHours(str) {
    timezone = parseInt(str.substr(6, 2));
    let hours = parseInt(str.substr(0, 2)) - timezone;
    let _hours = hours < 0 ? hours + 24 : hours;
    let minutes = parseInt(str.substr(3, 2));

    return new Time(hoursToMinutes(_hours, minutes), 'all');
}

function hoursToMinutes(hours, minutes) {
    return hours * 60 + minutes;
}

function parseTime(str) {
    let hours = parseInt(str.substr(3, 2)) - parseInt(str.substr(9, 2));
    let minutes = parseInt(str.substr(6, 2));
    let day = dayOfWeek[str.substr(0, 2)];
    if (hours < 0) {
        if (day - 1 >= 0) {
            day -= 1;
            hours += 24;
        } else {
            hours = 0;
        }
    }

    return new Time(hoursToMinutes(hours, minutes), day);
}

module.exports = {
    getAppropriateMoment,

    isStar
};
