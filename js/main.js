var transitionClasses = [
    'move-in-left',
    'move-in-right', 
    'move-out-left',
    'move-out-right',
    'fade-in',
    'fade-out'
];

function removeTransitions(elem) {
    for(var i = 0; i < transitionClasses.length; i++) {
        elem.classList.remove(transitionClasses[i]);
    }
}

function calcDV(value) {
    var ret;
    var sum = 0;
    var p = value.length + 1;
    for (var i = 0; i < value.length; i++) {
        sum += parseInt(value[i]) * (p - i);
    } 
    ret = (sum * 10) % 11;
    if (ret > 9) ret = 0;
    return ret;
}

function isValid(cpf) {
    var clean = cpf.replace(/\D/g, '');
    if (clean.length !== 11) return false;
    var sub = clean.substr(0, 9);
    var dvs = clean.substr(9, 2);
    var dva = calcDV(sub);
    var dvb = calcDV(sub + dva);
    return dva === parseInt(dvs[0]) && dvb === parseInt(dvs[1]);
}

function fadeIn(elem) {
    removeTransitions(elem);
    elem.classList.add('fade-in');
    elem.classList.remove('hidden');
}

function fadeOut(elem) {
    removeTransitions(elem);
    elem.classList.add('fade-out');
    setTimeout(function () { elem.classList.add('hidden'); }, 400);
}

function moveInLeft(elem) {
    removeTransitions(elem);
    elem.classList.add('move-in-left');
    elem.classList.remove('hidden');
}

function moveOutLeft(elem) {
    removeTransitions(elem);
    elem.classList.add('move-out-left');
    setTimeout(function () { elem.classList.add('hidden'); }, 400);
}

function moveInRight(elem) {
    removeTransitions(elem);
    elem.classList.add('move-in-right');
    elem.classList.remove('hidden');
}

function moveOutRight(elem) {
    removeTransitions(elem);
    elem.classList.add('move-out-right');
    setTimeout(function () { elem.classList.add('hidden'); }, 400);
}

function cpfKeyUp(e) {
    var submit = document.querySelector('.submit');
    var vc = document.querySelector('.validation-container');
    var cpf = e.target.value;
    if (cpf.length !== 14) {
        if (!vc.classList.contains('hidden')) fadeOut(vc);
        submit.classList.add('disabled');
        return;
    }
    if (isValid(cpf)) {
        if (e.keyCode === 13) return submitOnClick(cpf.replace(/\D/g, ''));
        submit.classList.remove('disabled');
        if (vc.classList.contains('hidden')) return;
        fadeOut(vc);
        return;
    }
    submit.classList.add('disabled');
    if (!vc.classList.contains('hidden')) return;
    fadeIn(vc);
}

function submitOnClick(cpf) {
    if (document.querySelector('.submit').classList.contains('disabled')) return;
    var queryScreen = document.querySelector('.query-screen');
    moveOutLeft(queryScreen);
    var nextScreen;

    var x = new XMLHttpRequest();
    x.open('GET', 'https://api.radialle.com/api/LeakQuery?cpf=' + cpf);
    x.onreadystatechange = function(e) {
        if (x.readyState === 4) {
            if (x.status === 200) {
                try {
                    var data = JSON.parse(x.responseText);
                    var results = data.results;
                    if (results.length <= 0) {
                        nextScreen = document.querySelector('.result-screen-safe');
                        return;
                    }
                    if (results.includes(0)) document.querySelector('.leak-info-basic').classList.remove('hidden');
                    var cflag = false;
                    for (var i = 0; i < results.length; i++) {
                        var item = results[i];
                        var selector = '.leak-column-' + item;
                        var elems = document.querySelectorAll(selector);
                        if (elems.length <= 0) continue;
                        for (var ii = 0; ii < elems.length; ii++) {
                            elems[ii].classList.remove('hidden');
                            cflag = true;
                        }
                    }
                    if (cflag) document.querySelector('.leak-info-complete').classList.remove('hidden');
                    nextScreen = document.querySelector('.result-screen-exposed');
                } catch (e) {
                    console.error(e);
                    nextScreen = document.querySelector('.result-screen-error');
                }
            } else {
                nextScreen = document.querySelector('.result-screen-error');
            }
        }
    };
    x.send();

    var moveNext = function() {
        if (typeof nextScreen === 'undefined') {
            setTimeout(moveNext, 400);
            return;
        }
        moveInLeft(nextScreen);
    };

    setTimeout(moveNext, 400);
}

function getCurrentScreen() {
    var screens = document.querySelectorAll('.screen');
    for (var i = 0; i < screens.length; i++) {
        if (!screens[i].classList.contains('hidden')) return screens[i];
    }
}

function backOnClick() {
    var currentScreen = getCurrentScreen();
    var queryScreen = document.querySelector('.query-screen');
    moveOutRight(currentScreen);
    setTimeout(function() {
        var columns = document.querySelectorAll('[class^="leak-column-"]');
        for (var i = 0; i < columns.length; i++) columns[i].classList.add('hidden');
        moveInRight(queryScreen);
    }, 400);
}

document.addEventListener('DOMContentLoaded', function (e) {
    var input = document.querySelector('input');
    var submit = document.querySelector('.submit');
    var back = document.querySelectorAll('.back-button');
    for (var i = 0; i < back.length; i++) back[i].addEventListener('click', backOnClick);
    new Cleave('.cpf-input', {
        delimiters: ['.', '.', '-'],
        blocks: [3, 3, 3, 2],
        numericOnly: true
    });
    input.addEventListener('keyup', cpfKeyUp);
    submit.addEventListener('click', function(e) { submitOnClick(input.value.replace(/\D/g, '')); });
});