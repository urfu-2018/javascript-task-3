'use strict';

const isStar = true;


function translateTimeBank(time) {
    let hour = Number(time.slice(0, 2));
    let minute = Number(time.slice(3, 5));

    return hour * 60 + minute;
}

function translateTimeGuy(time) {
    let day = time.slice(0, 2);
    let hour = Number(time.slice(3, 5));
    let minute = Number(time.slice(6, 8));
    if (day === 'ПН') {
        return hour * 60 + minute;
    }
    if (day === 'ВТ') {
        return 1440 + hour * 60 + minute;
    }
    if (day === 'СР') {
        return 2880 + hour * 60 + minute;
    }
    if (day === 'ЧТ') {
        return 4320 + hour * 60 + minute;
    }

    return 5760;
}

function intersectTime(listTime, start, end, sliceTime) {
    let startSlice = sliceTime[0];
    let endSlice = sliceTime[1];
    if (end < endSlice) {
        if (startSlice < start) {
            listTime.push([startSlice, start], [end, endSlice]);
        } else if (startSlice < end) {
            listTime.push([end, endSlice]);
        } else {
            listTime.push(sliceTime);
        }
    } else if (startSlice < start) {
        if (start < endSlice) {
            listTime.push([startSlice, start]);
        } else {
            listTime.push(sliceTime);
        }
    }

    return listTime;
}

function refinementTime(start, end, timeRobbery) {
    let listTime = [];
    for (let sliceTime of timeRobbery) {
        listTime = intersectTime(listTime, start, end, sliceTime);
    }

    return listTime;
}

function convertTime(time) {
    let minute = time % 60;
    let hour = (time % 1440 - minute) / 60;
    if (minute < 10) {
        minute = '0' + minute;
    }
    if (hour < 10) {
        hour = '0' + hour;
    }
    if (time < 1440) {
        return [hour, minute, 'ПН'];
    }
    if (time < 2880) {
        return [hour, minute, 'ВТ'];
    }

    return [hour, minute, 'СР'];
}

function getAppropriateMoment(schedule, duration, workingHours) {
    let openBank = translateTimeBank(workingHours.from);
    let closeBank = translateTimeBank(workingHours.to);
    let timezoneBank = Number(workingHours.from.slice(6, 8));
    let timeRobbery = [[openBank, closeBank], [1440 + openBank, 1440 + closeBank],
        [2880 + openBank, 2880 + closeBank]];
    for (let guy of Object.keys(schedule)) {
        for (let workingGuy of schedule[guy]) {
            let timezoneGuy = Number(workingGuy.from.slice(9, 11));
            let startGuy = translateTimeGuy(workingGuy.from) + 60 * (timezoneBank - timezoneGuy);
            let endGuy = translateTimeGuy(workingGuy.to) + 60 * (timezoneBank - timezoneGuy);
            timeRobbery = refinementTime(startGuy, endGuy, timeRobbery);
        }
    }
    timeRobbery = timeRobbery.filter(entry => entry[1] - entry[0] >= duration);

    return {
        exists: function () {
            return timeRobbery.length !== 0;
        },
        format: function (template) {
            if (timeRobbery.length !== 0) {
                let robbery = convertTime(timeRobbery[0][0]);

                return template.replace('%HH', robbery[0]).replace('%MM', robbery[1])
                    .replace('%DD', robbery[2]);
            }

            return '';
        },
        tryLater: function () {
            if (timeRobbery.length === 0) {
                return false;
            }
            let fistSlice = timeRobbery[0];
            if (fistSlice[1] - fistSlice[0] >= duration + 30) {
                timeRobbery[0][0] += 30;

                return true;
            }
            timeRobbery.splice(0, 1);
            if (timeRobbery.length > 0) {
                return true;
            }
            timeRobbery.push(fistSlice);

            return false;
        }
    };
}

module.exports = {
    getAppropriateMoment,

    isStar
};
