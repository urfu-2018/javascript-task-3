'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = false;

var numberDays = { 1: 'ПН', 2:'ВТ', 3: 'СР',  4:'ЧТ', 5:'ПТ', 6: 'СБ', 0:'ВС'};
var daysNumber = {'ПН': 1, 'ВТ': 2, 'СР': 3, 'ЧТ': 4,'ПТ': 5, 'СБ': 6, 'ВС': 0};
var organizationSchedule = {};

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
    var result = [];
    for (var i = 0; i < 3; i++){
    organizationSchedule[numberDays[i+1]] = translateInMin(workingHours, i+1);
    result.push({'a1': organizationSchedule[numberDays[i+1]].from, 'b1': '(', 'c1' : '('});
    result.push({'a1' :organizationSchedule[numberDays[i+1]].to, 'b1': ')', 'c1' : ')'});
    }
    

    var gangSchedule = [];
    var keysSchedule = Object.keys(schedule);
    keysSchedule.forEach(element => {
        gangSchedule[element] = [];
        for (var i = 0; i < schedule[element].length; i++){
            gangSchedule[element][i] = makeDifData(schedule[element][i]);
            result.push({'a1': gangSchedule[element][i].from, 'b1':element, 'c1' :']'});
            result.push({'a1': gangSchedule[element][i].to, 'b1':element, 'c1' :'['});
        }
    });
   result.sort((a, b) =>{
    if (a.a1 < b.a1) {
        return -1;
      }
      if (a.a1 > b.a1) {
        return 1;
      }
  
      return 0;
   });
   fiendTime(result, duration);
    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return false;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
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
function fiendTime(result, duration) {
    var tmp = [];
    var tmp1 = [];
    var flag = false;
    for(var i = 0; i < result.length; i++) {
        if (tmp1.length !== 0 && tmp1[tmp1.length-1].b1 === result[i].b1) {
            var t = tmp1.pop();
            if (tmp1.length === 0) {
                tmp.push({'a1' : t.a1, 'b1':t.b1, 'c1':t.c1});
                tmp.push({'a1' : result[i].a1, 'b1':result[i].b1, 'c1':result[i].c1});
            } else if (flag) {
                var t = tmp1.pop();
                tmp.push({'a1' : t.a1, 'b1':t.b1, 'c1':t.c1});
                tmp.push({'a1' : result[i].a1, 'b1':result[i].b1, 'c1':result[i].c1});
            }
            continue;
        }
        if ((result[i].b1 === '(' && tmp1.length === 0 ) || (result[i].b1 === ')' && tmp1.length === 0) 
        || tmp.length !== 0 && result[i].a1 < tmp[tmp.length-1]) {
            tmp.push({'a1' : result[i].a1, 'b1':result[i].b1, 'c1':result[i].c1});
            flag = true;
        } else {    
            if (result[i].c1 !== '[' && result[i].c1 !== '('){
                    tmp1.push({'a1': result[i].a1, 'b1':result[i].b1, 'c1':result[i].c1});
                    flag = false;
            } else {
                flag = true;
            }
         } 
         if (tmp.length !== 0 && tmp[0].c1 === ']') {
            tmp.shift();
        }
    }
}


function translateInMin(arr, day) {
    var tFrom = makeDate(arr.from.replace(/(\+)|(\:)/g, ' ').split(' '), day);
    var tTo = makeDate(arr.to.replace(/(\+)|(\:)/g, ' ').split(' '), day);
    return { from:tFrom.valueOf(), to:tTo.valueOf()};
}

function makeDate(date, day) {
    var tDate = new Date();
   if (date.length === 4){
    tDate.setUTCHours(date[1]-date[3]);
    tDate.setUTCMinutes(date[2]);
    tDate.setDate(daysNumber[date[0]]);
   } else {
    tDate.setUTCHours(date[0]-date[2]);
    tDate.setUTCMinutes(date[1]);
    tDate.setDate(day);
   }
   tDate.setMilliseconds(0);
   tDate.setSeconds(0); 
    
    return tDate;
}

function makeDifData(arr){
    var tFrom = makeDate(arr.from.replace(/(\+)|(\:)/g, ' ').split(' '));
    var tTo = makeDate(arr.to.replace(/(\+)|(\:)/g, ' ').split(' '));
    return {from: tFrom.valueOf(), to: tTo.valueOf()};
}

const gangSchedule = {
    Danny: [
        { from: 'ПН 11:00+5', to: 'ПН 14:00+5' }
    ],
    Rusty: [
        { from: 'ПН 12:00+5', to: 'ПН 16:30+5' }
    ],
    Linus: [
        { from: 'ПН 12:00+5', to: 'ПН 17:00+5' }
    ]
};

const bankWorkingHours = {
    from: '10:00+5',
    to: '18:00+5'
};

// Время не существует
const longMoment = getAppropriateMoment(gangSchedule, 120, bankWorkingHours);

// Выведется `false` и `""`
console.info(longMoment.exists());
console.info(longMoment.format('Метим на %DD, старт в %HH:%MM!'));

module.exports = {
    getAppropriateMoment,

    isStar
};
