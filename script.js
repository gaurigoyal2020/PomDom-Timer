let focus = document.getElementById("focus");
let short_br = document.getElementById("s_break");
let long_br = document.getElementById("l_break");
let timer = document.getElementById("timer_clk");
let start = document.getElementById("start");
let pause = document.getElementById("pause");
let reset = document.getElementById("reset");
let buttons = document.querySelector(".work_btns");
let set; //holds interval ID for the secsdown
let active = "focus"; //to know what category are we on (focus is deault)
let secs=59;
let mins=24;
let paused=true;

timer.textContent = `${mins+1}:00`; //adds initial text in span

//making sure that timer always has 2 digits
//If value is less than 10, we append 0 or we return og value
const appendZero = (value) => {
    value = value<10 ? `0${value}` : value;
    return value;
}

start.addEventListener("click", ()=> {
    pause.classList.add("show");
    reset.classList.add("show");
    start.classList.add("hide");
    start.classList.remove("show");

    if (paused == true)
        {
            paused = false;
            timer.textContent = `${appendZero(mins)}:${appendZero(secs)}`;
            
            set = setInterval(() => {
            secs--;
            timer.textContent = `${appendZero(mins)}:${appendZero(secs)}`;
            if(secs==0)
            {
                if(mins != 0) {
                    mins--;
                    secs = 60;
                }
                else{
                    clearInterval(set);
                }
            }
            if(mins == 0 && secs == 0)
                alert("TIME'S UP!!!");
        }, 1000);
    }
});

pause.addEventListener("click",
    (pauseTimer = () => {
    paused= true;
    clearInterval(set);
    start.classList.remove("hide");
    reset.classList.remove("show");
    pause.classList.remove("show");
    })
);

reset.addEventListener("click", 
    (resetTime = () => {
    pauseTimer();
    switch(active)
    {
        case "long": mins=14;
                     break;
        case "short": mins = 4;
                      break;
        default: mins=24;
    }
    secs = 59;
    timer.textContent = `${mins+1}:00`;
    })
);

focus.addEventListener("click", () => {
    pauseTimer();
    mins=24;
    secs=59;
    timer.textContent = `${mins+1}:00`;
});

short_br.addEventListener("click", () => {
    active = "short";
    pauseTimer();
    mins=4;
    secs=59;
    timer.textContent = `${appendZero(mins+1)}:00`;
});

long_br.addEventListener("click", () => {
    active = "long";
    pauseTimer();
    mins=14;
    secs=59;
    timer.textContent = `${mins+1}:00`;
});